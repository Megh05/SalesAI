
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: integer("expire", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  })
);

// User storage table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = Omit<typeof users.$inferSelect, 'password'>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;

// Organizations
export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  domain: text("domain"),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  settings: text("settings"), // JSON string for org-level settings
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

// Roles
export const roles = sqliteTable("roles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isSystemRole: integer("is_system_role", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

// Permissions
export const permissions = sqliteTable("permissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  resource: text("resource").notNull(),
  action: text("action").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;

// RolePermissions (join table)
export const rolePermissions = sqliteTable("role_permissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: text("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;

// Companies
export const companies = sqliteTable("companies", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  industry: text("industry"),
  size: text("size"),
  location: text("location"),
  website: text("website"),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

// Contacts
export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  position: text("position"),
  companyId: text("company_id").references(() => companies.id, { onDelete: "set null" }),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

// Leads
export const leads = sqliteTable("leads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  value: integer("value"),
  status: text("status").notNull().default("prospect"),
  contactId: text("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  companyId: text("company_id").references(() => companies.id, { onDelete: "set null" }),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  assignedTo: text("assigned_to").references(() => users.id, { onDelete: "set null" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  value: z.union([z.string(), z.number()]).optional().nullable(),
  source: z.string().optional().nullable(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

// Activities
export const activities = sqliteTable("activities", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  contactId: text("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  leadId: text("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Email Threads (Multi-channel Messages)
export const emailThreads = sqliteTable("email_threads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  subject: text("subject").notNull(),
  snippet: text("snippet"),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  toEmail: text("to_email"),
  aiSummary: text("ai_summary"),
  aiClassification: text("ai_classification"),
  aiConfidence: integer("ai_confidence"),
  nextAction: text("next_action"),
  threadId: text("thread_id"),
  messageId: text("message_id"),
  channel: text("channel").notNull().default("email"), // 'email', 'linkedin', 'twitter', etc.
  providerMetadata: text("provider_metadata"), // JSON string for channel-specific data
  contactId: text("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  leadId: text("lead_id").references(() => leads.id, { onDelete: "set null" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receivedAt: integer("received_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertEmailThreadSchema = createInsertSchema(emailThreads).omit({
  id: true,
  createdAt: true,
});

export type EmailThread = typeof emailThreads.$inferSelect;
export type InsertEmailThread = z.infer<typeof insertEmailThreadSchema>;

// User Settings
export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").unique().notNull().references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").default("light"),
  emailNotifications: integer("email_notifications", { mode: "boolean" }).default(true),
  openRouterApiKey: text("openrouter_api_key"),
  aiModel: text("ai_model"),
  gmailClientId: text("gmail_client_id"),
  gmailClientSecret: text("gmail_client_secret"),
  gmailConnected: integer("gmail_connected", { mode: "boolean" }).default(false),
  linkedinClientId: text("linkedin_client_id"),
  linkedinClientSecret: text("linkedin_client_secret"),
  linkedinConnected: integer("linkedin_connected", { mode: "boolean" }).default(false),
  n8nWebhookUrl: text("n8n_webhook_url"),
  n8nApiKey: text("n8n_api_key"),
  n8nConnected: integer("n8n_connected", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

// OAuth Tokens
export const oauthTokens = sqliteTable("oauth_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenType: text("token_type").default("Bearer"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertOAuthTokenSchema = createInsertSchema(oauthTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOAuthToken = z.infer<typeof insertOAuthTokenSchema>;
export type OAuthToken = typeof oauthTokens.$inferSelect;

// Invitation Tokens
export const invitationTokens = sqliteTable("invitation_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  teamId: text("team_id").references(() => teams.id, { onDelete: "cascade" }),
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("PENDING"), // PENDING, ACCEPTED, EXPIRED, DECLINED
  invitedBy: text("invited_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertInvitationTokenSchema = createInsertSchema(invitationTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InvitationToken = typeof invitationTokens.$inferSelect;
export type InsertInvitationToken = z.infer<typeof insertInvitationTokenSchema>;

// Teams
export const teams = sqliteTable("teams", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

// Team Members
export const teamMembers = sqliteTable("team_members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: text("role_id").references(() => roles.id, { onDelete: "set null" }),
  role: text("role").notNull().default("member"), // Deprecated: kept for backward compatibility
  invitationStatus: text("invitation_status").default("ACCEPTED"), // PENDING, ACCEPTED, DECLINED
  joinedAt: integer("joined_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

// Lead Assignments
export const leadAssignments = sqliteTable("lead_assignments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  leadId: text("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  assignedTo: text("assigned_to").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedBy: text("assigned_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignmentMethod: text("assignment_method").notNull(), // manual, ai, round_robin
  aiReasoning: text("ai_reasoning"), // JSON string with AI explanation
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertLeadAssignmentSchema = createInsertSchema(leadAssignments).omit({
  id: true,
  createdAt: true,
});

export type LeadAssignment = typeof leadAssignments.$inferSelect;
export type InsertLeadAssignment = z.infer<typeof insertLeadAssignmentSchema>;

// Workflow Templates
export const workflowTemplates = sqliteTable("workflow_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'lead_nurturing', 'cold_outreach', 'lead_recovery', etc.
  icon: text("icon"),
  isBuiltin: integer("is_builtin", { mode: "boolean" }).default(true),
  triggerType: text("trigger_type").notNull(), // 'email_received', 'lead_created', 'status_change', etc.
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertWorkflowTemplateSchema = createInsertSchema(workflowTemplates).omit({
  id: true,
  createdAt: true,
});

export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;
export type InsertWorkflowTemplate = z.infer<typeof insertWorkflowTemplateSchema>;

// Workflow Template Steps
export const workflowTemplateSteps = sqliteTable("workflow_template_steps", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  templateId: text("template_id").notNull().references(() => workflowTemplates.id, { onDelete: "cascade" }),
  stepOrder: integer("step_order").notNull(),
  stepType: text("step_type").notNull(), // 'ai_classify', 'ai_summarize', 'send_email', 'create_task', etc.
  stepConfig: text("step_config").notNull(), // JSON configuration for the step
  description: text("description"),
});

export const insertWorkflowTemplateStepSchema = createInsertSchema(workflowTemplateSteps).omit({
  id: true,
});

export type WorkflowTemplateStep = typeof workflowTemplateSteps.$inferSelect;
export type InsertWorkflowTemplateStep = z.infer<typeof insertWorkflowTemplateStepSchema>;

// User Workflows (cloned from templates)
export const userWorkflows = sqliteTable("user_workflows", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  templateId: text("template_id").references(() => workflowTemplates.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  n8nWorkflowId: text("n8n_workflow_id"), // Reference to n8n workflow if using external automation
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const insertUserWorkflowSchema = createInsertSchema(userWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserWorkflow = typeof userWorkflows.$inferSelect;
export type InsertUserWorkflow = z.infer<typeof insertUserWorkflowSchema>;
