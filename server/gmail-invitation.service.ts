import { gmailService } from './gmail';
import { storage } from './storage';

export class GmailInvitationService {
  async sendInvitationEmail(params: {
    to: string;
    inviterName: string;
    organizationName: string;
    teamName?: string;
    inviteToken: string;
    userId: string;
  }): Promise<void> {
    const { to, inviterName, organizationName, teamName, inviteToken, userId } = params;

    // Get the base URL
    const baseUrl = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000';

    const inviteUrl = `${baseUrl}/invite/${inviteToken}`;

    const subject = `You've been invited to join ${organizationName}`;
    
    const body = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #4F46E5; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SalesPilot Invitation</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong>${teamName ? ` as part of the <strong>${teamName}</strong> team` : ''}.</p>
      
      <p>SalesPilot is an AI-powered sales automation platform that helps teams manage leads, contacts, and sales processes more efficiently.</p>
      
      <p style="text-align: center;">
        <a href="${inviteUrl}" class="button">Accept Invitation</a>
      </p>
      
      <p style="font-size: 14px; color: #6b7280;">
        Or copy and paste this link into your browser:<br>
        <code>${inviteUrl}</code>
      </p>
      
      <p>This invitation will expire in 7 days.</p>
      
      <p>Best regards,<br>The SalesPilot Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    try {
      // Get OAuth token for the user
      const token = await storage.getOAuthToken(userId, 'gmail');
      if (!token) {
        console.warn('Gmail not connected for user', userId, '- skipping invitation email');
        return;
      }

      const settings = await storage.getUserSettings(userId);
      if (!settings?.gmailClientId || !settings?.gmailClientSecret) {
        console.warn('Gmail credentials not configured - skipping invitation email');
        return;
      }

      // Send email via Gmail API
      await gmailService.sendEmail(
        userId,
        settings.gmailClientId,
        settings.gmailClientSecret,
        {
          to,
          subject,
          body,
          isHtml: true,
        }
      );

      console.log('Invitation email sent to:', to);
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      // Don't throw - invitation is created, email is best effort
    }
  }

  async sendInvitationResend(invitationId: string, userId: string): Promise<void> {
    const invitation = await storage.getInvitation(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new Error('Can only resend pending invitations');
    }

    // Get inviter details
    const inviter = await storage.getUser(invitation.invitedBy);
    if (!inviter) {
      throw new Error('Inviter not found');
    }

    // Get organization details
    const org = await storage.getOrganization(invitation.organizationId);
    if (!org) {
      throw new Error('Organization not found');
    }

    // Get team details if applicable
    let teamName: string | undefined;
    if (invitation.teamId) {
      const team = await storage.getTeam(invitation.teamId);
      teamName = team?.name;
    }

    await this.sendInvitationEmail({
      to: invitation.email,
      inviterName: `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim() || inviter.email,
      organizationName: org.name,
      teamName,
      inviteToken: invitation.token,
      userId: invitation.invitedBy,
    });

    // Update invitation timestamp
    await storage.updateInvitation(invitationId, {
      updatedAt: new Date(),
    });
  }
}

export const gmailInvitationService = new GmailInvitationService();
