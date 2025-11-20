import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Plus, Eye, Edit, Loader2, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PermissionInspector } from "@/components/permission-inspector";
import { useAuth } from "@/hooks/useAuth";

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
}

interface Permission {
  id: string;
  key: string;
  resource: string;
  action: string;
  description: string | null;
}

export default function RBACDashboard() {
  const { activeOrgId } = useAuth();
  const { toast } = useToast();
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showPermissionInspector, setShowPermissionInspector] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles", { organizationId: activeOrgId }],
    enabled: !!activeOrgId,
  });

  const { data: permissions, isLoading: permissionsLoading } = useQuery<Permission[]>({
    queryKey: ["/api/permissions"],
  });

  const createRole = useMutation({
    mutationFn: async (data: { name: string; description?: string; permissionIds: string[] }) => {
      const res = await apiRequest("POST", "/api/roles", {
        ...data,
        organizationId: activeOrgId,
        isSystemRole: false,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles", { organizationId: activeOrgId }] });
      setShowCreateRole(false);
      setNewRoleName("");
      setNewRoleDescription("");
      setSelectedPermissions(new Set());
      toast({
        title: "Role created",
        description: "New role has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create role",
        variant: "destructive",
      });
    },
  });

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      toast({
        title: "Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    createRole.mutate({
      name: newRoleName.trim(),
      description: newRoleDescription.trim() || undefined,
      permissionIds: Array.from(selectedPermissions),
    });
  };

  const groupedPermissions = permissions?.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>) || {};

  const handleViewPermissions = (roleId: string) => {
    setSelectedRoleId(roleId);
    setShowPermissionInspector(true);
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  };

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-rbac">Role & Permission Management</h1>
            <p className="text-muted-foreground">Manage roles and access control</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateRole(true)} data-testid="button-create-role">
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>All roles in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles && roles.length > 0 ? (
                roles.map((role) => (
                  <TableRow key={role.id} data-testid={`role-row-${role.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {role.isSystemRole && <Crown className="h-4 w-4 text-amber-500" />}
                        {role.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {role.description || "No description"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.isSystemRole ? "default" : "secondary"}>
                        {role.isSystemRole ? "System" : "Custom"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPermissions(role.id)}
                        data-testid={`button-view-permissions-${role.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Permissions
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No roles found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a custom role with specific permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name *</Label>
              <Input
                id="role-name"
                placeholder="e.g., Marketing Manager"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                data-testid="input-role-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                placeholder="Describe the role's responsibilities"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                rows={2}
                data-testid="input-role-description"
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto space-y-4">
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <div key={resource} className="space-y-2">
                    <h4 className="font-medium text-sm capitalize">{resource}</h4>
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      {perms.map((perm) => (
                        <div key={perm.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={perm.id}
                            checked={selectedPermissions.has(perm.id)}
                            onCheckedChange={() => togglePermission(perm.id)}
                            data-testid={`checkbox-permission-${perm.key}`}
                          />
                          <label
                            htmlFor={perm.id}
                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {perm.action}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateRole(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRole}
              disabled={createRole.isPending}
              data-testid="button-submit-create-role"
            >
              {createRole.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedRoleId && (
        <PermissionInspector
          open={showPermissionInspector}
          onClose={() => {
            setShowPermissionInspector(false);
            setSelectedRoleId(null);
          }}
          roleId={selectedRoleId}
          title="Role Permissions"
        />
      )}
    </div>
  );
}
