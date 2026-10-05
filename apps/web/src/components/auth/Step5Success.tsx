// ZapTI Web — Step 5: Success/Complete Screen
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CheckCircle2, Zap, Building2, User, Mail, Lock, ArrowRight } from 'lucide-react';

interface Step5SuccessProps {
  adminData: {
    name: string;
    email: string;
  };
  tenantData: {
    name: string;
  };
  onComplete: () => void;
  isLoading?: boolean;
  completed?: boolean;
}

export function Step5Success({ adminData, tenantData, onComplete, isLoading }: Step5SuccessProps) {
  const router = useRouter();

  const handleGoToDashboard = () => {
    onComplete();
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Success Animation */}
      <div className="text-center">
        <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Onboarding concluído!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Sua conta e empresa foram criadas com sucesso. Bem-vindo ao ZapTI!
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Administrador</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Mail className="w-4 h-4 text-slate-500" />
              </div>
              <span className="text-slate-600 dark:text-slate-400">{adminData.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <span className="text-slate-600 dark:text-slate-400">{adminData.name}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
              <span className="text-slate-600 dark:text-slate-400">Superadmin • Acesso total</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Empresa</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-slate-500" />
              </div>
              <span className="text-slate-600 dark:text-slate-400">{tenantData.name}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <span className="text-slate-600 dark:text-slate-400">Plano: Gratuito (14 dias trial)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Próximos passos
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-3">
            {[
              'Acesse o painel de administração',
              'Configure sua instância WhatsApp (se pulou essa etapa)',
              'Convide membros da equipe',
              'Crie departamentos e configure filas',
              'Personalize respostas automáticas',
            ].map((step, index) => (
              <li key={index} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Action Button */}
      <Button
        onClick={handleGoToDashboard}
        className="w-full py-3 text-lg"
        disabled={isLoading}
        isLoading={isLoading}
      >
        Acessar o painel
        <ArrowRight className="w-4 h-4" />
      </Button>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Você será redirecionado automaticamente em alguns segundos...
      </p>
    </div>
  );
}