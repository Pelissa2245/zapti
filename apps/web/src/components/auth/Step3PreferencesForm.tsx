// ZapTI Web — Step 3: Initial Preferences Form
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Globe, Moon, Sun, Monitor, Bell, AlertCircle, Palette } from 'lucide-react';
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
  error?: string | null;
}

export function Step3PreferencesForm({ onNext, onBack, initialData, isLoading, error }: Step3PreferencesFormProps) {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-in" noValidate>
      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-in" role="alert">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Language */}
      <div className="animate-in" style={{ animationDelay: '50ms' }}>
        <Label htmlFor="language" className="flex items-center gap-2 text-sm font-medium">
          <Globe className="w-4 h-4 text-slate-400" />
          Idioma <span className="text-red-500">*</span>
        </Label>
        <Select
          value={watch('language')}
          onValueChange={(value) => setValue('language', value)}
          disabled={isLoading}
        >
          <SelectTrigger className="mt-1.5">
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
            <AlertCircle className="w-3 h-3" />
            {errors.language.message}
          </p>
        )}
      </div>

      {/* Timezone */}
      <div className="animate-in" style={{ animationDelay: '100ms' }}>
        <Label htmlFor="timezone" className="flex items-center gap-2 text-sm font-medium">
          <Monitor className="w-4 h-4 text-slate-400" />
          Fuso horário <span className="text-red-500">*</span>
        </Label>
        <Select
          value={watch('timezone')}
          onValueChange={(value) => setValue('timezone', value)}
          disabled={isLoading}
        >
          <SelectTrigger className="mt-1.5">
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
            <AlertCircle className="w-3 h-3" />
            {errors.timezone.message}
          </p>
        )}
      </div>

      {/* Theme */}
      <div className="animate-in" style={{ animationDelay: '150ms' }}>
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Palette className="w-4 h-4 text-slate-400" />
          Tema
        </Label>
        <div className="mt-1.5 flex flex-wrap items-center gap-3" role="radiogroup" aria-label="Tema">
          {['light', 'dark', 'system'].map((theme) => (
            <label
              key={theme}
              className={cn(
                'flex flex-col items-center gap-2 cursor-pointer p-3 rounded-xl border-2 transition-all duration-200 min-w-[80px]',
                watch('theme') === theme
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
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
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  watch('theme') === theme
                    ? 'bg-primary'
                    : 'bg-slate-100 dark:bg-slate-800'
                )}
              >
                {theme === 'light' && <Sun className={cn('w-5 h-5', watch('theme') === theme ? 'text-white' : 'text-slate-600')} />}
                {theme === 'dark' && <Moon className={cn('w-5 h-5', watch('theme') === theme ? 'text-white' : 'text-slate-400')} />}
                {theme === 'system' && <Monitor className={cn('w-5 h-5', watch('theme') === theme ? 'text-white' : 'text-slate-500')} />}
              </div>
              <span className="text-xs font-medium text-slate-900 dark:text-white text-center">
                {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Sistema'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="pt-2 animate-in" style={{ animationDelay: '200ms' }}>
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Bell className="w-4 h-4 text-slate-400" />
          Notificações
        </Label>
        <div className="mt-2 space-y-3">
          {[
            { key: 'email', label: 'Email', description: 'Receber notificações por email' },
            { key: 'push', label: 'Push', description: 'Notificações no navegador' },
            { key: 'whatsapp', label: 'WhatsApp', description: 'Notificações via WhatsApp (requer configuração)' },
          ].map((notification, index) => {
            const fieldName = `notifications.${notification.key}` as 'notifications.email' | 'notifications.push' | 'notifications.whatsapp';
            return (
            <div
              key={notification.key}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 animate-in"
              style={{ animationDelay: `${250 + index * 50}ms` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  id={`notifications-${notification.key}`}
                  {...register(fieldName)}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 shrink-0"
                />
                <div className="min-w-0">
                  <Label htmlFor={`notifications-${notification.key}`} className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer">
                    {notification.label}
                  </Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {notification.description}
                  </p>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

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
        <Button
          type="submit"
          className="w-full sm:w-auto gap-2"
          disabled={isLoading}
          isLoading={isLoading}
        >
          Continuar
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </form>
  );
}