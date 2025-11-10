import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Building2, User, Target, Flame, Clock, TrendingUp, Search, Maximize2, Filter, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface RelationshipGraphData {
  nodes: Array<{
    id: string;
    type: string;
    data: any;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    label: string;
  }>;
  insights: {
    topEngagedContacts: Array<{
      id: string;
      name: string;
      score: number;
      lastInteraction: Date;
      interactionCount: number;
    }>;
    contactsToFollowUp: Array<{
      id: string;
      name: string;
      score: number;
      daysSinceLastContact: number;
      reason: string;
    }>;
    hotLeads: Array<{
      id: string;
      title: string;
      score: number;
      status: string;
      value: number | null;
    }>;
    stats: {
      totalCompanies: number;
      totalContacts: number;
      totalLeads: number;
      activeLeads: number;
      hotLeadsCount: number;
    };
  };
}

function CompanyNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 rounded-md border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md min-w-[180px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <div className="font-semibold text-sm text-blue-900 dark:text-blue-100">{data.label}</div>
      </div>
      <div className="text-xs text-blue-700 dark:text-blue-300">{data.description}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

function ContactNode({ data }: { data: any }) {
  const engagement = data.engagement;
  const score = engagement?.score || 0;
  
  const styleMap = {
    green: "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100",
    yellow: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-100",
    orange: "border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-900 dark:text-orange-100",
    gray: "border-gray-500 bg-gray-50 dark:bg-gray-950/30 text-gray-900 dark:text-gray-100"
  };

  let colorKey: keyof typeof styleMap = "gray";
  if (score >= 70) colorKey = "green";
  else if (score >= 40) colorKey = "yellow";
  else if (score >= 20) colorKey = "orange";

  return (
    <div className={`px-4 py-3 rounded-md border-2 shadow-md min-w-[180px] ${styleMap[colorKey]}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2 mb-1">
        <User className="w-4 h-4" />
        <div className="font-semibold text-sm">{data.label}</div>
      </div>
      <div className="text-xs opacity-80 mb-1">{data.description}</div>
      {engagement && (
        <Badge variant="secondary" className="text-xs">
          Score: {score}
        </Badge>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

function LeadNode({ data }: { data: any }) {
  const isHot = data.isHot;
  
  return (
    <div className={`px-4 py-3 rounded-md border-2 ${isHot ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'} shadow-md min-w-[180px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2 mb-1">
        <Target className="w-4 h-4" />
        {isHot && <Flame className="w-3 h-3 text-red-500" />}
        <div className="font-semibold text-sm">{data.label}</div>
      </div>
      <div className="text-xs opacity-80">{data.description}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

const nodeTypes = {
  company: CompanyNode,
  contact: ContactNode,
  lead: LeadNode,
};

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 100, ranksep: 120 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 80 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 100,
        y: nodeWithPosition.y - 40,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export default function RelationMap() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showInsights, setShowInsights] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "company" | "contact" | "lead">("all");

  const { data: graphData, isLoading } = useQuery<RelationshipGraphData>({
    queryKey: ["/api/relationship-graph"],
  });

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (graphData) {
      let filteredNodes = graphData.nodes;
      
      if (filterType !== "all") {
        filteredNodes = filteredNodes.filter(n => n.type === filterType);
      }

      if (searchTerm) {
        filteredNodes = filteredNodes.filter(n =>
          n.data.label?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
      const filteredEdges = graphData.edges.filter(
        e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
      );

      const flowNodes = filteredNodes.map(n => ({
        id: n.id,
        type: n.type,
        data: n.data,
        position: { x: 0, y: 0 },
      }));

      const flowEdges = filteredEdges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: "smoothstep",
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: { stroke: "#94a3b8", strokeWidth: 2 },
        labelStyle: { fontSize: 10, fill: "#64748b" },
      }));

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges);

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [graphData, searchTerm, filterType]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Failed to load relationship data</p>
      </div>
    );
  }

  const insights = graphData.insights;

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-relation-map-title">
              Relation Map
            </h1>
            <p className="text-muted-foreground">
              Visualize your sales network and discover key relationships
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInsights(!showInsights)}
            data-testid="button-toggle-insights"
          >
            <Info className="w-4 h-4 mr-2" />
            {showInsights ? "Hide" : "Show"} Insights
          </Button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-entities"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("all")}
              data-testid="button-filter-all"
            >
              All ({graphData.nodes.length})
            </Button>
            <Button
              variant={filterType === "company" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("company")}
              data-testid="button-filter-companies"
            >
              <Building2 className="w-3 h-3 mr-1" />
              Companies ({insights.stats.totalCompanies})
            </Button>
            <Button
              variant={filterType === "contact" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("contact")}
              data-testid="button-filter-contacts"
            >
              <User className="w-3 h-3 mr-1" />
              Contacts ({insights.stats.totalContacts})
            </Button>
            <Button
              variant={filterType === "lead" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType("lead")}
              data-testid="button-filter-leads"
            >
              <Target className="w-3 h-3 mr-1" />
              Leads ({insights.stats.totalLeads})
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {showInsights && (
          <div className="w-80 border-r bg-muted/20">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Flame className="w-4 h-4 text-red-500" />
                      Hot Leads
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {insights.hotLeads.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No hot leads found</p>
                    ) : (
                      insights.hotLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="flex items-center justify-between p-2 rounded-md hover-elevate cursor-pointer"
                          data-testid={`hot-lead-${lead.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{lead.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {lead.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Score: {lead.score}
                              </span>
                            </div>
                          </div>
                          {lead.value && (
                            <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                              ${lead.value.toLocaleString()}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      Top Engaged Contacts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {insights.topEngagedContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-2 rounded-md hover-elevate cursor-pointer"
                        data-testid={`top-contact-${contact.id}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{contact.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {contact.score}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {contact.interactionCount} interactions
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Follow Up Needed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {insights.contactsToFollowUp.length === 0 ? (
                      <p className="text-xs text-muted-foreground">All contacts up to date</p>
                    ) : (
                      insights.contactsToFollowUp.map((contact) => (
                        <div
                          key={contact.id}
                          className="p-2 rounded-md hover-elevate cursor-pointer"
                          data-testid={`followup-contact-${contact.id}`}
                        >
                          <p className="text-sm font-medium mb-1">{contact.name}</p>
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            {contact.reason}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Network Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Companies</span>
                      <span className="font-semibold">{insights.stats.totalCompanies}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contacts</span>
                      <span className="font-semibold">{insights.stats.totalContacts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Leads</span>
                      <span className="font-semibold">{insights.stats.totalLeads}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active Leads</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {insights.stats.activeLeads}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>
        )}

        <div className="flex-1 relative">
          {nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">No data to visualize yet</p>
                <p className="text-sm text-muted-foreground">
                  Add companies, contacts, and leads to see the relationship map
                </p>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
              <MiniMap
                nodeColor={(node) => {
                  if (node.type === "company") return "#3b82f6";
                  if (node.type === "contact") return "#10b981";
                  if (node.type === "lead") return "#8b5cf6";
                  return "#94a3b8";
                }}
                maskColor="rgb(0, 0, 0, 0.1)"
              />
            </ReactFlow>
          )}
        </div>
      </div>

      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent className="max-w-2xl">
          {selectedNode && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedNode.type === "company" && <Building2 className="w-5 h-5" />}
                  {selectedNode.type === "contact" && <User className="w-5 h-5" />}
                  {selectedNode.type === "lead" && <Target className="w-5 h-5" />}
                  {selectedNode.data.label}
                </DialogTitle>
                <DialogDescription>{selectedNode.data.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {selectedNode.type === "company" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Industry</p>
                      <p className="text-sm">{selectedNode.data.industry || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Size</p>
                      <p className="text-sm">{selectedNode.data.size || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p className="text-sm">{selectedNode.data.location || "Not specified"}</p>
                    </div>
                    {selectedNode.data.website && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Website</p>
                        <a
                          href={selectedNode.data.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {selectedNode.data.website}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {selectedNode.type === "contact" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="text-sm">{selectedNode.data.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Phone</p>
                        <p className="text-sm">{selectedNode.data.phone || "Not specified"}</p>
                      </div>
                    </div>

                    {selectedNode.data.engagement && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium mb-3">Engagement Score</p>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-green-600"
                                  style={{ width: `${selectedNode.data.engagement.score}%` }}
                                />
                              </div>
                            </div>
                            <Badge variant="secondary" className="font-semibold">
                              {selectedNode.data.engagement.score}/100
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Last Interaction</p>
                              <p className="text-sm font-medium">
                                {format(new Date(selectedNode.data.engagement.lastInteraction), "MMM d, yyyy")}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Interactions</p>
                              <p className="text-sm font-medium">
                                {selectedNode.data.engagement.interactionCount}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {selectedNode.type === "lead" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <Badge variant="secondary">{selectedNode.data.status}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Value</p>
                        <p className="text-sm font-semibold">
                          {selectedNode.data.value ? `$${selectedNode.data.value.toLocaleString()}` : "Not specified"}
                        </p>
                      </div>
                    </div>

                    {selectedNode.data.engagement && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between p-3 rounded-md bg-muted">
                          <div className="flex items-center gap-2">
                            {selectedNode.data.isHot && <Flame className="w-5 h-5 text-red-500" />}
                            <span className="font-medium">
                              {selectedNode.data.isHot ? "Hot Lead" : "Active Lead"}
                            </span>
                          </div>
                          <Badge variant="secondary">
                            Score: {selectedNode.data.engagement.score}
                          </Badge>
                        </div>
                      </>
                    )}

                    {selectedNode.data.description && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                        <p className="text-sm">{selectedNode.data.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
