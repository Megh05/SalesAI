import { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface OrganizationContext {
  organizationId: string;
  userId: string;
  role: string | null;
  permissions: string[];
}

interface Organization {
  id: string;
  name: string;
  domain: string | null;
  ownerId: string;
}

interface ContextData {
  context: OrganizationContext | null;
  organizations: Organization[];
  currentOrganization: Organization | null;
  setCurrentOrganization: (orgId: string) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isLoading: boolean;
}

const OrgContext = createContext<ContextData | null>(null);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{
    context: OrganizationContext;
    organizations: Organization[];
  }>({
    queryKey: ["/api/user/context", selectedOrgId],
    queryFn: async () => {
      const url = selectedOrgId
        ? `/api/user/context?organizationId=${selectedOrgId}`
        : "/api/user/context";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch context");
      return res.json();
    },
    retry: false,
  });

  // Auto-select first organization on load
  useEffect(() => {
    if (data?.organizations && !selectedOrgId) {
      const firstOrg = data.organizations[0];
      if (firstOrg) {
        setSelectedOrgId(firstOrg.id);
      }
    }
  }, [data?.organizations, selectedOrgId]);

  const currentOrganization = data?.organizations.find(
    (org) => org.id === selectedOrgId
  ) || null;

  const hasPermission = (permission: string): boolean => {
    return data?.context?.permissions.includes(permission) || false;
  };

  const hasRole = (role: string): boolean => {
    return data?.context?.role === role;
  };

  const setCurrentOrganization = (orgId: string) => {
    setSelectedOrgId(orgId);
    // Invalidate all queries when switching organizations
    queryClient.invalidateQueries();
  };

  return (
    <OrgContext.Provider
      value={{
        context: data?.context || null,
        organizations: data?.organizations || [],
        currentOrganization,
        setCurrentOrganization,
        hasPermission,
        hasRole,
        isLoading,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrganizationContext must be used within OrganizationProvider");
  }
  return context;
}

// Helper hook to add organization context to API requests
export function useApiWithContext() {
  const { context } = useOrganizationContext();

  const apiRequestWithContext = async (
    method: string,
    url: string,
    body?: any
  ) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (context?.organizationId) {
      headers["x-organization-id"] = context.organizationId;
    }

    const options: RequestInit = {
      method,
      headers,
      credentials: "include",
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || "Request failed");
    }

    if (res.status === 204) {
      return null;
    }

    return res;
  };

  return { apiRequestWithContext };
}
