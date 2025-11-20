import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Building2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface OrganizationSettings {
  roundRobinEnabled: boolean;
  aiAssignmentEnabled: boolean;
  defaultLeadSource?: string;
}

export default function OrganizationSettings() {
  const { activeOrganization, activeOrgId } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(activeOrganization?.name || "");
  const [domain, setDomain] = useState(activeOrganization?.domain || "");

  const { data: org, isLoading } = useQuery({
    queryKey: ["/api/organizations", activeOrgId],
    enabled: !!activeOrgId,
  });

  const settings: OrganizationSettings = org?.settings 
    ? (typeof org.settings === 'string' ? JSON.parse(org.settings) : org.settings)
    : { roundRobinEnabled: false, aiAssignmentEnabled: true };

  const [roundRobinEnabled, setRoundRobinEnabled] = useState(settings.roundRobinEnabled);
  const [aiAssignmentEnabled, setAiAssignmentEnabled] = useState(settings.aiAssignmentEnabled);

  const updateOrg = useMutation({
    mutationFn: async (data: {
      name?: string;
      domain?: string;
      settings?: OrganizationSettings;
    }) => {
      const res = await apiRequest("PATCH", `/api/organizations/${activeOrgId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", activeOrgId] });
      toast({
        title: "Settings saved",
        description: "Organization settings have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSaveGeneral = () => {
    updateOrg.mutate({
      name: name.trim(),
      domain: domain.trim() || undefined,
    });
  };

  const handleSaveSettings = () => {
    updateOrg.mutate({
      settings: {
        roundRobinEnabled,
        aiAssignmentEnabled,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!activeOrganization) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardHeader>
            <CardTitle>No Organization Selected</CardTitle>
            <CardDescription>Please select an organization to view settings</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-org-settings">Organization Settings</h1>
          <p className="text-muted-foreground">Manage your organization configuration</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>Basic details about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corporation"
              data-testid="input-org-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-domain">Domain</Label>
            <Input
              id="org-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="acme.com"
              data-testid="input-org-domain"
            />
            <p className="text-xs text-muted-foreground">
              Used for email-based team invitations and integrations
            </p>
          </div>

          <Button 
            onClick={handleSaveGeneral}
            disabled={updateOrg.isPending}
            data-testid="button-save-general"
          >
            {updateOrg.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lead Assignment</CardTitle>
          <CardDescription>Configure how leads are automatically assigned to team members</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="round-robin">Round Robin Assignment</Label>
              <p className="text-sm text-muted-foreground">
                Distribute leads evenly across team members
              </p>
            </div>
            <Switch
              id="round-robin"
              checked={roundRobinEnabled}
              onCheckedChange={setRoundRobinEnabled}
              data-testid="switch-round-robin"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ai-assignment">AI-Powered Assignment</Label>
              <p className="text-sm text-muted-foreground">
                Use AI to intelligently match leads with the best sales rep
              </p>
            </div>
            <Switch
              id="ai-assignment"
              checked={aiAssignmentEnabled}
              onCheckedChange={setAiAssignmentEnabled}
              data-testid="switch-ai-assignment"
            />
          </div>

          {!aiAssignmentEnabled && !roundRobinEnabled && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                At least one assignment method should be enabled for automatic lead distribution
              </p>
            </div>
          )}

          <Button 
            onClick={handleSaveSettings}
            disabled={updateOrg.isPending}
            data-testid="button-save-assignment"
          >
            {updateOrg.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Assignment Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization ID</CardTitle>
          <CardDescription>Use this ID for API integrations</CardDescription>
        </CardHeader>
        <CardContent>
          <code className="block p-3 bg-muted rounded-md text-sm" data-testid="text-org-id">
            {activeOrgId}
          </code>
        </CardContent>
      </Card>
    </div>
  );
}
