import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword } from "./auth";
import {
  insertCompanySchema,
  insertContactSchema,
  insertLeadSchema,
  insertActivitySchema,
  insertEmailThreadSchema,
  insertUserSchema,
  loginSchema,
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

  const httpServer = createServer(app);

  return httpServer;
}
