// ZapTI Web — Auth Middleware
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require NO authentication (exact match)
const publicPaths = [
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
];

// API paths that handle their own auth state (return 401, not redirect)
const publicApiPaths = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/auth/me',
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
}

function isPublicApiPath(pathname: string): boolean {
  return publicApiPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public API routes handle their own 401 responses (no redirect — keeps fetch() usable)
  if (isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  // Public pages: always accessible
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Root: redirect to dashboard (protected — auth check happens there via redirect below)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check for tokens in cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // No tokens at all — protect everything
  if (!accessToken && !refreshToken) {
    // API routes get 401 JSON, pages get redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Não autenticado' } },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Access token exists — forward it to API routes as Bearer header.
  // NOTE: token validity is verified server-side (API + route handlers); an
  // invalid/forged cookie value only gets the user an empty shell, never data.
  if (accessToken) {
    if (pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('Authorization', `Bearer ${accessToken}`);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    return NextResponse.next();
  }

  // Only refresh token exists — try to refresh by redirecting to the refresh
  // endpoint, which rotates tokens and sends the user back to where they were.
  if (refreshToken && !accessToken) {
    const refreshUrl = new URL('/api/auth/refresh', request.url);
    refreshUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(refreshUrl);
  }

  // Fallback: deny
  const loginUrl = new URL('/auth/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Apply to everything except static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)'],
};
