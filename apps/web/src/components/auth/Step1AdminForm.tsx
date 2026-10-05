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
import { Eye, EyeOff, AlertCircle, User, Mail, Lock, Shield } from 'lucide-react';

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
  onNext: (data: AdminFormData) => void;
  initialData?: Partial<AdminFormData>;
  isLoading?: boolean;
  error?: string | null;
}

export function Step1AdminForm({ onNext, initialData, isLoading, error }: Step1AdminFormProps) {
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

    switch (strength) {
      case 0:
      case 1:
        return { label: 'Muito fraca', color: 'bg-red-500', width: '20%' };
      case 2:
        return { label: 'Fraca', color: 'bg-orange-500', width: '40%' };
      case 3:
        return { label: 'Média', color: 'bg-yellow-500', width: '60%' };
      case 4:
        return { label: 'Forte', color: 'bg-lime-500', width: '80%' };
      case 5:
        return { label: 'Muito forte', color: 'bg-green-500', width: '100%' };
      default:
        return { label: '', color: 'bg-slate-200', width: '0%' };
    }
  };

  const strength = getPasswordStrength(passwordValue);

  const onSubmit = handleSubmit((data: AdminFormData) => {
    onNext(data);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6 animate-in" noValidate>
      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-in" role="alert">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Name Field */}
      <div className="animate-in" style={{ animationDelay: '50ms' }}>
        <Label htmlFor="name" className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          Nome completo
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Seu nome completo"
          autoComplete="name"
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

      {/* Email Field */}
      <div className="animate-in" style={{ animationDelay: '100ms' }}>
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-400" />
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          {...register('email')}
          error={errors.email?.message}
          disabled={isLoading}
          className="mt-1.5"
        />
        {errors.email && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <Label htmlFor="password" className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400" />
          Senha
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
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Password Strength Meter */}
        {passwordValue && (
          <div className="mt-2 space-y-1">
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strength.color}`}
                style={{ width: strength.width }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Força da senha: <span className="font-medium">{strength.label}</span>
            </p>
          </div>
        )}

        {errors.password && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
            <AlertCircle className="w-3 h-3" />
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="animate-in" style={{ animationDelay: '150ms' }}>
        <Label htmlFor="confirmPassword" className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400" />
          Confirmar senha
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
          />
          <button
            type="button"
            onClick={() => setShowConfirmPass(!showConfirmPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label={showConfirmPass ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showConfirmPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 animate-in">
            <AlertCircle className="w-3 h-3" />
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Terms Checkbox */}
      <div className="pt-2 animate-in" style={{ animationDelay: '200ms' }}>
        <div className="flex items-start gap-3">
          <Checkbox
            id="acceptTerms"
            {...register('acceptTerms')}
            disabled={isLoading}
            className="mt-0.5"
          />
          <Label htmlFor="acceptTerms" className="text-sm text-slate-600 dark:text-slate-300 cursor-pointer leading-relaxed">
            Eu li e concordo com os
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
              Termos de Uso
            </a>
            e a
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium ml-1">
              Política de Privacidade
            </a>
            do ZapTI.
          </Label>
        </div>
        {errors.acceptTerms && (
          <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1 ml-6 animate-in">
            <AlertCircle className="w-3 h-3" />
            {errors.acceptTerms.message}
          </p>
        )}
      </div>

      {/* Security Note */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 animate-in" style={{ animationDelay: '250ms' }}>
        <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-sm text-slate-600 dark:text-slate-400">
          <p className="font-medium">Segurança:</p>
          <p className="mt-1">
            Sua senha será armazenada de forma segura usando hash bcrypt. Nós nunca armazenamos
            senhas em texto puro e não temos acesso à sua senha original.
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full py-3 text-lg animate-in"
        disabled={isLoading}
        isLoading={isLoading}
        style={{ animationDelay: '300ms' }}
      >
        Continuar
      </Button>
    </form>
  );
}