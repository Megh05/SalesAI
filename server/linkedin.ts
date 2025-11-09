import axios from 'axios';

export class LinkedInService {
  getAuthUrl(clientId: string, redirectUri: string, state: string): string {
    const scope = 'openid profile email';
    
    return `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `scope=${encodeURIComponent(scope)}`;
  }

  async getTokenFromCode(code: string, clientId: string, clientSecret: string, redirectUri: string) {
    try {
      const response = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        null,
        {
          params: {
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('LinkedIn token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to exchange LinkedIn authorization code');
    }
  }

  async getUserProfile(accessToken: string) {
    try {
      const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      return profileResponse.data;
    } catch (error: any) {
      console.error('LinkedIn profile fetch error:', error.response?.data || error.message);
      throw new Error('Failed to fetch LinkedIn profile');
    }
  }

  async sharePost(accessToken: string, text: string, personId: string) {
    try {
      const shareData = {
        author: `urn:li:person:${personId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const response = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        shareData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('LinkedIn share error:', error.response?.data || error.message);
      throw new Error('Failed to share on LinkedIn');
    }
  }

  async syncMessages(accessToken: string, userId: string): Promise<any[]> {
    console.log('[LinkedIn Sync] Message sync initiated for user:', userId);
    console.log('[LinkedIn Sync] NOTE: LinkedIn Messaging API is restricted to approved partners.');
    console.log('[LinkedIn Sync] This is a placeholder implementation ready for Unipile or official API integration.');
    
    return [];
  }

  parseLinkedInMessage(message: any, userId: string) {
    return {
      subject: message.subject || 'LinkedIn Message',
      snippet: message.text?.substring(0, 200),
      fromEmail: message.from?.email || 'linkedin-user@linkedin.com',
      fromName: message.from?.name || 'LinkedIn User',
      toEmail: message.to?.email || 'me@linkedin.com',
      threadId: message.conversationId || message.id,
      messageId: message.id,
      channel: 'linkedin',
      providerMetadata: JSON.stringify({
        conversationId: message.conversationId,
        participants: message.participants,
        linkedinMessageId: message.id,
      }),
      userId,
      receivedAt: message.createdAt ? new Date(message.createdAt) : new Date(),
    };
  }
}

export const linkedinService = new LinkedInService();
