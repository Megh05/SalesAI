import { Mail, Phone, MessageSquare, Calendar, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

//todo: remove mock functionality
const activities = [
  {
    id: 1,
    type: "email",
    icon: Mail,
    title: "Email sent to Sarah Johnson",
    description: "Sent product demo proposal and pricing details",
    contact: "Sarah Johnson",
    company: "TechCorp",
    time: "2 hours ago",
    avatar: "SJ",
  },
  {
    id: 2,
    type: "call",
    icon: Phone,
    title: "Call with Michael Chen",
    description: "30-minute discovery call completed. Discussed implementation timeline.",
    contact: "Michael Chen",
    company: "DataFlow Inc",
    time: "4 hours ago",
    avatar: "MC",
  },
  {
    id: 3,
    type: "message",
    icon: MessageSquare,
    title: "LinkedIn message to Emma Wilson",
    description: "Initial outreach message sent",
    contact: "Emma Wilson",
    company: "CloudSys",
    time: "Yesterday at 3:45 PM",
    avatar: "EW",
  },
  {
    id: 4,
    type: "meeting",
    icon: Calendar,
    title: "Meeting scheduled with James Rodriguez",
    description: "Product demo scheduled for next Tuesday at 2 PM",
    contact: "James Rodriguez",
    company: "AI Solutions",
    time: "Yesterday at 11:20 AM",
    avatar: "JR",
  },
  {
    id: 5,
    type: "note",
    icon: FileText,
    title: "Note added for Lisa Anderson",
    description: "Decision maker confirmed. Budget approved for Q2.",
    contact: "Lisa Anderson",
    company: "SaaS Co",
    time: "2 days ago",
    avatar: "LA",
  },
  {
    id: 6,
    type: "email",
    icon: Mail,
    title: "Follow-up email to David Kim",
    description: "Sent technical documentation and integration guides",
    contact: "David Kim",
    company: "TechCorp",
    time: "3 days ago",
    avatar: "DK",
  },
];

const activityTypeColors: Record<string, string> = {
  email: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  call: "bg-green-500/10 text-green-600 dark:text-green-400",
  message: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  meeting: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  note: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

export default function Activities() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Activities</h1>
          <p className="text-muted-foreground">Track all interactions and communications</p>
        </div>
        <Button data-testid="button-add-activity">
          <FileText className="h-4 w-4 mr-2" />
          Add Activity
        </Button>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <Card key={activity.id} className="hover-elevate" data-testid={`activity-item-${activity.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`h-10 w-10 rounded-md flex items-center justify-center ${activityTypeColors[activity.type]}`}>
                  <activity.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium mb-1">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">{activity.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{activity.contact}</span>
                      <span className="text-sm text-muted-foreground">·</span>
                      <span className="text-sm text-muted-foreground">{activity.company}</span>
                    </div>
                    <Badge variant="secondary" className="ml-auto text-xs capitalize">
                      {activity.type}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
