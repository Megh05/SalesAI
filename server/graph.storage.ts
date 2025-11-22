import { db } from "./db";
import { graphNodes, graphEdges, type InsertGraphNode, type InsertGraphEdge, type GraphNode, type GraphEdge } from "@shared/schema";
import { eq, and, or, sql } from "drizzle-orm";

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface NodeMatchCriteria {
  linkedinUrl?: string;
  name?: string;
  type?: string;
  company?: string;
  organizationId?: string;
}

export class GraphStorage {
  async upsertNode(nodeData: InsertGraphNode): Promise<GraphNode> {
    let metadata = {};
    try {
      metadata = nodeData.metadata ? JSON.parse(nodeData.metadata) : {};
    } catch (e) {}

    const criteria: NodeMatchCriteria = {
      linkedinUrl: nodeData.linkedinUrl,
      name: nodeData.name,
      type: nodeData.type,
      company: (metadata as any).company,
      organizationId: nodeData.organizationId,
    };

    const existingNode = await this.findNode(criteria, nodeData.userId);

    if (existingNode) {
      const updated = await db
        .update(graphNodes)
        .set({
          ...nodeData,
          updatedAt: new Date(),
        })
        .where(eq(graphNodes.id, existingNode.id))
        .returning();
      return updated[0];
    }

    const inserted = await db.insert(graphNodes).values(nodeData).returning();
    return inserted[0];
  }

  async findNode(criteria: NodeMatchCriteria & { organizationId: string }, userId: string): Promise<GraphNode | null> {
    const baseConditions = [
      eq(graphNodes.userId, userId),
      eq(graphNodes.organizationId, criteria.organizationId)
    ];

    if (criteria.linkedinUrl) {
      const [node] = await db
        .select()
        .from(graphNodes)
        .where(and(...baseConditions, eq(graphNodes.linkedinUrl, criteria.linkedinUrl)))
        .limit(1);
      if (node) return node;
    }

    if (criteria.name && criteria.type) {
      const allNodes = await db
        .select()
        .from(graphNodes)
        .where(and(...baseConditions, eq(graphNodes.type, criteria.type)));

      const normalizedSearchName = criteria.name.toLowerCase().trim();
      
      for (const node of allNodes) {
        const normalizedNodeName = node.name.toLowerCase().trim();
        
        if (normalizedNodeName === normalizedSearchName) {
          if (!criteria.company) return node;
          
          let nodeMetadata = {};
          try {
            nodeMetadata = node.metadata ? JSON.parse(node.metadata) : {};
          } catch (e) {}
          
          const nodeCompany = (nodeMetadata as any).company?.toLowerCase().trim();
          const searchCompany = criteria.company.toLowerCase().trim();
          
          if (nodeCompany === searchCompany) {
            return node;
          }
        }
        
        if (this.fuzzyMatch(normalizedNodeName, normalizedSearchName)) {
          if (!criteria.company) {
            return node;
          }
          
          let nodeMetadata = {};
          try {
            nodeMetadata = node.metadata ? JSON.parse(node.metadata) : {};
          } catch (e) {}
          
          const nodeCompany = (nodeMetadata as any).company?.toLowerCase().trim();
          const searchCompany = criteria.company.toLowerCase().trim();
          
          if (nodeCompany && nodeCompany === searchCompany) {
            return node;
          }
        }
      }
    }

    return null;
  }

  private fuzzyMatch(str1: string, str2: string): boolean {
    const similarity = this.calculateSimilarity(str1, str2);
    return similarity > 0.85;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1.0;
    
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / maxLen;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  async upsertEdge(edgeData: InsertGraphEdge): Promise<GraphEdge> {
    const conditions = [
      eq(graphEdges.sourceNodeId, edgeData.sourceNodeId),
      eq(graphEdges.targetNodeId, edgeData.targetNodeId),
      eq(graphEdges.relationType, edgeData.relationType),
      eq(graphEdges.userId, edgeData.userId),
    ];

    if (edgeData.organizationId) {
      conditions.push(eq(graphEdges.organizationId, edgeData.organizationId));
    }

    const [existingEdge] = await db
      .select()
      .from(graphEdges)
      .where(and(...conditions))
      .limit(1);

    if (existingEdge) {
      const updated = await db
        .update(graphEdges)
        .set({
          ...edgeData,
          updatedAt: new Date(),
        })
        .where(eq(graphEdges.id, existingEdge.id))
        .returning();
      return updated[0];
    }

    const inserted = await db.insert(graphEdges).values(edgeData).returning();
    return inserted[0];
  }

  async getCompanyGraph(companyNodeId: string, userId: string, organizationId: string, depth: number = 2): Promise<GraphData> {
    const nodes: Map<string, GraphNode> = new Map();
    const edges: GraphEdge[] = [];
    const visitedNodes = new Set<string>();
    const queue: { nodeId: string; currentDepth: number }[] = [{ nodeId: companyNodeId, currentDepth: 0 }];

    const [rootNode] = await db
      .select()
      .from(graphNodes)
      .where(and(
        eq(graphNodes.id, companyNodeId),
        eq(graphNodes.userId, userId),
        eq(graphNodes.organizationId, organizationId)
      ))
      .limit(1);

    if (!rootNode) {
      throw new Error("Company node not found or access denied to this organization");
    }

    while (queue.length > 0) {
      const { nodeId, currentDepth } = queue.shift()!;

      if (visitedNodes.has(nodeId) || currentDepth > depth) {
        continue;
      }

      visitedNodes.add(nodeId);

      const [node] = await db
        .select()
        .from(graphNodes)
        .where(and(
          eq(graphNodes.id, nodeId),
          eq(graphNodes.userId, userId),
          eq(graphNodes.organizationId, organizationId)
        ))
        .limit(1);

      if (!node) continue;

      nodes.set(node.id, node);

      const connectedEdges = await db
        .select()
        .from(graphEdges)
        .where(and(
          or(
            eq(graphEdges.sourceNodeId, nodeId),
            eq(graphEdges.targetNodeId, nodeId)
          ),
          eq(graphEdges.userId, userId),
          eq(graphEdges.organizationId, organizationId)
        ));

      for (const edge of connectedEdges) {
        edges.push(edge);

        const nextNodeId = edge.sourceNodeId === nodeId ? edge.targetNodeId : edge.sourceNodeId;

        if (!visitedNodes.has(nextNodeId) && currentDepth < depth) {
          queue.push({ nodeId: nextNodeId, currentDepth: currentDepth + 1 });
        }
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges,
    };
  }

  async getNodesByType(type: string, userId: string, organizationId: string): Promise<GraphNode[]> {
    return await db
      .select()
      .from(graphNodes)
      .where(and(
        eq(graphNodes.type, type),
        eq(graphNodes.userId, userId),
        eq(graphNodes.organizationId, organizationId)
      ));
  }

  async deleteOrgGraphData(userId: string, organizationId: string): Promise<void> {
    await db.delete(graphEdges).where(and(
      eq(graphEdges.userId, userId),
      eq(graphEdges.organizationId, organizationId)
    ));
    await db.delete(graphNodes).where(and(
      eq(graphNodes.userId, userId),
      eq(graphNodes.organizationId, organizationId)
    ));
  }

  async getGraphStats(userId: string, organizationId: string): Promise<{ totalNodes: number; totalEdges: number; companies: number; people: number }> {
    const [nodeCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(graphNodes)
      .where(and(eq(graphNodes.userId, userId), eq(graphNodes.organizationId, organizationId)));

    const [edgeCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(graphEdges)
      .where(and(eq(graphEdges.userId, userId), eq(graphEdges.organizationId, organizationId)));

    const [companyCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(graphNodes)
      .where(and(eq(graphNodes.userId, userId), eq(graphNodes.organizationId, organizationId), eq(graphNodes.type, 'company')));

    const [peopleCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(graphNodes)
      .where(and(eq(graphNodes.userId, userId), eq(graphNodes.organizationId, organizationId), eq(graphNodes.type, 'person')));

    return {
      totalNodes: Number(nodeCount?.count || 0),
      totalEdges: Number(edgeCount?.count || 0),
      companies: Number(companyCount?.count || 0),
      people: Number(peopleCount?.count || 0),
    };
  }
}

export const graphStorage = new GraphStorage();
