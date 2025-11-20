import type { Express, Response } from "express";
import { storage } from "./storage";
import { enhancedStorage } from "./storage-enhanced";
import { isAuthenticated } from "./auth";
import { orgContextService } from "./organization-context.service";
import { aiAssignmentService } from "./ai-assignment.service";
import { gmailInvitationService } from "./gmail-invitation.service";
import { rbacService } from "./rbac.service";
import { requirePermission, requireRole, extractOrganization, type AuthenticatedRequest } from "./rbac.middleware";
import crypto from "crypto";
import {
  insertCompanySchema,
  insertContactSchema,
  insertLeadSchema,
  insertActivitySchema,
} from "@shared/schema";

export function registerRBACRoutes(app: Express) {
  // Middleware to extract organization context
  const withOrgContext = async (req: AuthenticatedRequest, res: Response, next: Function) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const orgId = req.headers['x-organization-id'] as string || req.query.organizationId as string;
    const context = await orgContextService.getContext(req.user.id, orgId);
    
    if (!context) {
      return res.status(403).json({ error: 'No organization access' });
    }

    (req as any).orgContext = context;
    next();
  };

  // ===================
  // COMPANY ROUTES (RBAC)
  // ===================
  
  app.get("/api/v2/companies", isAuthenticated, withOrgContext, async (req: AuthenticatedRequest & { orgContext: any }, res: Response) => {
    try {
      const companies = await enhancedStorage.getCompaniesForContext(req.orgContext);
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.post("/api/v2/companies", isAuthenticated, withOrgContext, async (req: AuthenticatedRequest & { orgContext: any }, res: Response) => {
    try {
      const { organizationId, userId } = req.orgContext;
      
      // Check permission
      const hasPermission = await rbacService.hasPermission(userId, organizationId, 'companies.write');
      if (!hasPermission) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const companyData = insertCompanySchema.parse({ ...req.body, userId, organizationId });
      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error: any) {
      console.error("Error creating company:", error);
      res.status(400).json({ message: error.message || "Failed to create company" });
    }
  });

  app.patch("/api/v2/companies/:id", isAuthenticated, withOrgContext, async (req: AuthenticatedRequest & { orgContext: any }, res: Response) => {
    try {
      const { id } = req.params;
      const company = await enhancedStorage.getCompanyForContext(id, req.orgContext);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      if (!enhancedStorage.canModifyResource(req.orgContext, company)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const updated = await storage.updateCompany(id, req.orgContext.userId, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating company:", error);
      res.status(400).json({ message: error.message || "Failed to update company" });
    }
  });

  app.delete("/api/v2/companies/:id", isAuthenticated, withOrgContext, async (req: AuthenticatedRequest & { orgContext: any }, res: Response) => {
    try {
      const { id } = req.params;
      const company = await enhancedStorage.getCompanyForContext(id, req.orgContext);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      if (!enhancedStorage.canDeleteResource(req.orgContext, company)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const deleted = await storage.deleteCompany(id, req.orgContext.userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // ===================
  // CONTACT ROUTES (RBAC)
  // ===================
  
  app.get("/api/v2/contacts", isAuthenticated, withOrgContext, async (req: AuthenticatedRequest & { orgContext: any }, res: Response) => {
    try {
      const contacts = await enhancedStorage.getContactsForContext(req.orgContext);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post("/api/v2/contacts", isAuthenticated, withOrgContext, async (req: AuthenticatedRequest & { orgContext: any }, res: Response) => {
    try {
      const { organizationId, userId } = req.orgContext;
      
      const hasPermission = await rbacService.hasPermission(userId, organizationId, 'contacts.write');
      if (!hasPermission) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const contactData = insertContactSchema.parse({ ...req.body, userId, organizationId });
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error: any) {
      console.error("Error creating contact:", error);
      res.status(400).json({ message: error.message || "Failed to create contact" });
    }
  });

  app.patch("/api/v2/contacts/:id", isAuthenticated, withOrgContext, async (req: AuthenticatedRequest & { orgContext: any }, res: Response) => {
    try {
      const { id } = req.params;
      const contact = await enhancedStorage.getContactForContext(id, req.orgContext);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      if (!enhancedStorage.canModifyResource(req.orgContext, contact)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const updated = await storage.updateContact(id, req.orgContext.userId, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating contact:", error);
      res.status(400).json({ message: error.message || "Failed to update contact" });
    }
  });

  app.delete("/api/v2/contacts/:id", isAuthenticated, withOrgContext, async (req: AuthenticatedRequest & { orgContext: any }, res: Response) => {
    try {
      const { id } = req.params;
      const contact = await enhancedStorage.getContactForContext(id, req.orgContext);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      if (!enhancedStorage.canDeleteResource(req.orgContext, contact)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const deleted = await storage.deleteContact(id, req.orgContext.userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // ===================
  // LEAD ROUTES (RBAC)
  // ===================
  
  app.get("/api/v2/leads", isAuthenticated, withOrgContext, async (req: AuthenticatedRequest & { orgContext: any }, res: Response) => {
    try {
      const leads = await enhancedStorage.getLeadsForContext(req.orgContext);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/v2/leads", isAuthenticated, withOrgContext, async (req: AuthenticatedRequest & { orgContext: any }, res: Response) => {
    try {
      const { organizationId, userId } = req.orgContext;
      
      const hasPermission = await rbacService.hasPermission(userId, organizationId, 'leads.write');
      if (!hasPermission) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const leadData = insertLeadSchema.parse({ ...req.body, userId, organizationId });
      const lead = await storage.createLead(leadData);
      res.status(201).json(lead);
    } catch (error: any) {
      console.error("Error creating lead:", error);
      res.status(400).json({ message: error.message || "Failed to create lead" });
    }
  });

  app.patch("/api/v2/leads/:id", isAuthenticated, withOrgContext, async (req: AuthenticatedRequest & { orgContext: any }, res: Response) => {
    try {
      const { id } = req.params;
      const lead = await enhancedStorage.getLeadForContext(id, req.orgContext);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      if (!enhancedStorage.canModifyResource(req.orgContext, lead)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const updated = await storage.updateLead(id, req.orgContext.userId, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating lead:", error);
      res.status(400).json({ message: error.message || "Failed to update lead" });
    }
  });

  app.delete("/api/v2/leads/:id", isAuthenticated, withOrgContext, async (req: AuthenticatedRequest & { orgContext: any }, res: Response) => {
    try {
      const { id } = req.params;
      const lead = await enhancedStorage.getLeadForContext(id, req.orgContext);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      if (!enhancedStorage.canDeleteResource(req.orgContext, lead)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const deleted = await storage.deleteLead(id, req.orgContext.userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // ===================
  // ACTIVITY ROUTES (RBAC)
  // ===================
  
  app.get("/api/v2/activities", isAuthenticated, withOrgContext, async (req: AuthenticatedRequest & { orgContext: any }, res: Response) => {
    try {
      const activities = await enhancedStorage.getActivitiesForContext(req.orgContext);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/v2/activities", isAuthenticated, withOrgContext, async (req: AuthenticatedRequest & { orgContext: any }, res: Response) => {
    try {
      const { organizationId, userId } = req.orgContext;
      
      const hasPermission = await rbacService.hasPermission(userId, organizationId, 'activities.write');
      if (!hasPermission) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const activityData = insertActivitySchema.parse({ ...req.body, userId, organizationId });
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error: any) {
      console.error("Error creating activity:", error);
      res.status(400).json({ message: error.message || "Failed to create activity" });
    }
  });

  // ===================
  // AI ASSIGNMENT ROUTES
  // ===================
  
  app.post("/api/ai/assignment/recommend", isAuthenticated, withOrgContext, async (req: AuthenticatedRequest & { orgContext: any }, res: Response) => {
    try {
      const { leadId } = req.body;
      const { organizationId, userId } = req.orgContext;
      
      const hasPermission = await rbacService.hasPermission(userId, organizationId, 'leads.assign');
      if (!hasPermission) {
        return res.status(403).json({ message: "Insufficient permissions to assign leads" });
      }

      const recommendations = await aiAssignmentService.getRecommendations(leadId, organizationId, userId);
      res.json({ recommendations });
    } catch (error: any) {
      console.error("Error getting AI recommendations:", error);
      res.status(500).json({ message: error.message || "Failed to get recommendations" });
    }
  });

  app.post("/api/leads/:leadId/assign", isAuthenticated, withOrgContext, async (req: AuthenticatedRequest & { orgContext: any }, res: Response) => {
    try {
      const { leadId } = req.params;
      const { assignedTo, method } = req.body;
      const { organizationId, userId } = req.orgContext;
      
      const hasPermission = await rbacService.hasPermission(userId, organizationId, 'leads.assign');
      if (!hasPermission) {
        return res.status(403).json({ message: "Insufficient permissions to assign leads" });
      }

      if (method === 'round_robin') {
        const assignedUserId = await aiAssignmentService.assignRoundRobin(leadId, organizationId, userId);
        res.json({ assignedTo: assignedUserId, method: 'round_robin' });
      } else {
        // Manual assignment
        await storage.createLeadAssignment({
          leadId,
          assignedTo,
          assignedBy: userId,
          assignmentMethod: 'manual',
        });
        await storage.updateLead(leadId, userId, { assignedTo });
        res.json({ assignedTo, method: 'manual' });
      }
    } catch (error: any) {
      console.error("Error assigning lead:", error);
      res.status(500).json({ message: error.message || "Failed to assign lead" });
    }
  });

  app.get("/api/leads/:leadId/assignments", isAuthenticated, withOrgContext, async (req: AuthenticatedRequest & { orgContext: any }, res: Response) => {
    try {
      const { leadId } = req.params;
      const assignments = await storage.getLeadAssignments(leadId);
      res.json(assignments);
    } catch (error: any) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ message: error.message || "Failed to fetch assignments" });
    }
  });

  // ===================
  // INVITATION ROUTES (WITH GMAIL)
  // ===================
  
  app.post("/api/invitations", isAuthenticated, extractOrganization, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email, roleId, teamId, organizationId } = req.body;
      const userId = req.user!.id;
      
      // Check permission
      const hasPermission = await rbacService.hasPermission(userId, organizationId, 'members.invite');
      if (!hasPermission) {
        return res.status(403).json({ message: "Insufficient permissions to invite members" });
      }

      // Generate token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation
      const invitation = await storage.createInvitation({
        email,
        organizationId,
        teamId: teamId || null,
        roleId,
        token,
        status: 'PENDING',
        invitedBy: userId,
        expiresAt,
      });

      // Send email via Gmail
      const inviter = await storage.getUser(userId);
      const org = await storage.getOrganization(organizationId);
      let teamName: string | undefined;
      if (teamId) {
        const team = await storage.getTeam(teamId);
        teamName = team?.name;
      }

      await gmailInvitationService.sendInvitationEmail({
        to: email,
        inviterName: `${inviter?.firstName || ''} ${inviter?.lastName || ''}`.trim() || inviter?.email || 'Someone',
        organizationName: org?.name || 'the organization',
        teamName,
        inviteToken: token,
        userId,
      });

      res.status(201).json(invitation);
    } catch (error: any) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: error.message || "Failed to create invitation" });
    }
  });

  app.post("/api/invitations/:id/resend", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      await gmailInvitationService.sendInvitationResend(id, userId);
      res.json({ message: "Invitation resent successfully" });
    } catch (error: any) {
      console.error("Error resending invitation:", error);
      res.status(500).json({ message: error.message || "Failed to resend invitation" });
    }
  });

  app.post("/api/invitations/accept", async (req: Request, res: Response) => {
    try {
      const { token, userId } = req.body;
      
      const invitation = await storage.getInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      if (invitation.status !== 'PENDING') {
        return res.status(400).json({ message: "Invitation already used or expired" });
      }

      if (new Date() > new Date(invitation.expiresAt)) {
        await storage.updateInvitation(invitation.id, { status: 'EXPIRED' });
        return res.status(400).json({ message: "Invitation expired" });
      }

      // Add user to team if specified
      if (invitation.teamId) {
        await storage.addTeamMember({
          teamId: invitation.teamId,
          userId,
          roleId: invitation.roleId,
          invitationStatus: 'ACCEPTED',
        });
      }

      // Mark invitation as accepted
      await storage.updateInvitation(invitation.id, { status: 'ACCEPTED' });

      res.json({ message: "Invitation accepted successfully", organizationId: invitation.organizationId });
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: error.message || "Failed to accept invitation" });
    }
  });

  // ===================
  // ORGANIZATION CONTEXT ROUTES
  // ===================
  
  app.get("/api/user/context", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const orgId = req.query.organizationId as string | undefined;
      
      const context = await orgContextService.getContext(userId, orgId);
      if (!context) {
        return res.status(404).json({ message: "No organization context found" });
      }

      const organizations = await storage.getOrganizations(userId);
      
      res.json({
        context,
        organizations,
      });
    } catch (error: any) {
      console.error("Error fetching context:", error);
      res.status(500).json({ message: error.message || "Failed to fetch context" });
    }
  });
}
