import { NextResponse, type NextRequest } from 'next/server';

/**
 * Auth guard middleware.
 * Protects dashboard routes — redirects unauthenticated users to /login.
 * In dev mode (PROJECT_ENV=dev), all routes are accessible.
 */

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/transactions',
  '/categories',
  '/budgets',
  '/settings',
];

const PUBLIC_PATHS = ['/', '/login', '/callback'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dev bypass — allow all routes
  if (process.env.PROJECT_ENV === 'dev') {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for Appwrite session cookie
  const sessionCookie = request.cookies.get('a_session');

  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - api routes (handled separately)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
