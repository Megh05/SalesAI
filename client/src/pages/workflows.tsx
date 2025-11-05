import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Play, Pause, Trash2, Copy, Workflow as WorkflowIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Workflow } from "@shared/schema";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Workflows() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deletingWorkflow, setDeletingWorkflow] = useState<Workflow | null>(null);

  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ["/api/workflows/templates"],
  });

  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/workflows/${id}`);
      if (!res.ok) throw new Error("Failed to delete workflow");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      setDeletingWorkflow(null);
      toast({
        title: "Success",
        description: "Workflow deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive",
      });
    },
  });

  const toggleWorkflow = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/workflows/${id}`, { isActive: !isActive });
      if (!res.ok) throw new Error("Failed to toggle workflow");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Success",
        description: "Workflow updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update workflow",
        variant: "destructive",
      });
    },
  });

  const cloneTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await apiRequest("POST", `/api/workflows/${templateId}/clone`);
      if (!res.ok) throw new Error("Failed to clone template");
      return res.json();
    },
    onSuccess: (workflow) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Success",
        description: "Template cloned successfully",
      });
      setLocation(`/workflows/${workflow.id}/edit`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clone template",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Workflows</h1>
          <p className="text-muted-foreground">
            Automate your sales processes with AI-powered workflows
          </p>
        </div>
        <Button
          onClick={() => setLocation("/workflows/new")}
          data-testid="button-create-workflow"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      <Tabs defaultValue="my-workflows" className="w-full">
        <TabsList>
          <TabsTrigger value="my-workflows" data-testid="tab-my-workflows">
            My Workflows ({workflows.length})
          </TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">
            Templates ({templates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-workflows" className="space-y-4 mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading workflows...</p>
            </div>
          ) : workflows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <WorkflowIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first workflow or clone a template to get started
                </p>
                <Button onClick={() => setLocation("/workflows/new")} data-testid="button-create-first-workflow">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-lg transition-shadow" data-testid={`card-workflow-${workflow.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{workflow.name}</CardTitle>
                        <CardDescription>{workflow.description}</CardDescription>
                      </div>
                      {workflow.isActive ? (
                        <Badge variant="default" data-testid={`badge-active-${workflow.id}`}>Active</Badge>
                      ) : (
                        <Badge variant="secondary" data-testid={`badge-inactive-${workflow.id}`}>Inactive</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-2" />
                        {workflow.executionCount || 0} executions
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setLocation(`/workflows/${workflow.id}/edit`)}
                          data-testid={`button-edit-${workflow.id}`}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleWorkflow.mutate({ id: workflow.id, isActive: workflow.isActive || false })}
                          data-testid={`button-toggle-${workflow.id}`}
                        >
                          {workflow.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingWorkflow(workflow)}
                          data-testid={`button-delete-${workflow.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow" data-testid={`card-template-${index}`}>
                <CardHeader>
                  <CardTitle className="text-lg mb-1">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => cloneTemplate.mutate(index.toString())}
                    data-testid={`button-clone-template-${index}`}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deletingWorkflow} onOpenChange={() => setDeletingWorkflow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingWorkflow?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingWorkflow && deleteWorkflow.mutate(deletingWorkflow.id)}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
