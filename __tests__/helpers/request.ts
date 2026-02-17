/**
 * Shared request helpers for integration tests.
 *
 * Provides reusable NextRequest factories, route context helper,
 * and the standard mock user constant.
 *
 * Usage:
 *   import { createGetRequest, routeContext, MOCK_USER } from '../helpers/request';
 */

import { NextRequest } from 'next/server';

import type { AuthenticatedUser } from '@/lib/auth/middleware';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOST = 'http://localhost:4321';

/** Standard mock user matching fixture test-user-001 (for dev mode auth bypass). */
export const MOCK_USER: AuthenticatedUser = {
  accountId: 'test-user-001',
  email: 'test@aura.local',
  name: 'Test User',
};

/** Alternative mock user for ownership / isolation tests. */
export const OTHER_USER: AuthenticatedUser = {
  accountId: 'test-user-002',
  email: 'other@aura.local',
  name: 'Other User',
};

// ---------------------------------------------------------------------------
// Request factories
// ---------------------------------------------------------------------------

/** Create a GET request. Pass query string without leading `?`. */
export function createGetRequest(path: string, query = ''): NextRequest {
  const url = `${HOST}${path}${query ? '?' + query : ''}`;
  return new NextRequest(url, { method: 'GET' });
}

/** Create a POST request with JSON body. */
export function createPostRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(`${HOST}${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Create a PATCH request with JSON body. */
export function createPatchRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(`${HOST}${path}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Create a DELETE request. */
export function createDeleteRequest(path: string): NextRequest {
  return new NextRequest(`${HOST}${path}`, { method: 'DELETE' });
}

/** Create a request with an unparseable body (for invalid-JSON tests). */
export function createInvalidJsonRequest(
  path: string,
  method: 'POST' | 'PATCH'
): NextRequest {
  return new NextRequest(`${HOST}${path}`, {
    method,
    body: 'not-json',
    headers: { 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// Route context helper — for Next.js dynamic route handlers
// ---------------------------------------------------------------------------

/** Build the context object expected by dynamic route handlers (e.g. [id]). */
export function routeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}
