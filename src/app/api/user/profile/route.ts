import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/user/profile
 *
 * Get the authenticated user's profile including their unique inbound email address.
 * Auth required.
 */
export async function GET(_request: NextRequest) {
  // TODO: Implement in FEAT-001
  // 1. Authenticate user
  // 2. Fetch user profile from database
  // 3. Return profile with inboundEmail, oauthProvider, etc.
  return NextResponse.json(
    { error: 'Not implemented' },
    { status: 501 },
  );
}

/**
 * PATCH /api/user/profile
 *
 * Update user profile fields (monthly_salary, budget_mode).
 * Auth required.
 *
 * Body: { monthly_salary?, budget_mode? }
 */
export async function PATCH(_request: NextRequest) {
  // TODO: Implement in FEAT-001
  // 1. Authenticate user
  // 2. Parse & validate request body
  // 3. Update user document in database
  // 4. Return updated profile
  return NextResponse.json(
    { error: 'Not implemented' },
    { status: 501 },
  );
}
