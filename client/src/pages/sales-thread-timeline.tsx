import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Mail,
  Sparkles,
  Clock,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Zap,
  MessageSquare,
  Brain,
  Target,
  User,
  Building2,
  Loader2,
  Reply,
  Wand2,
  Send,
} from "lucide-react";
import type { EmailThread, SalesThreadActivity } from "@shared/schema";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ThreadTimelineData {
  emails: EmailThread[];
  activities: SalesThreadActivity[];
  threadId: string;
}

interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}

export default function SalesThreadTimeline() {
  const { threadId } = useParams<{ threadId: string }>();
  const [, navigate] = useLocation();

  const [composeOpen, setComposeOpen] = useState(false);
  const [emailTone, setEmailTone] = useState<'professional' | 'friendly' | 'persuasive'>('professional');
  const [emailDraft, setEmailDraft] = useState<EmailDraft>({
    to: "",
    subject: "",
    body: "",
  });
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);


  const { data, isLoading, refetch } = useQuery<ThreadTimelineData>({
    queryKey: [`/api/sales-emails/thread/${threadId}`],
    enabled: !!threadId,
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: EmailDraft) => {
      const response = await fetch(`/api/sales-emails/thread/${threadId}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });
      if (!response.ok) {
        throw new Error("Failed to send email");
      }
      return response.json();
    },
    onMutate: () => {
      setSendingEmail(true);
    },
    onSuccess: () => {
      setSendingEmail(false);
      setComposeOpen(false);
      toast.success("Email sent successfully!");
      refetch(); // Refresh the thread timeline to show the sent email
    },
    onError: (error) => {
      setSendingEmail(false);
      toast.error(error.message);
    },
  });

  const generateEmailMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await fetch(`/api/ai/generate-email?threadId=${threadId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, tone: emailTone }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate email");
      }
      return response.json();
    },
    onMutate: () => {
      setGeneratingEmail(true);
    },
    onSuccess: (data) => {
      setGeneratingEmail(false);
      setEmailDraft((prev) => ({ ...prev, body: data.generatedText }));
    },
    onError: (error) => {
      setGeneratingEmail(false);
      toast.error(error.message);
    },
  });

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive":
        return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case "negative":
        return <ThumbsDown className="w-4 h-4 text-red-500" />;
      case "urgent":
        return <Zap className="w-4 h-4 text-orange-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStageColor = (stage: string | null) => {
    switch (stage) {
      case "prospect":
        return "bg-gray-100 text-gray-800";
      case "contacted":
        return "bg-blue-100 text-blue-800";
      case "qualified":
        return "bg-indigo-100 text-indigo-800";
      case "demo":
        return "bg-purple-100 text-purple-800";
      case "proposal":
        return "bg-pink-100 text-pink-800";
      case "negotiation":
        return "bg-orange-100 text-orange-800";
      case "closed_won":
        return "bg-green-100 text-green-800";
      case "closed_lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "ai_analysis":
        return <Brain className="w-4 h-4 text-purple-500" />;
      case "email_received":
        return <Mail className="w-4 h-4 text-blue-500" />;
      case "email_sent":
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case "lead_created":
        return <Target className="w-4 h-4 text-orange-500" />;
      case "contact_created":
        return <User className="w-4 h-4 text-indigo-500" />;
      case "company_created":
        return <Building2 className="w-4 h-4 text-pink-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-primary" />;
    }
  };

  const handleGenerateReply = async () => {
    if (!latestEmail) return;

    setGeneratingEmail(true);
    try {
      const response = await fetch("/api/emails/generate-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          emailId: latestEmail.id,
          tone: emailTone 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate email");
      }

      const data = await response.json();
      setEmailDraft((prev) => ({ ...prev, body: data.reply }));
      toast.success("Email generated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate email");
    } finally {
      setGeneratingEmail(false);
    }
  };

  const handleSendEmail = () => {
    if (emailDraft.to && emailDraft.subject && emailDraft.body) {
      sendEmailMutation.mutate(emailDraft);
    } else {
      toast.error("Please fill in all fields.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || !data.emails || data.emails.length === 0) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/smart-inbox")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inbox
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Mail className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Thread not found</h3>
            <p className="text-muted-foreground text-center">
              This email thread could not be found or has no messages.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allTimelineItems = [
    ...data.emails.map((email) => ({
      type: "email" as const,
      id: email.id,
      date: new Date(email.receivedAt),
      data: email,
    })),
    ...data.activities.map((activity) => ({
      type: "activity" as const,
      id: activity.id,
      date: new Date(activity.createdAt!),
      data: activity,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const latestEmail = data.emails[data.emails.length - 1];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/smart-inbox")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Inbox
        </Button>
        <Button onClick={() => {
          if (latestEmail) {
            setEmailDraft({
              to: latestEmail.fromEmail,
              subject: `Re: ${latestEmail.subject}`,
              body: "",
            });
            setComposeOpen(true);
          }
        }} data-testid="button-reply">
          <Reply className="w-4 h-4 mr-2" />
          Reply
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Thread Timeline
                </CardTitle>
                <Badge variant="secondary">
                  {data?.emails.length || 0} emails
                </Badge>
              </div>
              {latestEmail && (
                <p className="text-sm text-muted-foreground">
                  {latestEmail.subject}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                  <div className="space-y-6">
                    {allTimelineItems.map((item) => (
                      <div key={item.id} className="relative pl-10">
                        <div className="absolute left-2 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                          {item.type === "email" ? (
                            <Mail className="w-2 h-2 text-primary" />
                          ) : (
                            getActivityIcon(
                              (item.data as SalesThreadActivity).activityType
                            )
                          )}
                        </div>

                        {item.type === "email" ? (
                          <Card className="shadow-sm">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold">
                                    {(item.data as EmailThread).fromName ||
                                      (item.data as EmailThread).fromEmail}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {(item.data as EmailThread).fromEmail}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getSentimentIcon(
                                    (item.data as EmailThread).aiSentiment
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3 inline-block mr-1" />
                                    {item.date.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm font-medium mb-2">
                                {(item.data as EmailThread).subject}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {(item.data as EmailThread).aiSummary ||
                                  (item.data as EmailThread).snippet}
                              </p>
                              {(item.data as EmailThread).nextAction && (
                                <div className="mt-3 p-2 bg-muted rounded-md flex items-start gap-2">
                                  <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">
                                    {(item.data as EmailThread).nextAction}
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ) : (
                          <Card className="shadow-sm bg-muted/30">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                {getActivityIcon(
                                  (item.data as SalesThreadActivity).activityType
                                )}
                                <span className="font-medium text-sm">
                                  {(item.data as SalesThreadActivity).title}
                                </span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {item.date.toLocaleString()}
                                </span>
                              </div>
                              {(item.data as SalesThreadActivity).description && (
                                <p className="text-sm text-muted-foreground mt-1 pl-6">
                                  {(item.data as SalesThreadActivity).description}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {latestEmail && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Sales Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Priority Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${(latestEmail.priorityScore || 0) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round((latestEmail.priorityScore || 0) * 100)}%
                    </span>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">Lead Stage</p>
                  {latestEmail.leadStage ? (
                    <Badge className={getStageColor(latestEmail.leadStage)}>
                      {latestEmail.leadStage}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Not classified
                    </span>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">Sentiment</p>
                  <div className="flex items-center gap-2">
                    {getSentimentIcon(latestEmail.aiSentiment)}
                    <span className="text-sm capitalize">
                      {latestEmail.aiSentiment || "Unknown"}
                    </span>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-2">Intent</p>
                  <Badge variant="outline">
                    {latestEmail.aiIntent || "Unknown"}
                  </Badge>
                </div>

                {latestEmail.tags && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {JSON.parse(latestEmail.tags).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {latestEmail?.aiSummary ||
                  "No AI summary available for this thread."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Email Compose/Reply Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="w-5 h-5" />
              Reply to Email Thread
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-to">To</Label>
              <Input
                id="email-to"
                value={emailDraft.to}
                onChange={(e) => setEmailDraft({ ...emailDraft, to: e.target.value })}
                placeholder="recipient@example.com"
                data-testid="input-email-to"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailDraft.subject}
                onChange={(e) => setEmailDraft({ ...emailDraft, subject: e.target.value })}
                placeholder="Email subject"
                data-testid="input-email-subject"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-tone">Tone</Label>
              <Select value={emailTone} onValueChange={(value) => setEmailTone(value as 'professional' | 'friendly' | 'persuasive')}>
                <SelectTrigger id="email-tone" data-testid="select-email-tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="persuasive">Persuasive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-body">Message</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleGenerateReply}
                  disabled={generatingEmail || !latestEmail}
                  data-testid="button-generate-reply"
                >
                  {generatingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="email-body"
                value={emailDraft.body}
                onChange={(e) => setEmailDraft({ ...emailDraft, body: e.target.value })}
                placeholder="Write your message here..."
                rows={10}
                data-testid="textarea-email-body"
              />
            </div>
            {latestEmail?.nextAction && (
              <div className="p-3 bg-muted rounded-md flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Suggested Action</p>
                  <p className="text-sm text-muted-foreground">{latestEmail.nextAction}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={sendingEmail || !emailDraft.to || !emailDraft.subject || !emailDraft.body}
              data-testid="button-send-email"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}