import { storage } from './storage';
import { gmailService } from './gmail';
import crypto from 'crypto';

export class InvitationService {
  async createInvitation(
    email: string,
    organizationId: string,
    roleId: string,
    invitedBy: string,
    teamId?: string
  ) {
    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Create invitation record
    const invitation = await storage.createInvitation({
      email,
      organizationId,
      teamId: teamId || null,
      roleId,
      token,
      status: 'PENDING',
      invitedBy,
      expiresAt,
    });
    
    return invitation;
  }
  
  async sendInvitationEmail(invitationId: string) {
    const invitation = await storage.getInvitation(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    const org = await storage.getOrganization(invitation.organizationId);
    const inviter = await storage.getUserById(invitation.invitedBy);
    const role = await storage.getRole(invitation.roleId);
    
    if (!org || !inviter || !role) {
      throw new Error('Invalid invitation data');
    }
    
    const appUrl = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000';
    
    const acceptUrl = `${appUrl}/accept-invite?token=${invitation.token}`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've been invited to join ${org.name}</h2>
        <p>
          ${inviter.firstName} ${inviter.lastName} has invited you to join <strong>${org.name}</strong> 
          as a <strong>${role.name}</strong>.
        </p>
        <p>
          <a href="${acceptUrl}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
            Accept Invitation
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Or copy and paste this link: ${acceptUrl}
        </p>
      </div>
    `;
    
    // Get Gmail settings from inviter
    const settings = await storage.getUserSettings(invitation.invitedBy);
    if (!settings?.gmailConnected || !settings.gmailClientId || !settings.gmailClientSecret) {
      throw new Error('Gmail not configured for sender');
    }
    
    const oauthToken = await storage.getOAuthToken(invitation.invitedBy, 'gmail');
    if (!oauthToken) {
      throw new Error('Gmail OAuth token not found');
    }
    
    const gmail = await gmailService.getGmailClient(
      oauthToken.accessToken,
      oauthToken.refreshToken!,
      settings.gmailClientId,
      settings.gmailClientSecret
    );
    
    await gmailService.sendEmail(gmail, {
      to: invitation.email,
      subject: `You've been invited to join ${org.name} on SalesPilot`,
      text: `You've been invited to join ${org.name}. Accept your invitation: ${acceptUrl}`,
      html: emailHtml,
    });
    
    return invitation;
  }
  
  async acceptInvitation(token: string, userId: string) {
    const invitation = await storage.getInvitationByToken(token);
    
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    if (invitation.status !== 'PENDING') {
      throw new Error('Invitation already processed');
    }
    
    if (new Date() > invitation.expiresAt) {
      await storage.updateInvitation(invitation.id, { status: 'EXPIRED' });
      throw new Error('Invitation has expired');
    }
    
    // Get user's email to verify it matches
    const user = await storage.getUserById(userId);
    if (!user || user.email !== invitation.email) {
      throw new Error('Invitation email does not match user email');
    }
    
    // Add user to team if teamId is specified
    if (invitation.teamId) {
      await storage.addTeamMember({
        teamId: invitation.teamId,
        userId,
        roleId: invitation.roleId,
        role: 'member',
        invitationStatus: 'ACCEPTED',
      });
    }
    
    // Mark invitation as accepted
    await storage.updateInvitation(invitation.id, { status: 'ACCEPTED' });
    
    return invitation;
  }
  
  async resendInvitation(invitationId: string) {
    const invitation = await storage.getInvitation(invitationId);
    
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    
    if (invitation.status !== 'PENDING') {
      throw new Error('Can only resend pending invitations');
    }
    
    // Extend expiry
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await storage.updateInvitation(invitationId, { expiresAt: newExpiry });
    
    // Resend email
    await this.sendInvitationEmail(invitationId);
    
    return invitation;
  }
}

export const invitationService = new InvitationService();
