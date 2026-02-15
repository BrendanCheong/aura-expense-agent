import type { NextRequest } from 'next/server';
import { notImplementedResponse } from '@/lib/validation/http';

/**
 * POST /api/feedback
 *
 * Process user feedback on a miscategorized transaction.
 * The AI proposes a new category based on the user's correction text.
 * Auth required.
 *
 * Body: { transactionId, feedbackText, conversationHistory? }
 */
export async function POST(_request: NextRequest) {
  // TODO: Implement in FEAT-013
  // 1. Authenticate user
  // 2. Parse & validate request body
  // 3. Look up transaction and current category
  // 4. Invoke AI agent to propose new category
  // 5. Return proposed category with reasoning
  return notImplementedResponse();
}
