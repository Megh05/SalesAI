import { storage } from "./storage";

interface ClassificationResult {
  classification: string;
  confidence: number;
  nextAction: string;
}

interface SummarizationResult {
  summary: string;
}

export class AIService {
  private async getApiKey(userId: string): Promise<string | null> {
    const settings = await storage.getUserSettings(userId);
    return settings?.openrouterApiKey || null;
  }

  private async makeOpenRouterRequest(
    apiKey: string,
    messages: { role: string; content: string }[],
    maxTokens: number = 500
  ): Promise<any> {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.REPLIT_DOMAINS 
          ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
          : "http://localhost:5000",
        "X-Title": "SalesPilot",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages,
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "AI request failed");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async classifyEmail(
    userId: string,
    emailContent: {
      subject: string;
      from: string;
      preview: string;
    }
  ): Promise<ClassificationResult | null> {
    try {
      const apiKey = await this.getApiKey(userId);
      if (!apiKey) {
        console.warn("No API key configured for user", userId);
        return null;
      }

      const prompt = `You are an AI sales assistant. Classify the following email and provide a confidence score (0-100) and suggested next action.

Email Details:
From: ${emailContent.from}
Subject: ${emailContent.subject}
Preview: ${emailContent.preview}

Classify this email into one of these categories:
- Lead Inquiry (new potential customer asking about products/services)
- Follow-up (continuing an existing conversation)
- Negotiation (discussing terms, pricing, or contracts)
- Meeting Request (scheduling or confirming meetings)
- Support Request (technical or customer service issues)
- Closed Won (deal completed successfully)
- Closed Lost (deal not pursued or lost)
- Other (doesn't fit other categories)

Respond ONLY with valid JSON in this exact format:
{
  "classification": "category name",
  "confidence": 85,
  "nextAction": "Brief suggested action (max 100 chars)"
}`;

      const response = await this.makeOpenRouterRequest(
        apiKey,
        [{ role: "user", content: prompt }],
        200
      );

      // Parse the JSON response
      const cleaned = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const result = JSON.parse(cleaned);

      return {
        classification: result.classification || "Other",
        confidence: Math.min(100, Math.max(0, result.confidence || 50)),
        nextAction: result.nextAction || "Review and respond",
      };
    } catch (error) {
      console.error("Error classifying email:", error);
      return null;
    }
  }

  async summarizeEmail(
    userId: string,
    emailContent: {
      subject: string;
      from: string;
      body: string;
    }
  ): Promise<SummarizationResult | null> {
    try {
      const apiKey = await this.getApiKey(userId);
      if (!apiKey) {
        console.warn("No API key configured for user", userId);
        return null;
      }

      const prompt = `Summarize the following email in 2-3 concise sentences. Focus on key points, requests, and action items.

Email:
From: ${emailContent.from}
Subject: ${emailContent.subject}

${emailContent.body}

Provide a clear, professional summary:`;

      const summary = await this.makeOpenRouterRequest(
        apiKey,
        [{ role: "user", content: prompt }],
        150
      );

      return {
        summary: summary.trim(),
      };
    } catch (error) {
      console.error("Error summarizing email:", error);
      return null;
    }
  }

  async generateReply(
    userId: string,
    emailContent: {
      subject: string;
      from: string;
      body: string;
    },
    tone: "professional" | "friendly" | "persuasive" = "professional"
  ): Promise<string | null> {
    try {
      const apiKey = await this.getApiKey(userId);
      if (!apiKey) {
        console.warn("No API key configured for user", userId);
        return null;
      }

      const toneInstructions = {
        professional: "Write in a professional, business-appropriate tone.",
        friendly: "Write in a warm, friendly tone while maintaining professionalism.",
        persuasive: "Write persuasively to encourage action or agreement.",
      };

      const prompt = `You are a sales professional writing a reply to this email. ${toneInstructions[tone]}

Original Email:
From: ${emailContent.from}
Subject: ${emailContent.subject}

${emailContent.body}

Write a clear, concise reply that addresses the main points:`;

      const reply = await this.makeOpenRouterRequest(
        apiKey,
        [{ role: "user", content: prompt }],
        300
      );

      return reply.trim();
    } catch (error) {
      console.error("Error generating reply:", error);
      return null;
    }
  }

  async extractContactInfo(
    userId: string,
    emailContent: {
      from: string;
      subject: string;
      body: string;
    }
  ): Promise<{
    name?: string;
    company?: string;
    role?: string;
    phone?: string;
  } | null> {
    try {
      const apiKey = await this.getApiKey(userId);
      if (!apiKey) {
        console.warn("No API key configured for user", userId);
        return null;
      }

      const prompt = `Extract contact information from this email. Return ONLY valid JSON.

Email:
From: ${emailContent.from}
Subject: ${emailContent.subject}

${emailContent.body}

Extract and return in this exact JSON format (use null for missing fields):
{
  "name": "Full Name or null",
  "company": "Company Name or null",
  "role": "Job Title or null",
  "phone": "Phone Number or null"
}`;

      const response = await this.makeOpenRouterRequest(
        apiKey,
        [{ role: "user", content: prompt }],
        150
      );

      const cleaned = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const result = JSON.parse(cleaned);

      return {
        name: result.name || undefined,
        company: result.company || undefined,
        role: result.role || undefined,
        phone: result.phone || undefined,
      };
    } catch (error) {
      console.error("Error extracting contact info:", error);
      return null;
    }
  }
}

export const aiService = new AIService();
