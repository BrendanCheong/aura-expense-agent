import type { NextRequest } from 'next/server';

import { notImplementedResponse } from '@/lib/validation/http';

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
  // 1. Read RAW request body via `await request.text()`
  // 2. Verify Resend webhook signature with `svix` using:
  //    - `svix-id`
  //    - `svix-timestamp`
  //    - `svix-signature`
  //    and `process.env.RESEND_WEBHOOK_SECRET`
  // 3. Parse verified webhook payload (reject non-email.received events)
  // 4. Fetch full email via Resend API
  // 5. Resolve user from inbound email address
  // 6. Dedup check (resendEmailId)
  // 7. Vendor cache fast path
  // 8. Invoke LangGraph agent pipeline
  return notImplementedResponse();
}
