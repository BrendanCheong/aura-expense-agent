import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createContainer } from '@/lib/container/container';
import { getSessionUser } from '@/lib/appwrite/session';
import { HttpStatus, ErrorMessage } from '@/lib/constants';
import { OAuthProvider } from '@/lib/enums';

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
        { error: ErrorMessage.MISSING_REQUIRED_FIELDS },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    // Verify the caller is authenticated (session matches accountId)
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || sessionUser.accountId !== accountId) {
      return NextResponse.json(
        { error: ErrorMessage.UNAUTHORIZED },
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    const container = await createContainer();
    const user = await container.authService.getOrCreateUser(accountId, {
      email,
      name,
      avatarUrl: avatarUrl ?? '',
      oauthProvider: OAuthProvider.GOOGLE, // Will be determined from session in future
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error('ensure-user error:', err);
    return NextResponse.json(
      { error: ErrorMessage.INTERNAL_SERVER_ERROR },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
