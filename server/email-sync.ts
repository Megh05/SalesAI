import { storage } from "./storage";
import { gmailService } from "./gmail";
import { aiService } from "./ai";
import { n8nService } from "./n8n";

interface SyncStats {
  totalEmails: number;
  newEmails: number;
  classifiedEmails: number;
  errors: number;
}

export class EmailSyncService {
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  async syncUserEmails(userId: string): Promise<SyncStats> {
    const stats: SyncStats = {
      totalEmails: 0,
      newEmails: 0,
      classifiedEmails: 0,
      errors: 0
    };

    try {
      const settings = await storage.getUserSettings(userId);
      if (!settings?.gmailConnected) {
        console.log(`Gmail not connected for user ${userId}`);
        return stats;
      }

      const oauthToken = await storage.getOAuthToken(userId, 'gmail');
      if (!oauthToken) {
        console.log(`No Gmail OAuth token for user ${userId}`);
        return stats;
      }

      if (!settings.gmailClientId || !settings.gmailClientSecret) {
        console.log(`Gmail OAuth credentials not configured for user ${userId}`);
        return stats;
      }

      const gmail = await gmailService.getGmailClient(
        oauthToken.accessToken,
        oauthToken.refreshToken,
        settings.gmailClientId,
        settings.gmailClientSecret
      );

      const messages = await gmailService.listMessages(gmail, 20);
      stats.totalEmails = messages.length;

      for (const message of messages) {
        try {
          const existingEmail = await storage.getEmailThreadByMessageId(message.id);
          if (existingEmail) {
            continue;
          }

          const messageDetails = await gmailService.getMessage(gmail, message.id);
          const parsedEmail = gmailService.parseEmail(messageDetails);

          const fromEmail = this.extractEmail(parsedEmail.from);
          const toEmail = this.extractEmail(parsedEmail.to);

          let contactId = null;
          const existingContacts = await storage.getContacts(userId);
          const matchingContact = existingContacts.find(
            c => c.email.toLowerCase() === fromEmail.toLowerCase()
          );

          if (matchingContact) {
            contactId = matchingContact.id;
          }

          const emailThread = await storage.createEmailThread({
            subject: parsedEmail.subject || '(No Subject)',
            snippet: parsedEmail.snippet,
            fromEmail,
            fromName: this.extractName(parsedEmail.from),
            toEmail,
            threadId: parsedEmail.threadId,
            messageId: parsedEmail.id,
            contactId,
            userId,
            receivedAt: parsedEmail.date ? new Date(parsedEmail.date) : new Date(),
          });

          stats.newEmails++;

          if (settings.openrouterApiKey) {
            try {
              const classification = await aiService.classifyEmail(userId, {
                subject: parsedEmail.subject || '',
                from: this.extractName(parsedEmail.from) || fromEmail,
                preview: parsedEmail.snippet,
              });

              if (classification) {
                await storage.updateEmailThread(emailThread.id, userId, {
                  aiClassification: classification.classification,
                  aiConfidence: classification.confidence,
                  nextAction: classification.nextAction,
                });

                stats.classifiedEmails++;

                n8nService.triggerWorkflow(settings, "email.classified", {
                  emailId: emailThread.id,
                  subject: parsedEmail.subject || '(No Subject)',
                  fromEmail,
                  fromName: this.extractName(parsedEmail.from),
                  classification: classification.classification,
                  confidence: classification.confidence,
                  summary: classification.summary,
                  nextAction: classification.nextAction,
                }).catch(err => console.error("n8n trigger error:", err));

                if (contactId) {
                  await this.autoUpdateLead(userId, contactId, classification.classification, emailThread.id);
                }
              }
            } catch (aiError) {
              console.error(`AI classification error for email ${emailThread.id}:`, aiError);
            }
          }
        } catch (emailError) {
          console.error(`Error processing email ${message.id}:`, emailError);
          stats.errors++;
        }
      }

      console.log(`Email sync completed for user ${userId}:`, stats);
      return stats;
    } catch (error) {
      console.error(`Email sync error for user ${userId}:`, error);
      stats.errors++;
      return stats;
    }
  }

  async autoUpdateLead(userId: string, contactId: string, classification: string, emailId: string): Promise<void> {
    const classificationToStatus: Record<string, string> = {
      "Lead Inquiry": "prospect",
      "Follow-up": "qualified",
      "Negotiation": "negotiation",
      "Meeting Request": "demo",
      "Closed Won": "won",
      "Closed Lost": "lost",
    };

    const newStatus = classificationToStatus[classification];
    if (!newStatus) return;

    const existingLeads = await storage.getLeads(userId);
    const contactLead = existingLeads.find(l => l.contactId === contactId);

    if (contactLead) {
      // Only update if the new status represents progression or explicit closure
      const shouldUpdate = this.shouldTransitionLead(contactLead.status, newStatus);
      
      if (shouldUpdate) {
        await storage.updateLead(contactLead.id, userId, { status: newStatus });
        console.log(`Lead ${contactLead.id} status updated from ${contactLead.status} to ${newStatus} based on email classification`);
        
        // Trigger n8n workflow for lead status change
        const settings = await storage.getUserSettings(userId);
        if (settings) {
          n8nService.triggerWorkflow(settings, "lead.statusChanged", {
            leadId: contactLead.id,
            title: contactLead.title,
            previousStatus: contactLead.status,
            newStatus,
            contactId: contactLead.contactId,
          }).catch(err => console.error("n8n trigger error:", err));
        }
      }
      
      await storage.updateEmailThread(emailId, userId, { leadId: contactLead.id });
    } else if (classification === "Lead Inquiry" || classification === "Negotiation") {
      const contact = await storage.getContact(contactId, userId);
      if (contact) {
        const lead = await storage.createLead({
          title: `Lead from ${contact.firstName} ${contact.lastName}`,
          contactId,
          companyId: contact.companyId,
          status: newStatus,
          source: "email",
          userId,
        });
        await storage.updateEmailThread(emailId, userId, { leadId: lead.id });
        
        console.log(`New lead created from email: ${lead.id} with status ${newStatus}`);
        
        // Trigger n8n workflow for new lead
        const settings = await storage.getUserSettings(userId);
        if (settings) {
          n8nService.triggerWorkflow(settings, "lead.created", {
            leadId: lead.id,
            title: lead.title,
            status: newStatus,
            contactEmail: contact.email,
            contactName: `${contact.firstName} ${contact.lastName}`,
            companyName: contact.companyId ? "Associated Company" : undefined,
          }).catch(err => console.error("n8n trigger error:", err));
        }
      }
    }
  }

  private shouldTransitionLead(currentStatus: string, newStatus: string): boolean {
    // Define the complete lead lifecycle progression
    const statusHierarchy: Record<string, number> = {
      "new": 0,
      "prospect": 1,
      "contacted": 2,
      "qualified": 3,
      "demo": 4,
      "negotiation": 5,
      "proposal": 6,
      "won": 7,
      "lost": 7, // Same level as won - both are terminal states
      "unqualified": 7, // Also a terminal state
    };

    // Get hierarchy levels, defaulting to -1 for unknown statuses
    const currentLevel = statusHierarchy[currentStatus] ?? -1;
    const newLevel = statusHierarchy[newStatus] ?? -1;

    // Don't allow transitions with unknown statuses
    if (currentLevel === -1 || newLevel === -1) {
      console.warn(`Unknown lead status detected: current=${currentStatus}, new=${newStatus}. Skipping transition.`);
      return false;
    }

    // Always allow transitions to terminal states (won, lost, unqualified)
    if (newStatus === "won" || newStatus === "lost" || newStatus === "unqualified") {
      return true;
    }

    // Don't transition from terminal states back to active states
    if (currentStatus === "won" || currentStatus === "lost" || currentStatus === "unqualified") {
      console.log(`Lead is in terminal state ${currentStatus}, not transitioning to ${newStatus}`);
      return false;
    }

    // Only allow progression forward (never regress)
    if (newLevel < currentLevel) {
      console.log(`Preventing lead regression from ${currentStatus} (level ${currentLevel}) to ${newStatus} (level ${newLevel})`);
      return false;
    }
    
    return true;
  }

  startAutoSync(userId: string, intervalMinutes: number = 15): void {
    if (this.syncIntervals.has(userId)) {
      console.log(`Auto-sync already running for user ${userId}`);
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;
    
    this.syncUserEmails(userId);
    
    const interval = setInterval(() => {
      this.syncUserEmails(userId);
    }, intervalMs);

    this.syncIntervals.set(userId, interval);
    console.log(`Auto-sync started for user ${userId} (every ${intervalMinutes} minutes)`);
  }

  stopAutoSync(userId: string): void {
    const interval = this.syncIntervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(userId);
      console.log(`Auto-sync stopped for user ${userId}`);
    }
  }

  stopAllAutoSync(): void {
    this.syncIntervals.forEach((interval, userId) => {
      clearInterval(interval);
      console.log(`Auto-sync stopped for user ${userId}`);
    });
    this.syncIntervals.clear();
  }

  async initializeAutoSyncForConnectedUsers(): Promise<void> {
    try {
      const allSettings = await storage.getAllUserSettings();
      for (const setting of allSettings) {
        if (setting.gmailConnected) {
          this.startAutoSync(setting.userId, 15);
        }
      }
      console.log(`Auto-sync initialized for ${allSettings.filter(s => s.gmailConnected).length} users`);
    } catch (error) {
      console.error('Error initializing auto-sync:', error);
    }
  }

  private extractEmail(emailString: string | undefined): string {
    if (!emailString) return '';
    const match = emailString.match(/<([^>]+)>/);
    return match ? match[1] : emailString;
  }

  private extractName(emailString: string | undefined): string | null {
    if (!emailString) return null;
    const match = emailString.match(/^([^<]+)</);
    return match ? match[1].trim().replace(/^["']|["']$/g, '') : null;
  }
}

export const emailSyncService = new EmailSyncService();
