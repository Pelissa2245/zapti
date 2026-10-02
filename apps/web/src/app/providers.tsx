// ZapTI Web — Providers
'use client';

import * as React from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
              description: 'text-slate-600 dark:text-slate-400',
              actionButton: 'bg-primary-600 hover:bg-primary-700',
              cancelButton: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600',
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}