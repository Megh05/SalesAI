import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword } from "./auth";
import { aiService } from "./ai";
import { gmailService } from "./gmail";
import { linkedinService } from "./linkedin";
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

type AuthRequest = Request & { user?: any };

export async function registerRoutes(app: Express): Promise<Server> {
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
      const lead = await storage.updateLead(id, userId, req.body);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
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
        from: email.senderEmail,
        preview: email.preview || "",
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
        from: email.senderEmail,
        body: email.preview || "",
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

  app.get("/api/oauth/gmail/callback", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { code, state } = req.query;

      const storedState = req.session?.gmailState;
      delete req.session!.gmailState;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: "Authorization code missing" });
      }

      if (!state || !storedState || state !== storedState) {
        return res.status(400).json({ message: "Invalid state parameter - possible CSRF attack" });
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

  app.get("/api/oauth/linkedin/callback", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { code, state } = req.query;

      const storedState = req.session?.linkedinState;
      delete req.session!.linkedinState;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ message: "Authorization code missing" });
      }

      if (!state || !storedState || state !== storedState) {
        return res.status(400).json({ message: "Invalid state parameter - possible CSRF attack" });
      }

      const settings = await storage.getUserSettings(userId);
      if (!settings?.linkedinClientId || !settings?.linkedinClientSecret) {
        return res.status(400).json({ message: "LinkedIn OAuth credentials not configured" });
      }

      const redirectUri = `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : "http://localhost:5000"}/api/oauth/linkedin/callback`;
      const tokens = await linkedinService.getTokenFromCode(code, settings.linkedinClientId, settings.linkedinClientSecret, redirectUri);

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
          scope: tokens.scope || 'openid profile email w_member_social',
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
          sender: parsed.from.split('<')[0].trim(),
          senderEmail: parsed.from.match(/<(.+)>/)?.[1] || parsed.from,
          subject: parsed.subject,
          preview: parsed.snippet,
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

  // Development: Seed sample emails for testing
  app.post("/api/dev/seed-emails", isAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req.user as any).id;

      const sampleEmails = [
        {
          sender: "John Smith",
          senderEmail: "john.smith@techcorp.com",
          subject: "Interested in your B2B sales automation platform",
          preview: "Hi, I saw your product and I'm very interested in learning more about how it can help streamline our sales process...",
          userId,
        },
        {
          sender: "Sarah Johnson",
          senderEmail: "sarah.j@startup.io",
          subject: "Follow-up on our demo call",
          preview: "Thanks for the great demo yesterday! Our team is excited about the AI features. Can we schedule a follow-up to discuss pricing?",
          userId,
        },
        {
          sender: "Mike Chen",
          senderEmail: "m.chen@enterprise.com",
          subject: "Pricing and contract terms",
          preview: "We're ready to move forward. Could you send over the pricing details for the enterprise plan and the contract for review?",
          userId,
        },
        {
          sender: "Emily Davis",
          senderEmail: "emily@smallbiz.com",
          subject: "Meeting request - Product demo",
          preview: "I'd like to schedule a product demo for our sales team next week. Are you available Tuesday or Wednesday afternoon?",
          userId,
        },
        {
          sender: "Robert Lee",
          senderEmail: "rob.lee@bigcompany.com",
          subject: "Question about integration capabilities",
          preview: "Hi, we're using Salesforce and HubSpot. Does your platform integrate with these systems?",
          userId,
        },
      ];

      const createdEmails = [];
      for (const email of sampleEmails) {
        const created = await storage.createEmailThread(email);
        createdEmails.push(created);
      }

      res.json({ message: "Sample emails created", count: createdEmails.length, emails: createdEmails });
    } catch (error: any) {
      console.error("Error seeding emails:", error);
      res.status(500).json({ message: error.message || "Failed to seed emails" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
