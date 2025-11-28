import { db } from "./db";
import { eq, and, desc, or, inArray } from "drizzle-orm";
import {
  type User,
  type UpsertUser,
  type Company,
  type InsertCompany,
  type Contact,
  type InsertContact,
  type Lead,
  type InsertLead,
  type Activity,
  type InsertActivity,
  type EmailThread,
  type InsertEmailThread,
  type UserSettings,
  type InsertUserSettings,
  type OAuthToken,
  type InsertOAuthToken,
  type Team,
  type InsertTeam,
  type TeamMember,
  type InsertTeamMember,
  type WorkflowTemplate,
  type InsertWorkflowTemplate,
  type WorkflowTemplateStep,
  type InsertWorkflowTemplateStep,
  type UserWorkflow,
  type InsertUserWorkflow,
  type Organization,
  type InsertOrganization,
  type Role,
  type InsertRole,
  type Permission,
  type RolePermission,
  type InvitationToken,
  type InsertInvitationToken,
  type LeadAssignment,
  type InsertLeadAssignment,
  type EmailProcessingQueue,
  type InsertEmailProcessingQueue,
  type SalesThreadActivity,
  type InsertSalesThreadActivity,
  users,
  companies,
  contacts,
  leads,
  activities,
  emailThreads,
  userSettings,
  oauthTokens,
  teams,
  teamMembers,
  workflowTemplates,
  workflowTemplateSteps,
  userWorkflows,
  organizations,
  roles,
  permissions,
  rolePermissions,
  invitationTokens,
  leadAssignments,
  emailProcessingQueue,
  salesThreadActivities,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<{ id: string; email: string; password: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null; createdAt: Date | null; updatedAt: Date | null } | undefined>;
  createUser(userData: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Company operations
  getCompanies(userId: string): Promise<Company[]>;
  getCompany(id: string, userId: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, userId: string, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: string, userId: string): Promise<boolean>;

  // Contact operations
  getContacts(userId: string): Promise<Contact[]>;
  getContact(id: string, userId: string): Promise<Contact | undefined>;
  getContactsByCompany(companyId: string, userId: string): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, userId: string, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string, userId: string): Promise<boolean>;

  // Lead operations
  getLeads(userId: string): Promise<Lead[]>;
  getLead(id: string, userId: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, userId: string, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string, userId: string): Promise<boolean>;

  // Activity operations
  getActivities(userId: string): Promise<Activity[]>;
  getActivity(id: string, userId: string): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  deleteActivity(id: string, userId: string): Promise<boolean>;

  // Email thread operations
  getEmailThreads(userId: string): Promise<EmailThread[]>;
  getEmailThread(id: string, userId: string): Promise<EmailThread | undefined>;
  getEmailThreadByMessageId(messageId: string): Promise<EmailThread | undefined>;
  createEmailThread(emailThread: InsertEmailThread): Promise<EmailThread>;
  updateEmailThread(id: string, userId: string, emailThread: Partial<InsertEmailThread>): Promise<EmailThread | undefined>;
  markEmailAsRead(id: string, userId: string): Promise<boolean>;

  // User settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  getAllUserSettings(): Promise<UserSettings[]>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings | undefined>;

  // OAuth token operations
  getOAuthToken(userId: string, provider: string): Promise<OAuthToken | undefined>;
  createOAuthToken(token: InsertOAuthToken): Promise<OAuthToken>;
  updateOAuthToken(userId: string, provider: string, token: Partial<InsertOAuthToken>): Promise<OAuthToken | undefined>;
  deleteOAuthToken(userId: string, provider: string): Promise<boolean>;

  // Team operations
  getTeams(userId: string): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, ownerId: string, team: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: string, ownerId: string): Promise<boolean>;

  // Team member operations
  getTeamMembers(teamId: string): Promise<(TeamMember & { user: User })[]>;
  getTeamMember(teamId: string, userId: string): Promise<TeamMember | undefined>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMemberRole(teamId: string, userId: string, role: string): Promise<TeamMember | undefined>;
  removeTeamMember(teamId: string, userId: string): Promise<boolean>;

  // Workflow template operations
  getWorkflowTemplates(): Promise<WorkflowTemplate[]>;
  getWorkflowTemplate(id: string): Promise<(WorkflowTemplate & { steps: WorkflowTemplateStep[] }) | undefined>;
  createWorkflowTemplate(template: InsertWorkflowTemplate): Promise<WorkflowTemplate>;
  getWorkflowTemplateSteps(templateId: string): Promise<WorkflowTemplateStep[]>;
  createWorkflowTemplateStep(step: InsertWorkflowTemplateStep): Promise<WorkflowTemplateStep>;

  // User workflow operations
  getUserWorkflows(userId: string): Promise<UserWorkflow[]>;
  getUserWorkflow(id: string, userId: string): Promise<UserWorkflow | undefined>;
  createUserWorkflow(workflow: InsertUserWorkflow): Promise<UserWorkflow>;
  updateUserWorkflow(id: string, userId: string, workflow: Partial<InsertUserWorkflow>): Promise<UserWorkflow | undefined>;
  deleteUserWorkflow(id: string, userId: string): Promise<boolean>;

  // Organization operations
  getOrganizations(userId: string): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, org: Partial<InsertOrganization>): Promise<Organization | undefined>;
  deleteOrganization(id: string, ownerId: string): Promise<boolean>;
  getOrganizationMembers(organizationId: string): Promise<(TeamMember & { user: User })[]>;

  // Role operations
  getRoles(organizationId?: string): Promise<Role[]>;
  getRole(id: string): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(id: string): Promise<boolean>;

  // Permission operations
  getPermissions(): Promise<Permission[]>;
  getPermission(id: string): Promise<Permission | undefined>;

  // RolePermission operations
  getRolePermissions(roleId: string): Promise<Permission[]>;
  addRolePermission(roleId: string, permissionId: string): Promise<RolePermission>;
  removeRolePermission(roleId: string, permissionId: string): Promise<boolean>;

  // Invitation operations
  getInvitations(organizationId: string): Promise<InvitationToken[]>;
  getInvitation(id: string): Promise<InvitationToken | undefined>;
  getInvitationByToken(token: string): Promise<InvitationToken | undefined>;
  createInvitation(invitation: InsertInvitationToken): Promise<InvitationToken>;
  updateInvitation(id: string, invitation: Partial<InsertInvitationToken>): Promise<InvitationToken | undefined>;
  deleteInvitation(id: string): Promise<boolean>;

  // Lead Assignment operations
  createLeadAssignment(assignment: InsertLeadAssignment): Promise<LeadAssignment>;
  getLeadAssignments(leadId: string): Promise<LeadAssignment[]>;

  // Helper operations
  getUserById(userId: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) return undefined;
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Company operations
  async getCompanies(userId: string): Promise<Company[]> {
    return db.select().from(companies).where(eq(companies.userId, userId)).orderBy(desc(companies.createdAt));
  }

  async getCompany(id: string, userId: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(and(eq(companies.id, id), eq(companies.userId, userId)));
    return company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async updateCompany(id: string, userId: string, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const [updated] = await db
      .update(companies)
      .set(company)
      .where(and(eq(companies.id, id), eq(companies.userId, userId)))
      .returning();
    return updated;
  }

  async deleteCompany(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(companies).where(and(eq(companies.id, id), eq(companies.userId, userId)));
    return result.changes > 0;
  }

  // Contact operations
  async getContacts(userId: string): Promise<Contact[]> {
    return db.select().from(contacts).where(eq(contacts.userId, userId)).orderBy(desc(contacts.createdAt));
  }

  async getContact(id: string, userId: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
    return contact;
  }

  async getContactsByCompany(companyId: string, userId: string): Promise<Contact[]> {
    return db.select().from(contacts).where(and(eq(contacts.companyId, companyId), eq(contacts.userId, userId)));
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: string, userId: string, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updated] = await db
      .update(contacts)
      .set(contact)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
      .returning();
    return updated;
  }

  async deleteContact(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
    return result.changes > 0;
  }

  // Lead operations
  async getLeads(userId: string): Promise<Lead[]> {
    return db.select().from(leads).where(eq(leads.userId, userId)).orderBy(desc(leads.createdAt));
  }

  async getLead(id: string, userId: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(and(eq(leads.id, id), eq(leads.userId, userId)));
    return lead;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async updateLead(id: string, userId: string, lead: Partial<InsertLead>): Promise<Lead | undefined> {
    const [updated] = await db
      .update(leads)
      .set({ ...lead, updatedAt: new Date() })
      .where(and(eq(leads.id, id), eq(leads.userId, userId)))
      .returning();
    return updated;
  }

  async deleteLead(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(leads).where(and(eq(leads.id, id), eq(leads.userId, userId)));
    return result.changes > 0;
  }

  // Activity operations
  async getActivities(userId: string): Promise<Activity[]> {
    return db.select().from(activities).where(eq(activities.userId, userId)).orderBy(desc(activities.createdAt));
  }

  async getActivity(id: string, userId: string): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(and(eq(activities.id, id), eq(activities.userId, userId)));
    return activity;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async deleteActivity(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(activities).where(and(eq(activities.id, id), eq(activities.userId, userId)));
    return result.changes > 0;
  }

  // Email thread operations
  async getEmailThreads(userId: string): Promise<EmailThread[]> {
    return db.select().from(emailThreads).where(eq(emailThreads.userId, userId)).orderBy(desc(emailThreads.createdAt));
  }

  async getEmailThread(id: string, userId: string): Promise<EmailThread | undefined> {
    const [emailThread] = await db.select().from(emailThreads).where(and(eq(emailThreads.id, id), eq(emailThreads.userId, userId)));
    return emailThread;
  }

  async getEmailThreadByMessageId(messageId: string): Promise<EmailThread | undefined> {
    const [emailThread] = await db.select().from(emailThreads).where(eq(emailThreads.messageId, messageId));
    return emailThread;
  }

  async createEmailThread(emailThread: InsertEmailThread): Promise<EmailThread> {
    const [newEmailThread] = await db.insert(emailThreads).values(emailThread).returning();
    return newEmailThread;
  }

  async updateEmailThread(id: string, userId: string, emailThread: Partial<InsertEmailThread>): Promise<EmailThread | undefined> {
    const [updated] = await db
      .update(emailThreads)
      .set(emailThread)
      .where(and(eq(emailThreads.id, id), eq(emailThreads.userId, userId)))
      .returning();
    return updated;
  }

  async markEmailAsRead(id: string, userId: string): Promise<boolean> {
    return true;
  }

  // Sales email operations
  async getSalesEmails(userId: string): Promise<EmailThread[]> {
    return db.select().from(emailThreads)
      .where(and(eq(emailThreads.userId, userId), eq(emailThreads.isSales, true)))
      .orderBy(desc(emailThreads.receivedAt));
  }

  async getEmailsByThreadId(threadId: string, userId: string): Promise<EmailThread[]> {
    return db.select().from(emailThreads)
      .where(and(eq(emailThreads.threadId, threadId), eq(emailThreads.userId, userId)))
      .orderBy(emailThreads.receivedAt);
  }

  async getSalesEmailTags(userId: string): Promise<string[]> {
    const emails = await db.select({ tags: emailThreads.tags })
      .from(emailThreads)
      .where(and(eq(emailThreads.userId, userId), eq(emailThreads.isSales, true)));
    
    const allTags = new Set<string>();
    emails.forEach(e => {
      if (e.tags) {
        try {
          const parsed = JSON.parse(e.tags);
          if (Array.isArray(parsed)) {
            parsed.forEach(tag => allTags.add(tag));
          }
        } catch {}
      }
    });
    return Array.from(allTags);
  }

  // Email processing queue operations
  async createEmailProcessingQueue(queueItem: InsertEmailProcessingQueue): Promise<EmailProcessingQueue> {
    const [item] = await db.insert(emailProcessingQueue).values(queueItem).returning();
    return item;
  }

  async getPendingEmailProcessingQueue(userId: string): Promise<EmailProcessingQueue[]> {
    return db.select().from(emailProcessingQueue)
      .where(and(eq(emailProcessingQueue.userId, userId), eq(emailProcessingQueue.status, "pending")))
      .orderBy(emailProcessingQueue.createdAt);
  }

  async updateEmailProcessingQueue(id: string, data: Partial<InsertEmailProcessingQueue>): Promise<EmailProcessingQueue | undefined> {
    const [updated] = await db.update(emailProcessingQueue)
      .set(data)
      .where(eq(emailProcessingQueue.id, id))
      .returning();
    return updated;
  }

  // Sales thread activity operations
  async createSalesThreadActivity(activity: InsertSalesThreadActivity): Promise<SalesThreadActivity> {
    const [newActivity] = await db.insert(salesThreadActivities).values(activity).returning();
    return newActivity;
  }

  async getSalesThreadActivities(threadId: string, userId: string): Promise<SalesThreadActivity[]> {
    return db.select().from(salesThreadActivities)
      .where(and(eq(salesThreadActivities.threadId, threadId), eq(salesThreadActivities.userId, userId)))
      .orderBy(salesThreadActivities.createdAt);
  }

  async deleteSalesThreadActivities(threadId: string, userId: string): Promise<boolean> {
    const result = await db.delete(salesThreadActivities)
      .where(and(eq(salesThreadActivities.threadId, threadId), eq(salesThreadActivities.userId, userId)));
    return result.changes > 0;
  }

  // Email thread delete operation
  async deleteEmailThread(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(emailThreads)
      .where(and(eq(emailThreads.id, id), eq(emailThreads.userId, userId)));
    return result.changes > 0;
  }

  // User settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async getAllUserSettings(): Promise<UserSettings[]> {
    return db.select().from(userSettings);
  }

  async createUserSettings(settingsData: InsertUserSettings): Promise<UserSettings> {
    const [settings] = await db.insert(userSettings).values(settingsData).returning();
    return settings;
  }

  async updateUserSettings(userId: string, settingsData: Partial<InsertUserSettings>): Promise<UserSettings | undefined> {
    const [updated] = await db
      .update(userSettings)
      .set({
        ...settingsData,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId))
      .returning();
    return updated;
  }

  // OAuth token operations
  async getOAuthToken(userId: string, provider: string): Promise<OAuthToken | undefined> {
    const [token] = await db
      .select()
      .from(oauthTokens)
      .where(and(eq(oauthTokens.userId, userId), eq(oauthTokens.provider, provider)));
    return token;
  }

  async createOAuthToken(tokenData: InsertOAuthToken): Promise<OAuthToken> {
    const [token] = await db.insert(oauthTokens).values(tokenData).returning();
    return token;
  }

  async updateOAuthToken(userId: string, provider: string, tokenData: Partial<InsertOAuthToken>): Promise<OAuthToken | undefined> {
    const [updated] = await db
      .update(oauthTokens)
      .set({
        ...tokenData,
        updatedAt: new Date(),
      })
      .where(and(eq(oauthTokens.userId, userId), eq(oauthTokens.provider, provider)))
      .returning();
    return updated;
  }

  async deleteOAuthToken(userId: string, provider: string): Promise<boolean> {
    const result = await db
      .delete(oauthTokens)
      .where(and(eq(oauthTokens.userId, userId), eq(oauthTokens.provider, provider)));
    return result.changes > 0;
  }

  // Team operations
  async getTeams(userId: string): Promise<Team[]> {
    // Get teams where user is the owner
    const ownedTeams = await db.select().from(teams).where(eq(teams.ownerId, userId));

    // Get teams where user is a member
    const memberTeams = await db
      .select({ team: teams })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, userId));

    // Combine and deduplicate
    const allTeams = [...ownedTeams, ...memberTeams.map(m => m.team)];
    const uniqueTeams = Array.from(new Map(allTeams.map(team => [team.id, team])).values());

    return uniqueTeams;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async createTeam(teamData: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(teamData).returning();

    // Automatically add the owner as a team member with owner role
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: team.ownerId,
      role: 'owner',
    });

    return team;
  }

  async updateTeam(id: string, ownerId: string, teamData: Partial<InsertTeam>): Promise<Team | undefined> {
    const [updated] = await db
      .update(teams)
      .set({
        ...teamData,
        updatedAt: new Date(),
      })
      .where(and(eq(teams.id, id), eq(teams.ownerId, ownerId)))
      .returning();
    return updated;
  }

  async deleteTeam(id: string, ownerId: string): Promise<boolean> {
    const result = await db
      .delete(teams)
      .where(and(eq(teams.id, id), eq(teams.ownerId, ownerId)));
    return result.changes > 0;
  }

  // Team member operations
  async getTeamMembers(teamId: string): Promise<(TeamMember & { user: User })[]> {
    const members = await db
      .select({ 
        member: teamMembers, 
        user: users 
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));

    return members.map(m => {
      const { password: _, ...userWithoutPassword } = m.user;
      return {
        ...m.member,
        user: userWithoutPassword,
      };
    });
  }

  async getTeamMember(teamId: string, userId: string): Promise<TeamMember | undefined> {
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
    return member;
  }

  async addTeamMember(memberData: InsertTeamMember): Promise<TeamMember> {
    const [member] = await db.insert(teamMembers).values(memberData).returning();
    return member;
  }

  async updateTeamMemberRole(teamId: string, userId: string, role: string): Promise<TeamMember | undefined> {
    const [updated] = await db
      .update(teamMembers)
      .set({ role })
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .returning();
    return updated;
  }

  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
    return result.changes > 0;
  }

  // Workflow template operations
  async getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    return db.select().from(workflowTemplates).orderBy(desc(workflowTemplates.createdAt));
  }

  async getWorkflowTemplate(id: string): Promise<(WorkflowTemplate & { steps: WorkflowTemplateStep[] }) | undefined> {
    const [template] = await db.select().from(workflowTemplates).where(eq(workflowTemplates.id, id));
    if (!template) return undefined;

    const steps = await this.getWorkflowTemplateSteps(id);
    return { ...template, steps };
  }

  async createWorkflowTemplate(templateData: InsertWorkflowTemplate): Promise<WorkflowTemplate> {
    const [template] = await db.insert(workflowTemplates).values(templateData).returning();
    return template;
  }

  async getWorkflowTemplateSteps(templateId: string): Promise<WorkflowTemplateStep[]> {
    return db
      .select()
      .from(workflowTemplateSteps)
      .where(eq(workflowTemplateSteps.templateId, templateId))
      .orderBy(workflowTemplateSteps.stepOrder);
  }

  async createWorkflowTemplateStep(stepData: InsertWorkflowTemplateStep): Promise<WorkflowTemplateStep> {
    const [step] = await db.insert(workflowTemplateSteps).values(stepData).returning();
    return step;
  }

  // User workflow operations
  async getUserWorkflows(userId: string): Promise<UserWorkflow[]> {
    return db
      .select()
      .from(userWorkflows)
      .where(eq(userWorkflows.userId, userId))
      .orderBy(desc(userWorkflows.createdAt));
  }

  async getUserWorkflow(id: string, userId: string): Promise<UserWorkflow | undefined> {
    const [workflow] = await db
      .select()
      .from(userWorkflows)
      .where(and(eq(userWorkflows.id, id), eq(userWorkflows.userId, userId)));
    return workflow;
  }

  async createUserWorkflow(workflowData: InsertUserWorkflow): Promise<UserWorkflow> {
    const [workflow] = await db.insert(userWorkflows).values(workflowData).returning();
    return workflow;
  }

  async updateUserWorkflow(id: string, userId: string, workflowData: Partial<InsertUserWorkflow>): Promise<UserWorkflow | undefined> {
    const [updated] = await db
      .update(userWorkflows)
      .set({
        ...workflowData,
        updatedAt: new Date(),
      })
      .where(and(eq(userWorkflows.id, id), eq(userWorkflows.userId, userId)))
      .returning();
    return updated;
  }

  async deleteUserWorkflow(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(userWorkflows)
      .where(and(eq(userWorkflows.id, id), eq(userWorkflows.userId, userId)));
    return result.changes > 0;
  }

  // Organization operations
  async getOrganizations(userId: string): Promise<Organization[]> {
    const owned = await db.select().from(organizations).where(eq(organizations.ownerId, userId));
    const memberOrgs = await db
      .select({ org: organizations })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .innerJoin(organizations, eq(teams.organizationId, organizations.id))
      .where(eq(teamMembers.userId, userId));
    
    const allOrgs = [...owned, ...memberOrgs.map(m => m.org)];
    return Array.from(new Map(allOrgs.map(o => [o.id, o])).values());
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async createOrganization(orgData: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(orgData).returning();
    return org;
  }

  async updateOrganization(id: string, orgData: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [updated] = await db.update(organizations)
      .set({ ...orgData, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updated;
  }

  async deleteOrganization(id: string, ownerId: string): Promise<boolean> {
    const result = await db.delete(organizations)
      .where(and(eq(organizations.id, id), eq(organizations.ownerId, ownerId)));
    return result.changes > 0;
  }

  async getOrganizationMembers(organizationId: string): Promise<(TeamMember & { user: User })[]> {
    const orgTeams = await db.select().from(teams).where(eq(teams.organizationId, organizationId));
    const teamIds = orgTeams.map(t => t.id);
    
    if (teamIds.length === 0) return [];
    
    const members = await db
      .select({ member: teamMembers, user: users })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(inArray(teamMembers.teamId, teamIds));
    
    return members.map(m => {
      const { password: _, ...userWithoutPassword } = m.user;
      return { ...m.member, user: userWithoutPassword };
    });
  }

  // Role operations
  async getRoles(organizationId?: string): Promise<Role[]> {
    if (organizationId) {
      return db.select().from(roles)
        .where(or(eq(roles.organizationId, organizationId), eq(roles.isSystemRole, true)));
    }
    return db.select().from(roles).where(eq(roles.isSystemRole, true));
  }

  async getRole(id: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role;
  }

  async createRole(roleData: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(roleData).returning();
    return role;
  }

  async updateRole(id: string, roleData: Partial<InsertRole>): Promise<Role | undefined> {
    const [updated] = await db.update(roles)
      .set({ ...roleData, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return updated;
  }

  async deleteRole(id: string): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id));
    return result.changes > 0;
  }

  // Permission operations
  async getPermissions(): Promise<Permission[]> {
    return db.select().from(permissions);
  }

  async getPermission(id: string): Promise<Permission | undefined> {
    const [perm] = await db.select().from(permissions).where(eq(permissions.id, id));
    return perm;
  }

  // RolePermission operations
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const rolePerms = await db
      .select({ permission: permissions })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));
    
    return rolePerms.map(rp => rp.permission);
  }

  async addRolePermission(roleId: string, permissionId: string): Promise<RolePermission> {
    const [rolePerm] = await db.insert(rolePermissions)
      .values({ roleId, permissionId })
      .returning();
    return rolePerm;
  }

  async removeRolePermission(roleId: string, permissionId: string): Promise<boolean> {
    const result = await db.delete(rolePermissions)
      .where(and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId)
      ));
    return result.changes > 0;
  }

  // Invitation operations
  async getInvitations(organizationId: string): Promise<InvitationToken[]> {
    return db.select().from(invitationTokens)
      .where(eq(invitationTokens.organizationId, organizationId))
      .orderBy(desc(invitationTokens.createdAt));
  }

  async getInvitation(id: string): Promise<InvitationToken | undefined> {
    const [invitation] = await db.select().from(invitationTokens)
      .where(eq(invitationTokens.id, id));
    return invitation;
  }

  async getInvitationByToken(token: string): Promise<InvitationToken | undefined> {
    const [invitation] = await db.select().from(invitationTokens)
      .where(eq(invitationTokens.token, token));
    return invitation;
  }

  async createInvitation(invitationData: InsertInvitationToken): Promise<InvitationToken> {
    const [invitation] = await db.insert(invitationTokens)
      .values(invitationData)
      .returning();
    return invitation;
  }

  async updateInvitation(id: string, invitationData: Partial<InsertInvitationToken>): Promise<InvitationToken | undefined> {
    const [updated] = await db.update(invitationTokens)
      .set({ ...invitationData, updatedAt: new Date() })
      .where(eq(invitationTokens.id, id))
      .returning();
    return updated;
  }

  async deleteInvitation(id: string): Promise<boolean> {
    const result = await db.delete(invitationTokens)
      .where(eq(invitationTokens.id, id));
    return result.changes > 0;
  }

  // Lead Assignment operations
  async createLeadAssignment(assignmentData: InsertLeadAssignment): Promise<LeadAssignment> {
    const [assignment] = await db.insert(leadAssignments)
      .values(assignmentData)
      .returning();
    return assignment;
  }

  async getLeadAssignments(leadId: string): Promise<LeadAssignment[]> {
    return db.select().from(leadAssignments)
      .where(eq(leadAssignments.leadId, leadId))
      .orderBy(desc(leadAssignments.createdAt));
  }

  // Helper method to get user by ID (needed for services)
  async getUserById(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return undefined;
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const storage = new DatabaseStorage();