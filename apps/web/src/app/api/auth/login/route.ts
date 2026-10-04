// ZapTI Web — Login API Route
import { loginAction } from '@/actions/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const formData = new FormData();
  formData.set('email', String(body.email ?? ''));
  formData.set('password', String(body.password ?? ''));
  formData.set('rememberMe', body.rememberMe ? 'on' : '');

  try {
    const result = await loginAction(undefined, formData);

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Do not return tokens in the body — cookies are httpOnly, set by the action
    // Forward requiresTwoFactor flag for 2FA flow
    return NextResponse.json({
      success: true,
      requiresTwoFactor: result.requiresTwoFactor
    });
  } catch (err: any) {
    // Re-throw NEXT_REDIRECT errors (used by redirect() in server actions)
    if (err?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 });
  }
}
