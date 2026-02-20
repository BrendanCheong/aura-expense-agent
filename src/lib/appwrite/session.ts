/**
 * Server-side session helpers.
 * Validates Appwrite session from request cookies and returns the
 * authenticated user's account ID.
 *
 * In dev mode (PROJECT_ENV=dev), returns a mock user for easy testing.
 */

import { Client, Account } from 'node-appwrite';

import type { NextRequest } from 'next/server';

import { PROJECT_ENV_DEV } from '@/lib/constants';

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

  // Extract Appwrite session from cookies
  const sessionCookie = request.cookies.get('a_session')?.value;
  if (!sessionCookie) {return null;}

  try {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

    if (!endpoint || !projectId) {return null;}

    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setSession(sessionCookie);

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
