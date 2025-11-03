import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AIConfidenceBadgeProps {
  confidence: number;
  label?: string;
}

export function AIConfidenceBadge({ confidence, label }: AIConfidenceBadgeProps) {
  const getColor = (conf: number) => {
    if (conf >= 80) return "text-green-600 dark:text-green-400";
    if (conf >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  return (
    <Badge variant="outline" className="gap-1" data-testid="badge-ai-confidence">
      <Sparkles className="h-3 w-3" />
      <span className={getColor(confidence)}>{confidence}%</span>
      {label && <span className="text-muted-foreground">· {label}</span>}
    </Badge>
  );
}
