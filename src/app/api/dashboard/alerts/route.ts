import { NextResponse, type NextRequest } from 'next/server';

import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { HttpStatus } from '@/lib/constants';
import { createContainer } from '@/lib/container/container';
import { dashboardAlertsQuerySchema } from '@/lib/validation/dashboard.schemas';
import {
  parseQueryObject,
  serverErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/validation/http';

/**
 * GET /api/dashboard/alerts
 *
 * Budget alert status for the current period.
 * Returns categories approaching budget (>80%) or over budget (>=100%).
 * Auth required.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const queryResult = dashboardAlertsQuerySchema.safeParse(
    parseQueryObject(request.nextUrl.searchParams)
  );
  if (!queryResult.success) {
    return validationErrorResponse(queryResult.error);
  }

  const now = new Date();
  const year = queryResult.data.year ?? now.getFullYear();
  const month = queryResult.data.month ?? now.getMonth() + 1;

  try {
    const { dashboardService } = await createContainer();
    const result = await dashboardService.getAlerts({
      userId: user.accountId,
      year,
      month,
    });
    return NextResponse.json(result, { status: HttpStatus.OK });
  } catch {
    return serverErrorResponse();
  }
}
