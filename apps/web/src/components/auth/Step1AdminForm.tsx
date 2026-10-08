// ZapTI Web — Step 1: Create Administrator Form
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Eye, EyeOff, AlertCircle, User, Mail, Lock, Shield, CheckCircle2 } from 'lucide-react';

const adminSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').max(128),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, { message: 'Você deve aceitar os termos de uso' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

type AdminFormData = z.infer<typeof adminSchema>;

interface Step1AdminFormProps {
  onNext: (data: { name: string; email: string; password: string }) => void;
  initialData?: Partial<AdminFormData>;
  isLoading?: boolean;
}

export function Step1AdminForm({ onNext, initialData, isLoading }: Step1AdminFormProps) {
  const [showPass, setShowPass] = React.useState(false);
  const [showConfirmPass, setShowConfirmPass] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      ...initialData,
    },
  });

  const passwordValue = watch('password');

  const getPasswordStrength = (password: string): { label: string; color: string; width: string } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 1) return { label: 'Muito fraca', color: 'bg-red-500', width: '20%' };
    if (strength === 2) return { label: 'Fraca', color: 'bg-orange-500', width: '40%' };
    if (strength === 3) return { label: 'Média', color: 'bg-yellow-500', width: '60%' };
    if (strength === 4) return { label: 'Forte', color: 'bg-lime-500', width: '80%' };
    return { label: 'Muito forte', color: 'bg-green-500', width: '100%' };
  };

  const strength = React.useMemo(() => passwordValue ? getPasswordStrength(passwordValue) : null, [passwordValue]);

  const onSubmit = (data: AdminFormData) => {
    onNext({ name: data.name, email: data.email, password: data.password });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in" style={{ animationDelay: '50ms' }}>
      {/* Step Header */}
      <div className="text-center mb-8 animate-slide-up-fade" style={{ animationDelay: '0ms' }}>
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shadow-lg">
          <User className="w-7 h-7 text-primary-600 dark:text-primary-400" aria-hidden="true" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight font-display">
          Crie sua conta de administrador
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-base leading-relaxed font-body">
          Estes serão seus dados de acesso ao painel do ZapTI
        </p>
      </div>

      {/* Name Field */}
      <div className="animate-slide-up-fade" style={{ animationDelay: '50ms' }}>
        <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <User className="w-4 h-4 text-slate-400" aria-hidden="true" />
          Nome completo <span className="text-red-500" aria-hidden="true">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="João da Silva"
          autoComplete="name"
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

      {/* Email Field */}
      <div className="animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
        <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Mail className="w-4 h-4 text-slate-400" aria-hidden="true" />
          Email <span className="text-red-500" aria-hidden="true">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          {...register('email')}
          error={errors.email?.message}
          disabled={isLoading}
          className="mt-1.5 form-input"
        />
        {errors.email && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="animate-slide-up-fade" style={{ animationDelay: '150ms' }}>
        <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Lock className="w-4 h-4 text-slate-400" aria-hidden="true" />
          Senha <span className="text-red-500" aria-hidden="true">*</span>
        </Label>
        <div className="relative mt-1.5">
          <Input
            id="password"
            type={showPass ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            {...register('password')}
            error={errors.password?.message}
            disabled={isLoading}
            className="pr-12 form-input"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Password Strength Meter */}
        {passwordValue && strength && (
          <div className="mt-2 space-y-1 animate-slide-up-fade">
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-out ${strength.color}`}
                style={{ width: strength.width }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Força da senha: <span className="font-medium text-slate-700 dark:text-slate-300">{strength.label}</span>
            </p>
          </div>
        )}

        {errors.password && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="animate-slide-up-fade" style={{ animationDelay: '150ms' }}>
        <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Lock className="w-4 h-4 text-slate-400" aria-hidden="true" />
          Confirmar senha <span className="text-red-500" aria-hidden="true">*</span>
        </Label>
        <div className="relative mt-1.5">
          <Input
            id="confirmPassword"
            type={showConfirmPass ? 'text' : 'password'}
            placeholder="Confirme sua senha"
            autoComplete="new-password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            disabled={isLoading}
            className="pr-12 form-input"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPass(!showConfirmPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label={showConfirmPass ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showConfirmPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Terms Checkbox */}
      <div className="pt-2 animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
        <div className="flex items-start gap-3">
          <Checkbox
            id="acceptTerms"
            {...register('acceptTerms')}
            disabled={isLoading}
            className="mt-0.5"
          />
          <Label htmlFor="acceptTerms" className="text-sm text-slate-600 dark:text-slate-300 cursor-pointer leading-relaxed">
            Eu li e concordo com os
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium transition-colors">
              Termos de Uso
            </a>
            e a
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium ml-1 transition-colors">
              Política de Privacidade
            </a>
            do ZapTI.
          </Label>
        </div>
        {errors.acceptTerms && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 ml-6 animate-in">
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            {errors.acceptTerms.message}
          </p>
        )}
      </div>

      {/* Security Note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 animate-slide-up-fade" style={{ animationDelay: '250ms' }}>
        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          <p className="font-medium text-slate-900 dark:text-white">Segurança:</p>
          <p className="mt-1 leading-relaxed">
            Sua senha será armazenada de forma segura usando hash bcrypt. Nós nunca armazenamos
            senhas em texto puro e não temos acesso à sua senha original.
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full py-3.5 text-lg font-semibold animate-slide-up-fade"
        disabled={isLoading}
        isLoading={isLoading}
        style={{ animationDelay: '300ms' }}
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
    </form>
  );
}