import { NextResponse, type NextRequest } from 'next/server';

import { HttpStatus } from '@/lib/constants';
import { notImplementedResponse } from '@/lib/validation/http';

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
export async function PATCH(_request: NextRequest, _context: RouteParams) {
  // TODO: Implement in FEAT-008
  // 1. Authenticate user
  // 2. Parse route param (id) and request body
  // 3. Call transactionService.updateTransaction()
  // 4. Return updated transaction
  return notImplementedResponse();
}

/**
 * DELETE /api/transactions/[id]
 *
 * Delete a transaction. Returns 204 No Content.
 * Auth required. User can only delete own transactions.
 */
export async function DELETE(_request: NextRequest, _context: RouteParams) {
  // TODO: Implement in FEAT-008
  // 1. Authenticate user
  // 2. Parse route param (id)
  // 3. Call transactionService.deleteTransaction()
  // 4. Return 204
  return new NextResponse(null, { status: HttpStatus.NO_CONTENT });
}
