import { storage } from './storage';
import type { InsertOrganization } from '@shared/schema';

export class OrganizationService {
  async createOrganizationForUser(userId: string, name: string, domain?: string) {
    // Create organization
    const org = await storage.createOrganization({
      name,
      domain,
      ownerId: userId,
      settings: JSON.stringify({ roundRobinEnabled: false }),
    });
    
    // Create default team for the organization
    const team = await storage.createTeam({
      organizationId: org.id,
      name: `${name} Team`,
      description: 'Default team',
      ownerId: userId,
    });
    
    // Get OWNER role
    const ownerRole = await storage.getRoleByName('OWNER');
    
    // Add user as team member with OWNER role
    if (ownerRole) {
      await storage.addTeamMember({
        teamId: team.id,
        userId,
        roleId: ownerRole.id,
        role: 'owner',
        invitationStatus: 'ACCEPTED',
      });
    }
    
    return { organization: org, team };
  }
  
  async getOrganizationStats(organizationId: string) {
    const members = await storage.getOrganizationMembers(organizationId);
    
    if (members.length === 0) {
      return {
        companies: 0,
        contacts: 0,
        leads: 0,
        activities: 0,
        members: 0,
      };
    }
    
    // Use first member's userId to fetch org data
    const firstUserId = members[0].userId;
    
    const [companies, contacts, leads, activities] = await Promise.all([
      storage.getCompanies(firstUserId),
      storage.getContacts(firstUserId),
      storage.getLeads(firstUserId),
      storage.getActivities(firstUserId),
    ]);
    
    return {
      companies: companies.length,
      contacts: contacts.length,
      leads: leads.length,
      activities: activities.length,
      members: members.length,
    };
  }
}

export const organizationService = new OrganizationService();
