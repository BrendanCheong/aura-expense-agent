import { NextResponse, type NextRequest } from 'next/server';

import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { HttpStatus } from '@/lib/constants';
import { createContainer } from '@/lib/container/container';
import { BudgetAlreadyExistsError } from '@/lib/errors';
import {
  createBudgetBodySchema,
  listBudgetsQuerySchema,
  upsertBudgetBodySchema,
} from '@/lib/validation/budgets.schemas';
import {
  parseQueryObject,
  serverErrorResponse,
  unauthorizedResponse,
  validationErrorResponse,
  invalidJsonResponse,
  conflictResponse,
} from '@/lib/validation/http';

/**
 * GET /api/budgets
 *
 * List budgets for a given month/year with actual spending totals.
 * Auth required.
 *
 * Query params: year (default: current), month (default: current)
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const queryResult = listBudgetsQuerySchema.safeParse(
    parseQueryObject(request.nextUrl.searchParams)
  );
  if (!queryResult.success) {
    return validationErrorResponse(queryResult.error);
  }

  const now = new Date();
  const year = queryResult.data.year ?? now.getFullYear();
  const month = queryResult.data.month ?? now.getMonth() + 1;

  try {
    const { budgetService } = await createContainer();
    const result = await budgetService.getBudgetsWithSpending(user.accountId, year, month);
    return NextResponse.json(result, { status: HttpStatus.OK });
  } catch {
    return serverErrorResponse();
  }
}

/**
 * POST /api/budgets
 *
 * Create a new budget for a category in a given month (strict create).
 * Returns 409 Conflict if budget already exists for that category+period.
 * Auth required.
 *
 * Body: { categoryId, amount, year, month }
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return invalidJsonResponse();
  }

  const bodyResult = createBudgetBodySchema.safeParse(body);
  if (!bodyResult.success) {
    return validationErrorResponse(bodyResult.error);
  }

  try {
    const { budgetService } = await createContainer();
    const created = await budgetService.createBudget(user.accountId, bodyResult.data);
    return NextResponse.json(created, { status: HttpStatus.CREATED });
  } catch (error) {
    if (error instanceof BudgetAlreadyExistsError) {
      return conflictResponse(error.message);
    }
    return serverErrorResponse();
  }
}

/**
 * PUT /api/budgets
 *
 * Create or update a budget for a category in a given month (upsert).
 * Idempotent — if budget exists, updates amount. If not, creates.
 * Auth required.
 *
 * Body: { categoryId, amount, year, month }
 */
export async function PUT(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return invalidJsonResponse();
  }

  const bodyResult = upsertBudgetBodySchema.safeParse(body);
  if (!bodyResult.success) {
    return validationErrorResponse(bodyResult.error);
  }

  try {
    const { budgetService } = await createContainer();

    // Check if one already exists to determine 200 vs 201
    const existing = await budgetService.listBudgets(
      user.accountId,
      bodyResult.data.year,
      bodyResult.data.month
    );
    const existsForCategory = existing.some(
      (b) => b.categoryId === bodyResult.data.categoryId
    );

    const result = await budgetService.upsertBudget(user.accountId, bodyResult.data);
    const status = existsForCategory ? HttpStatus.OK : HttpStatus.CREATED;
    return NextResponse.json(result, { status });
  } catch {
    return serverErrorResponse();
  }
}
