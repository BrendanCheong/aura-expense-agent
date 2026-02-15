import { NextResponse } from 'next/server';
import { createContainer } from '@/lib/container/container';
import { HttpStatus, ErrorMessage } from '@/lib/constants';
import { OAuthProvider } from '@/lib/enums';

/**
 * POST /api/auth/dev-login
 *
 * Dev-only endpoint. Creates or returns the dev user.
 * Only available when PROJECT_ENV=dev.
 */
export async function POST() {
  if (process.env.PROJECT_ENV !== 'dev') {
    return NextResponse.json(
      { error: 'Dev login not available in production' },
      { status: HttpStatus.FORBIDDEN },
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

    return NextResponse.json({ user });
  } catch (err) {
    console.error('dev-login error:', err);
    return NextResponse.json(
      { error: ErrorMessage.INTERNAL_SERVER_ERROR },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
