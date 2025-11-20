import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Mail,
  Building2,
  Shield,
  BarChart3,
  Activity,
  Loader2,
  Eye,
} from "lucide-react";
import { PermissionInspector } from "@/components/permission-inspector";

interface Member {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  roleName: string;
  roleId: string;
  teamName: string;
  teamId: string;
  invitationStatus: string;
}

interface Lead {
  id: string;
  title: string;
  status: string;
  value: number | null;
  company: string | null;
  createdAt: string;
}

interface ActivityRecord {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

export default function MemberProfile() {
  const [, params] = useRoute("/members/:id");
  const memberId = params?.id;
  const [showPermissions, setShowPermissions] = useState(false);

  const { data: member, isLoading: memberLoading } = useQuery<Member>({
    queryKey: ["/api/team-members", memberId],
    enabled: !!memberId,
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads", { assignedTo: member?.userId }],
    enabled: !!member?.userId,
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<ActivityRecord[]>({
    queryKey: ["/api/activities", { userId: member?.userId }],
    enabled: !!member?.userId,
  });

  if (memberLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardHeader>
            <CardTitle>Member Not Found</CardTitle>
            <CardDescription>The requested team member could not be found</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const initials =
    member.firstName && member.lastName
      ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
      : member.email[0].toUpperCase();

  const fullName =
    member.firstName && member.lastName
      ? `${member.firstName} ${member.lastName}`
      : member.email;

  const wonLeads = leads.filter(l => l.status === "won").length;
  const totalLeadValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);
  const conversionRate = leads.length > 0 ? ((wonLeads / leads.length) * 100).toFixed(1) : "0";

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold" data-testid="text-member-name">{fullName}</h1>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">{member.teamName}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="gap-1">
                  <Shield className="h-3 w-3" />
                  {member.roleName}
                </Badge>
                <Badge variant={member.invitationStatus === "ACCEPTED" ? "default" : "secondary"}>
                  {member.invitationStatus}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPermissions(true)}
                  data-testid="button-view-permissions"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Permissions
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-total-leads">{leads.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Assigned leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-conversion">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{wonLeads} won leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-total-value">
              ${totalLeadValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pipeline value</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leads" className="w-full">
        <TabsList>
          <TabsTrigger value="leads" data-testid="tab-leads">
            <BarChart3 className="h-4 w-4 mr-2" />
            Assigned Leads ({leads.length})
          </TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">
            <Activity className="h-4 w-4 mr-2" />
            Recent Activity ({activities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Leads</CardTitle>
              <CardDescription>All leads assigned to this team member</CardDescription>
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : leads.length > 0 ? (
                <div className="space-y-3">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-3 border rounded-md hover-elevate"
                      data-testid={`lead-${lead.id}`}
                    >
                      <div>
                        <h4 className="font-medium">{lead.title}</h4>
                        {lead.company && (
                          <p className="text-sm text-muted-foreground">{lead.company}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {lead.value && (
                          <span className="text-sm font-medium">${lead.value.toLocaleString()}</span>
                        )}
                        <Badge variant={lead.status === "won" ? "default" : "secondary"}>
                          {lead.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No leads assigned yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 border rounded-md"
                      data-testid={`activity-${activity.id}`}
                    >
                      <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {member.userId && (
        <PermissionInspector
          open={showPermissions}
          onClose={() => setShowPermissions(false)}
          userId={member.userId}
          title={`${fullName}'s Permissions`}
        />
      )}
    </div>
  );
}
