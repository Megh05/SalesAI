import { Bell, Mail, Shield, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card className="hover-elevate cursor-pointer" data-testid="settings-nav-profile">
            <CardContent className="p-4 flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Profile</span>
            </CardContent>
          </Card>
          <Card className="hover-elevate cursor-pointer" data-testid="settings-nav-integrations">
            <CardContent className="p-4 flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Integrations</span>
            </CardContent>
          </Card>
          <Card className="hover-elevate cursor-pointer" data-testid="settings-nav-notifications">
            <CardContent className="p-4 flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Notifications</span>
            </CardContent>
          </Card>
          <Card className="hover-elevate cursor-pointer" data-testid="settings-nav-security">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Security</span>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="John Doe" data-testid="input-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john@company.com" data-testid="input-email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" defaultValue="Acme Inc" data-testid="input-company" />
              </div>
              <Button data-testid="button-save-profile">Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Integrations</CardTitle>
              <CardDescription>Connect your email accounts for smart inbox features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Gmail</p>
                  <p className="text-sm text-muted-foreground">john@gmail.com</p>
                </div>
                <Button variant="outline" data-testid="button-disconnect-gmail">
                  Disconnect
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">LinkedIn</p>
                  <p className="text-sm text-muted-foreground">Not connected</p>
                </div>
                <Button data-testid="button-connect-linkedin">
                  Connect
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive updates and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch defaultChecked data-testid="switch-email-notifications" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">New Lead Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified of new leads</p>
                </div>
                <Switch defaultChecked data-testid="switch-lead-alerts" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">AI Summary Notifications</p>
                  <p className="text-sm text-muted-foreground">Alerts for AI-classified emails</p>
                </div>
                <Switch data-testid="switch-ai-notifications" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
