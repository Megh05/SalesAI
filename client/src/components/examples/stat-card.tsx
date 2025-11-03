import { StatCard } from "../stat-card";
import { TrendingUp } from "lucide-react";

export default function StatCardExample() {
  return (
    <div className="p-8 grid grid-cols-3 gap-4">
      <StatCard
        title="Total Leads"
        value="1,234"
        change="+12.5% from last month"
        changeType="positive"
        icon={TrendingUp}
      />
      <StatCard
        title="Conversion Rate"
        value="24.8%"
        change="+2.3% from last month"
        changeType="positive"
        icon={TrendingUp}
      />
      <StatCard
        title="Active Deals"
        value="87"
        change="-3.2% from last month"
        changeType="negative"
        icon={TrendingUp}
      />
    </div>
  );
}
