import { NextResponse } from 'next/server';

import { DEV_USER } from '@/lib/appwrite/session';
import { ErrorMessage, HttpStatus, PROJECT_ENV_DEV } from '@/lib/constants';
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
  if (process.env.PROJECT_ENV !== PROJECT_ENV_DEV) {
    return NextResponse.json(
      { error: 'Dev login not available in production' },
      { status: HttpStatus.FORBIDDEN }
    );
  }

  try {
    const container = await createContainer();
    const user = await container.authService.getOrCreateUser(DEV_USER.$id, {
      email: DEV_USER.email,
      name: DEV_USER.name,
      avatarUrl: '',
      oauthProvider: OAuthProvider.GOOGLE,
    });

    const response = NextResponse.json({ user });

    // Set a dev session cookie so the browser has a persistent identity.
    // This cookie is not validated in dev mode — it simply prevents the
    // middleware from redirecting to /login if someone removes the
    // PROJECT_ENV bypass in the future.
    response.cookies.set('dev_session', DEV_USER.$id, {
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
