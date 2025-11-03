import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import {
  type User,
  type InsertUser,
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
  users,
  companies,
  contacts,
  leads,
  activities,
  emailThreads,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
  createEmailThread(emailThread: InsertEmailThread): Promise<EmailThread>;
  updateEmailThread(id: string, userId: string, emailThread: Partial<InsertEmailThread>): Promise<EmailThread | undefined>;
  markEmailAsRead(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
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
    return result.rowCount !== null && result.rowCount > 0;
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
    return result.rowCount !== null && result.rowCount > 0;
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
    return result.rowCount !== null && result.rowCount > 0;
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
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Email thread operations
  async getEmailThreads(userId: string): Promise<EmailThread[]> {
    return db.select().from(emailThreads).where(eq(emailThreads.userId, userId)).orderBy(desc(emailThreads.createdAt));
  }

  async getEmailThread(id: string, userId: string): Promise<EmailThread | undefined> {
    const [emailThread] = await db.select().from(emailThreads).where(and(eq(emailThreads.id, id), eq(emailThreads.userId, userId)));
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
    const result = await db
      .update(emailThreads)
      .set({ isRead: 1 })
      .where(and(eq(emailThreads.id, id), eq(emailThreads.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
