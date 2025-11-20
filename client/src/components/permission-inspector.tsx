import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, CheckCircle2, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";

interface PermissionInspectorProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
  roleId?: string;
  title?: string;
}

interface Permission {
  id: string;
  key: string;
  resource: string;
  action: string;
  description: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Permission[];
}

export function PermissionInspector({ 
  open, 
  onClose, 
  userId, 
  roleId,
  title = "Permissions"
}: PermissionInspectorProps) {
  const { activeOrgId } = useAuth();
  
  const { data: permissions, isLoading } = useQuery<Permission[]>({
    queryKey: roleId 
      ? ["/api/roles", roleId, "permissions", { organizationId: activeOrgId }] 
      : userId 
      ? ["/api/users", userId, "permissions", { organizationId: activeOrgId }] 
      : [],
    enabled: open && !!activeOrgId && (!!roleId || !!userId),
  });

  const groupedPermissions = permissions?.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>) || {};

  const resourceOrder = ['leads', 'contacts', 'companies', 'activities', 'teams', 'workflows', 'analytics'];
  const sortedResources = Object.keys(groupedPermissions).sort((a, b) => {
    const indexA = resourceOrder.indexOf(a);
    const indexB = resourceOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            View all permissions and access rights
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : permissions && permissions.length > 0 ? (
          <ScrollArea className="max-h-[500px] pr-4">
            <div className="space-y-4">
              {sortedResources.map((resource) => (
                <Card key={resource}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium capitalize">
                      {resource}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {groupedPermissions[resource].length} permission{groupedPermissions[resource].length !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {groupedPermissions[resource].map((perm) => (
                        <Badge 
                          key={perm.id} 
                          variant="secondary"
                          className="gap-1"
                          data-testid={`permission-${perm.key}`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {perm.action}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No permissions found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
