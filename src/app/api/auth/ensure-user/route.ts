import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createContainer } from '@/lib/container/container';
import { getSessionUser } from '@/lib/appwrite/session';

/**
 * POST /api/auth/ensure-user
 *
 * Called after OAuth callback to ensure the user record
 * exists in our database (creates if first login, updates if returning).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, email, name, avatarUrl } = body;

    if (!accountId || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: accountId, email, name' },
        { status: 400 },
      );
    }

    // Verify the caller is authenticated (session matches accountId)
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.accountId !== accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const container = await createContainer();
    const user = await container.authService.getOrCreateUser(accountId, {
      email,
      name,
      avatarUrl: avatarUrl ?? '',
      oauthProvider: 'google', // Will be determined from session in future
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error('ensure-user error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
