import { NextResponse, type NextRequest } from 'next/server';

import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { HttpStatus } from '@/lib/constants';
import { createContainer } from '@/lib/container/container';
import {
  updateCategoryBodySchema,
  deleteCategoryParamsSchema,
} from '@/lib/validation/categories.schemas';
import {
  unauthorizedResponse,
  validationErrorResponse,
  serverErrorResponse,
  invalidJsonResponse,
  notFoundResponse,
} from '@/lib/validation/http';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/categories/[id]
 *
 * Update a category (name, description, icon, color, sortOrder).
 * Auth required. User can only update own categories.
 */
export async function PATCH(request: NextRequest, context: RouteParams) {
  const user = await getAuthenticatedUser(request);
  if (!user) {return unauthorizedResponse();}

  const { id } = await context.params;
  const paramResult = deleteCategoryParamsSchema.safeParse({ id });
  if (!paramResult.success) {
    return validationErrorResponse(paramResult.error);
  }

  const body = await request.json().catch(() => null);
  if (!body) {return invalidJsonResponse();}

  const bodyResult = updateCategoryBodySchema.safeParse(body);
  if (!bodyResult.success) {
    return validationErrorResponse(bodyResult.error);
  }

  try {
    const { categoryService } = await createContainer();
    const updated = await categoryService.updateCategory(
      user.accountId,
      paramResult.data.id,
      bodyResult.data
    );
    return NextResponse.json(updated, { status: HttpStatus.OK });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return notFoundResponse(error.message);
    }
    return serverErrorResponse();
  }
}

/**
 * DELETE /api/categories/[id]
 *
 * Delete a category.
 * Auth required. User can only delete own categories.
 *
 * Cascade: transactions moved to "Other", vendor_cache + budgets deleted.
 * Cannot delete "Other" system category (returns 400).
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  const user = await getAuthenticatedUser(request);
  if (!user) {return unauthorizedResponse();}

  const { id } = await context.params;
  const paramResult = deleteCategoryParamsSchema.safeParse({ id });
  if (!paramResult.success) {
    return validationErrorResponse(paramResult.error);
  }

  try {
    const { categoryService } = await createContainer();
    await categoryService.deleteCategory(user.accountId, paramResult.data.id);
    return new NextResponse(null, { status: HttpStatus.NO_CONTENT });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return notFoundResponse(error.message);
    }
    if (error instanceof Error && error.message.includes('Cannot delete')) {
      return NextResponse.json({ error: error.message }, { status: HttpStatus.BAD_REQUEST });
    }
    return serverErrorResponse();
  }
}
