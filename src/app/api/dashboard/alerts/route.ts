import { type NextRequest } from 'next/server';

import { notImplementedResponse } from '@/lib/validation/http';

/**
 * GET /api/dashboard/alerts
 *
 * Budget alert status for the current period.
 * Returns categories approaching budget (>80%) or over budget (>=100%).
 * Auth required.
 */
export async function GET(_request: NextRequest) {
  // TODO: Implement in FEAT-007
  // 1. Authenticate user
  // 2. Compute current month spending vs budgets
  // 3. Return alerts array with type (warning/over_budget), amounts, messages
  return notImplementedResponse();
}
