// ZapTI Web — Onboarding Wizard Component
'use client';

import * as React from 'react';
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
  const [currentStep, setCurrentStep] = React.useState<Step>(1);
  const [formData, setFormData] = React.useState<FormData>({});
  const [completed, setCompleted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = { setCompleted, setIsLoading, setError };

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
            formData={formData}
            isLoading={isLoading}
            completed={completed}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-3 py-8 relative overflow-hidden">
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

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-6 animate-in">
          <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/25 dark:shadow-primary-500/30 animate-pulse-glow">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Bem-vindo ao <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">ZapTI</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-base max-w-sm mx-auto leading-relaxed">
            Configure sua conta e empresa em poucos passos — simples, rápido e seguro
          </p>
        </div>

        {/* Features preview - responsive wrap */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6 animate-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
            <Shield className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Seguro</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
            <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Multi-tenant</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
            <Smartphone className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">WhatsApp</span>
          </div>
        </div>

        {/* Stepper */}
        <ProgressIndicator steps={WIZARD_STEPS} currentStep={currentStep} totalSteps={WIZARD_STEPS.length} />

        {/* Step Content */}
        <div className="mt-6 animate-in">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}