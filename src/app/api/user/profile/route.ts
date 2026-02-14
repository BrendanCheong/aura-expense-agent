import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createContainer } from '@/lib/container/container';
import { getSessionUser } from '@/lib/appwrite/session';

/**
 * GET /api/user/profile
 *
 * Get the authenticated user's profile including their unique inbound email address.
 * Auth required.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionUser(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const container = await createContainer();
    const user = await container.authService.getUserById(session.accountId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error('GET /api/user/profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/profile
 *
 * Update user profile fields (monthlySalary, budgetMode, name).
 * Auth required.
 */
export async function PATCH(request: NextRequest) {
  const session = await getSessionUser(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const container = await createContainer();
    const updated = await container.authService.updateUserProfile(
      session.accountId,
      body,
    );

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error('PATCH /api/user/profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
