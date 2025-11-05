import { TrendingUp, Users, Building2, Zap, Mail, Phone, MessageSquare } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadStatusBadge } from "@/components/lead-status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

//todo: remove mock functionality
const recentLeads = [
  { id: 1, name: "Sarah Johnson", company: "TechCorp", status: "in_discussion" as const, value: "$45,000", avatar: "SJ" },
  { id: 2, name: "Michael Chen", company: "DataFlow Inc", status: "negotiation" as const, value: "$78,000", avatar: "MC" },
  { id: 3, name: "Emma Wilson", company: "CloudSys", status: "prospect" as const, value: "$32,000", avatar: "EW" },
  { id: 4, name: "James Rodriguez", company: "AI Solutions", status: "contacted" as const, value: "$56,000", avatar: "JR" },
  { id: 5, name: "Lisa Anderson", company: "SaaS Co", status: "in_discussion" as const, value: "$91,000", avatar: "LA" },
];

//todo: remove mock functionality
const recentActivities = [
  { id: 1, type: "email", contact: "Sarah Johnson", action: "Sent proposal", time: "2 hours ago", icon: Mail },
  { id: 2, type: "call", contact: "Michael Chen", action: "Follow-up call completed", time: "4 hours ago", icon: Phone },
  { id: 3, type: "message", contact: "Emma Wilson", action: "LinkedIn message sent", time: "Yesterday", icon: MessageSquare },
];

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your pipeline.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value="1,234"
          change="+12.5% from last month"
          changeType="positive"
          icon={Zap}
        />
        <StatCard
          title="Active Companies"
          value="87"
          change="+8 this month"
          changeType="positive"
          icon={Building2}
        />
        <StatCard
          title="Contacts"
          value="423"
          change="+23 this week"
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="Conversion Rate"
          value="24.8%"
          change="+2.3% from last month"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Recent Leads</CardTitle>
            <Button variant="ghost" size="sm" data-testid="button-view-all-leads">
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center gap-4 hover-elevate rounded-md p-3 -m-3" data-testid={`lead-item-${lead.id}`}>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs">{lead.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{lead.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{lead.company}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{lead.value}</span>
                  <LeadStatusBadge status={lead.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
            <Button variant="ghost" size="sm" data-testid="button-view-all-activities">
              View all
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4" data-testid={`activity-item-${activity.id}`}>
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                  <activity.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{activity.contact}</p>
                  <p className="text-sm text-muted-foreground">{activity.action}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
