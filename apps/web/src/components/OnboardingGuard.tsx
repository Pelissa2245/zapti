// ZapTI Web — Auth + Onboarding Guard Component
'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = React.useState<'checking' | 'authenticated' | 'redirecting'>('checking');

  useEffect(() => {
    let cancelled = false;

    async function validate() {
      try {
        // Ask the server whether there is a REAL session (cookies are httpOnly,
        // so the client store alone cannot be trusted)
        const res = await fetch('/api/auth/me', {
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.status === 401) {
          if (!cancelled) {
            setStatus('redirecting');
            router.replace(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
          }
          return;
        }

        if (!res.ok) {
          if (!cancelled) {
            setStatus('redirecting');
            router.replace('/auth/login?error=session_invalid');
          }
          return;
        }

        const session = await res.json();
        if (!session?.user) {
          if (!cancelled) {
            setStatus('redirecting');
            router.replace('/auth/login?error=session_invalid');
          }
          return;
        }

        // Real session exists — sync client store and check onboarding
        if (!cancelled) {
          useAuthStore.setState({
            user: session.user,
            currentTenant: session.user.tenants?.[0] || null,
            isAuthenticated: true,
            isSuperadmin: session.user.isSuperadmin || false,
          });

          if (!session.user.onboardingCompleted && !pathname.startsWith('/auth/onboarding')) {
            setStatus('redirecting');
            router.replace('/auth/onboarding');
            return;
          }

          setStatus('authenticated');
        }
      } catch {
        // Network error — never render protected content on failure
        if (!cancelled) {
          setStatus('redirecting');
          router.replace('/auth/login?error=session_invalid');
        }
      }
    }

    void validate();
    return () => {
      cancelled = true;
    };
    // Re-validate when the route changes
  }, [pathname, router]);

  // Never render protected children until a REAL session is confirmed
  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
