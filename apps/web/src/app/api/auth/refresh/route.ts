// ZapTI Web — Refresh Token API Route
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://api:3000/api/v1';

async function refreshTokenAction(): Promise<{ accessToken: string; refreshToken: string }> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `refreshToken=${refreshToken}`,
    },
    body: JSON.stringify({ refreshToken }),
  });

  const rawData = await response.json();
  const data: { accessToken: string; refreshToken: string } | undefined = rawData.data ?? rawData;
  const errorMessage: string | undefined = rawData.error?.message;

  if (!response.ok || errorMessage || !data?.accessToken || !data?.refreshToken) {
    throw new Error('Refresh failed');
  }

  return data;
}

function getCookieOptions(rememberMe: boolean) {
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };

  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 days or 1 day

  return {
    accessToken: { ...base, maxAge: 60 * 15 }, // 15 minutes
    refreshToken: { ...base, maxAge },
  };
}

export async function POST(request: Request) {
  try {
    // Get refresh token from cookie header if not in cookie store
    const cookieHeader = request.headers.get('cookie');
    const cookieStore = await cookies();

    // If cookie store doesn't have refreshToken but header does, set it
    if (!cookieStore.get('refreshToken') && cookieHeader) {
      const match = cookieHeader.match(/refreshToken=([^;]+)/);
      if (match) {
        cookieStore.set('refreshToken', match[1], { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
      }
    }

    const data = await refreshTokenAction();

    const options = getCookieOptions(false);
    const response = NextResponse.json({ success: true });
    response.cookies.set('accessToken', data.accessToken, options.accessToken);
    response.cookies.set('refreshToken', data.refreshToken, options.refreshToken);

    return response;
  } catch {
    const response = NextResponse.json({ error: 'Erro ao atualizar token' }, { status: 401 });
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    return response;
  }
}

// GET handler for middleware redirect flow
// Middleware redirects here when only refreshToken exists (no accessToken)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  try {
    // Get refresh token from cookie header if not in cookie store
    const cookieHeader = request.headers.get('cookie');
    const cookieStore = await cookies();

    if (!cookieStore.get('refreshToken') && cookieHeader) {
      const match = cookieHeader.match(/refreshToken=([^;]+)/);
      if (match) {
        cookieStore.set('refreshToken', match[1], { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
      }
    }

    const data = await refreshTokenAction();

    const options = getCookieOptions(false);
    // Use request headers to construct proper redirect URL
    const host = request.headers.get('host') || 'localhost:3001';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUrl = new URL(redirectTo, `${protocol}://${host}`);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('accessToken', data.accessToken, options.accessToken);
    response.cookies.set('refreshToken', data.refreshToken, options.refreshToken);

    return response;
  } catch {
    // On failure, redirect to login using host header
    const host = request.headers.get('host') || 'localhost:3001';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const loginUrl = new URL('/auth/login', `${protocol}://${host}`);
    loginUrl.searchParams.set('callbackUrl', redirectTo);
    return NextResponse.redirect(loginUrl);
  }
}
