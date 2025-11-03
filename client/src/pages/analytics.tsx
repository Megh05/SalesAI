import { TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

//todo: remove mock functionality
const pipelineData = [
  { stage: "Prospect", count: 234, value: "$456,000" },
  { stage: "Contacted", count: 156, value: "$892,000" },
  { stage: "In Discussion", count: 89, value: "$1,245,000" },
  { stage: "Negotiation", count: 45, value: "$2,100,000" },
  { stage: "Closed Won", count: 23, value: "$1,890,000" },
];

export default function Analytics() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">Track your sales performance and pipeline metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Pipeline Value"
          value="$6.6M"
          change="+18.2% from last quarter"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="Conversion Rate"
          value="24.8%"
          change="+2.3% from last month"
          changeType="positive"
          icon={Target}
        />
        <StatCard
          title="Active Deals"
          value="547"
          change="+45 this month"
          changeType="positive"
          icon={TrendingUp}
        />
        <StatCard
          title="New Contacts"
          value="1,234"
          change="+156 this week"
          changeType="positive"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Pipeline by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipelineData.map((stage, index) => (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.stage}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{stage.count} leads</span>
                      <span className="font-medium">{stage.value}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${((index + 1) / pipelineData.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Lead Response Time</span>
                  <span className="text-sm font-medium">2.4 hours</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full w-[85%]" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Target: {"<"} 3 hours</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Email Open Rate</span>
                  <span className="text-sm font-medium">68.5%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-[68%]" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Industry avg: 45%</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Meeting Conversion</span>
                  <span className="text-sm font-medium">42.3%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full w-[42%]" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Target: 40%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
