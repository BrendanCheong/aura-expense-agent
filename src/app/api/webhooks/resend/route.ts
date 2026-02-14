import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/webhooks/resend
 *
 * Resend inbound email webhook handler.
 * Authentication: Webhook signature verification (not user auth).
 *
 * Will be implemented in FEAT-004 (Webhook Handler).
 */
export async function POST(_request: NextRequest) {
  // TODO: Implement in FEAT-004
  // 1. Verify Resend webhook signature
  // 2. Parse webhook payload (reject non-email.received events)
  // 3. Fetch full email via Resend API
  // 4. Resolve user from inbound email address
  // 5. Dedup check (resendEmailId)
  // 6. Vendor cache fast path
  // 7. Invoke LangGraph agent pipeline
  return NextResponse.json(
    { error: 'Not implemented' },
    { status: 501 },
  );
}
