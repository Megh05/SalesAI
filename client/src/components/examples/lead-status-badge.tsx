import { LeadStatusBadge } from "../lead-status-badge";

export default function LeadStatusBadgeExample() {
  return (
    <div className="p-8 flex flex-wrap gap-2">
      <LeadStatusBadge status="prospect" />
      <LeadStatusBadge status="contacted" />
      <LeadStatusBadge status="in_discussion" />
      <LeadStatusBadge status="negotiation" />
      <LeadStatusBadge status="closed_won" />
      <LeadStatusBadge status="closed_lost" />
    </div>
  );
}
