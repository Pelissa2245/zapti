// ZapTI Web — 404 Not Found
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-slate-200 dark:text-slate-800">404</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-4">
          Página não encontrada
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          A página que você tentou acessar não existe ou foi movida.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            Ir para o Dashboard
          </Link>
          <Link
            href="/auth/login"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
