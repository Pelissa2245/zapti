// ZapTI Web — Superadmin Layout
'use client';

import * as React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <Header />
      <main
        className="lg:pl-64 pt-16 min-h-screen transition-all duration-300"
        style={{ marginLeft: '16rem' }}
      >
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}