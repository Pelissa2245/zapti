// ZapTI Web — Onboarding Wizard Component
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProgressIndicator } from './ProgressIndicator';
import { Step1AdminForm } from './Step1AdminForm';
import { Step2TenantForm } from './Step2TenantForm';
import { Step3PreferencesForm } from './Step3PreferencesForm';
import { Step4WhatsAppForm } from './Step4WhatsAppForm';
import { Step5Success } from './Step5Success';
import { Zap, Shield, Users, Smartphone } from 'lucide-react';

const WIZARD_STEPS = [
  { label: 'Administrador', description: 'Seus dados de acesso' },
  { label: 'Empresa', description: 'Dados da sua empresa' },
  { label: 'Preferências', description: 'Idioma, tema, notificações' },
  { label: 'WhatsApp', description: 'Configuração opcional' },
  { label: 'Concluído', description: 'Pronto para usar' },
] as const satisfies { label: string; description?: string }[];

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
  // Step 1
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string;
  // Step 2
  tenantName?: string;
  tenantFantasyName?: string;
  tenantTimezone?: string;
  tenantCountry?: string;
  tenantCurrency?: string;
  tenantLogoUrl?: string;
  // Step 3
  language?: string;
  timezone?: string;
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  };
  // Step 4
  configureWhatsApp?: boolean;
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  instanceName?: string;
}

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState<Step>(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<FormData>({});
  const [completed, setCompleted] = React.useState(false);

  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleStep1Submit = (data: { name: string; email: string; password: string }) => {
    updateFormData({ adminName: data.name, adminEmail: data.email, adminPassword: data.password });
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: {
    name: string;
    fantasyName?: string;
    timezone?: string;
    country?: string;
    currency?: string;
    logoUrl?: string;
  }) => {
    updateFormData({
      tenantName: data.name,
      tenantFantasyName: data.fantasyName,
      tenantTimezone: data.timezone,
      tenantCountry: data.country,
      tenantCurrency: data.currency,
      tenantLogoUrl: data.logoUrl
    });
    setCurrentStep(3);
  };

  const handleStep3Submit = (data: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'system';
    notifications: { email: boolean; push: boolean; whatsapp: boolean };
  }) => {
    updateFormData({
      language: data.language,
      timezone: data.timezone,
      theme: data.theme,
      notifications: data.notifications
    });
    setCurrentStep(4);
  };

  const handleStep4Submit = (data: {
    configureWhatsApp: boolean;
    evolutionApiUrl?: string;
    evolutionApiKey?: string;
    instanceName?: string;
  }) => {
    updateFormData({
      configureWhatsApp: data.configureWhatsApp,
      evolutionApiUrl: data.evolutionApiUrl,
      evolutionApiKey: data.evolutionApiKey,
      instanceName: data.instanceName
    });
    setCurrentStep(5);
  };

  const handleSkip = () => {
    // Skip WhatsApp config, go to completion
    setCurrentStep(5);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      // Prepare payload for bootstrap endpoint - matches backend schema
      const payload = {
        name: formData.adminName,
        email: formData.adminEmail,
        password: formData.adminPassword,
        confirmPassword: formData.adminPassword,
        tenantName: formData.tenantName,
        tenantFantasyName: formData.tenantFantasyName,
        tenantTimezone: formData.tenantTimezone || formData.timezone || 'America/Sao_Paulo',
        tenantCountry: formData.tenantCountry || 'BR',
        tenantCurrency: formData.tenantCurrency || 'BRL',
        tenantLogoUrl: formData.tenantLogoUrl,
        // Include bootstrap token if configured
        bootstrapToken: process.env.NEXT_PUBLIC_BOOTSTRAP_TOKEN,
      };

      const response = await fetch(`${apiUrl}/auth/bootstrap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (data.error?.code === 'BOOTSTRAP_NOT_ALLOWED') {
          throw new Error('Esta instalação já possui usuários. Faça login.');
        }
        if (data.error?.code === 'BOOTSTRAP_TOKEN_INVALID') {
          throw new Error('Token de bootstrap inválido. Contate o administrador.');
        }
        throw new Error(data.error?.message || 'Erro ao criar conta');
      }

      toast.success('Conta criada com sucesso! Bem-vindo ao ZapTI.');
      setCompleted(true);

      // Success - redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => (prev - 1) as Step);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1AdminForm
            onNext={handleStep1Submit}
            initialData={
              formData.adminName || formData.adminEmail ? {
                name: formData.adminName,
                email: formData.adminEmail,
              } : undefined
            }
            isLoading={isLoading}
            error={error}
          />
        );
      case 2:
        return (
          <Step2TenantForm
            onNext={handleStep2Submit}
            onBack={prevStep}
            initialData={
              formData.tenantName || formData.tenantFantasyName ? {
                name: formData.tenantName,
                fantasyName: formData.tenantFantasyName,
                timezone: formData.tenantTimezone,
                country: formData.tenantCountry,
                currency: formData.tenantCurrency,
                logoUrl: formData.tenantLogoUrl,
              } : undefined
            }
            isLoading={isLoading}
            error={error}
          />
        );
      case 3:
        return (
          <Step3PreferencesForm
            onNext={handleStep3Submit}
            onBack={prevStep}
            initialData={
              formData.language || formData.timezone || formData.theme ? {
                language: formData.language,
                timezone: formData.timezone,
                theme: formData.theme,
                notifications: formData.notifications,
              } : undefined
            }
            isLoading={isLoading}
            error={error}
          />
        );
      case 4:
        return (
          <Step4WhatsAppForm
            onNext={handleStep4Submit}
            onBack={prevStep}
            onSkip={handleSkip}
            initialData={
              formData.configureWhatsApp ? {
                configureWhatsApp: formData.configureWhatsApp,
                evolutionApiUrl: formData.evolutionApiUrl,
                evolutionApiKey: formData.evolutionApiKey,
                instanceName: formData.instanceName,
              } : undefined
            }
            isLoading={isLoading}
            error={error}
          />
        );
      case 5:
        return (
          <Step5Success
            adminData={{ name: formData.adminName || '', email: formData.adminEmail || '' }}
            tenantData={{ name: formData.tenantName || '' }}
            onComplete={handleComplete}
            isLoading={isLoading}
            completed={completed}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Enhanced Background Animation */}
      <div className="onboarding-bg" aria-hidden="true">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-mesh" />
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern" />
        {/* Floating particles */}
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
        <div className="particle particle-5" />
        <div className="particle particle-6" />
        {/* Floating orbs */}
        <div className="floating-orb floating-orb-1" />
        <div className="floating-orb floating-orb-2" />
        <div className="floating-orb floating-orb-3" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8 animate-in">
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/25 dark:shadow-primary-500/30 animate-pulse-glow">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
            Bem-vindo ao <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">ZapTI</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-3 text-lg max-w-md mx-auto leading-relaxed">
            Configure sua conta e empresa em poucos passos — simples, rápido e seguro
          </p>
        </div>

        {/* Features preview */}
        <div className="flex items-center justify-center gap-6 mb-8 animate-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
            <Shield className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Seguro</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Multi-tenant</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp</span>
          </div>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator
          currentStep={currentStep}
          totalSteps={WIZARD_STEPS.length}
          steps={WIZARD_STEPS}
        />

        {/* Wizard Form */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 sm:p-8 animate-in" style={{ animationDelay: '200ms' }}>
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm animate-in">
              {error}
            </div>
          )}
          {renderStep()}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 dark:text-slate-500 text-sm mt-6 animate-in" style={{ animationDelay: '300ms' }}>
          Ao continuar, você concorda com nossos{' '}
          <a href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">Termos de Uso</a>{' '}
          e{' '}
          <a href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">Política de Privacidade</a>
        </p>
      </div>
    </div>
  );
}