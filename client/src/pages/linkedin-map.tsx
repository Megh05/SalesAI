import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import ForceGraph3D from "react-force-graph-3d";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Users, Building2, Network, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface GraphNode {
  id: string;
  type: "person" | "company";
  name: string;
  linkedinUrl?: string;
  metadata?: string;
}

interface GraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationType: string;
  weight?: number;
  source: string;
  metadata?: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export default function LinkedInMap() {
  const [, params] = useRoute("/linkedin-map/:companyId");
  const companyId = params?.companyId;
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const fgRef = useRef<any>();
  const { activeOrgId } = useAuth();

  const { data: graphData, isLoading } = useQuery<GraphData>({
    queryKey: ["/api/graph/company", companyId, { organizationId: activeOrgId }],
    enabled: !!companyId && !!activeOrgId,
  });

  const graphDataFormatted = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };

    const nodes = graphData.nodes.map((node) => {
      let parsedMetadata = {};
      try {
        parsedMetadata = node.metadata ? JSON.parse(node.metadata) : {};
      } catch (e) {
        parsedMetadata = {};
      }

      return {
        id: node.id,
        name: node.name,
        type: node.type,
        linkedinUrl: node.linkedinUrl,
        ...parsedMetadata,
      };
    });

    const links = graphData.edges.map((edge) => ({
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      type: edge.relationType,
      weight: edge.weight || 1,
    }));

    return { nodes, links };
  }, [graphData]);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    
    if (fgRef.current) {
      const distance = 140;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node,
        3000
      );
    }
  }, []);

  const getNodeColor = (node: any) => {
    if (node.type === "company") return "#0066cc";
    return "#10b981";
  };

  const getNodeSize = (node: any) => {
    if (node.type === "company") return 8;
    return 5;
  };

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardHeader>
            <CardTitle>No Company Selected</CardTitle>
            <CardDescription>
              Please select a company from the companies page
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!activeOrgId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96" data-testid="card-no-org">
          <CardHeader>
            <CardTitle>No Organization Selected</CardTitle>
            <CardDescription>Please select an organization to view the LinkedIn network map</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loader-graph" />
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-4 left-4 z-10" data-testid="card-graph-info">
        <Card className="w-80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">LinkedIn Network</CardTitle>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 text-sm">
                  <Users className="h-4 w-4 text-green-500" />
                  <span>{graphDataFormatted.nodes.filter(n => n.type === 'person').length}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <span>{graphDataFormatted.nodes.filter(n => n.type === 'company').length}</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Network className="h-4 w-4 text-gray-500" />
                  <span>{graphDataFormatted.links.length}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Companies</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>People</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedNode && (
        <div className="absolute top-4 right-4 z-10" data-testid="card-node-details">
          <Card className="w-80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg truncate">{selectedNode.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedNode(null)}
                  data-testid="button-close-details"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                {selectedNode.type === "company" ? "Company" : "Person"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2 text-sm">
                  {selectedNode.title && (
                    <div>
                      <span className="font-medium">Title:</span>
                      <p className="text-muted-foreground">{selectedNode.title}</p>
                    </div>
                  )}
                  {selectedNode.position && (
                    <div>
                      <span className="font-medium">Position:</span>
                      <p className="text-muted-foreground">{selectedNode.position}</p>
                    </div>
                  )}
                  {selectedNode.company && (
                    <div>
                      <span className="font-medium">Company:</span>
                      <p className="text-muted-foreground">{selectedNode.company}</p>
                    </div>
                  )}
                  {selectedNode.industry && (
                    <div>
                      <span className="font-medium">Industry:</span>
                      <p className="text-muted-foreground">{selectedNode.industry}</p>
                    </div>
                  )}
                  {selectedNode.size && (
                    <div>
                      <span className="font-medium">Size:</span>
                      <p className="text-muted-foreground">{selectedNode.size}</p>
                    </div>
                  )}
                  {selectedNode.location && (
                    <div>
                      <span className="font-medium">Location:</span>
                      <p className="text-muted-foreground">{selectedNode.location}</p>
                    </div>
                  )}
                  {selectedNode.linkedinUrl && (
                    <div>
                      <a
                        href={selectedNode.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                        data-testid="link-linkedin"
                      >
                        View on LinkedIn →
                      </a>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      <ForceGraph3D
        ref={fgRef}
        graphData={graphDataFormatted}
        nodeLabel="name"
        nodeColor={getNodeColor}
        nodeVal={getNodeSize}
        onNodeClick={handleNodeClick}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        backgroundColor="#00000000"
        data-testid="graph-3d"
      />
    </div>
  );
}
