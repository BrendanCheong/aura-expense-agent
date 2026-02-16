/**
 * Resend email provider — Production implementation of IEmailProvider.
 *
 * Uses the Resend SDK (resend.emails.receiving.get()) to fetch
 * the full content of received inbound emails.
 *
 * @see https://resend.com/docs/api-reference/emails/retrieve-received-email
 * @see FEAT-004 (Webhook Handler)
 */

import { Resend } from 'resend';

import type { IEmailProvider, ReceivedEmail } from './interfaces';

/**
 * Singleton Resend client instance.
 * Reused across requests to avoid repeated initialization.
 */
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Reset the singleton (for tests).
 */
export function resetResendClient(): void {
  resendClient = null;
}

/**
 * Production email provider using the Resend SDK.
 */
export class ResendEmailProvider implements IEmailProvider {
  constructor(private readonly resend: Resend = getResendClient()) {}

  async getReceivedEmail(emailId: string): Promise<ReceivedEmail | null> {
    const { data, error } = await this.resend.emails.receiving.get(emailId);

    if (error || !data) {
      console.error('Failed to fetch received email:', error);
      return null;
    }

    return {
      id: data.id,
      to: data.to ?? [],
      from: data.from ?? '',
      subject: data.subject ?? '',
      html: data.html ?? null,
      text: data.text ?? null,
      createdAt: data.created_at ?? new Date().toISOString(),
    };
  }
}
