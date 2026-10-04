// ZapTI Web — Refresh Token API Route
import { refreshTokenAction } from '@/actions/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await refreshTokenAction();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar token' }, { status: 401 });
  }
}

// GET handler for middleware redirect flow
// Middleware redirects here when only refreshToken exists (no accessToken)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  try {
    await refreshTokenAction();
    // On success, redirect to the original destination
    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch {
    // On failure, redirect to login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', redirectTo);
    return NextResponse.redirect(loginUrl);
  }
}
