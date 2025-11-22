import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword, getSession } from "./auth";
import { aiService } from "./ai";
import { gmailService } from "./gmail";
import { linkedinService } from "./linkedin";
import { emailSyncService } from "./email-sync";
import { n8nService } from "./n8n";
import {
  insertCompanySchema,
  insertContactSchema,
  insertLeadSchema,
  insertActivitySchema,
  insertEmailThreadSchema,
  insertUserSchema,
  loginSchema,
  insertUserSettingsSchema,
} from "@shared/schema";
import { z } from "zod";

type AuthRequest = Request & { user?: any };

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply session middleware before authentication
  app.use(getSession());

  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to log in after registration" });
        }
        res.status(201).json(user);
      });
    } catch (error: any) {
      console.error("Error registering user:", error);
      res.status(400).json({ message: error.message || "Failed to register" });
    }
  });

  app.post("/api/auth/login", (req: Request, res: Response, next) => {
    try {
      loginSchema.parse(req.body);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || "Invalid credentials" });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Company routes
  app.get("/api/companies", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const companies = await storage.getCompanies(userId);
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.post("/api/companies", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const companyData = insertCompanySchema.parse({ ...req.body, userId });
      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error: any) {
      console.error("Error creating company:", error);
      res.status(400).json({ message: error.message || "Failed to create company" });
    }
  });

  app.patch("/api/companies/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;
      const company = await storage.updateCompany(id, userId, req.body);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error: any) {
      console.error("Error updating company:", error);
      res.status(400).json({ message: error.message || "Failed to update company" });
    }
  });

  app.delete("/api/companies/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;
      const deleted = await storage.deleteCompany(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // Contact routes
  app.get("/api/contacts", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const contacts = await storage.getContacts(userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post("/api/contacts", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const contactData = insertContactSchema.parse({ ...req.body, userId });
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error: any) {
      console.error("Error creating contact:", error);
      res.status(400).json({ message: error.message || "Failed to create contact" });
    }
  });

  app.patch("/api/contacts/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;
      const contact = await storage.updateContact(id, userId, req.body);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error: any) {
      console.error("Error updating contact:", error);
      res.status(400).json({ message: error.message || "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;
      const deleted = await storage.deleteContact(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Lead routes
  app.get("/api/leads", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const leads = await storage.getLeads(userId);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const leadData = insertLeadSchema.parse({ ...req.body, userId });
      const lead = await storage.createLead(leadData);

      const settings = await storage.getUserSettings(userId);
      const contact = lead.contactId ? await storage.getContact(lead.contactId, userId) : null;
      const company = lead.companyId ? await storage.getCompany(lead.companyId, userId) : null;

      n8nService.triggerWorkflow(settings, "lead.created", {
        leadId: lead.id,
        title: lead.title,
        status: lead.status,
        value: lead.value,
        contactEmail: contact?.email,
        contactName: contact ? `${contact.firstName} ${contact.lastName}` : null,
        companyName: company?.name,
      }).catch(err => console.error("n8n trigger error:", err));

      res.status(201).json(lead);
    } catch (error: any) {
      console.error("Error creating lead:", error);
      res.status(400).json({ message: error.message || "Failed to create lead" });
    }
  });

  app.patch("/api/leads/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;
      const oldLead = await storage.getLead(id, userId);
      const lead = await storage.updateLead(id, userId, req.body);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      if (oldLead && req.body.status && oldLead.status !== req.body.status) {
        const settings = await storage.getUserSettings(userId);
        const contact = lead.contactId ? await storage.getContact(lead.contactId, userId) : null;

        n8nService.triggerWorkflow(settings, "lead.statusChanged", {
          leadId: lead.id,
          title: lead.title,
          previousStatus: oldLead.status,
          newStatus: lead.status,
          contactEmail: contact?.email,
          contactName: contact ? `${contact.firstName} ${contact.lastName}` : null,
        }).catch(err => console.error("n8n trigger error:", err));
      }

      res.json(lead);
    } catch (error: any) {
      console.error("Error updating lead:", error);
      res.status(400).json({ message: error.message || "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;
      const deleted = await storage.deleteLead(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Lead not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Activity routes
  app.get("/api/activities", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const activities = await storage.getActivities(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const activityData = insertActivitySchema.parse({ ...req.body, userId });
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error: any) {
      console.error("Error creating activity:", error);
      res.status(400).json({ message: error.message || "Failed to create activity" });
    }
  });

  // Email thread routes
  app.get("/api/emails", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const emails = await storage.getEmailThreads(userId);
      res.json(emails);
    } catch (error) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ message: "Failed to fetch emails" });
    }
  });

  app.post("/api/emails", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const emailData = insertEmailThreadSchema.parse({ ...req.body, userId });
      const email = await storage.createEmailThread(emailData);
      res.status(201).json(email);
    } catch (error: any) {
      console.error("Error creating email:", error);
      res.status(400).json({ message: error.message || "Failed to create email" });
    }
  });

  app.patch("/api/emails/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;
      const email = await storage.updateEmailThread(id, userId, req.body);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }
      res.json(email);
    } catch (error: any) {
      console.error("Error updating email:", error);
      res.status(400).json({ message: error.message || "Failed to update email" });
    }
  });

  app.post("/api/emails/:id/read", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;
      const marked = await storage.markEmailAsRead(id, userId);
      if (!marked) {
        return res.status(404).json({ message: "Email not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error marking email as read:", error);
      res.status(500).json({ message: "Failed to mark email as read" });
    }
  });

  // Settings routes
  app.get("/api/settings", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      let settings = await storage.getUserSettings(userId);

      // Create default settings if none exist
      if (!settings) {
        settings = await storage.createUserSettings({
          userId,
          aiModel: "mistralai/mistral-7b-instruct",
        });
      }

      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const settingsData = insertUserSettingsSchema.partial().parse(req.body);

      let settings = await storage.getUserSettings(userId);

      if (!settings) {
        // Create if doesn't exist
        settings = await storage.createUserSettings({
          ...settingsData,
          userId,
        });
      } else {
        // Update existing
        settings = await storage.updateUserSettings(userId, settingsData);
      }

      res.json(settings);
    } catch (error: any) {
      console.error("Error updating settings:", error);
      res.status(400).json({ message: error.message || "Failed to update settings" });
    }
  });

  app.post("/api/emails/:id/classify", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;

      const email = await storage.getEmailThread(id, userId);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      const classification = await aiService.classifyEmail(userId, {
        subject: email.subject,
        from: email.fromName || email.fromEmail,
        preview: email.snippet || "",
      });

      if (!classification) {
        return res.status(400).json({ message: "AI service not configured or unavailable" });
      }

      // Update email with classification
      await storage.updateEmailThread(id, userId, {
        aiClassification: classification.classification,
        confidence: classification.confidence,
        nextAction: classification.nextAction,
      });

      // Auto-create or update leads based on classification
      if (email.contactId) {
        const classificationToStatus: Record<string, string> = {
          "Lead Inquiry": "prospect",
          "Follow-up": "qualified",
          "Negotiation": "negotiation",
          "Meeting Request": "demo",
          "Closed Won": "won",
          "Closed Lost": "lost",
        };

        const newStatus = classificationToStatus[classification.classification];

        if (newStatus) {
          const existingLeads = await storage.getLeads(userId);
          const contactLead = existingLeads.find(l => l.contactId === email.contactId);

          if (contactLead) {
            await storage.updateLead(contactLead.id, userId, { status: newStatus });
          } else if (classification.classification === "Lead Inquiry" || classification.classification === "Negotiation") {
            const contact = await storage.getContact(email.contactId);
            await storage.createLead({
              contactId: email.contactId,
              companyId: contact?.companyId || null,
              status: newStatus,
              source: "email",
              userId,
            });
          }
        }
      }

      res.json(classification);
    } catch (error: any) {
      console.error("Error classifying email:", error);
      res.status(500).json({ message: error.message || "Failed to classify email" });
    }
  });

  app.post("/api/emails/:id/summarize", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;

      const email = await storage.getEmailThread(id, userId);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      const result = await aiService.summarizeEmail(userId, {
        subject: email.subject,
        from: email.fromName || email.fromEmail,
        body: email.snippet || "",
      });

      if (!result) {
        return res.status(400).json({ message: "AI service not configured or unavailable" });
      }

      // Update email with summary
      await storage.updateEmailThread(id, userId, {
        aiSummary: result.summary,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error summarizing email:", error);
      res.status(500).json({ message: error.message || "Failed to summarize email" });
    }
  });

  app.post("/api/emails/:id/analyze-lead", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;

      const email = await storage.getEmailThread(id, userId);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      const leadData = await aiService.extractLeadData(userId, {
        from: email.fromName || email.fromEmail,
        senderEmail: email.fromEmail,
        subject: email.subject,
        preview: email.snippet || "",
      });

      if (!leadData) {
        return res.status(400).json({ message: "AI service not configured or unavailable" });
      }

      res.json(leadData);
    } catch (error: any) {
      console.error("Error analyzing lead from email:", error);
      res.status(500).json({ message: error.message || "Failed to analyze lead" });
    }
  });

  app.post("/api/emails/:id/create-lead", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { id } = req.params;

      const email = await storage.getEmailThread(id, userId);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      const leadData = await aiService.extractLeadData(userId, {
        from: email.fromName || email.fromEmail,
        senderEmail: email.fromEmail,
        subject: email.subject,
        preview: email.snippet || "",
      });

      if (!leadData) {
        return res.status(400).json({ message: "AI service not configured or unavailable" });
      }

      let companyId = null;
      if (leadData.company) {
        const existingCompanies = await storage.getCompanies(userId);
        const existingCompany = existingCompanies.find(c => c.name.toLowerCase() === leadData.company!.name.toLowerCase());

        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          const newCompany = await storage.createCompany({
            name: leadData.company.name,
            industry: leadData.company.industry || null,
            size: leadData.company.size || null,
            location: leadData.company.location || null,
            revenue: null,
            userId,
          });
          companyId = newCompany.id;
        }
      }

      const existingContacts = await storage.getContacts(userId);
      let contactId: string;
      const existingContact = existingContacts.find(c => c.email.toLowerCase() === leadData.contact.email.toLowerCase());

      if (existingContact) {
        contactId = existingContact.id;
        await storage.updateContact(existingContact.id, userId, {
          phone: leadData.contact.phone || existingContact.phone,
          position: leadData.contact.role || existingContact.position,
          companyId: companyId || existingContact.companyId,
        });
      } else {
        // Split name into first and last name
        const nameParts = leadData.contact.name.trim().split(/\s+/);
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || 'Contact';

        const newContact = await storage.createContact({
          firstName,
          lastName,
          email: leadData.contact.email,
          phone: leadData.contact.phone || null,
          position: leadData.contact.role || null,
          companyId: companyId,
          userId,
        });
        contactId = newContact.id;
      }

      const existingLeads = await storage.getLeads(userId);
      const existingLead = existingLeads.find(l => l.contactId === contactId);

      let lead;
      if (existingLead) {
        lead = await storage.updateLead(existingLead.id, userId, {
          companyId: companyId || existingLead.companyId,
          value: leadData.lead.value || existingLead.value,
        });
      } else {
        // Generate a title from the email subject or contact name
        const title = email.subject || `Lead from ${leadData.contact.name}`;

        lead = await storage.createLead({
          title,
          contactId: contactId,
          companyId: companyId,
          status: leadData.lead.status,
          value: leadData.lead.value || null,
          source: leadData.lead.source,
          userId,
        });
      }

      await storage.updateEmailThread(id, userId, {
        contactId: contactId,
        leadId: lead.id,
      });

      res.json({
        success: true,
        lead,
        contactId,
        companyId,
        message: existingLead ? "Lead updated successfully" : "Lead created successfully",
      });
    } catch (error: any) {
      console.error("Error creating lead from email:", error);
      res.status(500).json({ message: error.message || "Failed to create lead" });
    }
  });

  app.post("/api/emails/sync", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const stats = await emailSyncService.syncUserEmails(userId);
      res.json({
        message: "Email sync completed",
        stats
      });
    } catch (error: any) {
      console.error("Error syncing emails:", error);
      res.status(500).json({ message: error.message || "Failed to sync emails" });
    }
  });

  app.post("/api/emails/sync/start", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { intervalMinutes = 15 } = req.body;
      emailSyncService.startAutoSync(userId, intervalMinutes);
      res.json({
        message: "Auto-sync started",
        intervalMinutes
      });
    } catch (error: any) {
      console.error("Error starting auto-sync:", error);
      res.status(500).json({ message: error.message || "Failed to start auto-sync" });
    }
  });

  app.post("/api/emails/sync/stop", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      emailSyncService.stopAutoSync(userId);
      res.json({ message: "Auto-sync stopped" });
    } catch (error: any) {
      console.error("Error stopping auto-sync:", error);
      res.status(500).json({ message: error.message || "Failed to stop auto-sync" });
    }
  });

  app.post("/api/emails/generate-reply", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { emailId, tone } = req.body;

      if (!emailId) {
        return res.status(400).json({ message: "Email ID is required" });
      }

      const email = await storage.getEmailThread(emailId, userId);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      // Check if API key is configured
      const settings = await storage.getUserSettings(userId);
      if (!settings?.openRouterApiKey) {
        return res.status(400).json({ message: "AI API key not configured. Please add your OpenRouter API key in Settings." });
      }

      const validTone = ["professional", "friendly", "persuasive"].includes(tone) ? tone : "professional";

      const reply = await aiService.generateReply(
        userId,
        {
          subject: email.subject,
          from: email.fromName || email.fromEmail,
          body: email.snippet || "",
        },
        validTone
      );

      if (!reply) {
        return res.status(500).json({ message: "Failed to generate reply. The AI service may be unavailable. Please try again." });
      }

      res.json({ reply });
    } catch (error: any) {
      console.error("Error generating reply:", error);
      res.status(500).json({ message: error.message || "Failed to generate reply" });
    }
  });

  app.post("/api/emails/generate-compose", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { subject, tone, context } = req.body;

      if (!subject) {
        return res.status(400).json({ message: "Subject is required" });
      }

      const validTone = ["professional", "friendly", "persuasive"].includes(tone) ? tone : "professional";

      // Check if API key is configured
      const settings = await storage.getUserSettings(userId);
      if (!settings?.openRouterApiKey) {
        return res.status(400).json({ message: "AI API key not configured. Please add your OpenRouter API key in Settings." });
      }

      const body = await aiService.generateCompose(
        userId,
        {
          subject,
          context,
        },
        validTone
      );

      if (!body) {
        return res.status(500).json({ message: "Failed to generate email. The AI service may be unavailable. Please try again." });
      }

      res.json({ body });
    } catch (error: any) {
      console.error("Error generating compose:", error);
      res.status(500).json({ message: error.message || "Failed to generate email" });
    }
  });

  app.post("/api/emails/send", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { to, subject, body, replyToThreadId } = req.body;

      if (!to || !subject || !body) {
        return res.status(400).json({ message: "Missing required fields: to, subject, body" });
      }

      const token = await storage.getOAuthToken(userId, 'gmail');
      if (!token) {
        return res.status(400).json({ message: "Gmail not connected. Please connect Gmail first." });
      }

      const settings = await storage.getUserSettings(userId);
      if (!settings?.gmailClientId || !settings?.gmailClientSecret) {
        return res.status(400).json({ message: "Gmail credentials not configured" });
      }

      const gmail = await gmailService.getGmailClient(
        token.accessToken,
        token.refreshToken,
        settings.gmailClientId,
        settings.gmailClientSecret
      );

      const sentMessage = await gmailService.sendEmail(gmail, to, subject, body);

      const activity = await storage.createActivity({
        type: 'email',
        title: `Sent email: ${subject}`,
        description: `Sent email to ${to}`,
        userId,
      });

      res.json({
        success: true,
        message: "Email sent successfully",
        messageId: sentMessage.id,
        activity
      });
    } catch (error: any) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: error.message || "Failed to send email" });
    }
  });

  app.post("/api/settings/test-ai", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { apiKey } = req.body;

      if (!apiKey) {
        return res.status(400).json({ message: "API key is required" });
      }

      // Test the API key by making a simple request
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : "http://localhost:5000",
          "X-Title": "SalesPilot",
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct:free",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return res.status(400).json({
          message: "Invalid API key",
          connected: false,
          error: error.error?.message || "API key test failed"
        });
      }

      res.json({
        message: "API key is valid",
        connected: true
      });
    } catch (error: any) {
      console.error("Error testing AI API:", error);
      res.status(500).json({
        message: "Failed to test API key",
        connected: false,
        error: error.message
      });
    }
  });

  // OAuth routes - Gmail
  app.get("/api/oauth/gmail/authorize", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const settings = await storage.getUserSettings(userId);

      if (!settings?.gmailClientId || !settings?.gmailClientSecret) {
        return res.status(400).json({ message: "Gmail OAuth credentials not configured. Please configure them in settings first." });
      }

      const redirectUri = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : "http://localhost:5000"}/api/oauth/gmail/callback`;
      const state = crypto.randomBytes(32).toString('base64url');

      req.session!.gmailState = state;

      const authUrl = gmailService.getAuthUrl(settings.gmailClientId, settings.gmailClientSecret, redirectUri, state);

      res.json({ authUrl });
    } catch (error: any) {
      console.error("Error generating Gmail auth URL:", error);
      res.status(500).json({ message: error.message || "Failed to generate Gmail auth URL" });
    }
  });

  app.get("/api/oauth/gmail/callback", async (req: AuthRequest, res: Response) => {
    try {
      const { code, state } = req.query;

      if (!code || typeof code !== 'string') {
        return res.redirect('/settings?gmail=error&reason=no_code');
      }

      const storedState = req.session?.gmailState;
      const userId = req.session?.passport?.user;
      delete req.session!.gmailState;

      if (!userId) {
        return res.redirect('/settings?gmail=error&reason=not_authenticated');
      }

      if (!state || !storedState || state !== storedState) {
        return res.redirect('/settings?gmail=error&reason=invalid_state');
      }

      const settings = await storage.getUserSettings(userId);
      if (!settings?.gmailClientId || !settings?.gmailClientSecret) {
        return res.status(400).json({ message: "Gmail OAuth credentials not configured" });
      }

      const redirectUri = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : "http://localhost:5000"}/api/oauth/gmail/callback`;
      const tokens = await gmailService.getTokenFromCode(code, settings.gmailClientId, settings.gmailClientSecret, redirectUri);

      const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000);

      const existingToken = await storage.getOAuthToken(userId, 'gmail');
      if (existingToken) {
        await storage.updateOAuthToken(userId, 'gmail', {
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token || existingToken.refreshToken,
          expiresAt,
          scope: tokens.scope,
        });
      } else {
        await storage.createOAuthToken({
          userId,
          provider: 'gmail',
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token || null,
          expiresAt,
          scope: tokens.scope,
        });
      }

      await storage.updateUserSettings(userId, { gmailConnected: 1 });

      emailSyncService.startAutoSync(userId, 15);

      res.redirect('/settings?gmail=connected');
    } catch (error: any) {
      console.error("Error handling Gmail OAuth callback:", error);
      res.redirect('/settings?gmail=error');
    }
  });

  app.post("/api/oauth/gmail/disconnect", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      await storage.deleteOAuthToken(userId, 'gmail');
      await storage.updateUserSettings(userId, { gmailConnected: 0 });
      emailSyncService.stopAutoSync(userId);
      res.json({ message: "Gmail disconnected successfully" });
    } catch (error: any) {
      console.error("Error disconnecting Gmail:", error);
      res.status(500).json({ message: error.message || "Failed to disconnect Gmail" });
    }
  });

  // OAuth routes - LinkedIn
  app.get("/api/oauth/linkedin/authorize", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const settings = await storage.getUserSettings(userId);

      if (!settings?.linkedinClientId || !settings?.linkedinClientSecret) {
        return res.status(400).json({ message: "LinkedIn OAuth credentials not configured. Please configure them in settings first." });
      }

      const redirectUri = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : "http://localhost:5000"}/api/oauth/linkedin/callback`;
      const state = crypto.randomBytes(32).toString('base64url');

      req.session!.linkedinState = state;

      const authUrl = linkedinService.getAuthUrl(settings.linkedinClientId, redirectUri, state);
      res.json({ authUrl });
    } catch (error: any) {
      console.error("Error generating LinkedIn auth URL:", error);
      res.status(500).json({ message: error.message || "Failed to generate LinkedIn auth URL" });
    }
  });

  app.get("/api/oauth/linkedin/callback", async (req: AuthRequest, res: Response) => {
    try {
      const { code, state, error, error_description } = req.query;

      console.log("LinkedIn OAuth callback received:", { code: !!code, state: !!state, error, error_description });

      if (error) {
        console.error("LinkedIn OAuth error:", error, error_description);
        return res.redirect(`/settings?linkedin=error&reason=oauth_error&detail=${encodeURIComponent(error_description as string || error as string)}`);
      }

      if (!code || typeof code !== 'string') {
        return res.redirect('/settings?linkedin=error&reason=no_code');
      }

      const storedState = req.session?.linkedinState;
      const userId = req.session?.passport?.user;
      delete req.session!.linkedinState;

      if (!userId) {
        return res.redirect('/settings?linkedin=error&reason=not_authenticated');
      }

      if (!state || !storedState || state !== storedState) {
        console.error("State mismatch:", { received: state, stored: storedState });
        return res.redirect('/settings?linkedin=error&reason=invalid_state');
      }

      const settings = await storage.getUserSettings(userId);
      if (!settings?.linkedinClientId || !settings?.linkedinClientSecret) {
        return res.status(400).json({ message: "LinkedIn OAuth credentials not configured" });
      }

      const redirectUri = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : "http://localhost:5000"}/api/oauth/linkedin/callback`;

      console.log("LinkedIn token exchange - Using redirect URI:", redirectUri);

      let tokens;
      try {
        tokens = await linkedinService.getTokenFromCode(code, settings.linkedinClientId, settings.linkedinClientSecret, redirectUri);
      } catch (error: any) {
        console.error("LinkedIn token exchange failed:", error);
        return res.redirect('/settings?linkedin=error&reason=token_exchange_failed');
      }

      const expiresAt = new Date(Date.now() + (tokens.expires_in || 5184000) * 1000);

      const existingToken = await storage.getOAuthToken(userId, 'linkedin');
      if (existingToken) {
        await storage.updateOAuthToken(userId, 'linkedin', {
          accessToken: tokens.access_token,
          expiresAt,
          scope: tokens.scope || 'openid profile email w_member_social',
        });
      } else {
        await storage.createOAuthToken({
          userId,
          provider: 'linkedin',
          accessToken: tokens.access_token,
          refreshToken: null,
          expiresAt,
          scope: tokens.scope || 'openid profile email',
        });
      }

      await storage.updateUserSettings(userId, { linkedinConnected: 1 });

      res.redirect('/settings?linkedin=connected');
    } catch (error: any) {
      console.error("Error handling LinkedIn OAuth callback:", error);
      res.redirect('/settings?linkedin=error');
    }
  });

  app.post("/api/oauth/linkedin/disconnect", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      await storage.deleteOAuthToken(userId, 'linkedin');
      await storage.updateUserSettings(userId, { linkedinConnected: 0 });
      res.json({ message: "LinkedIn disconnected successfully" });
    } catch (error: any) {
      console.error("Error disconnecting LinkedIn:", error);
      res.status(500).json({ message: error.message || "Failed to disconnect LinkedIn" });
    }
  });

  // LinkedIn sync route
  app.post("/api/linkedin/sync", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;

      console.log('[LinkedIn Sync] Sync initiated for user:', userId);

      const settings = await storage.getUserSettings(userId);
      const token = await storage.getOAuthToken(userId, 'linkedin');

      if (!settings?.linkedinConnected || !token) {
        return res.status(400).json({ message: "LinkedIn not connected" });
      }

      const messages = await linkedinService.syncMessages(token.accessToken, userId);

      if (messages.length === 0) {
        console.log('[LinkedIn Sync] No messages retrieved (LinkedIn Messaging API is restricted to approved partners)');
        return res.json({ 
          message: "LinkedIn sync completed - no messages available (API restricted to partners. Ready for Unipile integration)",
          count: 0,
          messages: []
        });
      }

      const syncedMessages = [];
      for (const message of messages) {
        const parsed = linkedinService.parseLinkedInMessage(message, userId);

        const existing = await storage.getEmailThreads(userId);
        const isDuplicate = existing.some(e => 
          e.messageId === parsed.messageId && e.channel === 'linkedin'
        );

        if (isDuplicate) {
          console.log(`[LinkedIn Sync] Skipping duplicate message: ${parsed.messageId}`);
          continue;
        }

        const savedMessage = await storage.createEmailThread({
          subject: parsed.subject,
          snippet: parsed.snippet,
          fromEmail: parsed.fromEmail,
          fromName: parsed.fromName,
          toEmail: parsed.toEmail,
          threadId: parsed.threadId,
          messageId: parsed.messageId,
          channel: parsed.channel,
          providerMetadata: parsed.providerMetadata,
          userId: parsed.userId,
          receivedAt: parsed.receivedAt,
        });

        syncedMessages.push(savedMessage);
      }

      res.json({ 
        message: "LinkedIn messages synced successfully", 
        count: syncedMessages.length, 
        messages: syncedMessages 
      });
    } catch (error: any) {
      console.error("Error syncing LinkedIn messages:", error);
      res.status(500).json({ message: error.message || "Failed to sync LinkedIn messages" });
    }
  });

  // n8n Integration routes
  app.post("/api/n8n/configure", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { webhookUrl, apiKey } = req.body;

      if (!webhookUrl) {
        return res.status(400).json({ message: "Webhook URL is required" });
      }

      await storage.updateUserSettings(userId, {
        n8nWebhookUrl: webhookUrl,
        n8nApiKey: apiKey || null,
        n8nConnected: 1,
      });

      res.json({ message: "n8n configured successfully" });
    } catch (error: any) {
      console.error("Error configuring n8n:", error);
      res.status(500).json({ message: error.message || "Failed to configure n8n" });
    }
  });

  app.post("/api/n8n/test", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const settings = await storage.getUserSettings(userId);

      if (!settings?.n8nWebhookUrl) {
        return res.status(400).json({ message: "n8n webhook URL not configured" });
      }

      const testPayload = {
        event: "test",
        timestamp: new Date().toISOString(),
        data: { message: "Test connection from SalesPilot" }
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (settings.n8nApiKey) {
        headers['X-N8N-API-KEY'] = settings.n8nApiKey;
      }

      const response = await fetch(settings.n8nWebhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
      });

      if (!response.ok) {
        throw new Error(`n8n webhook returned status ${response.status}`);
      }

      res.json({ message: "n8n connection test successful", status: response.status });
    } catch (error: any) {
      console.error("Error testing n8n connection:", error);
      res.status(500).json({ message: error.message || "Failed to test n8n connection" });
    }
  });

  app.post("/api/n8n/disconnect", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      await storage.updateUserSettings(userId, {
        n8nWebhookUrl: null,
        n8nApiKey: null,
        n8nConnected: 0,
      });
      res.json({ message: "n8n disconnected successfully" });
    } catch (error: any) {
      console.error("Error disconnecting n8n:", error);
      res.status(500).json({ message: error.message || "Failed to disconnect n8n" });
    }
  });

  app.post("/api/n8n/trigger", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { event, data } = req.body;

      if (!event) {
        return res.status(400).json({ message: "Event type is required" });
      }

      const settings = await storage.getUserSettings(userId);

      if (!settings?.n8nWebhookUrl) {
        return res.status(400).json({ message: "n8n webhook URL not configured" });
      }

      const payload = {
        event,
        timestamp: new Date().toISOString(),
        userId,
        data,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (settings.n8nApiKey) {
        headers['X-N8N-API-KEY'] = settings.n8nApiKey;
      }

      const response = await fetch(settings.n8nWebhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`n8n webhook returned status ${response.status}`);
      }

      let responseData;
      try {
        responseData = await response.json();
      } catch {
        responseData = { message: "Workflow triggered successfully" };
      }

      res.json({ message: "Workflow triggered successfully", response: responseData });
    } catch (error: any) {
      console.error("Error triggering n8n workflow:", error);
      res.status(500).json({ message: error.message || "Failed to trigger workflow" });
    }
  });

  app.post("/api/contacts/:id/enrich-linkedin", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const contactId = req.params.id;
      const { linkedinProfileUrl } = req.body;

      if (!linkedinProfileUrl) {
        return res.status(400).json({ message: "LinkedIn profile URL is required" });
      }

      const contact = await storage.getContact(contactId);
      if (!contact || contact.userId !== userId) {
        return res.status(404).json({ message: "Contact not found" });
      }

      const linkedinToken = await storage.getOAuthToken(userId, 'linkedin');

      let enrichmentData: any = {
        linkedinProfileUrl
      };

      if (linkedinToken) {
        try {
          const profile = await linkedinService.getUserProfile(linkedinToken.accessToken);
          enrichmentData.linkedinImageUrl = profile.picture;
        } catch (error) {
          console.warn("Could not fetch LinkedIn profile data, saving URL only:", error);
        }
      }

      const updated = await storage.updateContact(contactId, userId, enrichmentData);
      res.json(updated);
    } catch (error: any) {
      console.error("Error enriching contact with LinkedIn data:", error);
      res.status(500).json({ message: error.message || "Failed to enrich contact" });
    }
  });

  // Gmail API routes - Sync emails
  app.post("/api/gmail/sync", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;

      const settings = await storage.getUserSettings(userId);
      const token = await storage.getOAuthToken(userId, 'gmail');

      if (!settings?.gmailClientId || !settings?.gmailClientSecret || !token) {
        return res.status(400).json({ message: "Gmail not connected" });
      }

      const gmail = await gmailService.getGmailClient(
        token.accessToken,
        token.refreshToken,
        settings.gmailClientId,
        settings.gmailClientSecret
      );

      const messages = await gmailService.listMessages(gmail, 20);

      const syncedEmails = [];
      for (const message of messages) {
        const fullMessage = await gmailService.getMessage(gmail, message.id);
        const parsed = gmailService.parseEmailMessage(fullMessage);

        const email = await storage.createEmailThread({
          fromName: parsed.from.split('<')[0].trim(),
          fromEmail: parsed.from.match(/<(.+)>/)?.[1] || parsed.from,
          subject: parsed.subject,
          snippet: parsed.snippet,
          userId,
        });

        syncedEmails.push(email);
      }

      res.json({ message: "Emails synced successfully", count: syncedEmails.length, emails: syncedEmails });
    } catch (error: any) {
      console.error("Error syncing Gmail:", error);
      res.status(500).json({ message: error.message || "Failed to sync Gmail" });
    }
  });

  // Relationship graph data for visualization
  app.get("/api/relationship-graph", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;

      const [companies, contacts, leads, activities, emails] = await Promise.all([
        storage.getCompanies(userId),
        storage.getContacts(userId),
        storage.getLeads(userId),
        storage.getActivities(userId),
        storage.getEmailThreads(userId),
      ]);

      const now = new Date();
      const calculateDaysSince = (date: Date) => Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

      const contactEngagement = new Map<string, { score: number; lastInteraction: Date; interactionCount: number }>();
      contacts.forEach(contact => {
        const contactActivities = activities.filter(a => a.contactId === contact.id);
        const contactEmails = emails.filter(e => e.contactId === contact.id);

        const allInteractions = [
          ...contactActivities.map(a => a.createdAt),
          ...contactEmails.map(e => e.receivedAt)
        ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        const lastInteraction = allInteractions[0] ? new Date(allInteractions[0]) : new Date(contact.createdAt);
        const daysSinceLastInteraction = calculateDaysSince(lastInteraction);
        const interactionCount = allInteractions.length;

        let score = 0;
        if (interactionCount > 10) score += 40;
        else if (interactionCount > 5) score += 25;
        else if (interactionCount > 0) score += 10;

        if (daysSinceLastInteraction < 7) score += 30;
        else if (daysSinceLastInteraction < 30) score += 15;
        else if (daysSinceLastInteraction < 90) score += 5;

        const contactLead = leads.find(l => l.contactId === contact.id);
        if (contactLead) {
          if (contactLead.status === 'negotiation') score += 20;
          else if (contactLead.status === 'demo' || contactLead.status === 'qualified') score += 15;
          else if (contactLead.status === 'prospect') score += 5;

          if (contactLead.value && contactLead.value > 50000) score += 10;
          else if (contactLead.value && contactLead.value > 10000) score += 5;
        }

        contactEngagement.set(contact.id, {
          score: Math.min(score, 100),
          lastInteraction,
          interactionCount
        });
      });

      const leadEngagement = new Map<string, { score: number; isHot: boolean }>();
      leads.forEach(lead => {
        const contactScore = lead.contactId ? contactEngagement.get(lead.contactId)?.score || 0 : 0;
        let leadScore = contactScore;

        if (lead.status === 'negotiation') leadScore += 20;
        else if (lead.status === 'demo') leadScore += 15;

        if (lead.value && lead.value > 50000) leadScore += 15;

        const isHot = leadScore >= 60;
        leadEngagement.set(lead.id, { score: Math.min(leadScore, 100), isHot });
      });

      const nodes = [
        ...companies.map(company => ({
          id: `company-${company.id}`,
          type: 'company',
          data: {
            ...company,
            label: company.name,
            description: `${company.industry || 'Unknown Industry'} • ${company.size || 'Unknown Size'}`,
          }
        })),
        ...contacts.map(contact => ({
          id: `contact-${contact.id}`,
          type: 'contact',
          data: {
            ...contact,
            label: `${contact.firstName} ${contact.lastName}`,
            description: contact.position || 'Contact',
            engagement: contactEngagement.get(contact.id),
          }
        })),
        ...leads.map(lead => ({
          id: `lead-${lead.id}`,
          type: 'lead',
          data: {
            ...lead,
            label: lead.title,
            description: `${lead.status} • ${lead.value ? `$${lead.value.toLocaleString()}` : 'No value'}`,
            engagement: leadEngagement.get(lead.id),
            isHot: leadEngagement.get(lead.id)?.isHot || false,
          }
        }))
      ];

      const edges = [];

      contacts.forEach(contact => {
        if (contact.companyId) {
          edges.push({
            id: `edge-contact-${contact.id}-company-${contact.companyId}`,
            source: `contact-${contact.id}`,
            target: `company-${contact.companyId}`,
            type: 'worksAt',
            label: 'works at'
          });
        }
      });

      leads.forEach(lead => {
        if (lead.contactId) {
          edges.push({
            id: `edge-lead-${lead.id}-contact-${lead.contactId}`,
            source: `lead-${lead.id}`,
            target: `contact-${lead.contactId}`,
            type: 'associatedWith',
            label: 'associated with'
          });
        }
        if (lead.companyId) {
          edges.push({
            id: `edge-lead-${lead.id}-company-${lead.companyId}`,
            source: `lead-${lead.id}`,
            target: `company-${lead.companyId}`,
            type: 'forCompany',
            label: 'for company'
          });
        }
      });

      const topEngagedContacts = Array.from(contactEngagement.entries())
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 5)
        .map(([contactId, engagement]) => {
          const contact = contacts.find(c => c.id === contactId);
          return contact ? {
            id: contactId,
            name: `${contact.firstName} ${contact.lastName}`,
            score: engagement.score,
            lastInteraction: engagement.lastInteraction,
            interactionCount: engagement.interactionCount
          } : null;
        })
        .filter(c => c !== null);

      const contactsToFollowUp = Array.from(contactEngagement.entries())
        .filter(([_, engagement]) => {
          const daysSince = calculateDaysSince(engagement.lastInteraction);
          return engagement.interactionCount > 0 && daysSince > 14 && daysSince < 90;
        })
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 5)
        .map(([contactId, engagement]) => {
          const contact = contacts.find(c => c.id === contactId);
          if (!contact) return null;
          const daysSince = calculateDaysSince(engagement.lastInteraction);
          return {
            id: contactId,
            name: `${contact.firstName} ${contact.lastName}`,
            score: engagement.score,
            daysSinceLastContact: daysSince,
            reason: `No contact in ${daysSince} days`
          };
        })
        .filter(c => c !== null);

      const hotLeads = leads
        .filter(lead => leadEngagement.get(lead.id)?.isHot)
        .map(lead => ({
          id: lead.id,
          title: lead.title,
          score: leadEngagement.get(lead.id)?.score || 0,
          status: lead.status,
          value: lead.value
        }));

      res.json({
        nodes,
        edges,
        insights: {
          topEngagedContacts,
          contactsToFollowUp,
          hotLeads,
          stats: {
            totalCompanies: companies.length,
            totalContacts: contacts.length,
            totalLeads: leads.length,
            activeLeads: leads.filter(l => !['won', 'lost'].includes(l.status)).length,
            hotLeadsCount: hotLeads.length
          }
        }
      });
    } catch (error) {
      console.error("Error fetching relationship graph:", error);
      res.status(500).json({ message: "Failed to fetch relationship graph" });
    }
  });

  // Development: Seed sample emails for testing
  app.post("/api/dev/seed-emails", isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email;

      const sampleEmails = [
        {
          subject: "Partnership Opportunity",
          snippet: "I'd like to discuss a potential partnership...",
          fromEmail: "john@techcorp.com",
          fromName: "John Smith",
          toEmail: userEmail,
          aiSummary: "Partnership inquiry from TechCorp",
          aiClassification: "opportunity",
          aiConfidence: 85,
          threadId: "thread_1",
          messageId: "msg_1",
          userId,
          receivedAt: new Date(),
        },
        {
          subject: "Quick Question",
          snippet: "Can you help me with...",
          fromEmail: "sarah@startup.io",
          fromName: "Sarah Johnson",
          toEmail: userEmail,
          aiSummary: "Support request",
          aiClassification: "question",
          aiConfidence: 90,
          threadId: "thread_2",
          messageId: "msg_2",
          userId,
          receivedAt: new Date(),
        },
      ];

      for (const email of sampleEmails) {
        await storage.createEmailThread(email);
      }

      res.json({ message: "Sample emails seeded successfully" });
    } catch (error: any) {
      console.error("Error seeding emails:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // AI Copilot Chat
  app.post("/api/copilot/chat", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.user.id;
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Messages array is required" });
      }

      // Gather context from CRM data
      const leads = await storage.getLeads(userId);
      const contacts = await storage.getContacts(userId);
      const companies = await storage.getCompanies(userId);
      const activities = await storage.getActivities(userId);

      const response = await aiService.chatCopilot(userId, messages, {
        leads,
        contacts,
        companies,
        activities: activities.slice(0, 10), // Only recent activities
      });

      if (!response) {
        return res.status(500).json({ message: "Failed to generate response" });
      }

      res.json(response);
    } catch (error: any) {
      console.error("Error in copilot chat:", error);
      res.status(500).json({ message: error.message || "Failed to process chat" });
    }
  });

  // Teams API
  app.get("/api/teams", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const teams = await storage.getTeams(userId);
      res.json(teams);
    } catch (error: any) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: error.message || "Failed to fetch teams" });
    }
  });

  app.post("/api/teams", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Team name is required" });
      }

      // Create new team
      const team = await storage.createTeam({
        name,
        description,
        organizationId: req.organizationId!, // Added organizationId here
        ownerId: userId,
      });

      res.status(201).json(team);
    } catch (error: any) {
      console.error("Error creating team:", error);
      res.status(500).json({ message: error.message || "Failed to create team" });
    }
  });

  app.patch("/api/teams/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { name, description } = req.body;

      const updated = await storage.updateTeam(id, userId, {
        name,
        description,
      });

      if (!updated) {
        return res.status(404).json({ message: "Team not found or you don't have permission" });
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating team:", error);
      res.status(500).json({ message: error.message || "Failed to update team" });
    }
  });

  app.delete("/api/teams/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const deleted = await storage.deleteTeam(id, userId);

      if (!deleted) {
        return res.status(404).json({ message: "Team not found or you don't have permission" });
      }

      res.json({ message: "Team deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting team:", error);
      res.status(500).json({ message: error.message || "Failed to delete team" });
    }
  });

  // Team Members API
  app.get("/api/teams/:teamId/members", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const { teamId } = req.params;
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error: any) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: error.message || "Failed to fetch team members" });
    }
  });

  app.post("/api/teams/:teamId/members", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const { teamId } = req.params;
      const { email, role } = req.body;

      if (!email) {
        return res.status(400).json({ message: "User email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found with that email" });
      }

      // Check if already a member
      const existing = await storage.getTeamMember(teamId, user.id);
      if (existing) {
        return res.status(400).json({ message: "User is already a team member" });
      }

      const member = await storage.addTeamMember({
        teamId,
        userId: user.id,
        role: role || 'member',
      });

      res.status(201).json(member);
    } catch (error: any) {
      console.error("Error adding team member:", error);
      res.status(500).json({ message: error.message || "Failed to add team member" });
    }
  });

  app.patch("/api/teams/:teamId/members/:userId", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const { teamId, userId } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }

      const updated = await storage.updateTeamMemberRole(teamId, userId, role);

      if (!updated) {
        return res.status(404).json({ message: "Team member not found" });
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating team member role:", error);
      res.status(500).json({ message: error.message || "Failed to update team member" });
    }
  });

  app.post("/api/teams/:teamId/invite", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const { teamId } = req.params;
      const { email, role } = req.body;

      if (!email || !role) {
        return res.status(400).json({ message: "Email and role are required" });
      }

      // Find user by email
      const invitedUser = await storage.getUserByEmail(email);

      if (!invitedUser) {
        return res.status(404).json({ message: "User not found with this email" });
      }

      // Check if user is already a member
      const existingMember = await storage.getTeamMember(teamId, invitedUser.id);
      if (existingMember) {
        return res.status(400).json({ message: "User is already a team member" });
      }

      // Add member to team
      const member = await storage.addTeamMember({
        teamId,
        userId: invitedUser.id,
        role,
      });

      res.status(201).json(member);
    } catch (error: any) {
      console.error("Error inviting team member:", error);
      res.status(500).json({ message: error.message || "Failed to invite team member" });
    }
  });

  app.patch("/api/teams/:teamId/members/:userId/role", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const { teamId, userId } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }

      const updated = await storage.updateTeamMemberRole(teamId, userId, role);

      if (!updated) {
        return res.status(404).json({ message: "Team member not found" });
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating team member role:", error);
      res.status(500).json({ message: error.message || "Failed to update role" });
    }
  });

  app.delete("/api/teams/:teamId/members/:userId", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const { teamId, userId } = req.params;

      const removed = await storage.removeTeamMember(teamId, userId);

      if (!removed) {
        return res.status(404).json({ message: "Team member not found" });
      }

      res.json({ message: "Team member removed successfully" });
    } catch (error: any) {
      console.error("Error removing team member:", error);
      res.status(500).json({ message: error.message || "Failed to remove team member" });
    }
  });

  // Workflow Templates API
  app.get("/api/workflow-templates", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const templates = await storage.getWorkflowTemplates();
      res.json(templates);
    } catch (error: any) {
      console.error("Error fetching workflow templates:", error);
      res.status(500).json({ message: error.message || "Failed to fetch workflow templates" });
    }
  });

  app.post("/api/user-workflows", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { templateId } = req.body;

      if (!templateId) {
        return res.status(400).json({ message: "Template ID is required" });
      }

      const template = await storage.getWorkflowTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Workflow template not found" });
      }

      const workflow = await storage.createUserWorkflow({
        userId,
        templateId,
        name: template.name,
        description: template.description,
        triggerType: template.triggerType,
        isActive: true,
      });

      res.status(201).json(workflow);
    } catch (error: any) {
      console.error("Error creating user workflow:", error);
      res.status(500).json({ message: error.message || "Failed to create workflow" });
    }
  });

  app.get("/api/workflow-templates/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const template = await storage.getWorkflowTemplate(id);

      if (!template) {
        return res.status(404).json({ message: "Workflow template not found" });
      }

      res.json(template);
    } catch (error: any) {
      console.error("Error fetching workflow template:", error);
      res.status(500).json({ message: error.message || "Failed to fetch workflow template" });
    }
  });

  // User Workflows API
  app.get("/api/workflows", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const workflows = await storage.getUserWorkflows(userId);
      res.json(workflows);
    } catch (error: any) {
      console.error("Error fetching user workflows:", error);
      res.status(500).json({ message: error.message || "Failed to fetch workflows" });
    }
  });

  app.post("/api/workflows/clone/:templateId", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { templateId } = req.params;
      const { name, customConfig } = req.body;

      // Get the template
      const template = await storage.getWorkflowTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Workflow template not found" });
      }

      // Create user workflow from template
      const workflow = await storage.createUserWorkflow({
        userId,
        templateId,
        name: name || template.name,
        description: template.description,
        triggerType: template.triggerType,
        isActive: true,
      });

      res.status(201).json(workflow);
    } catch (error: any) {
      console.error("Error cloning workflow template:", error);
      res.status(500).json({ message: error.message || "Failed to clone workflow template" });
    }
  });

  app.patch("/api/workflows/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { name, description, isActive } = req.body;

      const updated = await storage.updateUserWorkflow(id, userId, {
        name,
        description,
        isActive,
      });

      if (!updated) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating workflow:", error);
      res.status(500).json({ message: error.message || "Failed to update workflow" });
    }
  });

  app.delete("/api/workflows/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const deleted = await storage.deleteUserWorkflow(id, userId);

      if (!deleted) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      res.json({ message: "Workflow deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting workflow:", error);
      res.status(500).json({ message: error.message || "Failed to delete workflow" });
    }
  });

  // ========== RBACROUTES ==========

  // Helper to verify organization membership
  async function verifyOrganizationMembership(userId: string, organizationId: string): Promise<boolean> {
    const userOrgs = await storage.getOrganizations(userId);
    return userOrgs.some(org => org.id === organizationId);
  }

  // Organizations
  app.get("/api/organizations", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const orgs = await storage.getOrganizations(userId);
      res.json(orgs);
    } catch (error: any) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: error.message || "Failed to fetch organizations" });
    }
  });

  app.get("/api/organizations/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const orgId = req.params.id;

      if (!await verifyOrganizationMembership(userId, orgId)) {
        return res.status(403).json({ message: "Access denied to this organization" });
      }

      const org = await storage.getOrganization(orgId);
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.json(org);
    } catch (error: any) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: error.message || "Failed to fetch organization" });
    }
  });

  app.post("/api/organizations", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { organizationService } = await import("./organization.service");
      const result = await organizationService.createOrganizationForUser(
        userId,
        req.body.name,
        req.body.domain
      );
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: error.message || "Failed to create organization" });
    }
  });

  app.patch("/api/organizations/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const orgId = req.params.id;

      const org = await storage.getOrganization(orgId);
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }

      if (org.ownerId !== userId) {
        return res.status(403).json({ message: "Only organization owner can update settings" });
      }

      const updated = await storage.updateOrganization(orgId, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating organization:", error);
      res.status(500).json({ message: error.message || "Failed to update organization" });
    }
  });

  app.get("/api/organizations/:id/members", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const orgId = req.params.id;

      if (!await verifyOrganizationMembership(userId, orgId)) {
        return res.status(403).json({ message: "Access denied to this organization" });
      }

      const members = await storage.getOrganizationMembers(orgId);
      res.json(members);
    } catch (error: any) {
      console.error("Error fetching organization members:", error);
      res.status(500).json({ message: error.message || "Failed to fetch members" });
    }
  });

  // Roles
  app.get("/api/roles", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const orgId = req.query.organizationId as string | undefined;
      const roles = await storage.getRoles(orgId);
      res.json(roles);
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: error.message || "Failed to fetch roles" });
    }
  });

  app.get("/api/roles/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const role = await storage.getRole(req.params.id);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json(role);
    } catch (error: any) {
      console.error("Error fetching role:", error);
      res.status(500).json({ message: error.message || "Failed to fetch role" });
    }
  });

  app.get("/api/roles/:id/permissions", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const permissions = await storage.getRolePermissions(req.params.id);
      res.json(permissions);
    } catch (error: any) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ message: error.message || "Failed to fetch permissions" });
    }
  });

  app.post("/api/roles", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const role = await storage.createRole(req.body);
      res.status(201).json(role);
    } catch (error: any) {
      console.error("Error creating role:", error);
      res.status(500).json({ message: error.message || "Failed to create role" });
    }
  });

  app.patch("/api/roles/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const updated = await storage.updateRole(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: error.message || "Failed to update role" });
    }
  });

  app.delete("/api/roles/:id", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const deleted = await storage.deleteRole(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json({ message: "Role deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting role:", error);
      res.status(500).json({ message: error.message || "Failed to delete role" });
    }
  });

  // Permissions
  app.get("/api/permissions", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const permissions = await storage.getPermissions();
      res.json(permissions);
    } catch (error: any) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: error.message || "Failed to fetch permissions" });
    }
  });

  // Invitations
  app.get("/api/invitations", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const orgId = req.query.organizationId as string;
      if (!orgId) {
        return res.status(400).json({ message: "Organization ID required" });
      }

      if (!await verifyOrganizationMembership(userId, orgId)) {
        return res.status(403).json({ message: "Access denied to this organization" });
      }

      const invitations = await storage.getInvitations(orgId);
      res.json(invitations);
    } catch (error: any) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: error.message || "Failed to fetch invitations" });
    }
  });

  app.post("/api/invitations", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { organizationId } = req.body;

      if (!await verifyOrganizationMembership(userId, organizationId)) {
        return res.status(403).json({ message: "Access denied to this organization" });
      }

      const { invitationService } = await import("./invitation.service");

      const invitation = await invitationService.createInvitation(
        req.body.email,
        organizationId,
        req.body.roleId,
        userId,
        req.body.teamId
      );

      await invitationService.sendInvitationEmail(invitation.id);

      res.status(201).json(invitation);
    } catch (error: any) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: error.message || "Failed to create invitation" });
    }
  });

  app.post("/api/invitations/:id/resend", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const invitation = await storage.getInvitation(req.params.id);

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      if (!await verifyOrganizationMembership(userId, invitation.organizationId)) {
        return res.status(403).json({ message: "Access denied to this organization" });
      }

      const { invitationService } = await import("./invitation.service");
      const updated = await invitationService.resendInvitation(req.params.id);
      res.json(updated);
    } catch (error: any) {
      console.error("Error resending invitation:", error);
      res.status(500).json({ message: error.message || "Failed to resend invitation" });
    }
  });

  app.post("/api/invitations/accept", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { invitationService } = await import("./invitation.service");
      const invitation = await invitationService.acceptInvitation(req.body.token, userId);
      res.json(invitation);
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: error.message || "Failed to accept invitation" });
    }
  });

  // Lead Assignments
  app.get("/api/leads/:leadId/assignment-recommendation", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { leadId } = req.params;
      const organizationId = req.query.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({ message: "Organization ID required" });
      }

      if (!await verifyOrganizationMembership(userId, organizationId)) {
        return res.status(403).json({ message: "Access denied to this organization" });
      }

      const { assignmentService } = await import("./assignment.service");
      const recommendation = await assignmentService.getAIRecommendation(leadId, organizationId);

      res.json(recommendation);
    } catch (error: any) {
      console.error("Error getting assignment recommendation:", error);
      res.status(500).json({ message: error.message || "Failed to get recommendation" });
    }
  });

  app.post("/api/leads/:leadId/assign", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const { leadId } = req.params;
      const userId = req.user!.id;
      const { assignedTo, method, aiReasoning, organizationId } = req.body;

      if (organizationId && !await verifyOrganizationMembership(userId, organizationId)) {
        return res.status(403).json({ message: "Access denied to this organization" });
      }

      const { assignmentService } = await import("./assignment.service");
      const assignment = await assignmentService.assignLead(
        leadId,
        assignedTo,
        userId,
        method,
        aiReasoning
      );

      res.status(201).json(assignment);
    } catch (error: any) {
      console.error("Error assigning lead:", error);
      res.status(500).json({ message: error.message || "Failed to assign lead" });
    }
  });

  app.get("/api/leads/:leadId/assignments", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const { leadId } = req.params;
      const assignments = await storage.getLeadAssignments(leadId);
      res.json(assignments);
    } catch (error: any) {
      console.error("Error fetching lead assignments:", error);
      res.status(500).json({ message: error.message || "Failed to fetch assignments" });
    }
  });

  // LinkedIn Graph API Routes
  const linkedInCSVImportSchema = z.object({
    csvText: z.string().min(1, "CSV text is required"),
    organizationId: z.string().min(1, "Organization ID is required"),
  });

  const linkedInExtensionImportSchema = z.object({
    people: z.array(z.object({
      name: z.string(),
      title: z.string().optional(),
      company: z.string().optional(),
      linkedinUrl: z.string().optional(),
      profileImageUrl: z.string().optional(),
    })).optional(),
    companies: z.array(z.object({
      name: z.string(),
      linkedinUrl: z.string().optional(),
      industry: z.string().optional(),
      size: z.string().optional(),
      location: z.string().optional(),
      website: z.string().optional(),
    })).optional(),
    timestamp: z.string(),
    organizationId: z.string().min(1, "Organization ID is required"),
  }).refine(data => (data.people && data.people.length > 0) || (data.companies && data.companies.length > 0), {
    message: "At least one person or company must be provided",
  });

  app.post("/api/import/linkedin-csv", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const parsed = linkedInCSVImportSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid request body",
          errors: parsed.error.errors 
        });
      }

      const { csvText, organizationId } = parsed.data;

      const userOrgs = await storage.getOrganizations(userId);
      const hasAccess = userOrgs.some(org => org.id === organizationId);

      if (!hasAccess) {
        return res.status(403).json({ 
          message: "Access denied to specified organization" 
        });
      }

      const { linkedInCSVService } = await import("./linkedin-csv.service");
      const result = await linkedInCSVService.importCSV(csvText, userId, organizationId);

      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error importing LinkedIn CSV:", error);
      res.status(500).json({ message: error.message || "Failed to import CSV" });
    }
  });

  app.post("/api/import/linkedin-extension", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const parsed = linkedInExtensionImportSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid request body",
          errors: parsed.error.errors 
        });
      }

      const { organizationId, ...extensionData } = parsed.data;

      const userOrgs = await storage.getOrganizations(userId);
      const hasAccess = userOrgs.some(org => org.id === organizationId);

      if (!hasAccess) {
        return res.status(403).json({ 
          message: "Access denied to specified organization" 
        });
      }

      const { linkedInExtensionService } = await import("./linkedin-extension.service");
      const result = await linkedInExtensionService.importExtensionData(extensionData, userId, organizationId);

      res.status(200).json(result);
    } catch (error: any) {
      console.error("Error importing LinkedIn extension data:", error);
      res.status(500).json({ message: error.message || "Failed to import extension data" });
    }
  });

  app.get("/api/graph/company/:companyId", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { companyId } = req.params;
      const depth = parseInt(req.query.depth as string) || 2;
      const organizationId = req.query.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({ 
          message: "Organization ID is required" 
        });
      }

      const userOrgs = await storage.getOrganizations(userId);
      const hasAccess = userOrgs.some(org => org.id === organizationId);

      if (!hasAccess) {
        return res.status(403).json({ 
          message: "Access denied to specified organization" 
        });
      }

      const { graphStorage } = await import("./graph.storage");
      const graphData = await graphStorage.getCompanyGraph(companyId, userId, organizationId, depth);

      res.json(graphData);
    } catch (error: any) {
      console.error("Error fetching company graph:", error);
      res.status(500).json({ message: error.message || "Failed to fetch graph" });
    }
  });

  app.get("/api/graph/stats", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const organizationId = req.query.organizationId as string;

      if (!organizationId) {
        return res.status(400).json({ 
          message: "Organization ID is required" 
        });
      }

      const userOrgs = await storage.getOrganizations(userId);
      const hasAccess = userOrgs.some(org => org.id === organizationId);

      if (!hasAccess) {
        return res.status(403).json({ 
          message: "Access denied to specified organization" 
        });
      }

      const { graphStorage } = await import("./graph.storage");
      const stats = await graphStorage.getGraphStats(userId, organizationId);

      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching graph stats:", error);
      res.status(500).json({ message: error.message || "Failed to fetch stats" });
    }
  });

  app.get("/api/graph/nodes", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const type = req.query.type as string;

      const { graphStorage } = await import("./graph.storage");
      const nodes = type 
        ? await graphStorage.getNodesByType(type, userId)
        : [];

      res.json(nodes);
    } catch (error: any) {
      console.error("Error fetching graph nodes:", error);
      res.status(500).json({ message: error.message || "Failed to fetch nodes" });
    }
  });

  app.delete("/api/graph/data", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      const { graphStorage } = await import("./graph.storage");
      await graphStorage.deleteUserGraphData(userId);

      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting graph data:", error);
      res.status(500).json({ message: error.message || "Failed to delete graph data" });
    }
  });

  // Register new RBAC routes
  const { registerRBACRoutes } = await import("./routes-rbac");
  registerRBACRoutes(app);

  const httpServer = createServer(app);

  emailSyncService.initializeAutoSyncForConnectedUsers();

  return httpServer;
}