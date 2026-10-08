// ZapTI Web — Step 5: Success/Complete Screen
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CheckCircle2, Zap, Building2, User, ArrowRight, Loader2, Shield, Sparkles } from 'lucide-react';

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
    <div className="space-y-6 animate-in">
      {/* Success Animation */}
      <div className="text-center">
        <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center animate-pulse-glow shadow-xl shadow-green-500/25">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Tudo pronto!
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Sua conta <strong>{adminData.name}</strong> e empresa <strong>{tenantData.name}</strong> foram criadas com sucesso.
        </p>
      </div>

      {/* Sparkles decoration */}
      <div className="flex justify-center gap-2 animate-in" style={{ animationDelay: '100ms' }}>
        <Sparkles className="w-5 h-5 text-primary-400" />
        <Sparkles className="w-5 h-5 text-purple-400" style={{ animationDelay: '200ms' }} />
        <Sparkles className="w-5 h-5 text-green-400" style={{ animationDelay: '300ms' }} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors animate-in" style={{ animationDelay: '150ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Administrador</p>
                <p className="font-semibold text-slate-900 dark:text-white">{adminData.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">{adminData.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors animate-in" style={{ animationDelay: '200ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Empresa</p>
                <p className="font-semibold text-slate-900 dark:text-white">{tenantData.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Plano: Gratuito</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors animate-in" style={{ animationDelay: '250ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">WhatsApp</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {formData.configureWhatsApp ? 'Configurado' : 'Não configurado'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formData.configureWhatsApp ? 'Pronto para conectar' : 'Configure depois no painel'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors animate-in" style={{ animationDelay: '300ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Segurança</p>
                <p className="font-semibold text-slate-900 dark:text-white">2FA Opcional</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ative nas configurações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What's next */}
      <div className="rounded-2xl bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border border-primary-100 dark:border-primary-900/30 p-5 animate-in" style={{ animationDelay: '350ms' }}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">O que vem a seguir?</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Faça login no painel administrativo</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Configure suas primeiras automações</span>
              </li>
              {formData.configureWhatsApp && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Conecte suas instâncias WhatsApp</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Convide sua equipe para colaborar</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="text-center pt-2 animate-in" style={{ animationDelay: '400ms' }}>
        <Button
          onClick={handleComplete}
          disabled={isSubmitting}
          size="lg"
          className="w-full sm:w-auto min-w-[220px] gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Finalizando...
            </>
          ) : (
            <>
              Entrar no Dashboard
              <ArrowRight className="h-4 w-4" />
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