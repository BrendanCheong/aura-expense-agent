import { NextResponse, type NextRequest } from 'next/server';

import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { HttpStatus } from '@/lib/constants';
import { createContainer } from '@/lib/container/container';
import {
  unauthorizedResponse,
  serverErrorResponse,
  notFoundResponse,
  invalidJsonResponse,
  validationErrorResponse,
} from '@/lib/validation/http';
import { updateUserProfileBodySchema } from '@/lib/validation/user.schemas';

/**
 * GET /api/user/profile
 *
 * Get the authenticated user's profile including their unique inbound email address.
 * Auth required.
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const container = await createContainer();
    const profile = await container.authService.getUserById(user.accountId);

    if (!profile) {
      return notFoundResponse('User not found');
    }

    return NextResponse.json({ user: profile }, { status: HttpStatus.OK });
  } catch (err) {
    console.error('GET /api/user/profile error:', err);
    return serverErrorResponse();
  }
}

/**
 * PATCH /api/user/profile
 *
 * Update user profile fields (monthlySalary, budgetMode).
 * Auth required.
 */
export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return invalidJsonResponse();
  }

  const bodyResult = updateUserProfileBodySchema.safeParse(body);
  if (!bodyResult.success) {
    return validationErrorResponse(bodyResult.error);
  }

  try {
    const container = await createContainer();
    const updated = await container.authService.updateUserProfile(
      user.accountId,
      bodyResult.data
    );

    return NextResponse.json({ user: updated }, { status: HttpStatus.OK });
  } catch (err) {
    console.error('PATCH /api/user/profile error:', err);
    return serverErrorResponse();
  }
}
