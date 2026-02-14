import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { createContainer } from '@/lib/container/container';
import { createCategoryBodySchema } from '@/lib/validation/categories.schemas';
import {
  unauthorizedResponse,
  validationErrorResponse,
  serverErrorResponse,
} from '@/lib/validation/http';

/**
 * GET /api/categories
 *
 * List all categories for the authenticated user, ordered by sortOrder.
 * Auth required.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const { categoryService } = await createContainer();
    const categories = await categoryService.listCategories(user.accountId);
    return NextResponse.json(categories, { status: 200 });
  } catch {
    return serverErrorResponse();
  }
}

/**
 * POST /api/categories
 *
 * Create a new custom category.
 * Auth required.
 *
 * Body: { name, description, icon?, color? }
 * Validation: name must be unique per user, description required.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const bodyResult = createCategoryBodySchema.safeParse(body);
  if (!bodyResult.success) {
    return validationErrorResponse(bodyResult.error);
  }

  try {
    const { categoryService } = await createContainer();
    const category = await categoryService.createCategory(user.accountId, {
      ...bodyResult.data,
      isDefault: false,
      sortOrder: 0,
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return serverErrorResponse();
  }
}
