import { NextResponse, type NextRequest } from 'next/server';

import { getAppwriteServer } from '@/lib/appwrite/server';
import { AURA_SESSION_COOKIE, getSessionUser } from '@/lib/appwrite/session';
import { HttpStatus, ErrorMessage } from '@/lib/constants';

/**
 * JWT duration in seconds — must match /api/auth/session.
 */
const JWT_DURATION_SECONDS = 1800;

/**
 * POST /api/auth/refresh
 *
 * Refreshes the session JWT before it expires.
 * The existing JWT cookie is used to verify the caller's identity,
 * then a fresh JWT is created with a new 30-minute window.
 */
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json(
        { error: ErrorMessage.UNAUTHORIZED },
        { status: HttpStatus.UNAUTHORIZED }
      );
    }

    const { users } = getAppwriteServer();
    const { jwt } = await users.createJWT({
      userId: sessionUser.accountId,
      sessionId: 'recent',
      duration: JWT_DURATION_SECONDS,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(AURA_SESSION_COOKIE, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: JWT_DURATION_SECONDS,
    });

    return response;
  } catch (err) {
    console.error('JWT refresh error:', err);
    return NextResponse.json(
      { error: ErrorMessage.UNAUTHORIZED },
      { status: HttpStatus.UNAUTHORIZED }
    );
  }
}
