import { storage } from './storage';
import { aiService } from './ai';

export class AssignmentService {
  async getAIRecommendation(leadId: string, organizationId: string) {
    // Get organization members first to get a valid userId
    const members = await storage.getOrganizationMembers(organizationId);
    if (members.length === 0) {
      throw new Error('No team members found in organization');
    }
    
    // Use first member's userId to fetch lead (any member can access org data)
    const firstUserId = members[0].userId;
    const lead = await storage.getLead(leadId, firstUserId);
    if (!lead) {
      throw new Error('Lead not found');
    }
    
    const [contact, company] = await Promise.all([
      lead.contactId ? storage.getContact(lead.contactId, firstUserId) : null,
      lead.companyId ? storage.getCompany(lead.companyId, firstUserId) : null,
    ]);
    
    // Get all leads for this organization to calculate workloads
    const allLeads = await storage.getLeads(firstUserId);
    
    // Get lead count for each member
    const memberWorkloads = members.map((m) => {
      const userLeads = allLeads.filter(l => l.assignedTo === m.userId);
      return {
        userId: m.userId,
        name: `${m.user.firstName} ${m.user.lastName}`,
        email: m.user.email,
        currentLeads: userLeads.length,
        role: m.role,
      };
    });
    
    // Call AI for recommendation
    const prompt = `You are an AI sales assistant helping to assign a lead to the best team member.

Lead Details:
- Title: ${lead.title}
- Value: ${lead.value ? `$${lead.value}` : 'Unknown'}
- Status: ${lead.status}
- Contact: ${contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown'}
- Company: ${company?.name || 'Unknown'}
- Industry: ${company?.industry || 'Unknown'}

Team Members:
${memberWorkloads.map(m => `- ${m.name} (${m.role}): Currently handling ${m.currentLeads} leads`).join('\n')}

Based on this information, recommend the best team member to assign this lead to. Consider:
1. Current workload balance
2. Role suitability (managers for high-value, reps for standard)
3. Industry match if known
4. Lead value

Respond with valid JSON:
{
  "recommendedUserId": "user-id",
  "confidence": 85,
  "reasoning": "Clear explanation of why this person is the best choice"
}`;
    
    const apiKey = await storage.getUserSettings(lead.userId);
    if (!apiKey?.openRouterApiKey) {
      throw new Error('AI API key not configured');
    }
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.REPLIT_DOMAINS 
            ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
            : 'http://localhost:5000',
          'X-Title': 'SalesPilot',
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });
      
      if (!response.ok) {
        throw new Error('AI request failed');
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }
      
      const recommendation = JSON.parse(jsonMatch[0]);
      
      // Find recommended member
      const recommendedMember = memberWorkloads.find(m => m.userId === recommendation.recommendedUserId);
      
      return {
        ...recommendation,
        member: recommendedMember,
      };
      
    } catch (error) {
      console.error('AI recommendation error:', error);
      // Fallback to round-robin
      const leastBusy = memberWorkloads.reduce((prev, current) => 
        current.currentLeads < prev.currentLeads ? current : prev
      );
      
      return {
        recommendedUserId: leastBusy.userId,
        confidence: 50,
        reasoning: 'AI unavailable. Assigned to least busy team member.',
        member: leastBusy,
      };
    }
  }
  
  async assignLead(
    leadId: string,
    assignedTo: string,
    assignedBy: string,
    method: 'manual' | 'ai' | 'round_robin',
    aiReasoning?: string
  ) {
    // Update lead
    await storage.updateLead(leadId, assignedBy, { assignedTo });
    
    // Create assignment record
    const assignment = await storage.createLeadAssignment({
      leadId,
      assignedTo,
      assignedBy,
      assignmentMethod: method,
      aiReasoning: aiReasoning ? JSON.stringify({ reasoning: aiReasoning }) : null,
    });
    
    return assignment;
  }
}

export const assignmentService = new AssignmentService();
