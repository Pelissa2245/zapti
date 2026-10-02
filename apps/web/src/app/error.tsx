// ZapTI Web — Client-side Exception Boundary (app routes)
'use client';

import Link from 'next/link';

export default function ErrorPage({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-slate-200 dark:text-slate-800">500</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-4">
          Algo deu errado
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Ocorreu um erro interno. Nossa equipe já foi notificada. Tente novamente em instantes.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            Tentar novamente
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            Ir para o Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
