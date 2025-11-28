import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Mail,
  Sparkles,
  TrendingUp,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  Tag,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Target,
  RefreshCw,
} from "lucide-react";
import type { EmailThread } from "@shared/schema";

interface SalesEmailsListProps {
  onSelectEmail?: (email: EmailThread) => void;
}

export function SalesEmailsList({ onSelectEmail }: SalesEmailsListProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: salesEmails, isLoading } = useQuery<EmailThread[]>({
    queryKey: ["/api/sales-emails"],
  });

  const { data: tags } = useQuery<string[]>({
    queryKey: ["/api/sales-emails/tags"],
  });

  const analyzeSalesEmail = useMutation({
    mutationFn: async (emailId: string) => {
      const res = await apiRequest("POST", `/api/emails/${emailId}/analyze-sales`);
      if (!res.ok) throw new Error("Failed to analyze email");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-emails"] });
      toast({
        title: "Analysis Complete",
        description: "Email has been analyzed and categorized.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze email",
        variant: "destructive",
      });
    },
  });

  const filteredEmails = useMemo(() => {
    if (!salesEmails) return [];

    return salesEmails.filter((email) => {
      const matchesSearch =
        !searchQuery ||
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.fromEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.fromName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag =
        selectedTag === "all" ||
        (email.tags && JSON.parse(email.tags).includes(selectedTag));

      const matchesStage =
        selectedStage === "all" || email.leadStage === selectedStage;

      const matchesSentiment =
        selectedSentiment === "all" || email.aiSentiment === selectedSentiment;

      return matchesSearch && matchesTag && matchesStage && matchesSentiment;
    });
  }, [salesEmails, searchQuery, selectedTag, selectedStage, selectedSentiment]);

  const getPriorityColor = (score: number | null) => {
    if (score === null) return "bg-gray-200";
    if (score >= 0.8) return "bg-red-500";
    if (score >= 0.6) return "bg-orange-500";
    if (score >= 0.4) return "bg-yellow-500";
    return "bg-green-500";
  };

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

  const handleViewThread = (email: EmailThread) => {
    if (email.threadId) {
      navigate(`/smart-inbox/sales/${email.threadId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search business emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-[140px]">
              <Tag className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {tags?.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStage} onValueChange={setSelectedStage}>
            <SelectTrigger className="w-[150px]">
              <Target className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="demo">Demo</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="negotiation">Negotiation</SelectItem>
              <SelectItem value="closed_won">Closed Won</SelectItem>
              <SelectItem value="closed_lost">Closed Lost</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSentiment} onValueChange={setSelectedSentiment}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sentiment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sentiments</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredEmails.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Mail className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No business emails found</h3>
              <p className="text-muted-foreground text-center">
                {salesEmails?.length === 0
                  ? "No business-related emails yet. Emails classified as inquiry, follow-up, sales, negotiation, or meetings will appear here."
                  : "No emails match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredEmails.map((email) => {
              const emailTags = email.tags ? JSON.parse(email.tags) : [];

              return (
                <Card
                  key={email.id}
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => onSelectEmail?.(email)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Tooltip>
                            <TooltipTrigger>
                              <div
                                className={`w-3 h-3 rounded-full ${getPriorityColor(
                                  email.priorityScore
                                )}`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              Priority: {Math.round((email.priorityScore || 0) * 100)}%
                            </TooltipContent>
                          </Tooltip>
                          <h4 className="font-semibold truncate">
                            {email.fromName || email.fromEmail}
                          </h4>
                          {getSentimentIcon(email.aiSentiment)}
                        </div>
                        <p className="text-sm font-medium text-foreground truncate mb-1">
                          {email.subject}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {email.aiSummary || email.snippet}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {email.leadStage && (
                            <Badge className={getStageColor(email.leadStage)}>
                              {email.leadStage}
                            </Badge>
                          )}
                          {email.aiIntent && (
                            <Badge variant="outline" className="text-xs">
                              {email.aiIntent}
                            </Badge>
                          )}
                          {emailTags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {emailTags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{emailTags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          <Clock className="w-3 h-3 inline-block mr-1" />
                          {new Date(email.receivedAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProcessingId(email.id);
                                  analyzeSalesEmail.mutate(email.id, {
                                    onSettled: () => setProcessingId(null),
                                  });
                                }}
                                disabled={processingId === email.id}
                              >
                                {processingId === email.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Re-analyze with AI</TooltipContent>
                          </Tooltip>
                          {email.threadId && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewThread(email);
                                  }}
                                >
                                  <ArrowUpRight className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Thread Timeline</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>
                    {email.nextAction && (
                      <div className="mt-3 p-2 bg-muted rounded-md flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{email.nextAction}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
