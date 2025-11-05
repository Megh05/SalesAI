import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Zap, Mail, UserPlus, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { UserSettings } from "@shared/schema";
import { Link } from "wouter";

const workflowEvents = [
  {
    id: "lead.created",
    name: "New Lead Created",
    description: "Triggered when a new lead is created in the system",
    icon: UserPlus,
    sampleData: {
      leadId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Partnership Opportunity",
      status: "prospect",
      contactEmail: "john@example.com",
      contactName: "John Smith",
      companyName: "TechCorp Inc"
    }
  },
  {
    id: "email.classified",
    name: "Email Classified",
    description: "Triggered when an email is classified by AI",
    icon: Mail,
    sampleData: {
      emailId: "550e8400-e29b-41d4-a716-446655440001",
      subject: "Partnership Opportunity",
      fromEmail: "john@example.com",
      classification: "opportunity",
      confidence: 85,
      summary: "Partnership inquiry from TechCorp",
      nextAction: "Schedule discovery call"
    }
  },
  {
    id: "lead.statusChanged",
    name: "Lead Status Changed",
    description: "Triggered when a lead's status is updated",
    icon: CheckCircle2,
    sampleData: {
      leadId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Partnership Opportunity",
      previousStatus: "prospect",
      newStatus: "qualified",
      contactEmail: "john@example.com"
    }
  }
];

export default function Workflows() {
  const { toast } = useToast();
  const [triggeringEvent, setTriggeringEvent] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
  });

  const triggerWorkflow = useMutation({
    mutationFn: async ({ event, data }: { event: string; data: any }) => {
      const res = await apiRequest("POST", "/api/n8n/trigger", { event, data });
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Workflow Triggered",
        description: `Successfully triggered ${variables.event} workflow`,
      });
      setTriggeringEvent(null);
    },
    onError: (error: any, variables) => {
      toast({
        title: "Workflow Trigger Failed",
        description: error.message || `Failed to trigger ${variables.event} workflow`,
        variant: "destructive",
      });
      setTriggeringEvent(null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isN8nConnected = settings?.n8nConnected;

  return (
    <div className="p-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-workflows-title">Workflows</h1>
          <p className="text-muted-foreground">Manage and trigger n8n workflow automations</p>
        </div>
        <Badge variant={isN8nConnected ? "default" : "secondary"} className={isN8nConnected ? "bg-green-500" : ""} data-testid="badge-n8n-connection-status">
          {isN8nConnected ? (
            <>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              n8n Connected
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" />
              n8n Not Connected
            </>
          )}
        </Badge>
      </div>

      {!isN8nConnected && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <CardTitle className="text-amber-900 dark:text-amber-100">n8n Not Connected</CardTitle>
                <CardDescription className="text-amber-800 dark:text-amber-200">
                  Connect your n8n instance in Settings to enable workflow automation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/settings">
              <Button variant="default" data-testid="button-go-to-settings">
                Go to Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workflowEvents.map((event) => {
          const Icon = event.icon;
          const isTriggering = triggeringEvent === event.id;

          return (
            <Card key={event.id} data-testid={`card-workflow-${event.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                      <CardDescription className="mt-1">{event.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Event Type:</p>
                  <code className="block p-2 rounded bg-muted text-xs" data-testid={`text-event-type-${event.id}`}>
                    {event.id}
                  </code>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Sample Payload:</p>
                  <pre className="p-2 rounded bg-muted text-xs overflow-auto max-h-40" data-testid={`text-sample-payload-${event.id}`}>
                    {JSON.stringify(event.sampleData, null, 2)}
                  </pre>
                </div>

                <Button
                  onClick={() => {
                    setTriggeringEvent(event.id);
                    triggerWorkflow.mutate({
                      event: event.id,
                      data: event.sampleData
                    });
                  }}
                  disabled={!isN8nConnected || isTriggering}
                  className="w-full"
                  data-testid={`button-trigger-${event.id}`}
                >
                  {isTriggering ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Triggering...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Test Trigger
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How to Use Workflows</CardTitle>
          <CardDescription>Set up automated workflows with n8n</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Create a Webhook Workflow in n8n</p>
                <p className="text-sm text-muted-foreground">
                  In your n8n instance, create a new workflow starting with a Webhook trigger node
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Copy the Webhook URL</p>
                <p className="text-sm text-muted-foreground">
                  Get the webhook URL from your n8n workflow and paste it in Settings
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Configure Your Workflow</p>
                <p className="text-sm text-muted-foreground">
                  Use the event types and payload structures shown above to build your automation logic
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <p className="font-medium">Test Your Workflow</p>
                <p className="text-sm text-muted-foreground">
                  Use the "Test Trigger" buttons above to send sample data and verify your workflow
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
