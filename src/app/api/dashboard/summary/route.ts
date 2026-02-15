import type { NextRequest } from 'next/server';

import { notImplementedResponse } from '@/lib/validation/http';

/**
 * GET /api/dashboard/summary
 *
 * Aggregated spending data for dashboard charts.
 * Server-side computation to avoid sending raw transactions to the client.
 * Auth required.
 *
 * Query params: period (week|month|year), year, month, week
 */
export async function GET(_request: NextRequest) {
  // TODO: Implement in FEAT-007
  // 1. Authenticate user
  // 2. Parse & validate query params (period, year, month, week)
  // 3. Call dashboardService.getSummary()
  // 4. Return summary with byCategory, recentTransactions, dailySpending
  return notImplementedResponse();
}
