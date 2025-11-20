import { storage } from './storage';
import { db } from './db';
import { companies, contacts, leads, activities, emailThreads } from '@shared/schema';
import { eq, and, or, inArray, desc } from 'drizzle-orm';
import type { Company, Contact, Lead, Activity, EmailThread } from '@shared/schema';
import type { OrganizationContext } from './organization-context.service';

export class EnhancedStorage {
  // Organization-scoped company operations
  async getCompaniesForContext(context: OrganizationContext): Promise<Company[]> {
    const { organizationId, role, userId, teamMemberIds } = context;

    if (role === 'OWNER' || role === 'ADMIN' || role === 'VIEWER') {
      // Can see all companies in organization
      return db
        .select()
        .from(companies)
        .where(eq(companies.organizationId, organizationId))
        .orderBy(desc(companies.createdAt));
    }

    if (role === 'SALES_MANAGER' && teamMemberIds && teamMemberIds.length > 0) {
      // Can see companies created by team members
      return db
        .select()
        .from(companies)
        .where(
          and(
            eq(companies.organizationId, organizationId),
            inArray(companies.userId, teamMemberIds)
          )
        )
        .orderBy(desc(companies.createdAt));
    }

    // SALES_REP can only see their own or assigned
    return db
      .select()
      .from(companies)
      .where(and(eq(companies.organizationId, organizationId), eq(companies.userId, userId)))
      .orderBy(desc(companies.createdAt));
  }

  async getCompanyForContext(id: string, context: OrganizationContext): Promise<Company | undefined> {
    const companies = await this.getCompaniesForContext(context);
    return companies.find(c => c.id === id);
  }

  // Organization-scoped contact operations
  async getContactsForContext(context: OrganizationContext): Promise<Contact[]> {
    const { organizationId, role, userId, teamMemberIds } = context;

    if (role === 'OWNER' || role === 'ADMIN' || role === 'VIEWER') {
      // Can see all contacts in organization
      return db
        .select()
        .from(contacts)
        .where(eq(contacts.organizationId, organizationId))
        .orderBy(desc(contacts.createdAt));
    }

    if (role === 'SALES_MANAGER' && teamMemberIds && teamMemberIds.length > 0) {
      // Can see contacts created by team members
      return db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.organizationId, organizationId),
            inArray(contacts.userId, teamMemberIds)
          )
        )
        .orderBy(desc(contacts.createdAt));
    }

    // SALES_REP can only see their own
    return db
      .select()
      .from(contacts)
      .where(and(eq(contacts.organizationId, organizationId), eq(contacts.userId, userId)))
      .orderBy(desc(contacts.createdAt));
  }

  async getContactForContext(id: string, context: OrganizationContext): Promise<Contact | undefined> {
    const contacts = await this.getContactsForContext(context);
    return contacts.find(c => c.id === id);
  }

  // Organization-scoped lead operations
  async getLeadsForContext(context: OrganizationContext): Promise<Lead[]> {
    const { organizationId, role, userId, teamMemberIds } = context;

    if (role === 'OWNER' || role === 'ADMIN') {
      // Can see all leads in organization
      return db
        .select()
        .from(leads)
        .where(eq(leads.organizationId, organizationId))
        .orderBy(desc(leads.createdAt));
    }

    if (role === 'SALES_MANAGER' && teamMemberIds && teamMemberIds.length > 0) {
      // Can see leads created by or assigned to team members
      return db
        .select()
        .from(leads)
        .where(
          and(
            eq(leads.organizationId, organizationId),
            or(
              inArray(leads.userId, teamMemberIds),
              inArray(leads.assignedTo, teamMemberIds)
            )
          )
        )
        .orderBy(desc(leads.createdAt));
    }

    if (role === 'SALES_REP') {
      // Can only see own or assigned leads
      return db
        .select()
        .from(leads)
        .where(
          and(
            eq(leads.organizationId, organizationId),
            or(eq(leads.userId, userId), eq(leads.assignedTo, userId))
          )
        )
        .orderBy(desc(leads.createdAt));
    }

    if (role === 'VIEWER') {
      // Can see all leads (read-only)
      return db
        .select()
        .from(leads)
        .where(eq(leads.organizationId, organizationId))
        .orderBy(desc(leads.createdAt));
    }

    return [];
  }

  async getLeadForContext(id: string, context: OrganizationContext): Promise<Lead | undefined> {
    const leads = await this.getLeadsForContext(context);
    return leads.find(l => l.id === id);
  }

  // Organization-scoped activity operations
  async getActivitiesForContext(context: OrganizationContext): Promise<Activity[]> {
    const { organizationId, role, userId, teamMemberIds } = context;

    if (role === 'OWNER' || role === 'ADMIN' || role === 'VIEWER') {
      // Can see all activities in organization
      return db
        .select()
        .from(activities)
        .where(eq(activities.organizationId, organizationId))
        .orderBy(desc(activities.createdAt));
    }

    if (role === 'SALES_MANAGER' && teamMemberIds && teamMemberIds.length > 0) {
      // Can see activities created by team members
      return db
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.organizationId, organizationId),
            inArray(activities.userId, teamMemberIds)
          )
        )
        .orderBy(desc(activities.createdAt));
    }

    // SALES_REP can only see their own activities
    return db
      .select()
      .from(activities)
      .where(and(eq(activities.organizationId, organizationId), eq(activities.userId, userId)))
      .orderBy(desc(activities.createdAt));
  }

  async getActivityForContext(id: string, context: OrganizationContext): Promise<Activity | undefined> {
    const activities = await this.getActivitiesForContext(context);
    return activities.find(a => a.id === id);
  }

  // Organization-scoped email operations  
  async getEmailThreadsForContext(context: OrganizationContext): Promise<EmailThread[]> {
    const { userId, role, organizationId } = context;

    // Get all emails for this user
    const userEmails = await db
      .select()
      .from(emailThreads)
      .where(eq(emailThreads.userId, userId))
      .orderBy(desc(emailThreads.createdAt));

    // For OWNER/ADMIN, could potentially see all org emails
    // For now, users only see their own emails
    return userEmails;
  }

  // Permission checks
  canModifyResource(context: OrganizationContext, resource: { userId?: string; assignedTo?: string | null }): boolean {
    const { role, userId, teamMemberIds } = context;

    if (role === 'VIEWER') {
      return false;
    }

    if (role === 'OWNER' || role === 'ADMIN') {
      return true;
    }

    if (role === 'SALES_MANAGER') {
      // Can only modify resources belonging to team members
      const resourceOwnerId = resource.userId;
      const resourceAssignedTo = resource.assignedTo;
      
      return (
        (resourceOwnerId && teamMemberIds?.includes(resourceOwnerId)) ||
        (resourceAssignedTo && teamMemberIds?.includes(resourceAssignedTo))
      );
    }

    if (role === 'SALES_REP') {
      return resource.userId === userId || resource.assignedTo === userId;
    }

    return false;
  }

  canDeleteResource(context: OrganizationContext, resource: { userId?: string }): boolean {
    const { role, userId, teamMemberIds } = context;

    if (role === 'VIEWER' || role === 'SALES_REP') {
      return false;
    }

    if (role === 'OWNER' || role === 'ADMIN') {
      return true;
    }

    if (role === 'SALES_MANAGER') {
      // Can delete resources belonging to team members
      return resource.userId ? teamMemberIds?.includes(resource.userId) || false : false;
    }

    return false;
  }
}

export const enhancedStorage = new EnhancedStorage();
