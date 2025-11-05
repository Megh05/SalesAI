import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Mail, 
  Sparkles, 
  TrendingUp, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  UserPlus,
  Building,
  Check
} from "lucide-react";
import type { EmailThread } from "@shared/schema";
import { AIConfidenceBadge } from "@/components/ai-confidence-badge";
import { LeadStatusBadge } from "@/components/lead-status-badge";

interface LeadAnalysis {
  contact: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
  };
  company?: {
    name: string;
    industry?: string;
    size?: string;
    location?: string;
  };
  lead: {
    status: string;
    value?: string;
    source: string;
  };
  isPotentialLead: boolean;
  confidence: number;
  reasoning: string;
}

export default function SmartInbox() {
  const { toast } = useToast();
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [processingEmails, setProcessingEmails] = useState<Set<string>>(new Set());
  const [leadAnalysis, setLeadAnalysis] = useState<Record<string, LeadAnalysis>>({});
  const [creatingLead, setCreatingLead] = useState<string | null>(null);

  const { data: emails, isLoading } = useQuery<EmailThread[]>({
    queryKey: ["/api/emails"],
  });

  const seedEmails = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/dev/seed-emails");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      toast({
        title: "Sample emails created",
        description: "5 sample emails have been added to your inbox.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create sample emails",
        variant: "destructive",
      });
    },
  });

  const classifyEmail = async (emailId: string) => {
    setProcessingEmails(prev => new Set(prev).add(emailId));
    try {
      const res = await apiRequest("POST", `/api/emails/${emailId}/classify`);
      const data = await res.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      
      toast({
        title: "Email Classified",
        description: `Classified as: ${data.classification} (${data.confidence}% confidence)`,
      });
    } catch (error: any) {
      toast({
        title: "Classification Failed",
        description: error.message || "Failed to classify email. Make sure your API key is configured.",
        variant: "destructive",
      });
    } finally {
      setProcessingEmails(prev => {
        const next = new Set(prev);
        next.delete(emailId);
        return next;
      });
    }
  };

  const summarizeEmail = async (emailId: string) => {
    setProcessingEmails(prev => new Set(prev).add(emailId));
    try {
      const res = await apiRequest("POST", `/api/emails/${emailId}/summarize`);
      await res.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      
      toast({
        title: "Email Summarized",
        description: "AI summary has been generated for this email.",
      });
    } catch (error: any) {
      toast({
        title: "Summarization Failed",
        description: error.message || "Failed to summarize email. Make sure your API key is configured.",
        variant: "destructive",
      });
    } finally {
      setProcessingEmails(prev => {
        const next = new Set(prev);
        next.delete(emailId);
        return next;
      });
    }
  };

  const analyzeForLead = async (emailId: string) => {
    setProcessingEmails(prev => new Set(prev).add(emailId));
    try {
      const res = await apiRequest("POST", `/api/emails/${emailId}/analyze-lead`);
      const data = await res.json();
      
      setLeadAnalysis(prev => ({ ...prev, [emailId]: data }));
      
      toast({
        title: data.isPotentialLead ? "Potential Lead Detected!" : "Analysis Complete",
        description: data.reasoning,
      });
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze email. Make sure your API key is configured.",
        variant: "destructive",
      });
    } finally {
      setProcessingEmails(prev => {
        const next = new Set(prev);
        next.delete(emailId);
        return next;
      });
    }
  };

  const createLeadFromEmail = async (emailId: string) => {
    setCreatingLead(emailId);
    try {
      const res = await apiRequest("POST", `/api/emails/${emailId}/create-lead`);
      const data = await res.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      
      toast({
        title: "Success!",
        description: data.message || "Lead created successfully with contact and company information.",
      });
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create lead from email.",
        variant: "destructive",
      });
    } finally {
      setCreatingLead(null);
    }
  };

  const selectedEmailData = emails?.find(e => e.id === selectedEmail);
  const currentAnalysis = selectedEmail ? leadAnalysis[selectedEmail] : null;
  const hasEmails = emails && emails.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-inbox-title">Smart Inbox</h1>
          <p className="text-muted-foreground">AI-powered email classification and insights</p>
        </div>
        {!hasEmails && (
          <Button 
            onClick={() => seedEmails.mutate()}
            disabled={seedEmails.isPending}
            data-testid="button-seed-emails"
          >
            {seedEmails.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Create Sample Emails
              </>
            )}
          </Button>
        )}
      </div>

      {!hasEmails ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Mail className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No emails yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create sample emails to test the AI-powered inbox features
            </p>
            <Button 
              onClick={() => seedEmails.mutate()}
              disabled={seedEmails.isPending}
              data-testid="button-seed-emails-empty"
            >
              {seedEmails.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Create Sample Emails
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List - Scrollable */}
          <div className="lg:col-span-1 space-y-2 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:pr-2">
            {emails.map((email) => (
              <Card
                key={email.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedEmail === email.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedEmail(email.id)}
                data-testid={`email-item-${email.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{email.fromName || 'Unknown Sender'}</h4>
                      <p className="text-xs text-muted-foreground truncate">{email.fromEmail}</p>
                    </div>
                    <Badge variant="default" className="ml-2">New</Badge>
                  </div>
                  <p className="text-sm font-medium mb-1 truncate">{email.subject}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{email.snippet}</p>
                  
                  {email.aiClassification && (
                    <div className="flex items-center gap-2 mt-3">
                      <LeadStatusBadge status={email.aiClassification} />
                      {email.aiConfidence && (
                        <AIConfidenceBadge confidence={email.aiConfidence} />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Email Detail - Sticky */}
          <div className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
            {selectedEmailData ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{selectedEmailData.subject}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        From: {selectedEmailData.fromName || 'Unknown'} ({selectedEmailData.fromEmail})
                      </p>
                      {selectedEmailData.toEmail && (
                        <p className="text-sm text-muted-foreground">
                          To: {selectedEmailData.toEmail}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm whitespace-pre-wrap">{selectedEmailData.snippet}</p>
                  </div>

                  <Separator />

                  {/* AI Insights */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      AI Insights
                    </h3>

                    {selectedEmailData.aiSummary ? (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm font-medium mb-1">Summary:</p>
                        <p className="text-sm">{selectedEmailData.aiSummary}</p>
                      </div>
                    ) : (
                      <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">No AI summary yet</p>
                        <Button
                          size="sm"
                          onClick={() => summarizeEmail(selectedEmailData.id)}
                          disabled={processingEmails.has(selectedEmailData.id)}
                          data-testid="button-summarize"
                        >
                          {processingEmails.has(selectedEmailData.id) ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Summarizing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate Summary
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {selectedEmailData.aiClassification ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <LeadStatusBadge status={selectedEmailData.aiClassification} />
                          {selectedEmailData.aiConfidence && (
                            <AIConfidenceBadge confidence={selectedEmailData.aiConfidence} />
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => classifyEmail(selectedEmailData.id)}
                            disabled={processingEmails.has(selectedEmailData.id)}
                            data-testid="button-reclassify"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">No classification yet</p>
                        <Button
                          size="sm"
                          onClick={() => classifyEmail(selectedEmailData.id)}
                          disabled={processingEmails.has(selectedEmailData.id)}
                          data-testid="button-classify"
                        >
                          {processingEmails.has(selectedEmailData.id) ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Classifying...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Classify Email
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* AI Lead Analysis */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-primary" />
                      AI Lead Analysis
                    </h3>

                    {currentAnalysis ? (
                      <div className="space-y-3">
                        {currentAnalysis.isPotentialLead ? (
                          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-start gap-2 mb-2">
                              <Check className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                                  Potential Lead Detected ({currentAnalysis.confidence}% confidence)
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                  {currentAnalysis.reasoning}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm font-medium mb-1">Analysis Result:</p>
                            <p className="text-sm text-muted-foreground">{currentAnalysis.reasoning}</p>
                          </div>
                        )}

                        {/* Extracted Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-1">
                              <UserPlus className="w-3 h-3" />
                              Contact Info
                            </p>
                            <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                              <p><span className="font-medium">Name:</span> {currentAnalysis.contact.name}</p>
                              <p><span className="font-medium">Email:</span> {currentAnalysis.contact.email}</p>
                              {currentAnalysis.contact.phone && (
                                <p><span className="font-medium">Phone:</span> {currentAnalysis.contact.phone}</p>
                              )}
                              {currentAnalysis.contact.role && (
                                <p><span className="font-medium">Role:</span> {currentAnalysis.contact.role}</p>
                              )}
                            </div>
                          </div>

                          {currentAnalysis.company && (
                            <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
                              <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                Company Info
                              </p>
                              <div className="space-y-1 text-xs text-purple-700 dark:text-purple-300">
                                <p><span className="font-medium">Name:</span> {currentAnalysis.company.name}</p>
                                {currentAnalysis.company.industry && (
                                  <p><span className="font-medium">Industry:</span> {currentAnalysis.company.industry}</p>
                                )}
                                {currentAnalysis.company.size && (
                                  <p><span className="font-medium">Size:</span> {currentAnalysis.company.size}</p>
                                )}
                                {currentAnalysis.company.location && (
                                  <p><span className="font-medium">Location:</span> {currentAnalysis.company.location}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {currentAnalysis.isPotentialLead && (
                          <Button
                            onClick={() => createLeadFromEmail(selectedEmailData.id)}
                            disabled={creatingLead === selectedEmailData.id}
                            className="w-full"
                            data-testid="button-create-lead"
                          >
                            {creatingLead === selectedEmailData.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating Lead...
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Create Lead with Contact & Company
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Analyze this email to detect potential leads</p>
                        <Button
                          size="sm"
                          onClick={() => analyzeForLead(selectedEmailData.id)}
                          disabled={processingEmails.has(selectedEmailData.id)}
                          data-testid="button-analyze-lead"
                        >
                          {processingEmails.has(selectedEmailData.id) ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Analyze for Lead
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button variant="default" data-testid="button-reply">
                      Reply
                    </Button>
                    <Button variant="outline" data-testid="button-forward">
                      Forward
                    </Button>
                    <Button variant="ghost" data-testid="button-archive">
                      Archive
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select an email to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
