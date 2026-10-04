// ZapTI Web — Server Actions for Authentication
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Server-side API URL (uses internal Docker hostname)
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://api:3000/api/v1';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  rememberMe: z.boolean().optional(),
  twoFactorToken: z.string().optional(),
});

interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    isSuperadmin: boolean;
    onboardingCompleted: boolean;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
  session: {
    id: string;
    expiresAt: string;
  };
  accessToken: string;
  refreshToken: string;
  requiresTwoFactor: boolean;
}

function getCookieOptions(rememberMe: boolean) {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 15 * 60; // 30 days or 15 minutes
  const refreshMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days

  return {
    accessToken: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_API_URL?.startsWith('https'),
      sameSite: 'lax' as const,
      maxAge,
      path: '/',
    },
    refreshToken: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_API_URL?.startsWith('https'),
      sameSite: 'lax' as const,
      maxAge: refreshMaxAge,
      path: '/',
    },
  };
}

export async function loginAction(prevState: { error?: string } | undefined, formData: FormData) {

  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    rememberMe: formData.get('rememberMe') === 'on',
    twoFactorToken: formData.get('twoFactorToken') as string || undefined,
  };


  const validated = loginSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: validated.error.errors[0].message, requiresTwoFactor: false };
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validated.data,
        twoFactorToken: validated.data.twoFactorToken,
      }),
    });

    const rawData = await response.json();

    // API returns { data: {...}, error: {...} } or just the data
    const data: LoginResponse = rawData.data ?? rawData;
    const errorMessage: string | undefined = rawData.error?.message;

    // Handle 2FA required case - API returns { requiresTwoFactor: true, message: '...' } without accessToken
    if (data.requiresTwoFactor) {
      return { requiresTwoFactor: true };
    }

    if (!response.ok || errorMessage || !data.accessToken) {
      return { error: errorMessage || 'Credenciais inválidas', requiresTwoFactor: false };
    }

    // Set cookies server-side
    const cookieStore = await cookies();
    const options = getCookieOptions(validated.data.rememberMe ?? false);

    cookieStore.set('accessToken', data.accessToken, options.accessToken);
    cookieStore.set('refreshToken', data.refreshToken, options.refreshToken);

    // Return requiresTwoFactor flag - client handles redirect
    return { requiresTwoFactor: data.requiresTwoFactor };
  } catch {
    return { error: 'Erro de conexão. Tente novamente.', requiresTwoFactor: false };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();

  // Revoke the session server-side BEFORE clearing cookies, otherwise the
  // database session stays ACTIVE and a copied cookie would still work.
  const accessToken = cookieStore.get('accessToken')?.value;
  if (accessToken) {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => {});
  }

  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
  redirect('/auth/login');
}

export async function refreshTokenAction() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!refreshToken) {
    redirect('/auth/login');
  }

  try {
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
      cookieStore.delete('accessToken');
      cookieStore.delete('refreshToken');
      redirect('/auth/login');
    }

    const options = getCookieOptions(false);
    cookieStore.set('accessToken', data.accessToken, options.accessToken);
    cookieStore.set('refreshToken', data.refreshToken, options.refreshToken);

    return { success: true };
  } catch {
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');
    redirect('/auth/login');
  }
}