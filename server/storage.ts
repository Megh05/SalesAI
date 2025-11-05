import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
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
  users,
  companies,
  contacts,
  leads,
  activities,
  emailThreads,
  userSettings,
  oauthTokens,
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
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
    // Note: isRead field not in current schema, this is a placeholder
    // You may want to add this field to the schema if needed
    return true;
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
}

export const storage = new DatabaseStorage();
