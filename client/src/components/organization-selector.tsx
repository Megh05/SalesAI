import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface OrganizationSelectorProps {
  open: boolean;
  onClose?: () => void;
  forceSelection?: boolean;
}

export function OrganizationSelector({ open, onClose, forceSelection = false }: OrganizationSelectorProps) {
  const { organizations, activeOrgId, setActiveOrgId } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDomain, setNewOrgDomain] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string>(activeOrgId || "");

  const createOrg = useMutation({
    mutationFn: async (data: { name: string; domain?: string }) => {
      const res = await apiRequest("POST", "/api/organizations", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setActiveOrgId(data.organization.id);
      setIsCreating(false);
      setNewOrgName("");
      setNewOrgDomain("");
      toast({
        title: "Organization created",
        description: `${data.organization.name} has been created successfully`,
      });
      if (onClose) onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
    },
  });

  const handleSelectOrganization = () => {
    if (selectedOrgId) {
      setActiveOrgId(selectedOrgId);
      toast({
        title: "Organization selected",
        description: "You can now access your workspace",
      });
      if (onClose) onClose();
    }
  };

  const handleCreateOrganization = () => {
    if (!newOrgName.trim()) {
      toast({
        title: "Error",
        description: "Organization name is required",
        variant: "destructive",
      });
      return;
    }
    createOrg.mutate({
      name: newOrgName.trim(),
      domain: newOrgDomain.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={forceSelection ? undefined : onClose}>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => forceSelection && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isCreating ? "Create Organization" : "Select Organization"}
          </DialogTitle>
          <DialogDescription>
            {isCreating
              ? "Create a new organization to get started"
              : organizations.length === 0
              ? "You need an organization to access the platform"
              : "Choose an organization to work with"}
          </DialogDescription>
        </DialogHeader>

        {!isCreating ? (
          <div className="space-y-4">
            {organizations.length > 0 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="org-select">Organization</Label>
                  <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                    <SelectTrigger id="org-select" data-testid="select-organization">
                      <SelectValue placeholder="Select an organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id} data-testid={`org-option-${org.id}`}>
                          {org.name}
                          {org.domain && <span className="text-muted-foreground ml-2">({org.domain})</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={handleSelectOrganization} disabled={!selectedOrgId} data-testid="button-confirm-org">
                    Continue
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(true)} data-testid="button-create-new-org">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Organization
                  </Button>
                </div>
              </>
            ) : (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-base">No organizations found</CardTitle>
                  <CardDescription>Create your first organization to get started</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setIsCreating(true)} className="w-full" data-testid="button-create-first-org">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Organization
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name *</Label>
              <Input
                id="org-name"
                placeholder="Acme Corporation"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                data-testid="input-org-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-domain">Domain (Optional)</Label>
              <Input
                id="org-domain"
                placeholder="acme.com"
                value={newOrgDomain}
                onChange={(e) => setNewOrgDomain(e.target.value)}
                data-testid="input-org-domain"
              />
              <p className="text-xs text-muted-foreground">
                Used for email-based team invitations
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {organizations.length > 0 && (
                <Button variant="outline" onClick={() => setIsCreating(false)} data-testid="button-cancel-create">
                  Back
                </Button>
              )}
              <Button
                onClick={handleCreateOrganization}
                disabled={createOrg.isPending}
                className="w-full sm:w-auto"
                data-testid="button-submit-create-org"
              >
                {createOrg.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Organization
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
