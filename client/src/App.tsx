import { useState, useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AICopilotChat } from "@/components/ai-copilot-chat";
import { OrganizationSelector } from "@/components/organization-selector";
import { useAuth } from "@/hooks/useAuth";
import { OrganizationProvider } from "@/hooks/use-organization-context";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import SmartInbox from "@/pages/smart-inbox";
import Leads from "@/pages/leads";
import Companies from "@/pages/companies";
import Contacts from "@/pages/contacts";
import Activities from "@/pages/activities";
import Analytics from "@/pages/analytics";
import Workflows from "@/pages/workflows";
import Teams from "@/pages/teams";
import RelationMap from "@/pages/relation-map";
import Settings from "@/pages/settings";
import OrganizationSettings from "@/pages/organization-settings";
import RBACDashboard from "@/pages/rbac";
import InvitationsHub from "@/pages/invitations";
import MemberProfile from "@/pages/member-profile";
import Login from "@/pages/login";
import Register from "@/pages/register";
import { Loader2 } from "lucide-react";

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/inbox" component={SmartInbox} />
      <Route path="/leads" component={Leads} />
      <Route path="/companies" component={Companies} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/activities" component={Activities} />
      <Route path="/relation-map" component={RelationMap} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/workflows" component={Workflows} />
      <Route path="/teams" component={Teams} />
      <Route path="/rbac" component={RBACDashboard} />
      <Route path="/invitations" component={InvitationsHub} />
      <Route path="/members/:id" component={MemberProfile} />
      <Route path="/organization" component={OrganizationSettings} />
      <Route path="/settings" component={Settings} />
      <Route path="/login">{() => <Redirect to="/" />}</Route>
      <Route path="/register">{() => <Redirect to="/" />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function UnauthenticatedRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route>{() => <Redirect to="/login" />}</Route>
    </Switch>
  );
}

function AppContent() {
  const { user, isLoading, isAuthenticated, hasOrganization, organizations } = useAuth();
  const [showOrgSelector, setShowOrgSelector] = useState(false);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  useEffect(() => {
    if (isAuthenticated && organizations.length === 0) {
      setShowOrgSelector(true);
    }
  }, [isAuthenticated, organizations]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <OrganizationProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between px-6 py-3 border-b">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-y-auto">
                <AuthenticatedRouter />
              </main>
            </div>
          </div>
          <AICopilotChat />
          <OrganizationSelector 
            open={showOrgSelector} 
            onClose={() => setShowOrgSelector(false)}
            forceSelection={!hasOrganization}
          />
        </SidebarProvider>
      </OrganizationProvider>
    );
  }

  return <UnauthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;