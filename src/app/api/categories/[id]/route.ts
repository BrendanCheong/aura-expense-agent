import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { createContainer } from '@/lib/container/container';
import { updateCategoryBodySchema, deleteCategoryParamsSchema } from '@/lib/validation/categories.schemas';
import {
  unauthorizedResponse,
  validationErrorResponse,
  serverErrorResponse,
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
  if (!user) return unauthorizedResponse();

  const { id } = await context.params;
  const paramResult = deleteCategoryParamsSchema.safeParse({ id });
  if (!paramResult.success) {
    return validationErrorResponse(paramResult.error);
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const bodyResult = updateCategoryBodySchema.safeParse(body);
  if (!bodyResult.success) {
    return validationErrorResponse(bodyResult.error);
  }

  try {
    const { categoryService } = await createContainer();
    const updated = await categoryService.updateCategory(
      user.accountId,
      paramResult.data.id,
      bodyResult.data,
    );
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
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
  if (!user) return unauthorizedResponse();

  const { id } = await context.params;
  const paramResult = deleteCategoryParamsSchema.safeParse({ id });
  if (!paramResult.success) {
    return validationErrorResponse(paramResult.error);
  }

  try {
    const { categoryService } = await createContainer();
    await categoryService.deleteCategory(user.accountId, paramResult.data.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes('Cannot delete')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return serverErrorResponse();
  }
}
