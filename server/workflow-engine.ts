import { storage } from "./storage";
import { AIService } from "./ai";
import type { Workflow, InsertLead, InsertActivity } from "@shared/schema";

const aiService = new AIService();

export interface WorkflowNode {
  id: string;
  type: string;
  data: any;
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface ExecutionContext {
  userId: string;
  trigger: any;
  variables: Record<string, any>;
}

export class WorkflowEngine {
  async executeWorkflow(workflowId: string, userId: string, triggerData: any): Promise<any> {
    if (!workflowId || workflowId === 'undefined' || workflowId === 'new') {
      throw new Error("Invalid workflow ID");
    }

    const workflow = await storage.getWorkflow(workflowId, userId);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    if (!workflow.isActive) {
      console.warn(`Executing inactive workflow: ${workflowId}`);
    }

    const execution = await storage.createWorkflowExecution({
      workflowId,
      userId,
      status: "running",
      executionData: JSON.stringify({ trigger: triggerData }),
    });

    try {
      const nodes: WorkflowNode[] = JSON.parse(workflow.nodes);
      const edges: WorkflowEdge[] = JSON.parse(workflow.edges);

      const context: ExecutionContext = {
        userId,
        trigger: triggerData,
        variables: {},
      };

      const result = await this.executeNodes(nodes, edges, context);

      await storage.updateWorkflowExecution(execution.id, {
        status: "completed",
        completedAt: new Date(),
        executionData: JSON.stringify({ trigger: triggerData, result }),
      });

      await storage.updateWorkflow(workflowId, userId, {
        lastExecutedAt: new Date(),
        executionCount: (workflow.executionCount || 0) + 1,
      });

      return result;
    } catch (error: any) {
      await storage.updateWorkflowExecution(execution.id, {
        status: "failed",
        completedAt: new Date(),
        error: error.message,
      });
      throw error;
    }
  }

  private async executeNodes(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    context: ExecutionContext
  ): Promise<any> {
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const executed = new Set<string>();
    const results: Record<string, any> = {};

    const triggerNode = nodes.find(n => n.type === "trigger");
    if (!triggerNode) {
      throw new Error("No trigger node found");
    }

    const executeNode = async (nodeId: string): Promise<any> => {
      if (executed.has(nodeId)) {
        return results[nodeId];
      }

      const node = nodeMap.get(nodeId);
      if (!node) {
        throw new Error(`Node ${nodeId} not found`);
      }

      const incomingEdges = edges.filter(e => e.target === nodeId);
      for (const edge of incomingEdges) {
        await executeNode(edge.source);
      }

      const result = await this.executeNodeAction(node, context, results);
      results[nodeId] = result;
      executed.add(nodeId);

      const outgoingEdges = edges.filter(e => e.source === nodeId);
      for (const edge of outgoingEdges) {
        await executeNode(edge.target);
      }

      return result;
    };

    await executeNode(triggerNode.id);
    return results;
  }

  private async executeNodeAction(
    node: WorkflowNode,
    context: ExecutionContext,
    previousResults: Record<string, any>
  ): Promise<any> {
    switch (node.type) {
      case "trigger":
        return context.trigger;

      case "ai_classify":
        return await this.executeAIClassify(node, context);

      case "ai_summarize":
        return await this.executeAISummarize(node, context);

      case "ai_generate_reply":
        return await this.executeAIGenerateReply(node, context);

      case "create_lead":
        return await this.executeCreateLead(node, context, previousResults);

      case "create_activity":
        return await this.executeCreateActivity(node, context, previousResults);

      case "send_notification":
        return await this.executeSendNotification(node, context, previousResults);

      case "condition":
        return await this.executeCondition(node, context, previousResults);

      case "delay":
        return await this.executeDelay(node);

      default:
        console.warn(`Unknown node type: ${node.type}`);
        return null;
    }
  }

  private async executeAIClassify(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const { emailSubject, emailFrom, emailPreview } = node.data;
    return await aiService.classifyEmail(context.userId, {
      subject: this.resolveVariable(emailSubject, context),
      from: this.resolveVariable(emailFrom, context),
      preview: this.resolveVariable(emailPreview, context),
    });
  }

  private async executeAISummarize(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const { emailSubject, emailFrom, emailBody } = node.data;
    return await aiService.summarizeEmail(context.userId, {
      subject: this.resolveVariable(emailSubject, context),
      from: this.resolveVariable(emailFrom, context),
      body: this.resolveVariable(emailBody, context),
    });
  }

  private async executeAIGenerateReply(node: WorkflowNode, context: ExecutionContext): Promise<any> {
    const { emailContent, tone, context: replyContext } = node.data;
    return await aiService.generateReply(context.userId, {
      emailContent: this.resolveVariable(emailContent, context),
      tone: tone || "professional",
      context: this.resolveVariable(replyContext, context),
    });
  }

  private async executeCreateLead(
    node: WorkflowNode,
    context: ExecutionContext,
    previousResults: Record<string, any>
  ): Promise<any> {
    const { title, description, value, status, contactId, companyId } = node.data;

    // Skip if contactId is required but not provided or invalid
    const resolvedContactId = contactId ? this.resolveVariable(contactId, context) : undefined;
    if (!resolvedContactId || resolvedContactId.includes('{{')) {
      console.warn('Skipping lead creation: contactId not provided or unresolved');
      return { skipped: true, reason: 'contactId not provided or unresolved' };
    }

    const leadData: InsertLead = {
      title: this.resolveVariable(title, context) || 'Test Lead',
      description: description ? this.resolveVariable(description, context) : undefined,
      value: value ? parseInt(this.resolveVariable(value, context)) : undefined,
      status: status || "prospect",
      contactId: resolvedContactId,
      companyId: companyId ? this.resolveVariable(companyId, context) : undefined,
      userId: context.userId,
    };

    return await storage.createLead(leadData);
  }

  private async executeCreateActivity(
    node: WorkflowNode,
    context: ExecutionContext,
    previousResults: Record<string, any>
  ): Promise<any> {
    const { type, title, description, contactId, leadId } = node.data;

    return await storage.createActivity({
      type: type || "note",
      title: this.resolveVariable(title, context),
      description: this.resolveVariable(description, context),
      contactId: contactId ? this.resolveVariable(contactId, context) : undefined,
      leadId: leadId ? this.resolveVariable(leadId, context) : undefined,
      userId: context.userId,
    });
  }

  private async executeSendNotification(
    node: WorkflowNode,
    context: ExecutionContext,
    previousResults: Record<string, any>
  ): Promise<any> {
    const { message, channel } = node.data;
    console.log(`[Notification] ${channel}: ${this.resolveVariable(message, context)}`);
    return { sent: true, channel, message: this.resolveVariable(message, context) };
  }

  private async executeCondition(
    node: WorkflowNode,
    context: ExecutionContext,
    previousResults: Record<string, any>
  ): Promise<any> {
    const { field, operator, value } = node.data;
    const fieldValue = this.resolveVariable(field, context);

    switch (operator) {
      case "equals":
        return fieldValue === value;
      case "not_equals":
        return fieldValue !== value;
      case "contains":
        return String(fieldValue).includes(value);
      case "greater_than":
        return Number(fieldValue) > Number(value);
      case "less_than":
        return Number(fieldValue) < Number(value);
      default:
        return false;
    }
  }

  private async executeDelay(node: WorkflowNode): Promise<any> {
    const { duration } = node.data;
    await new Promise(resolve => setTimeout(resolve, duration || 1000));
    return { delayed: duration };
  }

  private resolveVariable(value: string, context: ExecutionContext): string {
    if (typeof value !== "string") return value;

    return value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const keys = path.trim().split(".");
      let current: any = { ...context.trigger, ...context.variables };

      for (const key of keys) {
        if (current && typeof current === "object" && key in current) {
          current = current[key];
        } else {
          return match;
        }
      }

      return current;
    });
  }
}

export const workflowEngine = new WorkflowEngine();
