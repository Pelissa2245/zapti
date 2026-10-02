// ZapTI Web — Global Error Boundary (layout-level; replaces the raw Next.js
// "Application error" screen)
'use client';

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            padding: '16px',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <p style={{ fontSize: 72, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>500</p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginTop: 16 }}>
              Erro inesperado
            </h1>
            <p style={{ color: '#64748b', marginTop: 8 }}>
              Encontramos um problema ao carregar o aplicativo. Tente recarregar a página.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: 24,
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: '#4f46e5',
                color: 'white',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Recarregar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
