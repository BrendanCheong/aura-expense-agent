import { NextResponse, type NextRequest } from 'next/server';

import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { HttpStatus } from '@/lib/constants';
import { createContainer } from '@/lib/container/container';
import { NotFoundError, ValidationError } from '@/lib/services/transaction.service';
import {
  unauthorizedResponse,
  validationErrorResponse,
  serverErrorResponse,
  invalidJsonResponse,
  notFoundResponse,
} from '@/lib/validation/http';
import {
  updateTransactionBodySchema,
  updateTransactionParamsSchema,
  deleteTransactionParamsSchema,
} from '@/lib/validation/transactions.schemas';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/transactions/[id]
 *
 * Update a transaction (re-categorize, edit amount/vendor).
 * Auth required. User can only update own transactions.
 *
 * Body (partial): { categoryId?, amount?, vendor?, description?, transactionDate?, confidence? }
 */
export async function PATCH(request: NextRequest, context: RouteParams) {
  const user = await getAuthenticatedUser(request);
  if (!user) {return unauthorizedResponse();}

  const { id } = await context.params;
  const paramResult = updateTransactionParamsSchema.safeParse({ id });
  if (!paramResult.success) {
    return validationErrorResponse(paramResult.error);
  }

  const body = await request.json().catch(() => null);
  if (!body) {return invalidJsonResponse();}

  const bodyResult = updateTransactionBodySchema.safeParse(body);
  if (!bodyResult.success) {
    return validationErrorResponse(bodyResult.error);
  }

  try {
    const { transactionService } = await createContainer();
    const updated = await transactionService.updateTransaction(
      user.accountId,
      paramResult.data.id,
      bodyResult.data
    );
    return NextResponse.json(updated, { status: HttpStatus.OK });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFoundResponse(error.message);
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: HttpStatus.BAD_REQUEST });
    }
    return serverErrorResponse();
  }
}

/**
 * DELETE /api/transactions/[id]
 *
 * Delete a transaction. Returns 204 No Content.
 * Auth required. User can only delete own transactions.
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  const user = await getAuthenticatedUser(request);
  if (!user) {return unauthorizedResponse();}

  const { id } = await context.params;
  const paramResult = deleteTransactionParamsSchema.safeParse({ id });
  if (!paramResult.success) {
    return validationErrorResponse(paramResult.error);
  }

  try {
    const { transactionService } = await createContainer();
    await transactionService.deleteTransaction(user.accountId, paramResult.data.id);
    return new NextResponse(null, { status: HttpStatus.NO_CONTENT });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return notFoundResponse(error.message);
    }
    return serverErrorResponse();
  }
}
