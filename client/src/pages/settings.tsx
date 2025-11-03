import { useState } from "react";
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
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);
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
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      return apiRequest("/api/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
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
      const response = await apiRequest("/api/settings/test-ai", {
        method: "POST",
        body: JSON.stringify({ apiKey }),
      });

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
            <Badge variant="secondary" data-testid="badge-gmail-status">
              {settings?.gmailConnected ? "Connected" : "Not Connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled data-testid="button-connect-gmail">
            Connect Gmail (Coming Soon)
          </Button>
        </CardContent>
      </Card>

      {/* LinkedIn Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>LinkedIn Integration</CardTitle>
              <CardDescription>Connect your LinkedIn account to sync messages</CardDescription>
            </div>
            <Badge variant="secondary" data-testid="badge-linkedin-status">
              {settings?.linkedinConnected ? "Connected" : "Not Connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled data-testid="button-connect-linkedin">
            Connect LinkedIn (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
