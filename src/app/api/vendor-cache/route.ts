import { NextResponse, type NextRequest } from 'next/server';

import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { HttpStatus } from '@/lib/constants';
import { createContainer } from '@/lib/container/container';
import {
  serverErrorResponse,
  unauthorizedResponse,
} from '@/lib/validation/http';

/**
 * GET /api/vendor-cache
 *
 * List all cached vendor→category mappings for the authenticated user.
 * Used for vendor autocomplete in the "Add Transaction" sheet.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {return unauthorizedResponse();}

  try {
    const { vendorCacheRepo } = await createContainer();
    const entries = await vendorCacheRepo.findByUserId(user.accountId);
    return NextResponse.json(
      entries.map((e) => ({
        id: e.id,
        vendorName: e.vendorName,
        categoryId: e.categoryId,
        hitCount: e.hitCount,
      })),
      { status: HttpStatus.OK },
    );
  } catch {
    return serverErrorResponse();
  }
}
