import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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

  const setActiveOrgId = (orgId: string | null) => {
    setActiveOrgIdState(orgId);
    if (typeof window !== 'undefined') {
      if (orgId) {
        localStorage.setItem('activeOrgId', orgId);
      } else {
        localStorage.removeItem('activeOrgId');
      }
    }
  };

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    enabled: !!user,
  });

  const activeOrganization = organizations?.find(org => org.id === activeOrgId);

  // Auto-select first organization if none selected
  useEffect(() => {
    if (organizations && organizations.length > 0 && !activeOrgId) {
      setActiveOrgId(organizations[0].id);
    }
  }, [organizations, activeOrgId]);

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
