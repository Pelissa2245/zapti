// ZapTI Web — Dashboard Page (real data only; empty states; no fallback data)
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import {
  MessageSquare,
  Ticket as TicketIcon,
  Users,
  Wifi,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface DashboardStats {
  tickets: {
    total?: number;
    open?: number;
    inProgress?: number;
    waitingCustomer?: number;
    waitingAgent?: number;
    resolved?: number;
    closed?: number;
    overdue?: number;
  };
  whatsapp: {
    total?: number;
    connected?: number;
    disconnected?: number;
    totalMessages?: number;
    todayMessages?: number;
  };
  users: Record<string, number>;
  partialFailure?: boolean;
}

type LoadState = 'loading' | 'ready' | 'error';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<LoadState>('loading');
  const [stats, setStats] = useState<DashboardStats | null>(null);

  async function loadStats() {
    setState('loading');
    try {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('failed');
      const data: DashboardStats = await res.json();
      setStats(data);
      setState('ready');
    } catch {
      setStats(null);
      setState('error');
    }
  }

  useEffect(() => {
    void loadStats();
  }, []);

  const cards = [
    {
      title: 'Tickets',
      value: stats?.tickets?.total ?? 0,
      icon: TicketIcon,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      detail: `${stats?.tickets?.open ?? 0} abertos`,
    },
    {
      title: 'Instâncias WhatsApp',
      value: stats?.whatsapp?.total ?? 0,
      icon: Wifi,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      detail: `${stats?.whatsapp?.connected ?? 0} conectadas`,
    },
    {
      title: 'Mensagens',
      value: stats?.whatsapp?.totalMessages ?? 0,
      icon: MessageSquare,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
      detail: `${stats?.whatsapp?.todayMessages ?? 0} hoje`,
    },
    {
      title: 'Membros',
      value: stats?.users?.total ?? 0,
      icon: Users,
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      detail: `${stats?.users?.active ?? 0} ativos`,
    },
  ];

  const ticketStatuses = [
    { label: 'Abertos', count: stats?.tickets?.open ?? 0, color: 'bg-blue-500' },
    { label: 'Em Progresso', count: stats?.tickets?.inProgress ?? 0, color: 'bg-yellow-500' },
    { label: 'Aguardando Cliente', count: stats?.tickets?.waitingCustomer ?? 0, color: 'bg-orange-500' },
    { label: 'Aguardando Agente', count: stats?.tickets?.waitingAgent ?? 0, color: 'bg-purple-500' },
    { label: 'Resolvidos', count: stats?.tickets?.resolved ?? 0, color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {user ? `Olá, ${user.name.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Visão geral da sua central de atendimento
          </p>
        </div>
        <button
          onClick={() => void loadStats()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RefreshCw className={cn('h-4 w-4', state === 'loading' && 'animate-spin')} />
          Atualizar
        </button>
      </div>

      {state === 'error' && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Não foi possível carregar o dashboard</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Ocorreu um erro ao buscar seus dados. Tente novamente.
              </p>
            </div>
            <button
              onClick={() => void loadStats()}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Tentar novamente
            </button>
          </CardContent>
        </Card>
      )}

      {state !== 'error' && (
        <>
          {stats?.partialFailure && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Alguns dados não puderam ser carregados no momento. Os valores exibidos podem estar incompletos.
              </span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</p>
                      {state === 'loading' ? (
                        <div className="mt-2 h-8 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                      ) : (
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.detail}</p>
                    </div>
                    <div className={cn('p-3 rounded-xl', card.color)}>
                      <card.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Ticket status — real data; empty state when user has nothing yet */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Tickets por Status
                  <Badge variant="outline">{stats?.tickets?.total ?? 0} total</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {state === 'loading' ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-6 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    ))}
                  </div>
                ) : (stats?.tickets?.total ?? 0) === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <TicketIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Nenhum ticket ainda. Crie sua primeira instância WhatsApp e comece a atender.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ticketStatuses.map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn('h-2 w-2 rounded-full', item.color)} />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{item.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
