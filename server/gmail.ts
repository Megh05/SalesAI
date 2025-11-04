import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export class GmailService {
  private oauth2Client: OAuth2Client | null = null;

  createOAuth2Client(clientId: string, clientSecret: string, redirectUri: string): OAuth2Client {
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    return this.oauth2Client;
  }

  getAuthUrl(clientId: string, clientSecret: string, redirectUri: string, state: string): string {
    const oauth2Client = this.createOAuth2Client(clientId, clientSecret, redirectUri);
    
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify'
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state,
    });
  }

  async getTokenFromCode(code: string, clientId: string, clientSecret: string, redirectUri: string) {
    const oauth2Client = this.createOAuth2Client(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }

  async getGmailClient(accessToken: string, refreshToken: string | null, clientId: string, clientSecret: string) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken || undefined,
    });

    oauth2Client.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        console.log('New refresh token received');
      }
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
  }

  async listMessages(gmail: any, maxResults: number = 50) {
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      labelIds: ['INBOX'],
    });
    return res.data.messages || [];
  }

  async getMessage(gmail: any, messageId: string) {
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    return res.data;
  }

  async sendEmail(gmail: any, to: string, subject: string, body: string, from?: string) {
    const email = [
      `To: ${to}`,
      from ? `From: ${from}` : '',
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      body
    ].filter(Boolean).join('\n');

    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    return res.data;
  }

  parseEmailMessage(message: any) {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    let body = '';
    
    if (message.payload?.parts) {
      const textPart = message.payload.parts.find((part: any) => part.mimeType === 'text/plain' || part.mimeType === 'text/html');
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    } else if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    }

    const snippet = message.snippet || body.substring(0, 200);

    return {
      id: message.id,
      threadId: message.threadId,
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject'),
      date: getHeader('Date'),
      body,
      snippet,
      labels: message.labelIds || [],
    };
  }
}

export const gmailService = new GmailService();
