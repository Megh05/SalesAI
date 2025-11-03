import { AIConfidenceBadge } from "../ai-confidence-badge";

export default function AIConfidenceBadgeExample() {
  return (
    <div className="p-8 flex flex-wrap gap-2">
      <AIConfidenceBadge confidence={95} label="Lead Inquiry" />
      <AIConfidenceBadge confidence={72} label="Follow-up" />
      <AIConfidenceBadge confidence={45} label="Negotiation" />
    </div>
  );
}
