// ZapTI Web — Bootstrap Check Error Page
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { AlertCircle, RefreshCw, WifiOff, Loader2 } from 'lucide-react';

export default function BootstrapErrorPage() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('code');
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    // Reload the page to trigger middleware check again
    window.location.reload();
  };

  const getErrorMessage = () => {
    switch (errorCode) {
      case 'bootstrap_check_failed':
        return {
          title: 'Não foi possível verificar o status do sistema',
          description: 'Ocorreu um erro ao tentar verificar se o sistema precisa de configuração inicial. Isso pode acontecer se o servidor da API estiver indisponível.',
        };
      default:
        return {
          title: 'Erro desconhecido',
          description: 'Ocorreu um erro inesperado. Tente recarregar a página.',
        };
    }
  };

  const { title, description } = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">{title}</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar novamente
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              asChild
            >
              <Link href="/">
                <WifiOff className="w-4 h-4 mr-2" />
                Página inicial
              </Link>
            </Button>
          </div>
          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            Se o problema persistir, verifique se o servidor da API está rodando e acessível.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}