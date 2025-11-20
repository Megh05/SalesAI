import { storage } from './storage';
import { orgContextService } from './organization-context.service';
import { db } from './db';
import { leads } from '@shared/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import type { Lead } from '@shared/schema';

export interface AssignmentRecommendation {
  userId: string;
  userName: string;
  score: number;
  reasoning: string;
  workload: {
    activeLeads: number;
    totalValue: number;
    recentAssignments: number;
  };
}

export class AIAssignmentService {
  async getRecommendations(
    leadId: string,
    organizationId: string,
    requesterId: string
  ): Promise<AssignmentRecommendation[]> {
    const lead = await storage.getLead(leadId, requesterId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Get all team members in the organization
    const teamMembers = await storage.getOrganizationMembers(organizationId);
    
    // Filter to only sales reps and managers
    const salesTeam = [];
    for (const member of teamMembers) {
      const context = await orgContextService.getContext(member.userId, organizationId);
      if (context && ['SALES_REP', 'SALES_MANAGER'].includes(context.role || '')) {
        salesTeam.push(member);
      }
    }

    if (salesTeam.length === 0) {
      return [];
    }

    // Calculate scores for each team member
    const recommendations: AssignmentRecommendation[] = [];

    for (const member of salesTeam) {
      const workload = await this.calculateWorkload(member.userId, organizationId);
      const score = this.calculateAssignmentScore(lead, workload);
      const reasoning = this.generateReasoning(lead, workload, score);

      recommendations.push({
        userId: member.userId,
        userName: `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || member.user.email,
        score,
        reasoning,
        workload,
      });
    }

    // Sort by score descending
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations;
  }

  private async calculateWorkload(userId: string, organizationId: string) {
    const allLeads = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.organizationId, organizationId),
          eq(leads.assignedTo, userId)
        )
      );

    const activeLeads = allLeads.filter(l => 
      !['closed_won', 'closed_lost'].includes(l.status)
    );

    const totalValue = activeLeads.reduce((sum, l) => sum + (l.value || 0), 0);

    // Get recent assignments (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentAssignments = allLeads.filter(l => 
      new Date(l.createdAt) >= sevenDaysAgo
    ).length;

    return {
      activeLeads: activeLeads.length,
      totalValue,
      recentAssignments,
    };
  }

  private calculateAssignmentScore(
    lead: Lead,
    workload: { activeLeads: number; totalValue: number; recentAssignments: number }
  ): number {
    let score = 100;

    // Penalize based on active leads (more leads = lower score)
    score -= workload.activeLeads * 5;

    // Penalize based on total pipeline value
    const valueWeight = Math.min(workload.totalValue / 100000, 20);
    score -= valueWeight;

    // Penalize based on recent assignments
    score -= workload.recentAssignments * 10;

    // Keep score in range
    return Math.max(0, Math.min(100, score));
  }

  private generateReasoning(
    lead: Lead,
    workload: { activeLeads: number; totalValue: number; recentAssignments: number },
    score: number
  ): string {
    const reasons: string[] = [];

    if (workload.activeLeads < 5) {
      reasons.push('Low active lead count');
    } else if (workload.activeLeads > 15) {
      reasons.push('High active lead count');
    } else {
      reasons.push('Moderate workload');
    }

    if (workload.recentAssignments === 0) {
      reasons.push('No recent assignments');
    } else if (workload.recentAssignments > 5) {
      reasons.push('Many recent assignments');
    }

    if (workload.totalValue < 50000) {
      reasons.push('Low pipeline value');
    } else if (workload.totalValue > 200000) {
      reasons.push('High pipeline value');
    }

    return reasons.join(', ');
  }

  async assignRoundRobin(
    leadId: string,
    organizationId: string,
    assignedBy: string
  ): Promise<string> {
    // Get organization settings
    const org = await storage.getOrganization(organizationId);
    if (!org) {
      throw new Error('Organization not found');
    }

    const settings = org.settings ? JSON.parse(org.settings) : {};
    if (!settings.roundRobinEnabled) {
      throw new Error('Round robin is not enabled for this organization');
    }

    // Get all team members
    const teamMembers = await storage.getOrganizationMembers(organizationId);
    const salesTeam = [];
    for (const member of teamMembers) {
      const context = await orgContextService.getContext(member.userId, organizationId);
      if (context && ['SALES_REP', 'SALES_MANAGER'].includes(context.role || '')) {
        salesTeam.push(member);
      }
    }

    if (salesTeam.length === 0) {
      throw new Error('No sales team members available');
    }

    // Get last assignment index
    const lastIndex = settings.roundRobinLastIndex || 0;
    const nextIndex = (lastIndex + 1) % salesTeam.length;
    const assignedTo = salesTeam[nextIndex].userId;

    // Update organization settings with new index
    await storage.updateOrganization(organizationId, {
      settings: JSON.stringify({
        ...settings,
        roundRobinLastIndex: nextIndex,
      }),
    });

    // Create assignment record
    await storage.createLeadAssignment({
      leadId,
      assignedTo,
      assignedBy,
      assignmentMethod: 'round_robin',
      aiReasoning: JSON.stringify({
        method: 'round_robin',
        index: nextIndex,
        totalMembers: salesTeam.length,
      }),
    });

    // Update lead
    await storage.updateLead(leadId, assignedBy, { assignedTo });

    return assignedTo;
  }
}

export const aiAssignmentService = new AIAssignmentService();

// Import db at the bottom to avoid circular dependency
import { db } from './db';
import { leads } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
