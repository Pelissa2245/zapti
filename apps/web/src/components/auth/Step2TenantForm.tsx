// ZapTI Web — Step 2: Create Company/Tenant Form
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Building2, Globe, MapPin, DollarSign, Image as ImageIcon, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

const tenantSchema = z.object({
  name: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres').max(100),
  fantasyName: z.string().max(100).optional(),
  timezone: z.string().min(2, 'Selecione um fuso horário'),
  country: z.string().min(2, 'Selecione um país'),
  currency: z.string().min(3, 'Selecione uma moeda'),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

type TenantFormData = z.infer<typeof tenantSchema>;

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

const countries = [
  { value: 'BR', label: 'Brasil' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'PT', label: 'Portugal' },
  { value: 'ES', label: 'Espanha' },
  { value: 'AR', label: 'Argentina' },
  { value: 'MX', label: 'México' },
  { value: 'CO', label: 'Colômbia' },
  { value: 'CL', label: 'Chile' },
  { value: 'PE', label: 'Peru' },
];

const currencies = [
  { value: 'BRL', label: 'Real Brasileiro (BRL)' },
  { value: 'USD', label: 'Dólar Americano (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'ARS', label: 'Peso Argentino (ARS)' },
  { value: 'MXN', label: 'Peso Mexicano (MXN)' },
  { value: 'COP', label: 'Peso Colombiano (COP)' },
  { value: 'CLP', label: 'Peso Chileno (CLP)' },
  { value: 'PEN', label: 'Sol Peruano (PEN)' },
];

interface Step2TenantFormProps {
  onNext: (data: { name: string; fantasyName?: string; timezone: string; country: string; currency: string; logoUrl?: string }) => void;
  onBack: () => void;
  initialData?: Partial<TenantFormData>;
  isLoading?: boolean;
}

export function Step2TenantForm({ onNext, onBack, initialData, isLoading }: Step2TenantFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      fantasyName: '',
      timezone: 'America/Sao_Paulo',
      country: 'BR',
      currency: 'BRL',
      logoUrl: '',
      ...initialData,
    },
  });

  const watchedTimezone = watch('timezone');
  const watchedCountry = watch('country');
  const watchedCurrency = watch('currency');

  const onSubmit = handleSubmit((data: TenantFormData) => {
    onNext(data);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6 animate-in" style={{ animationDelay: '50ms' }} noValidate>
      {/* Step Header */}
      <div className="text-center mb-8 animate-slide-up-fade" style={{ animationDelay: '0ms' }}>
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shadow-lg">
          <Building2 className="w-7 h-7 text-primary-600 dark:text-primary-400" aria-hidden="true" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
          Dados da sua empresa
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-base leading-relaxed font-body">
          Configure as informações básicas do seu tenant
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

      {/* Name Field */}
      <div className="animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
        <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Building2 className="w-4 h-4 text-slate-400" aria-hidden="true" />
          Nome legal <span className="text-red-500" aria-hidden="true">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Nome legal da empresa"
          autoComplete="organization"
          {...register('name')}
          error={errors.name?.message}
          disabled={isLoading}
          className="mt-1.5 form-input"
        />
        {errors.name && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Fantasy Name Field */}
      <div className="animate-slide-up-fade" style={{ animationDelay: '150ms' }}>
        <Label htmlFor="fantasyName" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Building2 className="w-4 h-4 text-slate-400" aria-hidden="true" />
          Nome fantasia <span className="text-slate-400 text-xs font-normal">(opcional)</span>
        </Label>
        <Input
          id="fantasyName"
          type="text"
          placeholder="Nome de fantasia / marca"
          autoComplete="organization-title"
          {...register('fantasyName')}
          error={errors.fantasyName?.message}
          disabled={isLoading}
          className="mt-1.5 form-input"
        />
        {errors.fantasyName && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            {errors.fantasyName.message}
          </p>
        )}
      </div>

      {/* Timezone Field */}
      <div className="animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
        <Label htmlFor="timezone" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Globe className="w-4 h-4 text-slate-400" aria-hidden="true" />
          Fuso horário <span className="text-red-500" aria-hidden="true">*</span>
        </Label>
        <Select
          value={watchedTimezone}
          onValueChange={(value) => register('timezone').onChange({ target: { value } })}
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

      {/* Country & Currency Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up-fade" style={{ animationDelay: '250ms' }}>
        <div>
          <Label htmlFor="country" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <MapPin className="w-4 h-4 text-slate-400" aria-hidden="true" />
            País <span className="text-red-500" aria-hidden="true">*</span>
          </Label>
          <Select
            value={watchedCountry}
            onValueChange={(value) => register('country').onChange({ target: { value } })}
            disabled={isLoading}
          >
            <SelectTrigger className="mt-1.5 form-input">
              <SelectValue placeholder="Selecione o país" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.country && (
            <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
              <AlertCircle className="w-3 h-3" aria-hidden="true" />
              {errors.country.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="currency" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <DollarSign className="w-4 h-4 text-slate-400" aria-hidden="true" />
            Moeda <span className="text-red-500" aria-hidden="true">*</span>
          </Label>
          <Select
            value={watchedCurrency}
            onValueChange={(value) => register('currency').onChange({ target: { value } })}
            disabled={isLoading}
          >
            <SelectTrigger className="mt-1.5 form-input">
              <SelectValue placeholder="Selecione a moeda" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.currency && (
            <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
              <AlertCircle className="w-3 h-3" aria-hidden="true" />
              {errors.currency.message}
            </p>
          )}
        </div>
      </div>

      {/* Logo URL Field */}
      <div className="animate-slide-up-fade" style={{ animationDelay: '300ms' }}>
        <Label htmlFor="logoUrl" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <ImageIcon className="w-4 h-4 text-slate-400" aria-hidden="true" />
          URL do logotipo <span className="text-slate-400 text-xs font-normal">(opcional)</span>
        </Label>
        <Input
          id="logoUrl"
          type="url"
          placeholder="https://exemplo.com/logo.png"
          autoComplete="url"
          {...register('logoUrl')}
          error={errors.logoUrl?.message}
          disabled={isLoading}
          className="mt-1.5 form-input"
        />
        {errors.logoUrl && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            {errors.logoUrl.message}
          </p>
        )}
      </div>

      {/* Preview Note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 animate-slide-up-fade" style={{ animationDelay: '350ms' }}>
        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
          <ImageIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          <p className="font-medium text-slate-900 dark:text-white">Prévia do logotipo:</p>
          <p className="mt-1 leading-relaxed">
            O logotipo aparecerá no painel, em e-mails e na interface do WhatsApp. Use uma URL
            pública (HTTPS recomendado) para uma imagem quadrada ou retangular.
          </p>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-2 animate-slide-up-fade" style={{ animationDelay: '400ms' }}>
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