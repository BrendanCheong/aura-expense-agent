import { NextResponse, type NextRequest } from 'next/server';
import { Client, Account, Query } from 'node-appwrite';

import { getAppwriteServer } from '@/lib/appwrite/server';
import { AURA_SESSION_COOKIE } from '@/lib/appwrite/session';
import { HttpStatus, ErrorMessage } from '@/lib/constants';
import { createContainer } from '@/lib/container/container';
import { OAuthProvider } from '@/lib/enums';

/**
 * JWT duration in seconds.
 * 30 minutes — balances security (short-lived tokens) with UX (less frequent re-auth).
 * Maximum allowed by Appwrite Users API is 3600 (1 hour).
 */
const JWT_DURATION_SECONDS = 1800;

const PROVIDER_MAP: Record<string, OAuthProvider> = {
  google: OAuthProvider.GOOGLE,
  github: OAuthProvider.GITHUB,
};

/**
 * POST /api/auth/session
 *
 * Called after OAuth callback to establish a secure server-side session.
 *
 * Flow:
 * 1. Client passes a temporary JWT (from account.createJWT()) in Authorization header
 * 2. Server verifies JWT, extracts user identity from Appwrite
 * 3. Server creates a longer-lived JWT via Users API (admin SDK)
 * 4. Server ensures user record exists in database
 * 5. Server sets JWT as HttpOnly cookie (never exposed to client JS)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Extract client JWT from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: ErrorMessage.UNAUTHORIZED },
        { status: HttpStatus.UNAUTHORIZED }
      );
    }
    const clientJwt = authHeader.slice(7);

    // 2. Verify the client JWT and get user info
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

    if (!endpoint || !projectId) {
      return NextResponse.json(
        { error: ErrorMessage.INTERNAL_SERVER_ERROR },
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
      );
    }

    const jwtClient = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setJWT(clientJwt);

    const account = new Account(jwtClient);
    const user = await account.get();

    // 3. Create server-side JWT via Users API (admin SDK with API key)
    const { users } = getAppwriteServer();

    // Determine OAuth provider from user's identities (JWT can't access sessions)
    const identities = await users.listIdentities({
      queries: [Query.equal('userId', user.$id)],
    });
    const provider = identities.identities[0]?.provider || 'github';

    const { jwt: serverJwt } = await users.createJWT({
      userId: user.$id,
      sessionId: 'recent',
      duration: JWT_DURATION_SECONDS,
    });

    // 4. Ensure user record exists in DB
    const container = await createContainer();
    const dbUser = await container.authService.getOrCreateUser(user.$id, {
      email: user.email,
      name: user.name,
      avatarUrl: user.prefs?.avatar ?? '',
      oauthProvider: PROVIDER_MAP[provider] ?? OAuthProvider.GITHUB,
    });

    // 5. Set HttpOnly cookie and return user info
    const response = NextResponse.json({ user: dbUser });
    response.cookies.set(AURA_SESSION_COOKIE, serverJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: JWT_DURATION_SECONDS,
    });

    return response;
  } catch (err) {
    console.error('Session creation error:', err);
    return NextResponse.json(
      { error: ErrorMessage.UNAUTHORIZED },
      { status: HttpStatus.UNAUTHORIZED }
    );
  }
}

/**
 * DELETE /api/auth/session
 *
 * Logout — clears the session cookie.
 */
export function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(AURA_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
