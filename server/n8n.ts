import type { UserSettings } from "@shared/schema";

export class N8nService {
  async triggerWorkflow(settings: UserSettings | undefined, event: string, data: any): Promise<void> {
    if (!settings?.n8nConnected || !settings?.n8nWebhookUrl) {
      return;
    }

    try {
      const payload = {
        event,
        timestamp: new Date().toISOString(),
        userId: settings.userId,
        data,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (settings.n8nApiKey) {
        headers['X-N8N-API-KEY'] = settings.n8nApiKey;
      }

      const response = await fetch(settings.n8nWebhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`n8n webhook failed: ${response.status}`);
      } else {
        console.log(`n8n workflow triggered: ${event}`);
      }
    } catch (error) {
      console.error('Error triggering n8n workflow:', error);
    }
  }
}

export const n8nService = new N8nService();
