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
  RefreshCw,
  Play,
  Calendar,
  UserPlus,
  X,
  CheckCircle2,
  Circle,
  ArrowRight,
  Trash2,
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
import { queryClient, apiRequest } from "@/lib/queryClient";

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

interface SuggestedAction {
  action: string;
  priority: number;
  reason: string;
}

const PIPELINE_STAGES = [
  { id: "inquiry", label: "Inquiry", color: "bg-gray-400" },
  { id: "qualified", label: "Qualified", color: "bg-blue-500" },
  { id: "demo", label: "Demo", color: "bg-purple-500" },
  { id: "proposal", label: "Proposal", color: "bg-pink-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-orange-500" },
  { id: "closed", label: "Closed", color: "bg-green-500" },
];

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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [viewingEmailId, setViewingEmailId] = useState<string | null>(null);
  const [dismissedActions, setDismissedActions] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = useQuery<ThreadTimelineData>({
    queryKey: [`/api/sales-emails/thread/${threadId}`],
    enabled: !!threadId,
  });

  const deleteThread = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/emails/thread/${threadId}`);
      if (!res.ok) throw new Error("Failed to delete thread");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Thread deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["/api/sales-emails"] });
      navigate("/smart-inbox");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete thread");
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: EmailDraft) => {
      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.body,
          replyToThreadId: threadId,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send email");
      }
      return response.json();
    },
    onMutate: () => setSendingEmail(true),
    onSuccess: async () => {
      setSendingEmail(false);
      setComposeOpen(false);
      setEmailDraft({ to: "", subject: "", body: "" });
      toast.success("Email sent successfully!");
      await refetch();
    },
    onError: (error) => {
      setSendingEmail(false);
      toast.error(error.message);
    },
  });

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive": return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case "negative": return <ThumbsDown className="w-4 h-4 text-red-500" />;
      case "urgent": return <Zap className="w-4 h-4 text-orange-500" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStageColor = (stage: string | null) => {
    switch (stage) {
      case "prospect": return "bg-gray-100 text-gray-800";
      case "contacted": return "bg-blue-100 text-blue-800";
      case "qualified": return "bg-indigo-100 text-indigo-800";
      case "demo": return "bg-purple-100 text-purple-800";
      case "proposal": return "bg-pink-100 text-pink-800";
      case "negotiation": return "bg-orange-100 text-orange-800";
      case "closed_won": return "bg-green-100 text-green-800";
      case "closed_lost": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "ai_analysis": return <Brain className="w-4 h-4 text-purple-500" />;
      case "email_received": return <Mail className="w-4 h-4 text-blue-500" />;
      case "email_sent": return <MessageSquare className="w-4 h-4 text-green-500" />;
      case "lead_created": return <Target className="w-4 h-4 text-orange-500" />;
      case "contact_created": return <User className="w-4 h-4 text-indigo-500" />;
      case "company_created": return <Building2 className="w-4 h-4 text-pink-500" />;
      default: return <Sparkles className="w-4 h-4 text-primary" />;
    }
  };

  const getCurrentPipelineStage = (leadStage: string | null): number => {
    const stageMap: Record<string, number> = {
      "prospect": 0, "contacted": 0, "inquiry": 0,
      "qualified": 1,
      "demo": 2,
      "proposal": 3,
      "negotiation": 4,
      "closed_won": 5, "closed_lost": 5,
    };
    return stageMap[leadStage || "prospect"] || 0;
  };

  const getSuggestedActions = (email: EmailThread | undefined): SuggestedAction[] => {
    if (!email) return [];
    const actions: SuggestedAction[] = [];

    if (email.nextAction) {
      actions.push({
        action: email.nextAction,
        priority: 0.9,
        reason: "AI recommended based on email analysis",
      });
    }

    if (email.leadStage === "prospect" || email.leadStage === "contacted") {
      actions.push({
        action: "Schedule a discovery call",
        priority: 0.8,
        reason: "Move prospect to qualified stage",
      });
    }

    if (email.leadStage === "demo") {
      actions.push({
        action: "Send proposal document",
        priority: 0.85,
        reason: "Follow up after demo",
      });
    }

    if (email.aiSentiment === "positive") {
      actions.push({
        action: "Capitalize on positive sentiment - propose next steps",
        priority: 0.75,
        reason: "Positive engagement detected",
      });
    }

    return actions.filter(a => !dismissedActions.has(a.action));
  };

  const handleGenerateReply = async () => {
    if (!latestEmail) return;
    setGeneratingEmail(true);
    try {
      const response = await fetch("/api/emails/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId: latestEmail.id, tone: emailTone }),
      });
      if (!response.ok) throw new Error("Failed to generate email");
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

  const handleExecuteAction = async (action: SuggestedAction) => {
    if (!threadId) return;
    try {
      const res = await apiRequest("POST", `/api/smart-inbox/action/${threadId}`, {
        action: "create_task",
        payload: { title: action.action, description: action.reason, priority: action.priority },
      });
      if (!res.ok) throw new Error("Failed to execute action");
      toast.success("Task created successfully");
      await refetch();
      if (latestEmail) {
        setEmailDraft({
          to: latestEmail.fromEmail,
          subject: `Re: ${latestEmail.subject}`,
          body: `Regarding: ${action.action}\n\n`,
        });
        setComposeOpen(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to execute action");
    }
  };

  const handleScheduleAction = async (action: SuggestedAction) => {
    if (!threadId) return;
    try {
      const res = await apiRequest("POST", `/api/smart-inbox/action/${threadId}`, {
        action: "schedule_followup",
        payload: { title: action.action, note: action.reason, date: "in 2 days" },
      });
      if (!res.ok) throw new Error("Failed to schedule");
      toast.success("Follow-up scheduled");
      await refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to schedule");
    }
  };

  const handleDismissAction = (action: SuggestedAction) => {
    setDismissedActions(prev => new Set(prev).add(action.action));
    toast.info("Action dismissed");
  };

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
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
        <Button variant="ghost" size="sm" onClick={() => navigate("/smart-inbox")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Inbox
        </Button>
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
    ...data.emails.map((email) => ({ type: "email" as const, id: email.id, date: new Date(email.receivedAt), data: email })),
    ...data.activities.map((activity) => ({ type: "activity" as const, id: activity.id, date: new Date(activity.createdAt!), data: activity })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const latestEmail = data.emails[data.emails.length - 1];
  const suggestedActions = getSuggestedActions(latestEmail);
  const currentStageIndex = getCurrentPipelineStage(latestEmail?.leadStage);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate("/smart-inbox")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button onClick={() => {
          if (latestEmail) {
            setEmailDraft({ to: latestEmail.fromEmail, subject: `Re: ${latestEmail.subject}`, body: "" });
            setComposeOpen(true);
          }
        }}>
          <Reply className="w-4 h-4 mr-2" />
          Reply
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => deleteThread.mutate()}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Thread
        </Button>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Activity Pipeline</span>
            <Badge className={getStageColor(latestEmail?.leadStage)}>
              {latestEmail?.leadStage || "New"}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {PIPELINE_STAGES.map((stage, index) => (
              <div key={stage.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index <= currentStageIndex ? stage.color : "bg-gray-200"} ${index === currentStageIndex ? "ring-2 ring-offset-2 ring-primary" : ""}`}>
                    {index < currentStageIndex ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : index === currentStageIndex ? (
                      <Circle className="w-5 h-5 text-white fill-white" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 ${index <= currentStageIndex ? "font-medium" : "text-muted-foreground"}`}>
                    {stage.label}
                  </span>
                </div>
                {index < PIPELINE_STAGES.length - 1 && (
                  <ArrowRight className={`w-4 h-4 mx-1 ${index < currentStageIndex ? "text-primary" : "text-gray-300"}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Messages ({data.emails.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-3 space-y-2">
                  {data.emails.map((email, index) => (
                    <div
                      key={email.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-muted ${viewingEmailId === email.id ? "bg-primary/10 border border-primary" : "bg-muted/50"}`}
                      onClick={() => setViewingEmailId(email.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{email.fromName || email.fromEmail}</p>
                          <p className="text-xs text-muted-foreground truncate">{email.subject}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {getSentimentIcon(email.aiSentiment)}
                          <span className="text-xs text-muted-foreground">{new Date(email.receivedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[200px]">
                <div className="p-3 space-y-2">
                  {data.activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No activities yet</p>
                  ) : (
                    data.activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-2 p-2 rounded bg-muted/30">
                        {getActivityIcon(activity.activityType)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(activity.createdAt!).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[550px]">
                {viewingEmailId ? (
                  (() => {
                    const email = data.emails.find(e => e.id === viewingEmailId);
                    if (!email) return <p className="text-muted-foreground">Select an email to view</p>;
                    return (
                      <div className="space-y-4">
                        <div className="border-b pb-3">
                          <h3 className="font-semibold">{email.subject}</h3>
                          <p className="text-sm text-muted-foreground">From: {email.fromName || email.fromEmail} &lt;{email.fromEmail}&gt;</p>
                          <p className="text-sm text-muted-foreground">To: {email.toEmail}</p>
                          <p className="text-sm text-muted-foreground">{new Date(email.receivedAt).toLocaleString()}</p>
                        </div>
                        {email.aiSummary && (
                          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">AI Summary</span>
                            </div>
                            <p className="text-sm">{email.aiSummary}</p>
                          </div>
                        )}
                        <div className="prose prose-sm max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: email.bodyHtml || email.snippet || "" }} />
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Mail className="w-12 h-12 mb-2" />
                    <p>Select an email to view its content</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Sales Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium mb-1">Priority</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(latestEmail?.priorityScore || 0) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium">{Math.round((latestEmail?.priorityScore || 0) * 100)}%</span>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Stage</p>
                  <Badge className={`${getStageColor(latestEmail?.leadStage)} text-xs`}>{latestEmail?.leadStage || "New"}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sentiment</p>
                  <div className="flex items-center gap-1">
                    {getSentimentIcon(latestEmail?.aiSentiment)}
                    <span className="text-xs capitalize">{latestEmail?.aiSentiment || "Unknown"}</span>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Intent</p>
                <Badge variant="outline" className="text-xs">{latestEmail?.aiIntent || "Unknown"}</Badge>
              </div>
              {latestEmail?.tags && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {JSON.parse(latestEmail.tags).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Suggested Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedActions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No suggestions available</p>
              ) : (
                suggestedActions.map((action, index) => (
                  <div key={index} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium flex-1">{action.action}</p>
                      <Badge variant={action.priority >= 0.8 ? "default" : "secondary"} className="text-xs">
                        {Math.round(action.priority * 100)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{action.reason}</p>
                    <div className="flex gap-1 flex-wrap">
                      <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => handleExecuteAction(action)}>
                        <Play className="w-3 h-3 mr-1" />
                        Execute
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleScheduleAction(action)}>
                        <Calendar className="w-3 h-3 mr-1" />
                        Schedule
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleDismissAction(action)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Compose Reply
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <Input id="to" value={emailDraft.to} onChange={(e) => setEmailDraft({ ...emailDraft, to: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <Select value={emailTone} onValueChange={(v) => setEmailTone(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="persuasive">Persuasive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={emailDraft.subject} onChange={(e) => setEmailDraft({ ...emailDraft, subject: e.target.value })} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="body">Message</Label>
                <Button size="sm" variant="outline" onClick={handleGenerateReply} disabled={generatingEmail}>
                  {generatingEmail ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                  Generate with AI
                </Button>
              </div>
              <Textarea id="body" value={emailDraft.body} onChange={(e) => setEmailDraft({ ...emailDraft, body: e.target.value })} className="min-h-[200px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail}>
              {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
