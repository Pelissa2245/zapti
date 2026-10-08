// ZapTI Web — Auth Middleware
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require NO authentication (exact match)
const publicPaths = [
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/error', // Error page - must be accessible even when API is down
  '/terms',
  '/privacy',
];

// Onboarding wizard path - special handling needed
const onboardingWizardPath = '/auth/onboarding/wizard';

// API paths that handle their own auth state (return 401, not redirect)
const publicApiPaths = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/auth/me',
  '/api/auth/bootstrap-status',
  '/api/auth/bootstrap',
  '/api/auth/complete-onboarding',
  '/api/auth/onboarding-status',
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
}

function isPublicApiPath(pathname: string): boolean {
  return publicApiPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
}

// Check if the path is a dashboard API route that handles its own auth
function isDashboardApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/dashboard/');
}

// Check if bootstrap is needed by calling the backend API
// Returns: { needsBootstrap: boolean, error?: string }
// If error is set, the API call failed and we should show an error page
async function checkBootstrapNeeded(): Promise<{ needsBootstrap: boolean; error?: string }> {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  const timeoutMs = 10000; // 10 second timeout per attempt

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // In Docker, use internal network; locally, use localhost
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(apiUrl + '/auth/bootstrap-status', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      return { needsBootstrap: data.needsBootstrap };
    } catch (error) {
      clearTimeout(timeoutId);
      const isLastAttempt = attempt === maxRetries - 1;
      if (isLastAttempt) {
        return { needsBootstrap: false, error: 'Unable to connect to API' };
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt)));
    }
  }
  return { needsBootstrap: false, error: 'Unable to connect to API' };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml')
  ) {
    return NextResponse.next();
  }

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Allow public API paths
  if (isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  // Skip bootstrap check for public API paths and dashboard API paths
  if (isPublicApiPath(pathname) || isDashboardApiPath(pathname)) {
    return NextResponse.next();
  }

  // Check if bootstrap is needed
  const { needsBootstrap, error } = await checkBootstrapNeeded();

  if (error) {
    // API is unreachable - redirect to error page
    const errorUrl = new URL('/error', request.url);
    errorUrl.searchParams.set('code', 'API_UNAVAILABLE');
    errorUrl.searchParams.set('message', 'Unable to connect to the API server. Please try again later.');
    return NextResponse.redirect(errorUrl);
  }

  // Special handling for onboarding wizard
  // Only allow access if bootstrap is needed, otherwise redirect to dashboard
  if (pathname === onboardingWizardPath || pathname.startsWith(onboardingWizardPath + '/')) {
    if (needsBootstrap) {
      return NextResponse.next();
    } else {
      // Bootstrap already complete - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (needsBootstrap) {
    // Redirect to onboarding wizard
    const wizardUrl = new URL('/auth/onboarding/wizard', request.url);
    return NextResponse.redirect(wizardUrl);
  }

  // Check for access token in cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  if (!accessToken) {
    // No access token - redirect to login with return URL
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists - verify with backend
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const response = await fetch(apiUrl + '/auth/me', {
      method: 'GET',
      headers: {
        Cookie: `accessToken=${accessToken}; refreshToken=${refreshToken || ''}`,
      },
    });

    if (!response.ok) {
      // Token invalid or expired - try to refresh
      if (refreshToken) {
        const refreshResponse = await fetch(apiUrl + '/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          // Set new tokens in response
          const response = NextResponse.next();
          response.cookies.set('accessToken', refreshData.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
          });
          if (refreshData.refreshToken) {
            response.cookies.set('refreshToken', refreshData.refreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 30,
              path: '/',
            });
          }
          return response;
        }
      }

      // Refresh failed or no refresh token - redirect to login
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Valid token - continue
    return NextResponse.next();
  } catch {
    // Network error - allow request to proceed (graceful degradation)
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};