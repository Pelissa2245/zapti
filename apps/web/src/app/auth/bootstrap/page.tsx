// ZapTI Web — Bootstrap Page (First Admin Setup)
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { Loader2, Users, Building2, AlertCircle, Zap, Eye, EyeOff } from 'lucide-react';

const bootstrapSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').max(128),
  confirmPassword: z.string(),
  tenantName: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres').max(100),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

type BootstrapForm = z.infer<typeof bootstrapSchema>;

export default function BootstrapPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BootstrapForm>({
    resolver: zodResolver(bootstrapSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      tenantName: '',
    },
  });

  const [showPass, setShowPass] = React.useState(false);

  const onSubmit = async (data: BootstrapForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          tenantName: data.tenantName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Erro ao criar administrador');
      }

      toast.success('Administrador criado com sucesso!');
      router.push('/auth/onboarding');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Bem-vindo ao ZapTI
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Configure seu primeiro administrador para começar
          </p>
        </div>

        {/* Alert for errors */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Primeiro Administrador</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para criar o primeiro usuário administrador do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Tenant Name */}
              <div className="space-y-2">
                <Label htmlFor="tenantName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nome da Empresa
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <Input
                    id="tenantName"
                    placeholder="Ex: Minha Empresa Ltda"
                    className="pl-10 transition-all duration-200"
                    {...register('tenantName')}
                    autoComplete="organization"
                    disabled={isLoading}
                    aria-invalid={errors.tenantName ? 'true' : 'false'}
                    aria-describedby={errors.tenantName ? 'tenantName-error' : undefined}
                  />
                </div>
                {errors.tenantName && (
                  <p id="tenantName-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {errors.tenantName.message}
                  </p>
                )}
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nome Completo
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <Input
                    id="name"
                    placeholder="Seu nome completo"
                    className="pl-10 transition-all duration-200"
                    {...register('name')}
                    autoComplete="name"
                    disabled={isLoading}
                    aria-invalid={errors.name ? 'true' : 'false'}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                </div>
                {errors.name && (
                  <p id="name-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10 transition-all duration-200"
                    {...register('email')}
                    autoComplete="email"
                    disabled={isLoading}
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Senha
                </Label>
                <div className="relative">
                  <Eye className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <Input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-12 transition-all duration-200"
                    {...register('password')}
                    autoComplete="new-password"
                    disabled={isLoading}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                    aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Eye className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <Input
                    id="confirmPassword"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 transition-all duration-200"
                    {...register('confirmPassword')}
                    autoComplete="new-password"
                    disabled={isLoading}
                    aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                    aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  />
                </div>
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1" role="alert">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full py-3 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Criando administrador...
                  </span>
                ) : (
                  'Criar Administrador e Continuar'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              <p>Esta tela aparece apenas na primeira instalação.</p>
              <p className="mt-1">Após criar o administrador, você será direcionado para configurar suas preferências.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}