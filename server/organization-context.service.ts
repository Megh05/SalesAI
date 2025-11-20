import { storage } from './storage';
import { rbacService } from './rbac.service';
import { db } from './db';
import { teams } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface OrganizationContext {
  organizationId: string;
  userId: string;
  role: string | null;
  permissions: string[];
  teamMemberIds?: string[]; // For SALES_MANAGER role: list of team member IDs they manage
}

export class OrganizationContextService {
  async getUserPrimaryOrganization(userId: string): Promise<string | null> {
    const orgs = await storage.getOrganizations(userId);
    if (orgs.length === 0) {
      return null;
    }
    // Return first owned organization, or first joined organization
    const ownedOrg = orgs.find(o => o.ownerId === userId);
    return ownedOrg?.id || orgs[0].id;
  }

  async getContext(userId: string, organizationId?: string): Promise<OrganizationContext | null> {
    let orgId = organizationId;
    
    if (!orgId) {
      orgId = await this.getUserPrimaryOrganization(userId);
      if (!orgId) {
        return null;
      }
    }

    const role = await rbacService.getUserRole(userId, orgId);
    if (!role) {
      return null;
    }

    const permissions = await rbacService.getUserPermissions(userId, orgId);

    // For SALES_MANAGER, get team member IDs they manage
    let teamMemberIds: string[] | undefined;
    if (role === 'SALES_MANAGER') {
      teamMemberIds = await this.getTeamMemberIds(userId, orgId);
    }

    return {
      organizationId: orgId,
      userId,
      role,
      permissions,
      teamMemberIds,
    };
  }

  async getTeamMemberIds(userId: string, organizationId: string): Promise<string[]> {
    // Get ALL teams in the organization (not just teams where user is a member)
    const orgTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.organizationId, organizationId));
    
    const memberIds = new Set<string>();
    
    for (const team of orgTeams) {
      // Check if this user is a manager on this specific team
      const teamMember = await storage.getTeamMember(team.id, userId);
      
      // Only include team members if the user has SALES_MANAGER role on this team
      if (teamMember && teamMember.role === 'SALES_MANAGER') {
        const members = await storage.getTeamMembers(team.id);
        members.forEach(m => memberIds.add(m.userId));
      }
    }
    
    return Array.from(memberIds);
  }

  canReadResource(context: OrganizationContext, resource: { userId?: string; assignedTo?: string | null }): boolean {
    const { role, userId, teamMemberIds } = context;
    
    // OWNER and ADMIN can read all
    if (role === 'OWNER' || role === 'ADMIN') {
      return true;
    }
    
    // SALES_MANAGER can read resources owned by or assigned to their team members
    if (role === 'SALES_MANAGER') {
      const resourceOwnerId = resource.userId;
      const resourceAssignedTo = resource.assignedTo;
      
      return (
        (resourceOwnerId && teamMemberIds?.includes(resourceOwnerId)) ||
        (resourceAssignedTo && teamMemberIds?.includes(resourceAssignedTo))
      );
    }
    
    // SALES_REP can read own or assigned
    if (role === 'SALES_REP') {
      return resource.userId === userId || resource.assignedTo === userId;
    }
    
    // VIEWER can read all
    if (role === 'VIEWER') {
      return true;
    }
    
    return false;
  }

  canWriteResource(context: OrganizationContext, resource: { userId?: string; assignedTo?: string | null }): boolean {
    const { role, userId, teamMemberIds } = context;
    
    // OWNER and ADMIN can write all
    if (role === 'OWNER' || role === 'ADMIN') {
      return true;
    }
    
    // SALES_MANAGER can write resources owned by or assigned to their team members
    if (role === 'SALES_MANAGER') {
      const resourceOwnerId = resource.userId;
      const resourceAssignedTo = resource.assignedTo;
      
      return (
        (resourceOwnerId && teamMemberIds?.includes(resourceOwnerId)) ||
        (resourceAssignedTo && teamMemberIds?.includes(resourceAssignedTo))
      );
    }
    
    // SALES_REP can write own or assigned
    if (role === 'SALES_REP') {
      return resource.userId === userId || resource.assignedTo === userId;
    }
    
    return false;
  }
}

export const orgContextService = new OrganizationContextService();
