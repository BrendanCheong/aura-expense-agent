import { NextResponse, type NextRequest } from 'next/server';

import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { HttpStatus } from '@/lib/constants';
import { createContainer } from '@/lib/container/container';
import { ValidationError } from '@/lib/errors';
import {
  parseQueryObject,
  serverErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
  invalidJsonResponse,
} from '@/lib/validation/http';
import {
  createTransactionBodySchema,
  listTransactionsQuerySchema,
} from '@/lib/validation/transactions.schemas';

/**
 * GET /api/transactions
 *
 * List transactions with pagination, date range, category, and source filters.
 * Auth required.
 *
 * Query params: page, limit, startDate, endDate, categoryId, source, sortBy, sortOrder
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {return unauthorizedResponse();}

  const queryResult = listTransactionsQuerySchema.safeParse(
    parseQueryObject(request.nextUrl.searchParams)
  );
  if (!queryResult.success) {
    return validationErrorResponse(queryResult.error);
  }

  try {
    const { transactionService } = await createContainer();
    const result = await transactionService.listTransactions(user.accountId, queryResult.data);
    return NextResponse.json(result, { status: HttpStatus.OK });
  } catch {
    return serverErrorResponse();
  }
}

/**
 * POST /api/transactions
 *
 * Create a manual transaction (user-entered, not from email).
 * Auth required.
 *
 * Body: { amount, vendor, categoryId, transactionDate, description? }
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {return unauthorizedResponse();}

  const body = await request.json().catch(() => null);
  if (!body) {return invalidJsonResponse();}

  const bodyResult = createTransactionBodySchema.safeParse(body);
  if (!bodyResult.success) {
    return validationErrorResponse(bodyResult.error);
  }

  try {
    const { transactionService } = await createContainer();
    const created = await transactionService.createManualTransaction(user.accountId, bodyResult.data);
    return NextResponse.json(created, { status: HttpStatus.CREATED });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: HttpStatus.BAD_REQUEST });
    }
    return serverErrorResponse();
  }
}
