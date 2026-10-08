// ZapTI Web — Step 3: Initial Preferences Form
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Globe, Moon, Sun, Monitor, Bell, AlertCircle, Palette, ArrowLeft, CheckCircle2, Mail, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const preferencesSchema = z.object({
  language: z.string().min(2, 'Selecione um idioma'),
  timezone: z.string().min(2, 'Selecione um fuso horário'),
  theme: z.enum(['light', 'dark', 'system']),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    whatsapp: z.boolean().default(false),
  }).default({ email: true, push: true, whatsapp: false }),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

const languages = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
];

const timezones = [
  { value: 'America/Sao_Paulo', label: 'Brasília (UTC-3)' },
  { value: 'America/Recife', label: 'Recife (UTC-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (UTC-3)' },
  { value: 'America/Manaus', label: 'Manaus (UTC-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (UTC-5)' },
  { value: 'America/New_York', label: 'Nova York (UTC-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
  { value: 'Europe/Lisbon', label: 'Lisboa (UTC+0)' },
  { value: 'Europe/Madrid', label: 'Madrid (UTC+1)' },
  { value: 'UTC', label: 'UTC' },
];

interface Step3PreferencesFormProps {
  onNext: (data: { language: string; timezone: string; theme: 'light' | 'dark' | 'system'; notifications: { email: boolean; push: boolean; whatsapp: boolean } }) => void;
  onBack: () => void;
  initialData?: Partial<PreferencesFormData>;
  isLoading?: boolean;
}

export function Step3PreferencesForm({ onNext, onBack, initialData, isLoading }: Step3PreferencesFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      theme: 'system',
      notifications: { email: true, push: true, whatsapp: false },
      ...initialData,
    },
  });

  const onSubmit = (data: PreferencesFormData) => {
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in" style={{ animationDelay: '50ms' }} noValidate>
      {/* Step Header */}
      <div className="text-center mb-8 animate-slide-up-fade" style={{ animationDelay: '0ms' }}>
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shadow-lg">
          <Palette className="w-7 h-7 text-primary-600 dark:text-primary-400" aria-hidden="true" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
          Suas preferências
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-base leading-relaxed font-body">
          Personalize sua experiência no ZapTI
        </p>
      </div>

      {/* Back Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        disabled={isLoading}
        className="self-start animate-slide-up-fade"
        style={{ animationDelay: '50ms' }}
      >
        <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
        Voltar
      </Button>

      {/* Language */}
      <div className="animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
        <Label htmlFor="language" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Globe className="w-4 h-4 text-slate-400" aria-hidden="true" />
          Idioma <span className="text-red-500" aria-hidden="true">*</span>
        </Label>
        <Select
          value={watch('language')}
          onValueChange={(value) => setValue('language', value)}
          disabled={isLoading}
        >
          <SelectTrigger className="mt-1.5 form-input">
            <SelectValue placeholder="Selecione o idioma" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.language && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            {errors.language.message}
          </p>
        )}
      </div>

      {/* Timezone */}
      <div className="animate-slide-up-fade" style={{ animationDelay: '150ms' }}>
        <Label htmlFor="timezone" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Monitor className="w-4 h-4 text-slate-400" aria-hidden="true" />
          Fuso horário <span className="text-red-500" aria-hidden="true">*</span>
        </Label>
        <Select
          value={watch('timezone')}
          onValueChange={(value) => setValue('timezone', value)}
          disabled={isLoading}
        >
          <SelectTrigger className="mt-1.5 form-input">
            <SelectValue placeholder="Selecione o fuso horário" />
          </SelectTrigger>
          <SelectContent>
            {timezones.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.timezone && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            {errors.timezone.message}
          </p>
        )}
      </div>

      {/* Theme */}
      <div className="animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
        <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Palette className="w-4 h-4 text-slate-400" aria-hidden="true" />
          Tema
        </Label>
        <div className="mt-1.5 flex flex-wrap items-center gap-3" role="radiogroup" aria-label="Tema">
          {['light', 'dark', 'system'].map((theme) => (
            <label
              key={theme}
              className={cn(
                'flex flex-col items-center gap-2 cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 min-w-[90px] relative overflow-hidden',
                watch('theme') === theme
                  ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-lg shadow-primary/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50'
              )}
            >
              <input
                type="radio"
                value={theme}
                {...register('theme')}
                disabled={isLoading}
                className="sr-only"
              />
              <div
                className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 relative',
                  watch('theme') === theme
                    ? 'bg-gradient-to-br from-primary-500 to-purple-600 shadow-lg shadow-primary/40'
                    : 'bg-white dark:bg-slate-800 shadow-sm hover:shadow-md'
                )}
              >
                {theme === 'light' && <Sun className={cn('w-7 h-7', watch('theme') === theme ? 'text-white' : 'text-amber-500')} />}
                {theme === 'dark' && <Moon className={cn('w-7 h-7', watch('theme') === theme ? 'text-white' : 'text-slate-400')} />}
                {theme === 'system' && <Monitor className={cn('w-7 h-7', watch('theme') === theme ? 'text-white' : 'text-slate-500')} />}
              </div>
              <span className="text-sm font-medium text-slate-900 dark:text-white text-center">
                {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Sistema'}
              </span>
              {watch('theme') === theme && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                  <CheckCircle2 className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="pt-2 animate-slide-up-fade" style={{ animationDelay: '250ms' }}>
        <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Bell className="w-4 h-4 text-slate-400" aria-hidden="true" />
          Notificações
        </Label>
        <div className="mt-2 space-y-3">
          {[
            { key: 'email', label: 'Email', description: 'Receber notificações por email', icon: <Mail className="w-5 h-5" aria-hidden="true" /> },
            { key: 'push', label: 'Push', description: 'Notificações no navegador', icon: <Bell className="w-5 h-5" aria-hidden="true" /> },
            { key: 'whatsapp', label: 'WhatsApp', description: 'Notificações via WhatsApp (requer configuração)', icon: <MessageSquare className="w-5 h-5" aria-hidden="true" /> },
          ].map((notification, index) => {
            const fieldName = `notifications.${notification.key}` as 'notifications.email' | 'notifications.push' | 'notifications.whatsapp';
            return (
            <div
              key={notification.key}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 animate-slide-up-fade hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
              style={{ animationDelay: `${300 + index * 50}ms` }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary-600 dark:text-primary-400">
                  {notification.icon}
                </div>
                <div>
                  <Label htmlFor={`notifications-${notification.key}`} className="font-medium text-slate-900 dark:text-white cursor-pointer">
                    {notification.label}
                  </Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
                    {notification.description}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                id={`notifications-${notification.key}`}
                {...register(fieldName)}
                disabled={isLoading}
                className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer"
              />
            </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4 animate-slide-up-fade" style={{ animationDelay: '450ms' }}>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 py-3.5"
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          Voltar
        </Button>
        <Button
          type="submit"
          className="flex-1 py-3.5 text-lg font-semibold"
          disabled={isLoading}
          isLoading={isLoading}
        >
          <span className="flex items-center justify-center gap-2">
            Continuar
            <span className="w-5 h-5 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </span>
        </Button>
      </div>
    </form>
  );
}