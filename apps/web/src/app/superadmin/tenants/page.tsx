// ZapTI Web — Superadmin Tenants Page
'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';
import {
  Plus,
  Search,
  Trash2,
  Eye,
  Shield,
  Loader2,
  Users,
  MessageSquare,
} from 'lucide-react';

const tenantSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  adminEmail: z.string().email('Email inválido'),
  adminName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  adminPassword: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
});

type TenantForm = z.infer<typeof tenantSchema>;

interface Tenant {
  id: string;
  name: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    conversations: number;
    tickets: number;
    whatsappInstances: number;
  };
}

function TenantsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['tenants', page, search, statusFilter],
    queryFn: () => api.getTenants({ page, limit: 20, q: search, status: statusFilter || undefined }),
    select: (data) => data as { data: Tenant[]; pagination: any },
  });

  // Create tenant mutation
  const createMutation = useMutation({
    mutationFn: (data: TenantForm) => api.createTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao criar tenant');
    },
  });

  // Suspend tenant mutation
  const suspendMutation = useMutation({
    mutationFn: (id: string) => api.suspendTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant suspenso');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao suspender');
    },
  });

  // Unsuspend tenant mutation
  const unsuspendMutation = useMutation({
    mutationFn: (id: string) => api.unsuspendTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant reativado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao reativar');
    },
  });

  // Delete tenant mutation
  const deleteMutation = useMutation({
    mutationFn: ({ id, confirmation }: { id: string; confirmation: string }) => api.deleteTenant(id, confirmation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Tenant excluído');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao excluir');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Ativo</Badge>;
      case 'SUSPENDED':
        return <Badge variant="warning">Suspenso</Badge>;
      case 'DELETED':
        return <Badge variant="destructive">Excluído</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tenants</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie todas as empresas da plataforma</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Novo Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogTitle>Criar novo tenant</DialogTitle>
            <DialogDescription>
              Preencha os dados da empresa e do administrador inicial
            </DialogDescription>
            <CreateTenantForm onSubmit={createMutation.mutate} isLoading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800"
            >
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativo</option>
              <option value="SUSPENDED">Suspenso</option>
              <option value="DELETED">Excluído</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : error ? (
            <div className="flex h-64 items-center justify-center text-red-600">
              Erro ao carregar tenants
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Usuários</TableHead>
                      <TableHead className="text-right">Conversas</TableHead>
                      <TableHead className="text-right">Instâncias</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="w-32">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data.map((tenant: Tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{tenant.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">ID: {tenant.id.slice(0, 8)}...</p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                        <TableCell className="text-right">
                          <Users className="h-4 w-4 inline mr-1 text-slate-400" />
                          {tenant._count.users}
                        </TableCell>
                        <TableCell className="text-right">
                          <MessageSquare className="h-4 w-4 inline mr-1 text-slate-400" />
                          {tenant._count.conversations}
                        </TableCell>
                        <TableCell className="text-right">
                          <MessageSquare className="h-4 w-4 inline mr-1 text-slate-400" />
                          {tenant._count.whatsappInstances}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDateTime(tenant.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <a href={`/superadmin/tenants/${tenant.id}`}>
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                            {tenant.status === 'ACTIVE' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm(`Suspender o tenant "${tenant.name}"?`)) {
                                    suspendMutation.mutate(tenant.id);
                                  }
                                }}
                                disabled={suspendMutation.isPending}
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            )}
                            {tenant.status === 'SUSPENDED' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => unsuspendMutation.mutate(tenant.id)}
                                disabled={unsuspendMutation.isPending}
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            )}
                            {tenant.status !== 'DELETED' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const confirmation = prompt(`Digite o nome exato do tenant para confirmar a exclusão:\n\n${tenant.name}`);
                                  if (confirmation === tenant.name) {
                                    deleteMutation.mutate({ id: tenant.id, confirmation });
                                  } else if (confirmation !== null) {
                                    alert('Nome incorreto. Exclusão cancelada.');
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data && data.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Página {data.pagination.page} de {data.pagination.totalPages} — {data.pagination.total} tenants
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={data.pagination.page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                      disabled={data.pagination.page === data.pagination.totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateTenantForm({ onSubmit, isLoading }: { onSubmit: (data: TenantForm) => void; isLoading: boolean }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<TenantForm>({
    resolver: zodResolver(tenantSchema),
  });

  const handleFormSubmit = (data: TenantForm) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Empresa *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <h4 className="font-medium text-slate-900 dark:text-white mb-3">Administrador Inicial</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email *</Label>
              <Input id="adminEmail" type="email" {...register('adminEmail')} />
              {errors.adminEmail && <p className="text-sm text-red-600">{errors.adminEmail.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminName">Nome *</Label>
              <Input id="adminName" {...register('adminName')} />
              {errors.adminName && <p className="text-sm text-red-600">{errors.adminName.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminPassword">Senha *</Label>
            <Input id="adminPassword" type="password" {...register('adminPassword')} />
            {errors.adminPassword && <p className="text-sm text-red-600">{errors.adminPassword.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => reset()}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isLoading ? 'Criando...' : 'Criar Tenant'}
        </Button>
      </div>
    </form>
  );
}

export default TenantsPage;