import { NextResponse, type NextRequest } from 'next/server';

import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { HttpStatus } from '@/lib/constants';
import { createContainer } from '@/lib/container/container';
import { BudgetNotFoundError } from '@/lib/errors';
import { deleteBudgetParamsSchema } from '@/lib/validation/budgets.schemas';
import {
  unauthorizedResponse,
  validationErrorResponse,
  serverErrorResponse,
  notFoundResponse,
} from '@/lib/validation/http';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/budgets/[id]
 *
 * Delete a budget. Returns 204 No Content.
 * Auth required. User can only delete own budgets.
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await context.params;
  const paramResult = deleteBudgetParamsSchema.safeParse({ id });
  if (!paramResult.success) {
    return validationErrorResponse(paramResult.error);
  }

  try {
    const { budgetService } = await createContainer();
    await budgetService.deleteBudget(user.accountId, paramResult.data.id);
    return new NextResponse(null, { status: HttpStatus.NO_CONTENT });
  } catch (error) {
    if (error instanceof BudgetNotFoundError) {
      return notFoundResponse(error.message);
    }
    return serverErrorResponse();
  }
}
