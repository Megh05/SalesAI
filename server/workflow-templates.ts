import type { InsertWorkflow } from "@shared/schema";

export const workflowTemplates: Omit<InsertWorkflow, "userId">[] = [
  {
    name: "Lead Nurturing - Auto Follow-up",
    description: "Automatically classify incoming emails and create leads for qualified prospects",
    trigger: "email_received",
    triggerConfig: JSON.stringify({ source: "gmail" }),
    isTemplate: true,
    isActive: false,
    nodes: JSON.stringify([
      {
        id: "trigger-1",
        type: "trigger",
        data: { label: "New Email Received" },
        position: { x: 100, y: 100 },
      },
      {
        id: "ai-classify-1",
        type: "ai_classify",
        data: {
          label: "AI Email Classification",
          emailSubject: "{{trigger.subject}}",
          emailFrom: "{{trigger.from}}",
          emailPreview: "{{trigger.preview}}",
        },
        position: { x: 100, y: 200 },
      },
      {
        id: "condition-1",
        type: "condition",
        data: {
          label: "Is Lead Inquiry?",
          field: "{{ai-classify-1.classification}}",
          operator: "equals",
          value: "Lead Inquiry",
        },
        position: { x: 100, y: 300 },
      },
      {
        id: "create-lead-1",
        type: "create_lead",
        data: {
          label: "Create New Lead",
          title: "{{trigger.subject}}",
          description: "Auto-created from email: {{trigger.preview}}",
          status: "prospect",
          contactId: "{{trigger.contactId}}",
        },
        position: { x: 100, y: 400 },
      },
      {
        id: "notification-1",
        type: "send_notification",
        data: {
          label: "Notify Team",
          message: "New lead created: {{trigger.subject}}",
          channel: "internal",
        },
        position: { x: 100, y: 500 },
      },
    ]),
    edges: JSON.stringify([
      { id: "e1", source: "trigger-1", target: "ai-classify-1" },
      { id: "e2", source: "ai-classify-1", target: "condition-1" },
      { id: "e3", source: "condition-1", target: "create-lead-1" },
      { id: "e4", source: "create-lead-1", target: "notification-1" },
    ]),
  },
  {
    name: "Cold Outreach - Auto Response",
    description: "Generate personalized AI responses for prospect inquiries",
    trigger: "email_received",
    triggerConfig: JSON.stringify({ source: "gmail", filter: "label:prospects" }),
    isTemplate: true,
    isActive: false,
    nodes: JSON.stringify([
      {
        id: "trigger-1",
        type: "trigger",
        data: { label: "Prospect Email" },
        position: { x: 100, y: 100 },
      },
      {
        id: "ai-summarize-1",
        type: "ai_summarize",
        data: {
          label: "Summarize Email",
          emailSubject: "{{trigger.subject}}",
          emailFrom: "{{trigger.from}}",
          emailBody: "{{trigger.body}}",
        },
        position: { x: 100, y: 200 },
      },
      {
        id: "ai-reply-1",
        type: "ai_generate_reply",
        data: {
          label: "Generate Reply",
          emailContent: "{{trigger.body}}",
          tone: "professional",
          context: "Sales outreach for B2B SaaS platform",
        },
        position: { x: 100, y: 300 },
      },
      {
        id: "activity-1",
        type: "create_activity",
        data: {
          label: "Log Activity",
          type: "email",
          title: "AI-assisted reply sent",
          description: "{{ai-reply-1.reply}}",
          contactId: "{{trigger.contactId}}",
        },
        position: { x: 100, y: 400 },
      },
    ]),
    edges: JSON.stringify([
      { id: "e1", source: "trigger-1", target: "ai-summarize-1" },
      { id: "e2", source: "ai-summarize-1", target: "ai-reply-1" },
      { id: "e3", source: "ai-reply-1", target: "activity-1" },
    ]),
  },
  {
    name: "Deal Progress Tracker",
    description: "Monitor negotiations and notify team of key milestones",
    trigger: "email_received",
    triggerConfig: JSON.stringify({ source: "gmail", filter: "label:negotiations" }),
    isTemplate: true,
    isActive: false,
    nodes: JSON.stringify([
      {
        id: "trigger-1",
        type: "trigger",
        data: { label: "Negotiation Email" },
        position: { x: 100, y: 100 },
      },
      {
        id: "ai-classify-1",
        type: "ai_classify",
        data: {
          label: "Classify Stage",
          emailSubject: "{{trigger.subject}}",
          emailFrom: "{{trigger.from}}",
          emailPreview: "{{trigger.preview}}",
        },
        position: { x: 100, y: 200 },
      },
      {
        id: "condition-1",
        type: "condition",
        data: {
          label: "Is Positive Signal?",
          field: "{{ai-classify-1.classification}}",
          operator: "equals",
          value: "Negotiation",
        },
        position: { x: 100, y: 300 },
      },
      {
        id: "activity-1",
        type: "create_activity",
        data: {
          label: "Log Negotiation Update",
          type: "note",
          title: "Deal progress update",
          description: "Classification: {{ai-classify-1.classification}}, Confidence: {{ai-classify-1.confidence}}%",
          leadId: "{{trigger.leadId}}",
        },
        position: { x: 100, y: 400 },
      },
      {
        id: "notification-1",
        type: "send_notification",
        data: {
          label: "Alert Sales Team",
          message: "Deal update: {{trigger.subject}} - {{ai-classify-1.nextAction}}",
          channel: "slack",
        },
        position: { x: 100, y: 500 },
      },
    ]),
    edges: JSON.stringify([
      { id: "e1", source: "trigger-1", target: "ai-classify-1" },
      { id: "e2", source: "ai-classify-1", target: "condition-1" },
      { id: "e3", source: "condition-1", target: "activity-1" },
      { id: "e4", source: "activity-1", target: "notification-1" },
    ]),
  },
  {
    name: "Abandoned Lead Recovery",
    description: "Re-engage leads that haven't responded in 7 days",
    trigger: "scheduled",
    triggerConfig: JSON.stringify({ schedule: "daily", time: "09:00" }),
    isTemplate: true,
    isActive: false,
    nodes: JSON.stringify([
      {
        id: "trigger-1",
        type: "trigger",
        data: { label: "Daily Check - 9 AM" },
        position: { x: 100, y: 100 },
      },
      {
        id: "condition-1",
        type: "condition",
        data: {
          label: "No Response > 7 Days?",
          field: "{{trigger.daysSinceContact}}",
          operator: "greater_than",
          value: "7",
        },
        position: { x: 100, y: 200 },
      },
      {
        id: "ai-reply-1",
        type: "ai_generate_reply",
        data: {
          label: "Generate Follow-up",
          emailContent: "{{trigger.lastEmailContent}}",
          tone: "friendly",
          context: "Following up on previous conversation about our services",
        },
        position: { x: 100, y: 300 },
      },
      {
        id: "activity-1",
        type: "create_activity",
        data: {
          label: "Log Follow-up",
          type: "email",
          title: "Automated follow-up sent",
          description: "Re-engagement attempt for abandoned lead",
          leadId: "{{trigger.leadId}}",
        },
        position: { x: 100, y: 400 },
      },
    ]),
    edges: JSON.stringify([
      { id: "e1", source: "trigger-1", target: "condition-1" },
      { id: "e2", source: "condition-1", target: "ai-reply-1" },
      { id: "e3", source: "ai-reply-1", target: "activity-1" },
    ]),
  },
  {
    name: "Smart Lead Scoring",
    description: "Automatically score and prioritize leads based on email engagement",
    trigger: "email_received",
    triggerConfig: JSON.stringify({ source: "gmail" }),
    isTemplate: true,
    isActive: false,
    nodes: JSON.stringify([
      {
        id: "trigger-1",
        type: "trigger",
        data: { label: "Email Received" },
        position: { x: 100, y: 100 },
      },
      {
        id: "ai-classify-1",
        type: "ai_classify",
        data: {
          label: "Analyze Intent",
          emailSubject: "{{trigger.subject}}",
          emailFrom: "{{trigger.from}}",
          emailPreview: "{{trigger.preview}}",
        },
        position: { x: 100, y: 200 },
      },
      {
        id: "condition-1",
        type: "condition",
        data: {
          label: "High Confidence?",
          field: "{{ai-classify-1.confidence}}",
          operator: "greater_than",
          value: "80",
        },
        position: { x: 100, y: 300 },
      },
      {
        id: "activity-1",
        type: "create_activity",
        data: {
          label: "Mark as High Priority",
          type: "note",
          title: "High-value lead detected",
          description: "AI confidence: {{ai-classify-1.confidence}}% - {{ai-classify-1.nextAction}}",
          leadId: "{{trigger.leadId}}",
        },
        position: { x: 100, y: 400 },
      },
      {
        id: "notification-1",
        type: "send_notification",
        data: {
          label: "Alert Team Lead",
          message: "🔥 High-priority lead: {{trigger.subject}}",
          channel: "urgent",
        },
        position: { x: 100, y: 500 },
      },
    ]),
    edges: JSON.stringify([
      { id: "e1", source: "trigger-1", target: "ai-classify-1" },
      { id: "e2", source: "ai-classify-1", target: "condition-1" },
      { id: "e3", source: "condition-1", target: "activity-1" },
      { id: "e4", source: "activity-1", target: "notification-1" },
    ]),
  },
];

export async function seedWorkflowTemplates(userId: string): Promise<void> {
  const { storage } = await import("./storage");
  
  for (const template of workflowTemplates) {
    await storage.createWorkflow({
      ...template,
      userId,
    });
  }
}
