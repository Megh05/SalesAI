import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface Organization {
  id: string;
  name: string;
  domain: string | null;
  ownerId: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activeOrgId');
    }
    return null;
  });

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    enabled: !!user,
  });

  const setActiveOrgId = useCallback((orgId: string | null) => {
    setActiveOrgIdState(orgId);
    if (typeof window !== 'undefined') {
      if (orgId) {
        localStorage.setItem('activeOrgId', orgId);
      } else {
        localStorage.removeItem('activeOrgId');
      }
    }
    queryClient.removeQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === 'string' && (
          key.includes('/api/roles') ||
          key.includes('/api/invitations') ||
          key.includes('/api/teams') ||
          key.includes('/api/team-members') ||
          key.includes('/api/leads') ||
          key.includes('/api/activities')
        );
      },
    });
  }, []);

  const activeOrganization = organizations?.find(org => org.id === activeOrgId);

  useEffect(() => {
    if (organizations && organizations.length > 0 && !activeOrgId) {
      setActiveOrgId(organizations[0].id);
    }
  }, [organizations, activeOrgId, setActiveOrgId]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    activeOrgId,
    setActiveOrgId,
    organizations: organizations || [],
    activeOrganization,
    hasOrganization: (organizations?.length || 0) > 0,
  };
}
