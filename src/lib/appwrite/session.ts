/**
 * Server-side session helpers.
 * Validates Appwrite session from request cookies or JWT and returns the
 * authenticated user's account ID.
 *
 * Authentication methods (checked in order):
 * 1. Dev bypass — always returns mock user when PROJECT_ENV=dev
 * 2. JWT from Authorization header (Bearer token)
 * 3. JWT from `aura_session` cookie (set after OAuth callback)
 *
 * After OAuth2, the Appwrite session cookie lives on the Appwrite domain,
 * NOT on localhost. We bridge the gap by creating a JWT client-side
 * (account.createJWT()) and storing it in the `aura_session` cookie.
 */

import { Client, Account } from 'node-appwrite';

import type { NextRequest } from 'next/server';

import { PROJECT_ENV_DEV } from '@/lib/constants';

export const AURA_SESSION_COOKIE = 'aura_session';

export const DEV_USER = {
  $id: 'dev-user-001',
  email: 'dev@aura.local',
  name: 'Dev User',
  status: true,
} as const;

export interface SessionUser {
  accountId: string;
  email: string;
  name: string;
}

/**
 * Verify a JWT with Appwrite and return the user info.
 * Returns null if the JWT is invalid or expired.
 */
async function _getUserFromJWT(jwt: string): Promise<SessionUser | null> {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  if (!endpoint || !projectId) {
    return null;
  }

  try {
    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setJWT(jwt);

    const account = new Account(client);
    const user = await account.get();

    return {
      accountId: user.$id,
      email: user.email,
      name: user.name,
    };
  } catch {
    return null;
  }
}

/**
 * Extract the authenticated user from an incoming request.
 * Returns null if no valid session exists.
 *
 * In dev mode (PROJECT_ENV=dev), always returns a mock dev user.
 */
export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  // Dev bypass
  if (process.env.PROJECT_ENV === PROJECT_ENV_DEV) {
    return {
      accountId: DEV_USER.$id,
      email: DEV_USER.email,
      name: DEV_USER.name,
    };
  }

  // 1. Try JWT from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const jwt = authHeader.slice(7);
    const user = await _getUserFromJWT(jwt);
    if (user) {
      return user;
    }
  }

  // 2. Try JWT from aura_session cookie
  const jwtCookie = request.cookies.get(AURA_SESSION_COOKIE)?.value;
  if (jwtCookie) {
    return _getUserFromJWT(jwtCookie);
  }

  return null;
}
