// ZapTI Web — Onboarding Wizard Component
'use client';

import * as React from 'react';
import { ProgressIndicator } from './ProgressIndicator';
import { Step1AdminForm } from './Step1AdminForm';
import { Step2TenantForm } from './Step2TenantForm';
import { Step3PreferencesForm } from './Step3PreferencesForm';
import { Step4WhatsAppForm } from './Step4WhatsAppForm';
import { Step5Success } from './Step5Success';
import { Zap, Shield, Smartphone, Sparkles } from 'lucide-react';

const WIZARD_STEPS = [
  { label: 'Administrador', description: 'Seus dados de acesso' },
  { label: 'Empresa', description: 'Dados da sua empresa' },
  { label: 'Preferências', description: 'Idioma, tema, notificações' },
  { label: 'WhatsApp', description: 'Conexões WhatsApp' },
  { label: 'Concluído', description: 'Pronto para usar' },
] as const satisfies { label: string; description?: string }[];

type Step = 1 | 2 | 3 | 4 | 5;

interface WhatsAppConnectionInput {
  displayName: string;
  instanceName: string;
}

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
  whatsappConnections?: WhatsAppConnectionInput[];
  configureWhatsApp?: boolean;
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  instanceName?: string;
}

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = React.useState<Step>(1);
  const [formData, setFormData] = React.useState<FormData>({});
  const [completed, setCompleted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const callBootstrapAndComplete = React.useCallback(async (currentFormData: FormData): Promise<{ error?: string; success?: boolean }> => {
    // First, bootstrap the admin user and tenant
    const fd = new FormData();
    fd.append('name', currentFormData.adminName || '');
    fd.append('email', currentFormData.adminEmail || '');
    fd.append('password', currentFormData.adminPassword || '');
    fd.append('confirmPassword', currentFormData.adminPassword || '');
    fd.append('tenantName', currentFormData.tenantName || '');
    fd.append('tenantFantasyName', currentFormData.tenantFantasyName || '');
    fd.append('tenantTimezone', currentFormData.tenantTimezone || 'America/Sao_Paulo');
    fd.append('tenantCountry', currentFormData.tenantCountry || 'BR');
    fd.append('tenantCurrency', currentFormData.tenantCurrency || 'BRL');
    fd.append('tenantLogoUrl', currentFormData.tenantLogoUrl || '');

    try {
      const bootstrapResponse = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });

      const bootstrapData = await bootstrapResponse.json();

      if (!bootstrapResponse.ok) {
        return { error: bootstrapData.error?.message || 'Erro ao criar administrador inicial' };
      }

      // Now complete onboarding with preferences
      // Browser automatically sends cookies set by bootstrap response via credentials: 'include'
      const completeBody = JSON.stringify({
        language: currentFormData.language || 'pt-BR',
        timezone: currentFormData.timezone || 'America/Sao_Paulo',
        theme: currentFormData.theme || 'system',
        notificationPreferences: currentFormData.notifications || { email: true, push: true, whatsapp: false },
        // Include WhatsApp config if configured
        ...(currentFormData.configureWhatsApp && currentFormData.evolutionApiUrl && currentFormData.evolutionApiKey && currentFormData.instanceName
          ? {
              whatsappConfig: {
                evolutionApiUrl: currentFormData.evolutionApiUrl,
                evolutionApiKey: currentFormData.evolutionApiKey,
                instanceName: currentFormData.instanceName,
              },
            }
          : {}),
      });

      const completeResponse = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: completeBody,
      });

      const completeData = await completeResponse.json();

      if (!completeResponse.ok) {
        return { error: completeData.error?.message || 'Erro ao completar onboarding' };
      }

      return { success: true };
    } catch {
      return { error: 'Erro de conexão. Tente novamente.' };
    }
  }, []);

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

  const handleStep4Submit = async (data: {
    configureWhatsApp: boolean;
    evolutionApiUrl?: string;
    evolutionApiKey?: string;
    connections?: WhatsAppConnectionInput[];
    instanceName?: string;
  }) => {
    // Merge form data before calling API
    const mergedFormData = {
      ...formData,
      configureWhatsApp: data.configureWhatsApp,
      evolutionApiUrl: data.evolutionApiUrl,
      evolutionApiKey: data.evolutionApiKey,
      instanceName: data.instanceName,
      whatsappConnections: data.connections
    };

    setIsLoading(true);

    const result = await callBootstrapAndComplete(mergedFormData);

    setIsLoading(false);

    if (result.error) {
      return;
    }

    setCompleted(true);
    setCurrentStep(5);
  };

  const handleSkip = async () => {
    setIsLoading(true);

    const result = await callBootstrapAndComplete(formData);

    setIsLoading(false);

    if (result.error) {
      return;
    }

    setCompleted(true);
    setCurrentStep(5);
  };

  const prevStep = () => {
    setCurrentStep((prev: Step) => (prev - 1) as Step);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1AdminForm
            onNext={handleStep1Submit}
            initialData={formData.adminName || formData.adminEmail ? { name: formData.adminName, email: formData.adminEmail } : undefined}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <Step2TenantForm
            onNext={handleStep2Submit}
            onBack={prevStep}
            initialData={formData.tenantName || formData.tenantFantasyName ? { name: formData.tenantName, fantasyName: formData.tenantFantasyName, timezone: formData.tenantTimezone, country: formData.tenantCountry, currency: formData.tenantCurrency, logoUrl: formData.tenantLogoUrl } : undefined}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <Step3PreferencesForm
            onNext={handleStep3Submit}
            onBack={prevStep}
            initialData={formData.language || formData.timezone || formData.theme ? { language: formData.language, timezone: formData.timezone, theme: formData.theme, notifications: formData.notifications } : undefined}
            isLoading={isLoading}
          />
        );
      case 4:
        return (
          <Step4WhatsAppForm
            onNext={handleStep4Submit}
            onBack={prevStep}
            onSkip={handleSkip}
            initialData={formData.configureWhatsApp ? { configureWhatsApp: formData.configureWhatsApp, evolutionApiUrl: formData.evolutionApiUrl, evolutionApiKey: formData.evolutionApiKey, instanceName: formData.instanceName, connections: formData.whatsappConnections } : undefined}
            isLoading={isLoading}
          />
        );
      case 5:
        return (
          <Step5Success
            adminData={{ name: formData.adminName || '', email: formData.adminEmail || '' }}
            tenantData={{ name: formData.tenantName || '' }}
            formData={formData}
            isLoading={isLoading}
            completed={completed}
          />
        );
      default:
        return null;
    }
  };

  // Generate floating particles positions
  const particles = React.useMemo(() => [
    { top: '8%', left: '8%', delay: '0s', duration: '14s', size: 6 },
    { top: '18%', left: '88%', delay: '1.5s', duration: '16s', size: 4 },
    { top: '58%', left: '12%', delay: '3s', duration: '15s', size: 5 },
    { top: '82%', left: '78%', delay: '4.5s', duration: '17s', size: 3 },
    { top: '28%', left: '52%', delay: '6s', duration: '13s', size: 4 },
    { top: '72%', left: '32%', delay: '7.5s', duration: '18s', size: 5 },
    { top: '45%', left: '92%', delay: '2s', duration: '19s', size: 3 },
    { top: '90%', left: '22%', delay: '5s', duration: '16s', size: 4 },
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Floating animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-blue-400/30 to-indigo-500/30 blur-3xl animate-float"
            style={{
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      {/* Subtle grid pattern overlay */}
      <div className="fixed inset-0 opacity-5 pointer-events-none" aria-hidden="true">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
          {/* Progress Indicator */}
          <ProgressIndicator
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            totalSteps={WIZARD_STEPS.length}
            className="mb-8"
          />

          {/* Wizard Card */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            <div className="p-8 md:p-10">
              {renderStep()}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>Ao continuar, você concorda com nossos <a href="#" className="text-blue-600 hover:underline">Termos de Serviço</a> e <a href="#" className="text-blue-600 hover:underline">Política de Privacidade</a>.</p>
          </div>
        </div>
      </main>
    </div>
  );
}