// ZapTI Web — Auth + Onboarding Guard Component
'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { Zap } from 'lucide-react';

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
        // Check if we're on the onboarding page and if bootstrap is needed
        // If database is empty, onboarding page should be accessible without session
        if (pathname === '/auth/onboarding') {
          const bootstrapRes = await fetch('/api/auth/bootstrap-status', {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
          });
          if (bootstrapRes.ok) {
            const data = await bootstrapRes.json();
            if (data.needsBootstrap === true) {
              // Database is empty, allow access to onboarding without session
              if (!cancelled) {
                setStatus('authenticated');
              }
              return;
            }
          }
        }

        // Ask the server whether there is a REAL session (cookies are httpOnly,
        // so the client store alone cannot be trusted)
        const res = await fetch('/api/auth/me', {
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.status === 401) {
          // No session - check if we need to redirect to login
          // (bootstrap check happens in middleware for root path)
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

          // Check if user needs to complete onboarding (language, timezone, etc.)
          // But only redirect if not already on onboarding page
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-10 h-10 text-primary animate-spin" />
          </div>
          <p className="text-slate-500 dark:text-slate-400">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
