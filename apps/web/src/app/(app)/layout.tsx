// ZapTI Web — Protected App Layout (with Onboarding Guard)
'use client';

import * as React from 'react';
import { OnboardingGuard } from '@/components/OnboardingGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <Header />
        <main className="lg:pl-64 pt-16 min-h-screen transition-all duration-300">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </OnboardingGuard>
  );
}