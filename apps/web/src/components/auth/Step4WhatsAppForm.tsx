// ZapTI Web — Step 4: WhatsApp Configuration (Optional)
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { MessageSquare, Loader2, AlertCircle, CheckCircle2, HelpCircle, Shield, ExternalLink, Eye, EyeOff } from 'lucide-react';

const whatsappSchema = z.object({
  configureWhatsApp: z.boolean().default(false),
  evolutionApiUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  evolutionApiKey: z.string().optional(),
  instanceName: z.string().optional(),
});

type WhatsAppFormData = z.infer<typeof whatsappSchema>;

interface Step4WhatsAppFormProps {
  onNext: (data: { configureWhatsApp: boolean; evolutionApiUrl?: string; evolutionApiKey?: string; instanceName?: string }) => void;
  onBack: () => void;
  onSkip: () => void;
  initialData?: Partial<WhatsAppFormData>;
  isLoading?: boolean;
  error?: string | null;
}

export function Step4WhatsAppForm({ onNext, onBack, onSkip, initialData, isLoading, error }: Step4WhatsAppFormProps) {
  const [showKey, setShowKey] = React.useState(false);
  const [connectionStatus, setConnectionStatus] = React.useState<'idle' | 'checking' | 'connected' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WhatsAppFormData>({
    resolver: zodResolver(whatsappSchema),
    defaultValues: {
      configureWhatsApp: false,
      evolutionApiUrl: '',
      evolutionApiKey: '',
      instanceName: '',
      ...initialData,
    },
  });

  const configureWhatsApp = watch('configureWhatsApp');
  const evolutionApiUrl = watch('evolutionApiUrl');
  const evolutionApiKey = watch('evolutionApiKey');
  const instanceName = watch('instanceName');

  // Test connection
  const testConnection = React.useCallback(async () => {
    if (!evolutionApiUrl || !evolutionApiKey || !instanceName) return;

    setConnectionStatus('checking');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const response = await fetch(`${apiUrl}/evolution/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: evolutionApiUrl, apiKey: evolutionApiKey, instanceName }),
      });
      const data = await response.json();
      setConnectionStatus(response.ok && data.connected ? 'connected' : 'error');
    } catch {
      setConnectionStatus('error');
    }
  }, [evolutionApiUrl, evolutionApiKey, instanceName]);

  React.useEffect(() => {
    if (!configureWhatsApp) {
      setConnectionStatus('idle');
    }
  }, [configureWhatsApp]);

  const onSubmit = (data: WhatsAppFormData) => {
    // If not configuring WhatsApp, send minimal data
    if (!data.configureWhatsApp) {
      onNext({ configureWhatsApp: false });
      return;
    }
    // Clean empty strings
    const cleanData = {
      ...data,
      evolutionApiUrl: data.evolutionApiUrl || undefined,
      evolutionApiKey: data.evolutionApiKey || undefined,
      instanceName: data.instanceName || undefined,
    };
    onNext(cleanData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-in" noValidate>
      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-in" role="alert">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* WhatsApp Toggle */}
      <div className="p-3 rounded-xl border-2 bg-slate-50 dark:bg-slate-800/50 transition-colors duration-200 animate-in"
        style={{ borderColor: configureWhatsApp ? 'hsl(var(--primary))' : 'hsl(var(--border))', animationDelay: '50ms' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">Conectar WhatsApp</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Configure a integração com a Evolution API para enviar e receber mensagens
              </p>
            </div>
          </div>
          <Toggle
            checked={configureWhatsApp}
            onCheckedChange={(checked) => setValue('configureWhatsApp', checked)}
            disabled={isLoading}
            label=""
          />
        </div>
      </div>

      {/* WhatsApp Config Fields */}
      {configureWhatsApp && (
        <div className="space-y-5 animate-slide-in animate-in" style={{ animationDelay: '100ms' }}>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 animate-in" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h4 className="font-medium text-slate-900 dark:text-white">Configuração da Evolution API</h4>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Preencha os campos abaixo para conectar sua instância da Evolution API
            </p>

            {/* Evolution API URL */}
            <div className="animate-in" style={{ animationDelay: '200ms' }}>
              <Label htmlFor="evolutionApiUrl" className="flex items-center gap-2 text-sm font-medium">
                <ExternalLink className="w-4 h-4 text-slate-400" />
                URL da API <span className="text-red-500">*</span>
              </Label>
              <Input
                id="evolutionApiUrl"
                type="url"
                placeholder="https://sua-evolution-api.com"
                {...register('evolutionApiUrl')}
                error={errors.evolutionApiUrl?.message}
                disabled={isLoading}
                className="mt-1.5"
              />
              {errors.evolutionApiUrl && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
                  <AlertCircle className="w-3 h-3" />
                  {errors.evolutionApiUrl.message}
                </p>
              )}
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                URL base da sua instância Evolution API (ex: https://api.seudominio.com)
              </p>
            </div>

            {/* Evolution API Key */}
            <div className="animate-in" style={{ animationDelay: '250ms' }}>
              <Label htmlFor="evolutionApiKey" className="flex items-center gap-2 text-sm font-medium">
                <Shield className="w-4 h-4 text-slate-400" />
                API Key <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="evolutionApiKey"
                  type={showKey ? 'text' : 'password'}
                  placeholder="Sua API Key da Evolution API"
                  {...register('evolutionApiKey')}
                  error={errors.evolutionApiKey?.message}
                  disabled={isLoading}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={showKey ? 'Ocultar chave' : 'Mostrar chave'}
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.evolutionApiKey && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
                  <AlertCircle className="w-3 h-3" />
                  {errors.evolutionApiKey.message}
                </p>
              )}
            </div>

            {/* Instance Name */}
            <div className="animate-in" style={{ animationDelay: '300ms' }}>
              <Label htmlFor="instanceName" className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                Nome da instância <span className="text-red-500">*</span>
              </Label>
              <Input
                id="instanceName"
                type="text"
                placeholder="zapti-principal"
                {...register('instanceName')}
                error={errors.instanceName?.message}
                disabled={isLoading}
                className="mt-1.5"
              />
              {errors.instanceName && (
                <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
                  <AlertCircle className="w-3 h-3" />
                  {errors.instanceName.message}
                </p>
              )}
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Nome da instância WhatsApp na Evolution API (será criada se não existir)
              </p>
            </div>

            {/* Test Connection */}
            <div className="animate-in" style={{ animationDelay: '350ms' }}>
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={isLoading || connectionStatus === 'checking' || !evolutionApiUrl || !evolutionApiKey || !instanceName}
                className="w-full gap-2"
              >
                {connectionStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin" />}
                {connectionStatus === 'connected' && <CheckCircle2 className="w-4 h-4" />}
                {connectionStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                <span>
                  {connectionStatus === 'checking' && 'Testando conexão...'}
                  {connectionStatus === 'connected' && 'Conexão bem-sucedida!'}
                  {connectionStatus === 'error' && 'Erro na conexão'}
                  {connectionStatus === 'idle' && 'Testar conexão'}
                </span>
              </Button>
              {connectionStatus === 'error' && (
                <p className="mt-2 text-sm text-red-500 text-center animate-in">
                  Verifique se a URL da API, a chave e o nome da instância estão corretos.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      {!configureWhatsApp && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 animate-in" style={{ animationDelay: '100ms' }}>
          <HelpCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <p className="font-medium">Configuração opcional</p>
            <p className="mt-1">
              Você pode configurar o WhatsApp depois no painel de administração.
              O onboarding será concluído sem a integração WhatsApp.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-700 animate-in" style={{ animationDelay: '400ms' }}>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="w-full sm:w-auto gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Button>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            disabled={isLoading}
            className="w-full sm:w-auto text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Pular esta etapa
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto gap-2"
            disabled={isLoading || (configureWhatsApp && (!evolutionApiUrl || !evolutionApiKey || !instanceName))}
            isLoading={isLoading}
          >
            {!configureWhatsApp ? 'Concluir onboarding' : 'Continuar'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9l-7 7 7 7" />
            </svg>
          </Button>
        </div>
      </div>
    </form>
  );
}