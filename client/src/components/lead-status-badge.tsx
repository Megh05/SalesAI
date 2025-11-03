import { Badge } from "@/components/ui/badge";

type LeadStatus = "prospect" | "contacted" | "in_discussion" | "negotiation" | "closed_won" | "closed_lost";

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

const statusConfig: Record<LeadStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  prospect: { label: "Prospect", variant: "secondary" },
  contacted: { label: "Contacted", variant: "outline" },
  in_discussion: { label: "In Discussion", variant: "default" },
  negotiation: { label: "Negotiation", variant: "default" },
  closed_won: { label: "Closed Won", variant: "default" },
  closed_lost: { label: "Closed Lost", variant: "secondary" },
};

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
      {config.label}
    </Badge>
  );
}
