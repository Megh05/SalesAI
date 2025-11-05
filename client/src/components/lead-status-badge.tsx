import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

type LeadStatus = "prospect" | "contacted" | "in_discussion" | "negotiation" | "closed_won" | "closed_lost";

interface LeadStatusBadgeProps {
  status: LeadStatus | string;
}

const statusConfig: Record<LeadStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  prospect: { label: "Prospect", variant: "secondary" },
  contacted: { label: "Contacted", variant: "outline" },
  in_discussion: { label: "In Discussion", variant: "default" },
  negotiation: { label: "Negotiation", variant: "default" },
  closed_won: { label: "Closed Won", variant: "default" },
  closed_lost: { label: "Closed Lost", variant: "secondary" },
};

const aiClassificationConfig: Record<string, { variant: "default" | "secondary" | "outline" }> = {
  "Lead Inquiry": { variant: "default" },
  "Follow-up": { variant: "outline" },
  "Negotiation": { variant: "default" },
  "Meeting Request": { variant: "outline" },
  "Question": { variant: "secondary" },
  "Closed": { variant: "default" },
};

const statusStyles = {
  new: "bg-blue-500 text-white",
  contacted: "bg-purple-500 text-white",
  qualified: "bg-green-500 text-white",
  proposal: "bg-yellow-500 text-white",
  negotiation: "bg-green-500 text-white",
  closed_won: "bg-emerald-500 text-white",
  closed_lost: "bg-red-500 text-white",
};

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const lowerStatus = status.toLowerCase().replace(/\s+/g, '_') as LeadStatus;

  if (statusConfig[lowerStatus]) {
    const config = statusConfig[lowerStatus];
    return (
      <Badge variant={config.variant} data-testid={`badge-status-${lowerStatus}`} className={cn("text-xs font-medium px-3 py-1 rounded-full border-0", statusStyles[lowerStatus])}>
        {config.label}
      </Badge>
    );
  }

  const aiConfig = aiClassificationConfig[status] || { variant: "outline" as const };
  return (
    <Badge variant={aiConfig.variant} className="gap-1" data-testid={`badge-ai-${status}`}>
      <Sparkles className="h-3 w-3" />
      {status}
    </Badge>
  );
}