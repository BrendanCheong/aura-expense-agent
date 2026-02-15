import { NextResponse } from 'next/server';

import { HttpStatus, ErrorMessage } from '@/lib/constants';
import { createContainer } from '@/lib/container/container';
import { OAuthProvider } from '@/lib/enums';

/**
 * POST /api/auth/dev-login
 *
 * Dev-only endpoint. Creates or returns the dev user and sets
 * a dev_session cookie so the browser maintains identity across
 * requests (even though PROJECT_ENV=dev bypasses auth checks).
 *
 * Only available when PROJECT_ENV=dev.
 */
export async function POST() {
  if (process.env.PROJECT_ENV !== 'dev') {
    return NextResponse.json(
      { error: 'Dev login not available in production' },
      { status: HttpStatus.FORBIDDEN }
    );
  }

  try {
    const container = await createContainer();
    const user = await container.authService.getOrCreateUser('dev-user-001', {
      email: 'dev@aura.local',
      name: 'Dev User',
      avatarUrl: '',
      oauthProvider: OAuthProvider.GOOGLE,
    });

    const response = NextResponse.json({ user });

    // Set a dev session cookie so the browser has a persistent identity.
    // This cookie is not validated in dev mode — it simply prevents the
    // middleware from redirecting to /login if someone removes the
    // PROJECT_ENV bypass in the future.
    response.cookies.set('dev_session', 'dev-user-001', {
      httpOnly: true,
      secure: false, // localhost
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err) {
    console.error('dev-login error:', err);
    return NextResponse.json(
      { error: ErrorMessage.INTERNAL_SERVER_ERROR },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
