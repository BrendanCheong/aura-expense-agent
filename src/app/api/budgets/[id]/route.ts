import { NextResponse, type NextRequest } from 'next/server';

import { HttpStatus } from '@/lib/constants';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/budgets/[id]
 *
 * Delete a budget. Returns 204 No Content.
 * Auth required. User can only delete own budgets.
 */
export async function DELETE(_request: NextRequest, _context: RouteParams) {
  // TODO: Implement in FEAT-009
  // 1. Authenticate user
  // 2. Parse route param (id)
  // 3. Call budgetService.deleteBudget()
  // 4. Return 204
  return new NextResponse(null, { status: HttpStatus.NO_CONTENT });
}
