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
import Image from 'next/image';
import { Building2, Globe, MapPin, DollarSign, Image as ImageIcon, AlertCircle } from 'lucide-react';

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
  { value: 'UY', label: 'Uruguai' },
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
  { value: 'UYU', label: 'Peso Uruguaio (UYU)' },
];

interface Step2TenantFormProps {
  onNext: (data: { name: string; fantasyName?: string; timezone?: string; country?: string; currency?: string; logoUrl?: string }) => void;
  onBack: () => void;
  initialData?: Partial<TenantFormData>;
  isLoading?: boolean;
  error?: string | null;
}

export function Step2TenantForm({ onNext, onBack, initialData, isLoading, error }: Step2TenantFormProps) {
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);

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

  // Logo preview
  const logoUrlValue = watch('logoUrl');
  React.useEffect(() => {
    if (logoUrlValue) {
      setLogoPreview(logoUrlValue);
    } else {
      setLogoPreview(null);
    }
  }, [logoUrlValue]);

  const onSubmit = (data: TenantFormData) => {
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-in" noValidate>
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-in">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Company Name */}
      <div className="animate-in" style={{ animationDelay: '50ms' }}>
        <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="w-4 h-4 text-slate-400" />
          Nome da empresa <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Ex: Minha Empresa Ltda"
          autoComplete="organization"
          {...register('name')}
          error={errors.name?.message}
          disabled={isLoading}
          className="mt-1.5"
        />
        {errors.name && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
            <AlertCircle className="w-3 h-3" />
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Fantasy Name */}
      <div className="animate-in" style={{ animationDelay: '100ms' }}>
        <Label htmlFor="fantasyName" className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="w-4 h-4 text-slate-400" />
          Nome fantasia (opcional)
        </Label>
        <Input
          id="fantasyName"
          type="text"
          placeholder="Ex: Minha Empresa"
          autoComplete="organization"
          {...register('fantasyName')}
          error={errors.fantasyName?.message}
          disabled={isLoading}
          className="mt-1.5"
        />
        {errors.fantasyName && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
            <AlertCircle className="w-3 h-3" />
            {errors.fantasyName.message}
          </p>
        )}
      </div>

      {/* Timezone */}
      <div className="animate-in" style={{ animationDelay: '200ms' }}>
        <Label htmlFor="timezone" className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="w-4 h-4 text-slate-400" />
          Fuso horário <span className="text-red-500">*</span>
        </Label>
        <Select
          value={watch('timezone')}
          onValueChange={(value) => watch('timezone', value)}
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

      {/* Country */}
      <div className="animate-in" style={{ animationDelay: '250ms' }}>
        <Label htmlFor="country" className="flex items-center gap-2 text-sm font-medium">
          <Globe className="w-4 h-4 text-slate-400" />
          País <span className="text-red-500">*</span>
        </Label>
        <Select
          value={watch('country')}
          onValueChange={(value) => watch('country', value)}
          disabled={isLoading}
        >
          <SelectTrigger className="mt-1.5">
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
            <AlertCircle className="w-3 h-3" />
            {errors.country.message}
          </p>
        )}
      </div>

      {/* Currency */}
      <div className="animate-in" style={{ animationDelay: '300ms' }}>
        <Label htmlFor="currency" className="flex items-center gap-2 text-sm font-medium">
          <DollarSign className="w-4 h-4 text-slate-400" />
          Moeda <span className="text-red-500">*</span>
        </Label>
        <Select
          value={watch('currency')}
          onValueChange={(value) => watch('currency', value)}
          disabled={isLoading}
        >
          <SelectTrigger className="mt-1.5">
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
            <AlertCircle className="w-3 h-3" />
            {errors.currency.message}
          </p>
        )}
      </div>

      {/* Logo URL */}
      <div className="animate-in" style={{ animationDelay: '350ms' }}>
        <Label htmlFor="logoUrl" className="flex items-center gap-2 text-sm font-medium">
          <ImageIcon className="w-4 h-4 text-slate-400" />
          URL do logo (opcional)
        </Label>
        <Input
          id="logoUrl"
          type="url"
          placeholder="https://exemplo.com/logo.png"
          {...register('logoUrl')}
          error={errors.logoUrl?.message}
          disabled={isLoading}
          className="mt-1.5"
        />
        {logoPreview && (
          <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in">
            <Image src={logoPreview} alt="" fill className="object-cover" sizes="80px" />
          </div>
        )}
        {errors.logoUrl && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
            <AlertCircle className="w-3 h-3" />
            {errors.logoUrl.message}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700 animate-in" style={{ animationDelay: '400ms' }}>
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading} className="w-full sm:w-auto">
          Voltar
        </Button>
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          Próximo
        </Button>
      </div>
    </form>
  );
}