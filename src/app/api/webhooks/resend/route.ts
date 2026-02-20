/**
 * POST /api/webhooks/resend — Resend Inbound Email Webhook Handler
 *
 * Receives Resend's `email.received` webhook events, verifies the signature,
 * fetches the full email content, and processes it through the expense pipeline.
 *
 * Authentication: Svix webhook signature verification (not user auth).
 * Dev mode: Set PROJECT_ENV=dev to bypass Svix verification.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';

import { HttpStatus, PROJECT_ENV_DEV, RESEND_EMAIL_RECEIVED_EVENT } from '@/lib/constants';
import { createContainer } from '@/lib/container/container';

/**
 * Shape of the Resend webhook event after Svix verification.
 */
interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
  };
}

/**
 * Verify the Svix webhook signature.
 * Returns the parsed event if valid, or null if verification fails.
 *
 * In dev mode (PROJECT_ENV=dev), skips verification
 * and parses the raw payload directly.
 */
function verifyWebhookSignature(
  payload: string,
  headers: Headers,
): ResendWebhookEvent | null {
  const skipVerification = process.env.PROJECT_ENV === PROJECT_ENV_DEV;

  if (skipVerification) {
    try {
      return JSON.parse(payload) as ResendWebhookEvent;
    } catch {
      return null;
    }
  }

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('RESEND_WEBHOOK_SECRET is not configured');
    return null;
  }

  try {
    const wh = new Webhook(webhookSecret);
    const event = wh.verify(payload, {
      'svix-id': headers.get('svix-id') ?? '',
      'svix-timestamp': headers.get('svix-timestamp') ?? '',
      'svix-signature': headers.get('svix-signature') ?? '',
    }) as ResendWebhookEvent;
    return event;
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Read raw body (must be text before JSON parsing for Svix)
    const payload = await request.text();

    // 2. Verify webhook signature
    const event = verifyWebhookSignature(payload, request.headers);
    if (!event) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    // 3. Ignore non email.received events
    if (event.type !== RESEND_EMAIL_RECEIVED_EVENT) {
      return NextResponse.json({ status: 'ignored' }, { status: HttpStatus.OK });
    }

    const resendEmailId = event.data.email_id;

    // 4. Get DI container
    const container = await createContainer();

    // 5. Fetch full email content from Resend
    const email = await container.emailProvider.getReceivedEmail(resendEmailId);
    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: HttpStatus.OK }, // 200 to avoid Resend retries
      );
    }

    // 6. Resolve user from inbound email address
    const toAddress = email.to?.[0];
    if (!toAddress) {
      return NextResponse.json(
        { error: 'No recipient address' },
        { status: HttpStatus.OK },
      );
    }

    const userId = await container.webhookService.resolveUserByInboundEmail(toAddress);
    if (!userId) {
      console.warn(`No user found for inbound address: ${toAddress}`);
      return NextResponse.json(
        { error: 'Unknown recipient' },
        { status: HttpStatus.OK }, // 200 to avoid Resend retries
      );
    }

    // 7. Process through the webhook pipeline
    const result = await container.webhookService.processInboundEmail({
      emailHtml: email.html || '',
      emailText: email.text || '',
      emailSubject: email.subject || '',
      emailDate: email.createdAt,
      resendEmailId,
      userId,
    });

    return NextResponse.json(result, { status: HttpStatus.OK });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 500 so Resend retries the webhook
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
