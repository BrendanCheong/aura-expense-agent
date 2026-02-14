/**
 * Auth middleware for API routes.
 *
 * Thin wrapper around getSessionUser that provides a consistent auth
 * interface for all API routes. Returns the authenticated user's
 * account ID or null.
 *
 * In dev mode (PROJECT_ENV=dev): returns mock user without session check.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/appwrite/session';

export interface AuthenticatedUser {
  accountId: string;
  email: string;
  name: string;
}

/**
 * Get the authenticated user from request cookies.
 * Returns null if no valid session exists.
 */
export async function getAuthenticatedUser(
  request: NextRequest,
): Promise<AuthenticatedUser | null> {
  return getSessionUser(request);
}

/**
 * Return a 401 Unauthorized JSON response.
 */
export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
