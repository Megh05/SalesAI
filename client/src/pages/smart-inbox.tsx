import { useState } from "react";
import { Mail, Sparkles, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIConfidenceBadge } from "@/components/ai-confidence-badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

//todo: remove mock functionality
const emailThreads = [
  {
    id: 1,
    sender: "Sarah Johnson",
    email: "sarah@techcorp.com",
    subject: "Re: Product Demo Request",
    preview: "Thanks for reaching out! I'd love to see a demo of your platform...",
    aiSummary: "Lead is interested in scheduling a product demo. High intent to purchase. Mentioned budget of $50k.",
    aiClassification: "Lead Inquiry",
    confidence: 92,
    nextAction: "Schedule demo call this week",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    sender: "Michael Chen",
    email: "m.chen@dataflow.io",
    subject: "Follow-up on Proposal",
    preview: "I've reviewed the proposal with our team and we have some questions...",
    aiSummary: "Prospect reviewing proposal with decision makers. Requesting clarification on pricing tiers and implementation timeline.",
    aiClassification: "Negotiation",
    confidence: 88,
    nextAction: "Prepare detailed pricing breakdown",
    time: "5 hours ago",
    unread: true,
  },
  {
    id: 3,
    sender: "Emma Wilson",
    email: "emma.w@cloudsys.com",
    subject: "Initial Inquiry",
    preview: "Hi, I came across your platform and would like to learn more...",
    aiSummary: "New lead from website contact form. Looking for sales automation solution for 50+ person team.",
    aiClassification: "Lead Inquiry",
    confidence: 85,
    nextAction: "Send introductory email with case studies",
    time: "Yesterday",
    unread: false,
  },
  {
    id: 4,
    sender: "James Rodriguez",
    email: "james@aisolutions.ai",
    subject: "Re: Contract Review",
    preview: "We're ready to move forward. Just need a few minor adjustments...",
    aiSummary: "Deal in final stages. Client requesting minor contract modifications. High probability of closing this week.",
    aiClassification: "Closed",
    confidence: 95,
    nextAction: "Update contract and send for signature",
    time: "2 days ago",
    unread: false,
  },
];

export default function SmartInbox() {
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Smart Inbox</h1>
          <p className="text-muted-foreground">AI-powered email classification and insights</p>
        </div>
        <Button data-testid="button-sync-emails">
          <Mail className="h-4 w-4 mr-2" />
          Sync Emails
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search emails..."
          className="max-w-md"
          data-testid="input-search-emails"
        />
      </div>

      <div className="space-y-3">
        {emailThreads.map((thread) => (
          <Card
            key={thread.id}
            className={`hover-elevate cursor-pointer transition-all ${
              selectedEmail === thread.id ? "ring-2 ring-primary" : ""
            } ${thread.unread ? "border-l-4 border-l-primary" : ""}`}
            onClick={() => setSelectedEmail(selectedEmail === thread.id ? null : thread.id)}
            data-testid={`email-thread-${thread.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-primary">
                    {thread.sender.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-medium truncate ${thread.unread ? "font-semibold" : ""}`}>
                          {thread.sender}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {thread.email}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${thread.unread ? "font-medium" : "text-muted-foreground"}`}>
                        {thread.subject}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {thread.time}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {thread.preview}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      {thread.aiClassification}
                    </Badge>
                    <AIConfidenceBadge confidence={thread.confidence} />
                  </div>

                  {selectedEmail === thread.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="bg-muted/50 rounded-md p-3 border-l-4 border-l-primary">
                        <div className="flex items-start gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                          <p className="text-xs font-medium text-primary">AI Summary</p>
                        </div>
                        <p className="text-sm leading-relaxed">{thread.aiSummary}</p>
                      </div>
                      <div className="flex items-start gap-2 bg-accent/50 rounded-md p-3">
                        <ArrowRight className="h-4 w-4 text-accent-foreground mt-0.5" />
                        <div>
                          <p className="text-xs font-medium mb-1">Suggested Next Action</p>
                          <p className="text-sm">{thread.nextAction}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" data-testid={`button-reply-${thread.id}`}>
                          Reply
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-create-lead-${thread.id}`}>
                          Create Lead
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
