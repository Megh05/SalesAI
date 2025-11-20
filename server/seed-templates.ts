import { storage } from "./storage";

export async function seedWorkflowTemplates() {
  console.log("Seeding workflow templates...");

  const templates = [
    {
      name: "Lead Nurturing Sequence",
      description: "Automated follow-up sequence for new leads with educational content and value-driven touchpoints",
      category: "nurturing",
      triggerType: "lead_created",
      steps: [
        {
          name: "Initial Welcome Email",
          stepOrder: 1,
          actionType: "send_email",
          delay: 0,
          config: {
            subject: "Welcome! Let's get started",
            template: "Hi {{firstName}},\n\nThank you for your interest! I wanted to personally reach out and see how we can help you achieve your goals.\n\nBest regards,\n{{senderName}}",
          },
        },
        {
          name: "Share Resource",
          stepOrder: 2,
          actionType: "send_email",
          delay: 3,
          config: {
            subject: "Thought this might help",
            template: "Hi {{firstName}},\n\nI came across this resource that might be valuable for your {{industry}} business.\n\nWould love to hear your thoughts!\n\nBest,\n{{senderName}}",
          },
        },
        {
          name: "Check-in Call",
          stepOrder: 3,
          actionType: "schedule_call",
          delay: 7,
          config: {
            duration: 15,
            purpose: "Quick check-in to see if you have any questions",
          },
        },
        {
          name: "Case Study Follow-up",
          stepOrder: 4,
          actionType: "send_email",
          delay: 14,
          config: {
            subject: "How {{companyName}} increased their ROI by 40%",
            template: "Hi {{firstName}},\n\nI wanted to share how we helped a similar company in {{industry}} achieve amazing results.\n\nWould you be interested in a brief call to discuss?\n\nBest,\n{{senderName}}",
          },
        },
      ],
    },
    {
      name: "Cold Outreach Campaign",
      description: "Multi-touch cold outreach sequence with personalized messaging and strategic timing",
      category: "outreach",
      triggerType: "manual",
      steps: [
        {
          name: "Personalized Introduction",
          stepOrder: 1,
          actionType: "send_email",
          delay: 0,
          config: {
            subject: "Quick question about {{companyName}}",
            template: "Hi {{firstName}},\n\nI noticed {{companyName}} is doing interesting work in {{industry}}. I specialize in helping companies like yours with [value proposition].\n\nWould you be open to a brief conversation?\n\nBest,\n{{senderName}}",
          },
        },
        {
          name: "LinkedIn Connection",
          stepOrder: 2,
          actionType: "send_linkedin_message",
          delay: 1,
          config: {
            message: "Hi {{firstName}}, I sent you an email about collaborating with {{companyName}}. Would love to connect here as well!",
          },
        },
        {
          name: "Value-Add Follow-up",
          stepOrder: 3,
          actionType: "send_email",
          delay: 4,
          config: {
            subject: "Thought you'd find this interesting",
            template: "Hi {{firstName}},\n\nFollowing up on my previous email - I came across this insight about {{industry}} and thought of you.\n\n[Insert valuable insight or resource]\n\nStill interested in connecting?\n\nBest,\n{{senderName}}",
          },
        },
        {
          name: "Final Breakup Email",
          stepOrder: 4,
          actionType: "send_email",
          delay: 7,
          config: {
            subject: "Should I close your file?",
            template: "Hi {{firstName}},\n\nI haven't heard back, so I'm assuming this isn't a priority right now.\n\nShould I close your file, or is there a better time to reconnect?\n\nBest,\n{{senderName}}",
          },
        },
      ],
    },
    {
      name: "Lead Recovery Sequence",
      description: "Re-engagement campaign for cold or stalled leads with special offers and urgency triggers",
      category: "recovery",
      triggerType: "lead_inactive",
      steps: [
        {
          name: "Are You Still Interested?",
          stepOrder: 1,
          actionType: "send_email",
          delay: 0,
          config: {
            subject: "Are we still a good fit?",
            template: "Hi {{firstName}},\n\nIt's been a while since we last connected. I wanted to check in - are you still interested in [solution]?\n\nIf timing isn't right, no worries! Just let me know.\n\nBest,\n{{senderName}}",
          },
        },
        {
          name: "Share New Feature/Update",
          stepOrder: 2,
          actionType: "send_email",
          delay: 4,
          config: {
            subject: "New updates you might find valuable",
            template: "Hi {{firstName}},\n\nWe've recently launched some exciting new features that directly address challenges in {{industry}}.\n\nWould you be interested in a quick demo?\n\nBest,\n{{senderName}}",
          },
        },
        {
          name: "Limited-Time Offer",
          stepOrder: 3,
          actionType: "send_email",
          delay: 7,
          config: {
            subject: "Special offer for {{companyName}}",
            template: "Hi {{firstName}},\n\nI wanted to extend a special offer exclusively for {{companyName}}.\n\n[Details of offer with deadline]\n\nThis expires in 7 days. Interested in learning more?\n\nBest,\n{{senderName}}",
          },
        },
        {
          name: "Final Check-in",
          stepOrder: 4,
          actionType: "send_email",
          delay: 14,
          config: {
            subject: "Last chance to connect",
            template: "Hi {{firstName}},\n\nThis is my final follow-up. If you're not interested, I completely understand and won't bother you again.\n\nBut if there's even a small chance this could help {{companyName}}, I'd love to chat.\n\nBest,\n{{senderName}}",
          },
        },
      ],
    },
  ];

  try {
    for (const template of templates) {
      const { steps, ...templateData } = template;

      // Check if template already exists by name
      const existingTemplates = await storage.getWorkflowTemplates();
      const exists = existingTemplates.find(t => t.name === template.name);

      if (exists) {
        console.log(`Template "${template.name}" already exists, skipping...`);
        continue;
      }

      // Create the template
      const createdTemplate = await storage.createWorkflowTemplate(templateData);
      console.log(`Created template: ${createdTemplate.name}`);

      // Create the steps
      for (const step of steps) {
        await storage.createWorkflowTemplateStep({
          templateId: createdTemplate.id,
          ...step,
        });
      }

      console.log(`  Added ${steps.length} steps to ${createdTemplate.name}`);
    }

    console.log("Workflow templates seeded successfully!");
    return true;
  } catch (error) {
    console.error("Error seeding workflow templates:", error);
    throw error;
  }
}
