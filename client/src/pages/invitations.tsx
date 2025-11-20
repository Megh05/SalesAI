import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Plus, Send, Loader2, UserPlus, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface Invitation {
  id: string;
  email: string;
  teamId: string;
  roleId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
  token: string;
  expiresAt: string;
  createdAt: string;
  teamName?: string;
  roleName?: string;
}

interface Team {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
}

export default function InvitationsHub() {
  const { activeOrgId } = useAuth();
  const { toast } = useToast();
  const [showBulkInvite, setShowBulkInvite] = useState(false);
  const [emails, setEmails] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: invitations, isLoading: invitationsLoading } = useQuery<Invitation[]>({
    queryKey: ["/api/invitations", { organizationId: activeOrgId }],
    enabled: !!activeOrgId,
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams", { organizationId: activeOrgId }],
    enabled: !!activeOrgId,
  });

  const { data: roles } = useQuery<Role[]>({
    queryKey: ["/api/roles", { organizationId: activeOrgId }],
    enabled: !!activeOrgId,
  });

  const bulkInvite = useMutation({
    mutationFn: async (data: { emails: string[]; teamId: string; roleId: string }) => {
      const results = await Promise.all(
        data.emails.map(email =>
          apiRequest("POST", "/api/invitations", {
            email: email.trim(),
            teamId: data.teamId,
            roleId: data.roleId,
          }).then(res => res.json())
        )
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", { organizationId: activeOrgId }] });
      setShowBulkInvite(false);
      setEmails("");
      setSelectedTeam("");
      setSelectedRole("");
      toast({
        title: "Invitations sent",
        description: "All invitations have been sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitations",
        variant: "destructive",
      });
    },
  });

  const resendInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await apiRequest("POST", `/api/invitations/${invitationId}/resend`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invitations", { organizationId: activeOrgId }] });
      toast({
        title: "Invitation resent",
        description: "Invitation has been resent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resend invitation",
        variant: "destructive",
      });
    },
  });

  const handleBulkInvite = () => {
    const emailList = emails
      .split(/[,\n]/)
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (emailList.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one email address",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTeam || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select both team and role",
        variant: "destructive",
      });
      return;
    }

    bulkInvite.mutate({
      emails: emailList,
      teamId: selectedTeam,
      roleId: selectedRole,
    });
  };

  const filteredInvitations = invitations?.filter(inv => {
    if (activeTab === "all") return true;
    return inv.status.toLowerCase() === activeTab.toLowerCase();
  }) || [];

  const getStatusIcon = (status: Invitation["status"]) => {
    switch (status) {
      case "ACCEPTED":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "DECLINED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "EXPIRED":
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <Mail className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: Invitation["status"]) => {
    const variants = {
      PENDING: "default",
      ACCEPTED: "default",
      DECLINED: "destructive",
      EXPIRED: "secondary",
    } as const;

    return (
      <Badge variant={variants[status] || "secondary"} className="gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };

  if (invitationsLoading) {
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
          <UserPlus className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-invitations">Team Invitations</h1>
            <p className="text-muted-foreground">Manage and track team member invitations</p>
          </div>
        </div>
        <Button onClick={() => setShowBulkInvite(true)} data-testid="button-bulk-invite">
          <Plus className="mr-2 h-4 w-4" />
          Bulk Invite
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
          <CardDescription>All pending and past invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
              <TabsTrigger value="pending" data-testid="tab-pending">Pending</TabsTrigger>
              <TabsTrigger value="accepted" data-testid="tab-accepted">Accepted</TabsTrigger>
              <TabsTrigger value="declined" data-testid="tab-declined">Declined</TabsTrigger>
              <TabsTrigger value="expired" data-testid="tab-expired">Expired</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvitations.length > 0 ? (
                    filteredInvitations.map((inv) => (
                      <TableRow key={inv.id} data-testid={`invitation-row-${inv.id}`}>
                        <TableCell className="font-medium">{inv.email}</TableCell>
                        <TableCell>{inv.teamName || "Unknown"}</TableCell>
                        <TableCell>{inv.roleName || "Unknown"}</TableCell>
                        <TableCell>{getStatusBadge(inv.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          {inv.status === "PENDING" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resendInvitation.mutate(inv.id)}
                              disabled={resendInvitation.isPending}
                              data-testid={`button-resend-${inv.id}`}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Resend
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No invitations found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showBulkInvite} onOpenChange={setShowBulkInvite}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Bulk Invite Team Members</DialogTitle>
            <DialogDescription>
              Invite multiple team members at once by email
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emails">Email Addresses *</Label>
              <Textarea
                id="emails"
                placeholder="Enter email addresses (comma or newline separated)&#10;example@company.com, another@company.com"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                rows={5}
                data-testid="input-bulk-emails"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple emails with commas or newlines
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Team *</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger id="team" data-testid="select-team">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams?.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role" data-testid="select-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkInvite(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkInvite}
              disabled={bulkInvite.isPending}
              data-testid="button-submit-bulk-invite"
            >
              {bulkInvite.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Send Invitations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
