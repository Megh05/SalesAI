import { db } from './db';
import { roles, permissions, rolePermissions } from '@shared/schema';
import { eq } from 'drizzle-orm';

const SYSTEM_PERMISSIONS = [
  // Leads permissions
  { key: 'leads.read', resource: 'leads', action: 'read', description: 'View leads' },
  { key: 'leads.read_own', resource: 'leads', action: 'read_own', description: 'View own assigned leads only' },
  { key: 'leads.write', resource: 'leads', action: 'write', description: 'Create and edit leads' },
  { key: 'leads.write_own', resource: 'leads', action: 'write_own', description: 'Edit own assigned leads only' },
  { key: 'leads.delete', resource: 'leads', action: 'delete', description: 'Delete leads' },
  { key: 'leads.assign', resource: 'leads', action: 'assign', description: 'Assign leads to team members' },
  
  // Contacts permissions
  { key: 'contacts.read', resource: 'contacts', action: 'read', description: 'View contacts' },
  { key: 'contacts.write', resource: 'contacts', action: 'write', description: 'Create and edit contacts' },
  { key: 'contacts.delete', resource: 'contacts', action: 'delete', description: 'Delete contacts' },
  
  // Companies permissions
  { key: 'companies.read', resource: 'companies', action: 'read', description: 'View companies' },
  { key: 'companies.write', resource: 'companies', action: 'write', description: 'Create and edit companies' },
  { key: 'companies.delete', resource: 'companies', action: 'delete', description: 'Delete companies' },
  
  // Activities permissions
  { key: 'activities.read', resource: 'activities', action: 'read', description: 'View activities' },
  { key: 'activities.write', resource: 'activities', action: 'write', description: 'Create activities' },
  { key: 'activities.write_own', resource: 'activities', action: 'write_own', description: 'Create own activities only' },
  
  // Emails permissions
  { key: 'emails.read', resource: 'emails', action: 'read', description: 'View all emails' },
  { key: 'emails.read_own', resource: 'emails', action: 'read_own', description: 'View own emails only' },
  { key: 'emails.send', resource: 'emails', action: 'send', description: 'Send emails' },
  
  // Workflows permissions
  { key: 'workflows.read', resource: 'workflows', action: 'read', description: 'View workflows' },
  { key: 'workflows.write', resource: 'workflows', action: 'write', description: 'Create and edit workflows' },
  { key: 'workflows.delete', resource: 'workflows', action: 'delete', description: 'Delete workflows' },
  
  // Members permissions
  { key: 'members.read', resource: 'members', action: 'read', description: 'View team members' },
  { key: 'members.invite', resource: 'members', action: 'invite', description: 'Invite new members' },
  { key: 'members.manage', resource: 'members', action: 'manage', description: 'Manage member roles and permissions' },
  { key: 'members.remove', resource: 'members', action: 'remove', description: 'Remove team members' },
  
  // Organization permissions
  { key: 'organization.read', resource: 'organization', action: 'read', description: 'View organization settings' },
  { key: 'organization.write', resource: 'organization', action: 'write', description: 'Edit organization settings' },
  
  // Roles permissions
  { key: 'roles.read', resource: 'roles', action: 'read', description: 'View roles and permissions' },
  { key: 'roles.write', resource: 'roles', action: 'write', description: 'Create and edit custom roles' },
  { key: 'roles.delete', resource: 'roles', action: 'delete', description: 'Delete custom roles' },
];

const SYSTEM_ROLES = [
  {
    name: 'OWNER',
    description: 'Organization owner with full access to everything',
    permissions: [
      'leads.read', 'leads.write', 'leads.delete', 'leads.assign',
      'contacts.read', 'contacts.write', 'contacts.delete',
      'companies.read', 'companies.write', 'companies.delete',
      'activities.read', 'activities.write',
      'emails.read', 'emails.send',
      'workflows.read', 'workflows.write', 'workflows.delete',
      'members.read', 'members.invite', 'members.manage', 'members.remove',
      'organization.read', 'organization.write',
      'roles.read', 'roles.write', 'roles.delete',
    ],
  },
  {
    name: 'ADMIN',
    description: 'Administrator with full operational access',
    permissions: [
      'leads.read', 'leads.write', 'leads.delete', 'leads.assign',
      'contacts.read', 'contacts.write', 'contacts.delete',
      'companies.read', 'companies.write', 'companies.delete',
      'activities.read', 'activities.write',
      'emails.read', 'emails.send',
      'workflows.read', 'workflows.write', 'workflows.delete',
      'members.read', 'members.invite', 'members.manage',
      'organization.read',
      'roles.read',
    ],
  },
  {
    name: 'SALES_MANAGER',
    description: 'Sales manager with team oversight',
    permissions: [
      'leads.read', 'leads.write', 'leads.assign',
      'contacts.read', 'contacts.write',
      'companies.read', 'companies.write',
      'activities.read', 'activities.write',
      'emails.read', 'emails.send',
      'workflows.read',
      'members.read',
    ],
  },
  {
    name: 'SALES_REP',
    description: 'Sales representative with limited access',
    permissions: [
      'leads.read_own', 'leads.write_own',
      'contacts.read',
      'companies.read',
      'activities.write_own',
      'emails.read_own', 'emails.send',
    ],
  },
  {
    name: 'VIEWER',
    description: 'Read-only access to sales data',
    permissions: [
      'leads.read',
      'contacts.read',
      'companies.read',
      'activities.read',
    ],
  },
];

export async function seedRBAC() {
  console.log('Seeding RBAC data...');
  
  try {
    // 1. Seed permissions
    console.log('Creating permissions...');
    const existingPermissions = await db.select().from(permissions);
    
    for (const perm of SYSTEM_PERMISSIONS) {
      const exists = existingPermissions.find(p => p.key === perm.key);
      if (!exists) {
        await db.insert(permissions).values(perm);
        console.log(`  ✓ Created permission: ${perm.key}`);
      }
    }
    
    // Get all permissions for role assignment
    const allPermissions = await db.select().from(permissions);
    const permissionMap = new Map(allPermissions.map(p => [p.key, p]));
    
    // 2. Seed system roles
    console.log('\nCreating system roles...');
    
    for (const roleData of SYSTEM_ROLES) {
      // Check if role already exists
      const existingRole = await db
        .select()
        .from(roles)
        .where(eq(roles.name, roleData.name))
        .limit(1);
      
      let role;
      if (existingRole.length === 0) {
        [role] = await db.insert(roles).values({
          name: roleData.name,
          description: roleData.description,
          isSystemRole: true,
          organizationId: null, // System roles are not org-specific
        }).returning();
        console.log(`  ✓ Created role: ${roleData.name}`);
      } else {
        role = existingRole[0];
        console.log(`  → Role exists: ${roleData.name}`);
      }
      
      // 3. Assign permissions to role
      const existingRolePerms = await db
        .select()
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, role.id));
      
      for (const permKey of roleData.permissions) {
        const permission = permissionMap.get(permKey);
        if (!permission) {
          console.warn(`    ⚠ Permission not found: ${permKey}`);
          continue;
        }
        
        const exists = existingRolePerms.find(rp => rp.permissionId === permission.id);
        if (!exists) {
          await db.insert(rolePermissions).values({
            roleId: role.id,
            permissionId: permission.id,
          });
        }
      }
      console.log(`    → Assigned ${roleData.permissions.length} permissions`);
    }
    
    console.log('\n✅ RBAC seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding RBAC data:', error);
    throw error;
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedRBAC()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
