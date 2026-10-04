// ZapTI Web — Step 2: Create Company/Tenant Form
'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Building2, Globe, MapPin, DollarSign, Image, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const tenantSchema = z.object({
  name: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres').max(100),
  fantasyName: z.string().max(100).optional(),
  slug: z.string().min(2, 'Slug deve ter pelo menos 2 caracteres').max(50).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
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
  onNext: (data: TenantFormData) => void;
  onBack: () => void;
  initialData?: Partial<TenantFormData>;
  isLoading?: boolean;
  error?: string | null;
}

export function Step2TenantForm({ onNext, onBack, initialData, isLoading, error }: Step2TenantFormProps) {
  const [slugAvailable, setSlugAvailable] = React.useState<{ checking: boolean; available: boolean | null; message?: string }>({
    checking: false,
    available: null,
  });
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      fantasyName: '',
      slug: '',
      timezone: 'America/Sao_Paulo',
      country: 'BR',
      currency: 'BRL',
      logoUrl: '',
      ...initialData,
    },
  });

  const nameValue = watch('name');
  const slugValue = watch('slug');

  // Auto-generate slug from name
  React.useEffect(() => {
    if (nameValue && !slugValue) {
      const generatedSlug = nameValue
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [nameValue, slugValue, setValue]);

  // Check slug availability
  const checkSlugAvailability = React.useCallback(async (slug: string) => {
    if (!slug || slug.length < 2) {
      setSlugAvailable({ checking: false, available: null });
      return;
    }

    setSlugAvailable({ checking: true, available: null });
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const response = await fetch(`${apiUrl}/auth/check-slug?slug=${encodeURIComponent(slug)}`);
      const data = await response.json();
      setSlugAvailable({ checking: false, available: data.available, message: data.message });
    } catch {
      setSlugAvailable({ checking: false, available: null, message: 'Erro ao verificar disponibilidade' });
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      checkSlugAvailability(slugValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [slugValue, checkSlugAvailability]);

  // Logo preview
  const logoUrl = watch('logoUrl');

  React.useEffect(() => {
    if (logoUrl) {
      try {
        new URL(logoUrl);
        setLogoPreview(logoUrl);
      } catch {
        setLogoPreview(null);
      }
    } else {
      setLogoPreview(null);
    }
  }, [logoUrl]);

  const onSubmit = (data: TenantFormData) => {
    // Clean empty strings
    const cleanData = {
      ...data,
      fantasyName: data.fantasyName || undefined,
      logoUrl: data.logoUrl || undefined,
    };
    onNext(cleanData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" role="alert">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Company Name */}
      <div>
        <Label htmlFor="name" className="flex items-center gap-2">
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
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Fantasy Name */}
      <div>
        <Label htmlFor="fantasyName" className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          Nome fantasia (opcional)
        </Label>
        <Input
          id="fantasyName"
          type="text"
          placeholder="Ex: Minha Empresa"
          {...register('fantasyName')}
          error={errors.fantasyName?.message}
          disabled={isLoading}
          className="mt-1.5"
        />
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Nome como aparece para clientes. Se vazio, usa o nome da empresa.
        </p>
      </div>

      {/* Slug */}
      <div>
        <Label htmlFor="slug" className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400" />
          Slug / Identificador <span className="text-red-500">*</span>
        </Label>
        <div className="relative mt-1.5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            https://zapti.app/
          </span>
          <Input
            id="slug"
            type="text"
            placeholder="minha-empresa"
            {...register('slug')}
            error={errors.slug?.message || (slugAvailable.checking ? undefined : slugAvailable.available === false ? slugAvailable.message : undefined)}
            disabled={isLoading || slugAvailable.checking}
            className="mt-1.5 pl-32"
          />
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          {slugAvailable.checking && (
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verificando...
            </span>
          )}
          {slugAvailable.available === true && (
            <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              Slug disponível
            </span>
          )}
          {slugAvailable.available === false && (
            <span className="flex items-center gap-1 text-sm text-red-500">
              <AlertCircle className="w-3 h-3" />
              {slugAvailable.message || 'Slug indisponível'}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Gerado automaticamente a partir do nome. Use apenas letras minúsculas, números e hífens.
        </p>
      </div>

      {/* Timezone */}
      <div>
        <Label htmlFor="timezone" className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" />
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
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.timezone.message}
          </p>
        )}
      </div>

      {/* Country */}
      <div>
        <Label htmlFor="country" className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          País <span className="text-red-500">*</span>
        </Label>
        <Select
          value={watch('country')}
          onValueChange={(value) => setValue('country', value)}
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
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.country.message}
          </p>
        )}
      </div>

      {/* Currency */}
      <div>
        <Label htmlFor="currency" className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-slate-400" />
          Moeda <span className="text-red-500">*</span>
        </Label>
        <Select
          value={watch('currency')}
          onValueChange={(value) => setValue('currency', value)}
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
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.currency.message}
          </p>
        )}
      </div>

      {/* Logo URL */}
      <div>
        <Label htmlFor="logoUrl" className="flex items-center gap-2">
          <Image className="w-4 h-4 text-slate-400" />
          Logo da empresa (opcional)
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
          <div className="mt-2">
            <img
              src={logoPreview}
              alt="Preview do logo"
              className="h-16 w-auto rounded-lg border border-slate-200 dark:border-slate-700"
              onError={() => setLogoPreview(null)}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Preview do logo</p>
          </div>
        )}
        {errors.logoUrl && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.logoUrl.message}
          </p>
        )}
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          URL pública da imagem do logo. Recomendado: PNG/SVG, fundo transparente, max 200x200px.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Button>
        <Button
          type="submit"
          className="gap-2"
          disabled={isLoading || slugAvailable.checking || slugAvailable.available === false}
          isLoading={isLoading}
        >
          Continuar
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9l-7 7 7 7" />
          </svg>
        </Button>
      </div>
    </form>
  );
}