// ZapTI Web — Onboarding Page
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { Loader2, Globe, Bell, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const onboardingSchema = z.object({
  language: z.string().min(2, 'Selecione um idioma'),
  timezone: z.string().min(2, 'Selecione um fuso horário'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    whatsapp: z.boolean().default(false),
  }).default({ email: true, push: true, whatsapp: false }),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

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

export default function OnboardingPage() {
  const router = useRouter();
  const { fetchCurrentUser } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const totalSteps = 3;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      notifications: { email: true, push: true, whatsapp: false },
    },
  });

  const languageValue = watch('language');
  const timezoneValue = watch('timezone');

  const onSubmit = async (data: OnboardingForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erro ao completar onboarding');
      }

      toast.success('Onboarding concluído com sucesso!');

      // Refresh user data
      await fetchCurrentUser();

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao completar onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Globe className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-2xl font-bold">Bem-vindo ao ZapTI!</h3>
        <p className="text-muted-foreground mt-2">
          Vamos configurar sua conta para que você tenha a melhor experiência.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="language" className="block text-sm font-medium mb-2">
            Idioma
          </Label>
          <select
            id="language"
            {...register('language')}
            className={cn(
              'w-full px-3 py-2 border rounded-lg bg-background',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              errors.language && 'border-destructive'
            )}
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          {errors.language && (
            <p className="text-sm text-destructive mt-1">{errors.language.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="timezone" className="block text-sm font-medium mb-2">
            Fuso Horário
          </Label>
          <select
            id="timezone"
            {...register('timezone')}
            className={cn(
              'w-full px-3 py-2 border rounded-lg bg-background',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              errors.timezone && 'border-destructive'
            )}
          >
            {timezones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          {errors.timezone && (
            <p className="text-sm text-destructive mt-1">{errors.timezone.message}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Bell className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-2xl font-bold">Preferências de Notificação</h3>
        <p className="text-muted-foreground mt-2">
          Escolha como você prefere receber notificações importantes.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-4 border rounded-lg bg-background/50">
          <Checkbox
            id="email"
            checked={watch('notifications.email')}
            onCheckedChange={(checked) => setValue('notifications.email', checked)}
            label="Email"
          />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Receber notificações por email</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-4 border rounded-lg bg-background/50">
          <Checkbox
            id="push"
            checked={watch('notifications.push')}
            onCheckedChange={(checked) => setValue('notifications.push', checked)}
            label="Push (Navegador)"
          />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Receber notificações no navegador</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-4 border rounded-lg bg-background/50">
          <Checkbox
            id="whatsapp"
            checked={watch('notifications.whatsapp')}
            onCheckedChange={(checked) => setValue('notifications.whatsapp', checked)}
            label="WhatsApp"
          />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Receber notificações via WhatsApp (requer configuração)</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold">Tudo Pronto!</h3>
        <p className="text-muted-foreground mt-2">
          Revise suas configurações e finalize o onboarding.
        </p>
      </div>

      <div className="space-y-4 bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-3">Resumo das Configurações</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Idioma</span>
            <span className="font-medium">{languages.find(l => l.value === languageValue)?.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fuso Horário</span>
            <span className="font-medium">{timezones.find(t => t.value === timezoneValue)?.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Notificações por Email</span>
            <span className="font-medium">{watch('notifications.email') ? 'Ativado' : 'Desativado'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Notificações Push</span>
            <span className="font-medium">{watch('notifications.push') ? 'Ativado' : 'Desativado'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Notificações WhatsApp</span>
            <span className="font-medium">{watch('notifications.whatsapp') ? 'Ativado' : 'Desativado'}</span>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground text-center">
        Você pode alterar estas configurações a qualquer momento nas <a href="/settings" className="text-primary underline">Configurações</a>.
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    stepNum < step
                      ? 'bg-primary text-primary-foreground'
                      : stepNum === step
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {stepNum < step ? <CheckCircle2 className="w-5 h-5" /> : stepNum}
                </div>
                {stepNum < totalSteps && (
                  <div
                    className={cn(
                      'flex-1 h-1 mx-2 transition-colors',
                      stepNum < step ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Passo {step} de {totalSteps}
          </div>
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Configuração Inicial</CardTitle>
            <CardDescription>Leva menos de 1 minuto</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}

              <div className="flex justify-between pt-4 border-t">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Voltar
                  </Button>
                )}
                {step < totalSteps ? (
                  <Button type="button" onClick={nextStep} className="ml-auto">
                    Próximo <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" className="ml-auto" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Finalizando...
                      </>
                    ) : (
                      <>
                        Concluir <CheckCircle2 className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Ao continuar, você concorda com nossos{' '}
          <a href="/terms" className="text-primary underline">Termos de Uso</a>{' '}
          e{' '}
          <a href="/privacy" className="text-primary underline">Política de Privacidade</a>.
        </p>
      </div>
    </div>
  );
}