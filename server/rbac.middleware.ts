import type { Request, Response, NextFunction } from 'express';
import { rbacService } from './rbac.service';

export interface AuthenticatedRequest extends Request {
  user?: { id: string };
  organizationId?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function extractOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const orgId = 
    req.headers['x-organization-id'] ||
    req.params.organizationId || 
    req.body.organizationId || 
    req.query.organizationId;
  
  if (orgId) {
    req.organizationId = orgId as string;
  }
  next();
}

export function requireOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const orgId = 
    req.headers['x-organization-id'] ||
    req.params.organizationId || 
    req.body.organizationId || 
    req.query.organizationId;
  if (!orgId) {
    return res.status(400).json({ error: 'Organization ID required' });
  }
  req.organizationId = orgId as string;
  next();
}

export function requirePermission(permissionKey: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const orgId = req.organizationId || req.params.organizationId || req.body.organizationId;
    if (!orgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }
    
    try {
      const hasPermission = await rbacService.hasPermission(req.user.id, orgId as string, permissionKey);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

export function requireAnyPermission(permissionKeys: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const orgId = req.organizationId || req.params.organizationId || req.body.organizationId;
    if (!orgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }
    
    try {
      const hasPermission = await rbacService.hasAnyPermission(req.user.id, orgId as string, permissionKeys);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

export function requireRole(roleName: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const orgId = req.organizationId || req.params.organizationId || req.body.organizationId;
    if (!orgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }
    
    try {
      const userRole = await rbacService.getUserRole(req.user.id, orgId as string);
      if (userRole !== roleName) {
        return res.status(403).json({ error: `${roleName} role required` });
      }
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: 'Role check failed' });
    }
  };
}
