// ZapTI Web — Auth Middleware
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require NO authentication (exact match)
const publicPaths = [
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/bootstrap',  // Bootstrap page for first admin
  '/auth/onboarding', // Onboarding page - accessible when database is empty
  '/terms',
  '/privacy',
];

// API paths that handle their own auth state (return 401, not redirect)
const publicApiPaths = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/auth/me',
  '/api/auth/bootstrap-status',
  '/api/auth/bootstrap',
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
}

function isPublicApiPath(pathname: string): boolean {
  return publicApiPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
}

// Check if bootstrap is needed by calling the backend API
async function checkBootstrapNeeded(): Promise<boolean> {
  try {
    // In Docker, use internal network; locally, use localhost
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const response = await fetch(`${apiUrl}/auth/bootstrap-status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (response.ok) {
      const data = await response.json();
      return data.needsBootstrap === true;
    }
  } catch (error) {
    console.error('Bootstrap status check failed:', error);
  }
  // Default to false (no bootstrap needed) if check fails
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public API routes handle their own 401 responses (no redirect — keeps fetch() usable)
  if (isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  // Public pages: always accessible (but with bootstrap check for login/onboarding)
  if (isPublicPath(pathname)) {
    // Special handling for /auth/onboarding and /auth/login - check if bootstrap is needed
    if (pathname === '/auth/onboarding' || pathname === '/auth/login') {
      const needsBootstrap = await checkBootstrapNeeded();
      if (needsBootstrap) {
        // Database is empty
        if (pathname === '/auth/onboarding') {
          // Allow access to onboarding
          return NextResponse.next();
        }
        // Redirect login to onboarding
        return NextResponse.redirect(new URL('/auth/onboarding', request.url));
      } else {
        // Database has users
        if (pathname === '/auth/onboarding') {
          // Redirect onboarding to login
          const loginUrl = new URL('/auth/login', request.url);
          loginUrl.searchParams.set('callbackUrl', '/auth/onboarding');
          return NextResponse.redirect(loginUrl);
        }
        // Allow access to login
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // Root: check bootstrap status first, then redirect appropriately
  if (pathname === '/') {
    const needsBootstrap = await checkBootstrapNeeded();
    if (needsBootstrap) {
      return NextResponse.redirect(new URL('/auth/onboarding', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check for tokens in cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // No tokens at all — protect everything
  if (!accessToken && !refreshToken) {
    // Check bootstrap status for protected pages
    const needsBootstrap = await checkBootstrapNeeded();
    // API routes get 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Não autenticado' } },
        { status: 401 }
      );
    }
    // If database is empty, redirect to onboarding; otherwise redirect to login
    if (needsBootstrap) {
      return NextResponse.redirect(new URL('/auth/onboarding', request.url));
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
