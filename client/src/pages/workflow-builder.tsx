import { useState, useCallback, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, Play, Plus } from "lucide-react";
import type { Workflow } from "@shared/schema";

const nodeTypes = [
  { value: "trigger", label: "Trigger", description: "Starts the workflow" },
  { value: "ai_classify", label: "AI Classify", description: "Classify email with AI" },
  { value: "ai_summarize", label: "AI Summarize", description: "Summarize email content" },
  { value: "ai_generate_reply", label: "AI Generate Reply", description: "Generate AI response" },
  { value: "create_lead", label: "Create Lead", description: "Create a new lead" },
  { value: "create_activity", label: "Create Activity", description: "Log an activity" },
  { value: "send_notification", label: "Send Notification", description: "Send a notification" },
  { value: "condition", label: "Condition", description: "Conditional branching" },
  { value: "delay", label: "Delay", description: "Wait for a period" },
];

export default function WorkflowBuilder() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState("email_received");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const isNew = id === "new";

  const { data: workflow } = useQuery<Workflow>({
    queryKey: ["/api/workflows", id],
    enabled: !isNew,
  });

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description || "");
      setTrigger(workflow.trigger);
      try {
        setNodes(JSON.parse(workflow.nodes));
        setEdges(JSON.parse(workflow.edges));
      } catch (error) {
        console.error("Failed to parse workflow data:", error);
      }
    }
  }, [workflow]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type,
      position: { x: 250, y: nodes.length * 100 + 50 },
      data: {
        label: nodeTypes.find((t) => t.value === type)?.label || type,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const saveWorkflow = useMutation({
    mutationFn: async () => {
      const workflowData = {
        name,
        description,
        trigger,
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        isActive: false,
      };

      if (isNew) {
        const res = await apiRequest("POST", "/api/workflows", workflowData);
        if (!res.ok) throw new Error("Failed to create workflow");
        return res.json();
      } else {
        const res = await apiRequest("PATCH", `/api/workflows/${id}`, workflowData);
        if (!res.ok) throw new Error("Failed to update workflow");
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Success",
        description: `Workflow ${isNew ? "created" : "updated"} successfully`,
      });
      setLocation("/workflows");
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${isNew ? "create" : "update"} workflow`,
        variant: "destructive",
      });
    },
  });

  const executeWorkflow = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/workflows/${id}/execute`, {
        subject: "Test Email",
        from: "test@example.com",
        preview: "This is a test email for workflow execution",
      });
      if (!res.ok) throw new Error("Failed to execute workflow");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Workflow executed successfully",
      });
      console.log("Execution result:", data);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to execute workflow",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/workflows")} data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isNew ? "Create Workflow" : "Edit Workflow"}</h1>
              <p className="text-sm text-muted-foreground">Build your automation workflow</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isNew && (
              <Button
                variant="outline"
                onClick={() => executeWorkflow.mutate()}
                disabled={executeWorkflow.isPending}
                data-testid="button-test-workflow"
              >
                <Play className="w-4 h-4 mr-2" />
                Test
              </Button>
            )}
            <Button
              onClick={() => saveWorkflow.mutate()}
              disabled={saveWorkflow.isPending || !name}
              data-testid="button-save-workflow"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label htmlFor="name">Workflow Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter workflow name"
              data-testid="input-workflow-name"
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this workflow does"
              data-testid="input-workflow-description"
            />
          </div>
          <div>
            <Label htmlFor="trigger">Trigger</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger id="trigger" data-testid="select-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email_received">Email Received</SelectItem>
                <SelectItem value="lead_created">Lead Created</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r p-4 overflow-y-auto bg-muted/20">
          <h3 className="font-semibold mb-4">Workflow Nodes</h3>
          <div className="space-y-2">
            {nodeTypes.map((type) => (
              <Card
                key={type.value}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => addNode(type.value)}
                data-testid={`node-type-${type.value}`}
              >
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">{type.label}</CardTitle>
                  <CardDescription className="text-xs">{type.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node)}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>

        {selectedNode && (
          <div className="w-80 border-l p-4 overflow-y-auto bg-muted/20">
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Node Properties</h3>
              <Badge>{selectedNode.type || "unknown"}</Badge>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Label</Label>
                <Input
                  value={selectedNode.data.label || ""}
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, data: { ...node.data, label: e.target.value } }
                          : node
                      )
                    );
                  }}
                  data-testid="input-node-label"
                />
              </div>
              <div>
                <Label>Configuration</Label>
                <Textarea
                  placeholder="Enter node configuration as JSON"
                  className="font-mono text-xs"
                  rows={10}
                  value={JSON.stringify(selectedNode.data, null, 2)}
                  onChange={(e) => {
                    try {
                      const newData = JSON.parse(e.target.value);
                      setNodes((nds) =>
                        nds.map((node) =>
                          node.id === selectedNode.id ? { ...node, data: newData } : node
                        )
                      );
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  data-testid="textarea-node-config"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
