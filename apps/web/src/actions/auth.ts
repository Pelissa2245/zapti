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

  // Check if frontend is HTTPS (cookies are set on the frontend domain, not the API domain)
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3001';
  const isHttps = process.env.NODE_ENV === 'production' && frontendUrl.startsWith('https');

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

// Bootstrap schema for server action
const bootstrapSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').max(128),
  confirmPassword: z.string(),
  tenantName: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres').max(100),
  tenantFantasyName: z.string().max(100).optional(),
  tenantTimezone: z.string().min(2).default('America/Sao_Paulo'),
  tenantCountry: z.string().min(2).default('BR'),
  tenantCurrency: z.string().min(3).default('BRL'),
  tenantLogoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

interface BootstrapResponse {
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

export async function bootstrapAction(prevState: { error?: string } | undefined, formData: FormData) {
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    tenantName: formData.get('tenantName'),
    tenantFantasyName: formData.get('tenantFantasyName'),
    tenantTimezone: formData.get('tenantTimezone'),
    tenantCountry: formData.get('tenantCountry'),
    tenantCurrency: formData.get('tenantCurrency'),
    tenantLogoUrl: formData.get('tenantLogoUrl'),
  };

  const validated = bootstrapSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    const response = await fetch(`${API_URL}/auth/bootstrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validated.data),
    });

    const rawResponse = await response.json();

    const data: BootstrapResponse = rawResponse.data ?? rawResponse;
    const errorMessage: string | undefined = rawResponse.error?.message;

    if (!response.ok || errorMessage || !data.accessToken) {
      return { error: errorMessage || 'Erro ao criar administrador inicial' };
    }

    // Set cookies server-side
    const cookieStore = await cookies();
    const options = getCookieOptions(false);

    cookieStore.set('accessToken', data.accessToken, options.accessToken);
    cookieStore.set('refreshToken', data.refreshToken, options.refreshToken);

    return { success: true };
  } catch {
    return { error: 'Erro de conexão. Tente novamente.' };
  }
}
