import { storage } from './storage';
import { db } from './db';
import { roles, permissions, rolePermissions, teamMembers, teams, organizations } from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';

export class RBACService {
  async getUserRole(userId: string, organizationId: string): Promise<string | null> {
    // Check if user is organization owner
    const org = await storage.getOrganization(organizationId);
    if (org?.ownerId === userId) {
      return 'OWNER';
    }
    
    // Get user's team memberships in this organization
    const userTeams = await storage.getTeams(userId);
    const orgTeams = userTeams.filter(t => t.organizationId === organizationId);
    
    if (orgTeams.length === 0) {
      return null;
    }
    
    // Get team member record with role
    for (const team of orgTeams) {
      const member = await storage.getTeamMember(team.id, userId);
      if (member?.roleId) {
        const role = await storage.getRole(member.roleId);
        return role?.name || null;
      }
    }
    
    return null;
  }
  
  async getUserPermissions(userId: string, organizationId: string): Promise<string[]> {
    const roleName = await this.getUserRole(userId, organizationId);
    if (!roleName) {
      return [];
    }
    
    // Get all roles with this name (could be system role or custom role)
    const userRoles = await db
      .select()
      .from(roles)
      .where(eq(roles.name, roleName))
      .limit(1);
    
    if (userRoles.length === 0) {
      return [];
    }
    
    const role = userRoles[0];
    
    // Get all permissions for this role
    const rolePerms = await db
      .select({ permission: permissions })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, role.id));
    
    return rolePerms.map(rp => rp.permission.key);
  }
  
  async hasPermission(userId: string, organizationId: string, permissionKey: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, organizationId);
    return userPermissions.includes(permissionKey);
  }
  
  async hasAnyPermission(userId: string, organizationId: string, permissionKeys: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, organizationId);
    return permissionKeys.some(key => userPermissions.includes(key));
  }
  
  async hasAllPermissions(userId: string, organizationId: string, permissionKeys: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, organizationId);
    return permissionKeys.every(key => userPermissions.includes(key));
  }
  
  async getUserOrganizations(userId: string): Promise<string[]> {
    // Get organizations where user is owner
    const ownedOrgs = await db
      .select()
      .from(organizations)
      .where(eq(organizations.ownerId, userId));
    
    // Get organizations where user is a team member
    const userTeams = await storage.getTeams(userId);
    const orgIds = new Set([
      ...ownedOrgs.map(o => o.id),
      ...userTeams.map(t => t.organizationId),
    ]);
    
    return Array.from(orgIds);
  }
  
  async canAccessResource(
    userId: string,
    organizationId: string,
    resource: { userId?: string; assignedTo?: string; organizationId?: string }
  ): Promise<boolean> {
    // Organization owners and admins can access all resources
    const roleName = await this.getUserRole(userId, organizationId);
    if (roleName === 'OWNER' || roleName === 'ADMIN') {
      return true;
    }
    
    // Check if resource belongs to this organization
    if (resource.organizationId && resource.organizationId !== organizationId) {
      return false;
    }
    
    // SALES_MANAGER can access team resources
    if (roleName === 'SALES_MANAGER') {
      // Check if resource creator is in same team
      if (resource.userId) {
        const userTeams = await storage.getTeams(userId);
        const creatorTeams = await storage.getTeams(resource.userId);
        const commonTeams = userTeams.filter(ut => 
          creatorTeams.some(ct => ct.id === ut.id)
        );
        if (commonTeams.length > 0) {
          return true;
        }
      }
      return false;
    }
    
    // SALES_REP can only access own resources or assigned resources
    if (roleName === 'SALES_REP') {
      return resource.userId === userId || resource.assignedTo === userId;
    }
    
    // VIEWER can read but not modify
    return false;
  }
}

export const rbacService = new RBACService();
