import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/categories/[id]
 *
 * Update a category (name, description, icon, color, sortOrder).
 * Auth required. User can only update own categories.
 */
export async function PATCH(_request: NextRequest, _context: RouteParams) {
  // TODO: Implement in FEAT-010
  // 1. Authenticate user
  // 2. Parse route param (id) and request body
  // 3. Call categoryService.updateCategory()
  // 4. Return updated category
  return NextResponse.json(
    { error: 'Not implemented' },
    { status: 501 },
  );
}

/**
 * DELETE /api/categories/[id]
 *
 * Delete a category.
 * Auth required. User can only delete own categories.
 *
 * Pre-conditions: Cannot delete if transactions reference this category
 * (returns 409 Conflict). Cascades: deletes vendor_cache + budgets for category.
 */
export async function DELETE(_request: NextRequest, _context: RouteParams) {
  // TODO: Implement in FEAT-010
  // 1. Authenticate user
  // 2. Parse route param (id)
  // 3. Check for existing transactions (409 if any)
  // 4. Call categoryService.deleteCategory() (cascades vendor_cache + budgets)
  // 5. Return 204
  return new NextResponse(null, { status: 204 });
}
