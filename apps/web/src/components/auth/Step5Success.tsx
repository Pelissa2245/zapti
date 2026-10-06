// ZapTI Web — Step 5: Success/Complete Screen
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CheckCircle2, Zap, Building2, User, ArrowRight, Loader2, Shield } from 'lucide-react';

interface Step5SuccessProps {
  adminData: {
    name: string;
    email: string;
  };
  tenantData: {
    name: string;
  };
  formData: {
    language?: string;
    timezone?: string;
    theme?: 'light' | 'dark' | 'system';
    notifications?: { email: boolean; push: boolean; whatsapp: boolean };
    configureWhatsApp?: boolean;
    evolutionApiUrl?: string;
    evolutionApiKey?: string;
    instanceName?: string;
  };
  isLoading?: boolean;
  completed?: boolean;
}

export function Step5Success({ adminData, tenantData, formData, isLoading: _isLoading, completed }: Step5SuccessProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Handle completion internally - call API then redirect
  const handleComplete = React.useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Call complete-onboarding API to save preferences and WhatsApp config
      const response = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          language: formData.language || 'pt-BR',
          timezone: formData.timezone || 'America/Sao_Paulo',
          theme: formData.theme || 'system',
          notificationPreferences: formData.notifications,
          whatsappConfig: formData.configureWhatsApp ? {
            evolutionApiUrl: formData.evolutionApiUrl,
            evolutionApiKey: formData.evolutionApiKey,
            instanceName: formData.instanceName,
          } : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao completar onboarding');
      }

      toast.success('Conta criada com sucesso! Bem-vindo ao ZapTI.');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao finalizar';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [router, isSubmitting, formData]);

  // Auto-redirect after completion
  React.useEffect(() => {
    if (completed && !isSubmitting) {
      handleComplete();
    }
  }, [completed, handleComplete, isSubmitting]);

  return (
    <div className="space-y-5">
      {/* Success Animation */}
      <div className="text-center">
        <div className="mx-auto mb-5 w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-pulse-glow">
          <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Tudo pronto!
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Sua conta <strong>{adminData.name}</strong> e empresa <strong>{tenantData.name}</strong> foram criadas com sucesso.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Administrador</p>
                <p className="font-medium text-slate-900 dark:text-white">{adminData.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{adminData.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Empresa</p>
                <p className="font-medium text-slate-900 dark:text-white">{tenantData.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Plano: Gratuito</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">WhatsApp</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {formData.configureWhatsApp ? 'Configurado' : 'Não configurado'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formData.configureWhatsApp ? 'Pronto para conectar' : 'Configure depois no painel'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Segurança</p>
                <p className="font-medium text-slate-900 dark:text-white">2FA Opcional</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ative nas configurações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue Button */}
      <div className="text-center pt-2">
        <Button
          onClick={handleComplete}
          disabled={isSubmitting}
          size="lg"
          className="w-full sm:w-auto min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finalizando...
            </>
          ) : (
            <>
              Entrar no Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Você será redirecionado automaticamente em alguns segundos
        </p>
      </div>
    </div>
  );
}