import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Mail,
  Sparkles,
  Loader2,
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
  CheckSquare,
  UserPlus,
  Download,
  MailOpen,
  Building2,
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
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>("priority");

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

  const markAsRead = useMutation({
    mutationFn: async (emailIds: string[]) => {
      await Promise.all(
        emailIds.map((id) => apiRequest("POST", `/api/emails/${id}/read`))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-emails"] });
      setSelectedEmails(new Set());
      toast({ title: "Marked as read", description: `${selectedEmails.size} emails marked as read.` });
    },
  });

  const getCompanyDomain = (email: string) => {
    const match = email.match(/@([^.]+)/);
    return match ? match[1] : email.charAt(0);
  };

  const getAvatarColor = (email: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-red-500",
    ];
    const hash = email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const filteredAndSortedEmails = useMemo(() => {
    if (!salesEmails) return [];

    let filtered = salesEmails.filter((email) => {
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

    filtered.sort((a, b) => {
      if (sortBy === "priority") {
        const priorityDiff = (b.priorityScore || 0) - (a.priorityScore || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
      } else if (sortBy === "date") {
        return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
      } else if (sortBy === "sender") {
        return (a.fromName || a.fromEmail).localeCompare(b.fromName || b.fromEmail);
      }
      return 0;
    });

    return filtered;
  }, [salesEmails, searchQuery, selectedTag, selectedStage, selectedSentiment, sortBy]);

  const getPriorityColor = (score: number | null) => {
    if (score === null) return "bg-gray-200";
    if (score >= 0.8) return "bg-red-500";
    if (score >= 0.6) return "bg-orange-500";
    if (score >= 0.4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPriorityLabel = (score: number | null) => {
    if (score === null) return "Unknown";
    if (score >= 0.8) return "Urgent";
    if (score >= 0.6) return "High";
    if (score >= 0.4) return "Medium";
    return "Low";
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

  const toggleEmailSelection = (emailId: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(emailId)) {
        next.delete(emailId);
      } else {
        next.add(emailId);
      }
      return next;
    });
  };

  const selectAllEmails = () => {
    if (selectedEmails.size === filteredAndSortedEmails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredAndSortedEmails.map((e) => e.id)));
    }
  };

  const exportSelected = () => {
    const selected = filteredAndSortedEmails.filter((e) => selectedEmails.has(e.id));
    const csv = [
      ["Subject", "From", "Date", "Priority", "Stage", "Summary"].join(","),
      ...selected.map((e) =>
        [
          `"${e.subject.replace(/"/g, '""')}"`,
          e.fromEmail,
          new Date(e.receivedAt).toISOString(),
          e.priorityScore || 0,
          e.leadStage || "",
          `"${(e.aiSummary || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales-emails.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${selected.length} emails exported to CSV.` });
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
              placeholder="Search sales emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="sender">Sender</SelectItem>
            </SelectContent>
          </Select>

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

        {selectedEmails.size > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">{selectedEmails.size} selected</span>
            <div className="flex-1" />
            <Button size="sm" variant="outline" onClick={() => markAsRead.mutate(Array.from(selectedEmails))}>
              <MailOpen className="w-4 h-4 mr-2" />
              Mark Read
            </Button>
            <Button size="sm" variant="outline" onClick={exportSelected}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedEmails(new Set())}>
              Clear
            </Button>
          </div>
        )}

        {filteredAndSortedEmails.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Mail className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sales emails found</h3>
              <p className="text-muted-foreground text-center">
                {salesEmails?.length === 0
                  ? "No sales-related emails yet. Emails classified as sales inquiries, follow-ups, or negotiations will appear here."
                  : "No emails match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2">
              <Checkbox
                checked={selectedEmails.size === filteredAndSortedEmails.length && filteredAndSortedEmails.length > 0}
                onCheckedChange={selectAllEmails}
              />
              <span className="text-sm text-muted-foreground">
                {filteredAndSortedEmails.length} emails
              </span>
            </div>

            {filteredAndSortedEmails.map((email) => {
              const emailTags = email.tags ? JSON.parse(email.tags) : [];
              const domain = getCompanyDomain(email.fromEmail);
              const isSelected = selectedEmails.has(email.id);

              return (
                <Card
                  key={email.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
                  onClick={() => onSelectEmail?.(email)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleEmailSelection(email.id)}
                        />
                        <Avatar className={`h-10 w-10 ${getAvatarColor(email.fromEmail)}`}>
                          <AvatarFallback className="text-white text-sm font-medium">
                            {domain.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge
                                variant="outline"
                                className={`text-xs px-2 py-0.5 ${
                                  email.priorityScore && email.priorityScore >= 0.8
                                    ? "border-red-500 text-red-600 bg-red-50"
                                    : email.priorityScore && email.priorityScore >= 0.6
                                    ? "border-orange-500 text-orange-600 bg-orange-50"
                                    : email.priorityScore && email.priorityScore >= 0.4
                                    ? "border-yellow-500 text-yellow-600 bg-yellow-50"
                                    : "border-green-500 text-green-600 bg-green-50"
                                }`}
                              >
                                {getPriorityLabel(email.priorityScore)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              Priority Score: {Math.round((email.priorityScore || 0) * 100)}%
                            </TooltipContent>
                          </Tooltip>
                          <h4 className="font-semibold truncate flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-muted-foreground" />
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
