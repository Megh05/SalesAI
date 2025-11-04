import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import type { UserSettings } from "@shared/schema";

const settingsSchema = z.object({
  openrouterApiKey: z.string().optional(),
  aiModel: z.string().optional(),
  gmailClientId: z.string().optional(),
  gmailClientSecret: z.string().optional(),
  linkedinClientId: z.string().optional(),
  linkedinClientSecret: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGmailSecret, setShowGmailSecret] = useState(false);
  const [showLinkedInSecret, setShowLinkedInSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
  } | null>(null);

  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    values: {
      openrouterApiKey: settings?.openrouterApiKey || "",
      aiModel: settings?.aiModel || "mistralai/mistral-7b-instruct",
      gmailClientId: settings?.gmailClientId || "",
      gmailClientSecret: settings?.gmailClientSecret || "",
      linkedinClientId: settings?.linkedinClientId || "",
      linkedinClientSecret: settings?.linkedinClientSecret || "",
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const res = await apiRequest("PUT", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const testConnection = async () => {
    const apiKey = form.getValues("openrouterApiKey");

    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter an OpenRouter API key to test the connection.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setConnectionStatus(null);

    try {
      const res = await apiRequest("POST", "/api/settings/test-ai", { apiKey });
      const response = await res.json();

      setConnectionStatus({
        connected: response.connected,
        message: response.message,
      });

      if (response.connected) {
        toast({
          title: "Connection Successful",
          description: "Your OpenRouter API key is working correctly.",
        });
      }
    } catch (error: any) {
      setConnectionStatus({
        connected: false,
        message: error.message || "Connection failed",
      });
      toast({
        title: "Connection Failed",
        description: "Unable to connect to OpenRouter API. Please check your API key.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const onSubmit = (data: SettingsFormData) => {
    updateSettings.mutate(data);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gmailStatus = params.get("gmail");
    const linkedinStatus = params.get("linkedin");
    const reason = params.get("reason");

    const getErrorMessage = (service: string, reason: string | null) => {
      if (reason === "no_code") return `${service} authorization was cancelled or failed`;
      if (reason === "not_authenticated") return "Session expired. Please try connecting again";
      if (reason === "invalid_state") return "Security validation failed. Please try again";
      return `Failed to connect ${service}`;
    };

    if (gmailStatus === "connected") {
      toast({
        title: "Success",
        description: "Gmail connected successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      window.history.replaceState({}, "", "/settings");
    } else if (gmailStatus === "error") {
      toast({
        title: "Error",
        description: getErrorMessage("Gmail", reason),
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/settings");
    }

    if (linkedinStatus === "connected") {
      toast({
        title: "Success",
        description: "LinkedIn connected successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      window.history.replaceState({}, "", "/settings");
    } else if (linkedinStatus === "error") {
      toast({
        title: "Error",
        description: getErrorMessage("LinkedIn", reason),
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/settings");
    }
  }, [queryClient, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasApiKey = !!settings?.openrouterApiKey;

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-settings-title">Settings</h1>
        <p className="text-muted-foreground">Manage your account and integration settings</p>
      </div>

      {/* AI Integration Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Integration Status</CardTitle>
              <CardDescription>Current connection status to AI services</CardDescription>
            </div>
            {hasApiKey && connectionStatus?.connected && (
              <Badge variant="default" className="bg-green-500" data-testid="badge-ai-connected">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            )}
            {hasApiKey && connectionStatus?.connected === false && (
              <Badge variant="destructive" data-testid="badge-ai-disconnected">
                <XCircle className="w-3 h-3 mr-1" />
                Disconnected
              </Badge>
            )}
            {!hasApiKey && (
              <Badge variant="secondary" data-testid="badge-ai-not-configured">
                Not Configured
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>AI API Configuration</CardTitle>
          <CardDescription>
            Configure your OpenRouter API key for AI-powered features like email classification and summarization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openrouterApiKey">OpenRouter API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="openrouterApiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="sk-or-v1-..."
                    {...form.register("openrouterApiKey")}
                    data-testid="input-api-key"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                    data-testid="button-toggle-api-key-visibility"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={testConnection}
                  disabled={testing}
                  data-testid="button-test-connection"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenRouter
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aiModel">AI Model</Label>
              <Input
                id="aiModel"
                placeholder="mistralai/mistral-7b-instruct"
                {...form.register("aiModel")}
                data-testid="input-ai-model"
              />
              <p className="text-sm text-muted-foreground">
                Default: mistralai/mistral-7b-instruct (free tier available)
              </p>
            </div>

            <Button
              type="submit"
              disabled={updateSettings.isPending}
              data-testid="button-save-settings"
            >
              {updateSettings.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Gmail Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gmail Integration</CardTitle>
              <CardDescription>Connect your Gmail account to sync emails</CardDescription>
            </div>
            <Badge variant={settings?.gmailConnected ? "default" : "secondary"} className={settings?.gmailConnected ? "bg-green-500" : ""} data-testid="badge-gmail-status">
              {settings?.gmailConnected ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </>
              ) : (
                "Not Connected"
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gmailClientId">Gmail Client ID</Label>
            <Input
              id="gmailClientId"
              placeholder="123456789-abcdef.apps.googleusercontent.com"
              {...form.register("gmailClientId")}
              data-testid="input-gmail-client-id"
            />
            <p className="text-sm text-muted-foreground">
              Get your OAuth credentials from{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Cloud Console
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gmailClientSecret">Gmail Client Secret</Label>
            <div className="relative">
              <Input
                id="gmailClientSecret"
                type={showGmailSecret ? "text" : "password"}
                placeholder="GOCSPX-..."
                {...form.register("gmailClientSecret")}
                data-testid="input-gmail-client-secret"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowGmailSecret(!showGmailSecret)}
                data-testid="button-toggle-gmail-secret"
              >
                {showGmailSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            {!settings?.gmailConnected ? (
              <Button
                type="button"
                variant="default"
                onClick={async () => {
                  const gmailClientId = form.getValues("gmailClientId");
                  const gmailClientSecret = form.getValues("gmailClientSecret");

                  if (!gmailClientId || !gmailClientSecret) {
                    toast({
                      title: "Missing Credentials",
                      description: "Please enter your Gmail Client ID and Secret above.",
                      variant: "destructive",
                    });
                    return;
                  }

                  try {
                    // Save credentials first
                    await apiRequest("PUT", "/api/settings", {
                      gmailClientId,
                      gmailClientSecret,
                    });

                    // Then initiate OAuth
                    const res = await apiRequest("GET", "/api/oauth/gmail/authorize");
                    const data = await res.json();
                    if (data.authUrl) {
                      window.open(data.authUrl, "GoogleSignIn", "width=500,height=600");
                    }
                  } catch (error: any) {
                    toast({
                      title: "Connection Error",
                      description: error.message || "Failed to initiate Gmail OAuth",
                      variant: "destructive",
                    });
                  }
                }}
                data-testid="button-connect-gmail"
              >
                Sign in with Google
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await apiRequest("POST", "/api/gmail/sync");
                      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
                      toast({
                        title: "Sync Complete",
                        description: "Gmail emails synced successfully",
                      });
                    } catch (error: any) {
                      toast({
                        title: "Sync Failed",
                        description: error.message || "Failed to sync Gmail",
                        variant: "destructive",
                      });
                    }
                  }}
                  data-testid="button-sync-gmail"
                >
                  Sync Emails
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await apiRequest("POST", "/api/oauth/gmail/disconnect");
                      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
                      toast({
                        title: "Disconnected",
                        description: "Gmail disconnected successfully",
                      });
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message || "Failed to disconnect Gmail",
                        variant: "destructive",
                      });
                    }
                  }}
                  data-testid="button-disconnect-gmail"
                >
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* LinkedIn Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>LinkedIn Integration</CardTitle>
              <CardDescription>Connect your LinkedIn account for profile enrichment</CardDescription>
            </div>
            <Badge variant={settings?.linkedinConnected ? "default" : "secondary"} className={settings?.linkedinConnected ? "bg-green-500" : ""} data-testid="badge-linkedin-status">
              {settings?.linkedinConnected ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </>
              ) : (
                "Not Connected"
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkedinClientId">LinkedIn Client ID</Label>
            <Input
              id="linkedinClientId"
              placeholder="77xxxxxxxxxxxxx"
              {...form.register("linkedinClientId")}
              data-testid="input-linkedin-client-id"
            />
            <p className="text-sm text-muted-foreground">
              Get your OAuth credentials from{" "}
              <a
                href="https://www.linkedin.com/developers/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                LinkedIn Developer Portal
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedinClientSecret">LinkedIn Client Secret</Label>
            <div className="relative">
              <Input
                id="linkedinClientSecret"
                type={showLinkedInSecret ? "text" : "password"}
                placeholder="..."
                {...form.register("linkedinClientSecret")}
                data-testid="input-linkedin-client-secret"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowLinkedInSecret(!showLinkedInSecret)}
                data-testid="button-toggle-linkedin-secret"
              >
                {showLinkedInSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            {!settings?.linkedinConnected ? (
              <Button
                type="button"
                variant="default"
                onClick={async () => {
                  const linkedinClientId = form.getValues("linkedinClientId");
                  const linkedinClientSecret = form.getValues("linkedinClientSecret");

                  if (!linkedinClientId || !linkedinClientSecret) {
                    toast({
                      title: "Missing Credentials",
                      description: "Please enter your LinkedIn Client ID and Secret above.",
                      variant: "destructive",
                    });
                    return;
                  }

                  try {
                    // Save credentials first
                    await apiRequest("PUT", "/api/settings", {
                      linkedinClientId,
                      linkedinClientSecret,
                    });

                    // Then initiate OAuth
                    const res = await apiRequest("GET", "/api/oauth/linkedin/authorize");
                    const data = await res.json();
                    if (data.authUrl) {
                      window.open(data.authUrl, "LinkedInSignIn", "width=500,height=600");
                    }
                  } catch (error: any) {
                    toast({
                      title: "Connection Error",
                      description: error.message || "Failed to initiate LinkedIn OAuth",
                      variant: "destructive",
                    });
                  }
                }}
                data-testid="button-connect-linkedin"
              >
                Sign in with LinkedIn
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                onClick={async () => {
                  try {
                    await apiRequest("POST", "/api/oauth/linkedin/disconnect");
                    queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
                    toast({
                      title: "Disconnected",
                      description: "LinkedIn disconnected successfully",
                      });
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "Failed to disconnect LinkedIn",
                      variant: "destructive",
                    });
                  }
                }}
                data-testid="button-disconnect-linkedin"
              >
                Disconnect
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground border-l-2 border-amber-500 pl-3 py-1">
            Note: LinkedIn Messaging API is partner-restricted. This integration provides profile data access only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}