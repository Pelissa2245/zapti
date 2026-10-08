// ZapTI Web — Bootstrap API Route
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getCookieOptions(request: NextRequest) {
  // Determine if we're in production with HTTPS
  // Check the request protocol or headers to detect HTTPS
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const isHttps = proto === 'https' || process.env.NODE_ENV === 'production';

  const maxAge = 30 * 24 * 60 * 60; // 30 days
  const refreshMaxAge = 30 * 24 * 60 * 60; // 30 days

  return {
    accessToken: {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax' as const,
      maxAge,
      path: '/',
    },
    refreshToken: {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax' as const,
      maxAge: refreshMaxAge,
      path: '/',
    },
  };
}

// Get the backend API URL for server-side fetches
// In Docker: http://api:3000/api/v1
// In local dev: http://localhost:3000/api/v1
function getBackendApiUrl(): string {
  // Use explicit API_URL or BACKEND_URL for server-side calls
  if (process.env.API_URL) {
    return process.env.API_URL;
  }
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  // Default to Docker internal hostname
  return 'http://api:3000/api/v1';
}

export async function POST(request: NextRequest) {
  try {
    const apiUrl = getBackendApiUrl();

    // Handle both FormData (from frontend) and JSON
    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, string>;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = {};
      for (const [key, value] of formData.entries()) {
        body[key] = value.toString();
      }
    } else {
      body = await request.json();
    }

    const response = await fetch(`${apiUrl}/auth/bootstrap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || { message: 'Erro ao criar administrador inicial' } },
        { status: response.status }
      );
    }

    // Create response with cookies set properly for API routes
    const nextResponse = NextResponse.json(data);
    const options = getCookieOptions(request);

    // Set cookies directly on the response (works in API routes)
    if (data.accessToken) {
      nextResponse.cookies.set('accessToken', data.accessToken, options.accessToken);
    }
    if (data.refreshToken) {
      nextResponse.cookies.set('refreshToken', data.refreshToken, options.refreshToken);
    }

    // Also forward any cookies from the backend API response
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    for (const cookie of setCookieHeaders) {
      nextResponse.headers.append('Set-Cookie', cookie);
    }

    return nextResponse;
  } catch (error) {
    console.error('Bootstrap error:', error);
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor' } },
      { status: 500 }
    );
  }
}