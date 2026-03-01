import { NextResponse, type NextRequest } from 'next/server';

import type { DashboardPeriod } from '@/types/dashboard';

import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { HttpStatus } from '@/lib/constants';
import { createContainer } from '@/lib/container/container';
import { dashboardSummaryQuerySchema } from '@/lib/validation/dashboard.schemas';
import {
  parseQueryObject,
  serverErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/validation/http';

/**
 * GET /api/dashboard/summary
 *
 * Aggregated spending data for dashboard charts.
 * Server-side computation to avoid sending raw transactions to the client.
 * Auth required.
 *
 * Query params: period (week|month|year), year, month, week
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const queryResult = dashboardSummaryQuerySchema.safeParse(
    parseQueryObject(request.nextUrl.searchParams)
  );
  if (!queryResult.success) {
    return validationErrorResponse(queryResult.error);
  }

  const now = new Date();
  const period: DashboardPeriod = queryResult.data.period;
  const year = queryResult.data.year ?? now.getFullYear();
  const month = queryResult.data.month ?? (period !== 'year' ? now.getMonth() + 1 : undefined);
  const week = queryResult.data.week;

  try {
    const { dashboardService } = await createContainer();
    const result = await dashboardService.getSummary({
      userId: user.accountId,
      period,
      year,
      month,
      week,
    });
    return NextResponse.json(result, { status: HttpStatus.OK });
  } catch {
    return serverErrorResponse();
  }
}
