import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/categories
 *
 * List all categories for the authenticated user, ordered by sortOrder.
 * Auth required.
 */
export async function GET(_request: NextRequest) {
  // TODO: Implement in FEAT-010
  // 1. Authenticate user
  // 2. Call categoryService.listCategories()
  // 3. Return categories array
  return NextResponse.json(
    { error: 'Not implemented' },
    { status: 501 },
  );
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
export async function POST(_request: NextRequest) {
  // TODO: Implement in FEAT-010
  // 1. Authenticate user
  // 2. Parse & validate request body with `createCategoryBodySchema`
  // 3. Call categoryService.createCategory()
  // 4. Return 201 with created category
  return NextResponse.json(
    { error: 'Not implemented' },
    { status: 501 },
  );
}
