// ZapTI Web — Step 4: WhatsApp Connections (Optional)
'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { MessageSquare, Loader2, AlertCircle, CheckCircle2, Shield, Eye, EyeOff, Plus, Trash2, QrCode, Wifi, WifiOff, RefreshCw, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';

const connectionSchema = z.object({
  displayName: z.string().min(1, 'Nome de exibição é obrigatório').max(50),
  instanceName: z.string(),
});

const whatsappSchema = z.object({
  configureWhatsApp: z.boolean().default(false),
  evolutionApiUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  evolutionApiKey: z.string().optional(),
  connections: z.array(connectionSchema).default([]),
  instanceName: z.string().optional(),
});

type WhatsAppFormData = z.infer<typeof whatsappSchema>;

interface WhatsAppConnection {
  id: string;
  displayName: string;
  instanceName: string;
  qrCode?: string;
  status: 'pending' | 'connecting' | 'connected' | 'disconnected' | 'failed';
}

interface Step4WhatsAppFormProps {
  onNext: (data: {
    configureWhatsApp: boolean;
    evolutionApiUrl?: string;
    evolutionApiKey?: string;
    connections?: WhatsAppConnection[];
    instanceName?: string; // deprecated, kept for backward compatibility
  }) => void;
  onBack: () => void;
  onSkip: () => void;
  initialData?: Partial<WhatsAppFormData> & { connections?: WhatsAppConnectionInput[] };
  isLoading: boolean;
  error?: string | null;
}

interface WhatsAppConnectionInput {
  displayName: string;
  instanceName: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, '') // Trim dashes
    .substring(0, 50); // Limit length
}

function generateInstanceName(displayName: string, existingNames: string[]): string {
  const base = slugify(displayName) || 'whatsapp';
  let instanceName = base;
  let counter = 1;
  while (existingNames.includes(instanceName)) {
    instanceName = `${base}-${counter}`;
    counter++;
  }
  return instanceName;
}

export function Step4WhatsAppForm({
  onNext,
  onBack,
  onSkip,
  initialData,
  isLoading
}: Step4WhatsAppFormProps) {
  const [showKey, setShowKey] = React.useState(false);
  const [connections, setConnections] = React.useState<WhatsAppConnection[]>([]);
  const [generatingQrId, setGeneratingQrId] = React.useState<string | null>(null);
  const [checkingConnectionId, setCheckingConnectionId] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<WhatsAppFormData>({
    resolver: zodResolver(whatsappSchema),
    defaultValues: {
      configureWhatsApp: false,
      evolutionApiUrl: '',
      evolutionApiKey: '',
      connections: [],
      ...initialData,
    },
  });

  const configureWhatsApp = watch('configureWhatsApp');
  const evolutionApiUrl = watch('evolutionApiUrl');
  const evolutionApiKey = watch('evolutionApiKey');

  const { fields, append, remove } = useFieldArray({ control, name: 'connections' });

  // Initialize connections from initialData
  React.useEffect(() => {
    if (initialData?.connections && initialData.connections.length > 0) {
      // Convert WhatsAppConnectionInput[] to WhatsAppConnection[]
      const fullConnections: WhatsAppConnection[] = initialData.connections.map(conn => ({
        id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        displayName: conn.displayName,
        instanceName: conn.instanceName,
        status: 'pending' as const,
      }));
      setConnections(fullConnections);
      // Also sync with react-hook-form
      initialData.connections.forEach((conn, index) => {
        if (index < fields.length) {
          setValue(`connections.${index}.displayName`, conn.displayName);
          setValue(`connections.${index}.instanceName`, conn.instanceName);
        } else {
          append({ displayName: conn.displayName, instanceName: conn.instanceName });
        }
      });
    } else if (!configureWhatsApp) {
      // Add a default empty connection when WhatsApp is enabled
      if (fields.length === 0) {
        append({ displayName: '', instanceName: '' });
      }
    }
  }, [initialData?.connections, fields.length, append, setValue, configureWhatsApp]);

  // Sync connections from form to state
  React.useEffect(() => {
    const subscription = watch((value, info) => {
      if (info?.name?.startsWith('connections')) {
        const formConnections = value.connections;
        if (formConnections) {
          const existingNames = formConnections.map(c => c.instanceName).filter((v): v is string => Boolean(v));
          setConnections(prev => formConnections.map((fc, i) => {
            const existing = prev[i];
            const instanceName = fc.instanceName && fc.instanceName.trim() ? fc.instanceName : generateInstanceName(fc.displayName || `Conexão ${i + 1}`, existingNames);
            return {
              id: existing?.id || `conn-${i}`,
              displayName: fc.displayName || `Conexão ${i + 1}`,
              instanceName,
              qrCode: existing?.qrCode,
              status: existing?.status || 'pending',
            };
          }));
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const handleAddConnection = () => {
    const currentConnections = watch('connections') || [];
    const existingNames = currentConnections.map(c => c.instanceName).filter((v): v is string => Boolean(v));
    const displayName = `Conexão ${currentConnections.length + 1}`;
    const instanceName = generateInstanceName(displayName, existingNames);

    append({ displayName, instanceName });
    setConnections(prev => [...prev, {
      id: `conn-${Date.now()}`,
      displayName,
      instanceName,
      status: 'pending',
    }]);
  };

  const handleRemoveConnection = (index: number) => {
    remove(index);
    setConnections(prev => prev.filter((_, i) => i !== index));
  };

  const handleDisplayNameChange = (index: number, displayName: string) => {
    setValue(`connections.${index}.displayName`, displayName);
    const currentConnections = watch('connections') || [];
    const existingNames = currentConnections
      .map((c, i) => i !== index ? c.instanceName : '')
      .filter((v): v is string => Boolean(v));
    const instanceName = generateInstanceName(displayName, existingNames);
    setValue(`connections.${index}.instanceName`, instanceName);
    setConnections(prev => prev.map((conn, i) =>
      i === index ? { ...conn, displayName, instanceName } : conn
    ));
  };

  const handleGenerateQr = async (index: number) => {
    const conn = connections[index];
    if (!conn) return;

    setGeneratingQrId(conn.id);
    try {
      const response = await fetch('/api/auth/whatsapp/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          instanceName: conn.instanceName,
          evolutionApiUrl,
          evolutionApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao gerar QR Code');
      }

      setConnections(prev => prev.map((c, i) =>
        i === index ? { ...c, qrCode: data.qrCode, status: 'connecting' } : c
      ));

      // Start polling for connection status
      pollConnectionStatus(index, conn.instanceName);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar QR Code';
      toast.error(message);
      setConnections(prev => prev.map((c, i) =>
        i === index ? { ...c, status: 'failed' } : c
      ));
    } finally {
      setGeneratingQrId(null);
    }
  };

  const pollConnectionStatus = async (index: number, instanceName: string) => {
    setCheckingConnectionId(connections[index].id);

    const poll = async () => {
      try {
        const response = await fetch(`/api/auth/whatsapp/connection-status/${instanceName}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok && data.status) {
          const newStatus = data.status; // 'connecting', 'connected', 'disconnected', 'failed'

          setConnections(prev => prev.map((c, i) =>
            i === index ? { ...c, status: newStatus } : c
          ));

          if (newStatus === 'connected' || newStatus === 'failed' || newStatus === 'disconnected') {
            setCheckingConnectionId(null);
            return;
          }
        }
      } catch {
        // Ignore polling errors
      }

      // Poll every 3 seconds
      setTimeout(poll, 3000);
    };

    poll();
  };

  const handleCheckConnection = async (index: number) => {
    const conn = connections[index];
    if (!conn) return;

    setCheckingConnectionId(conn.id);
    try {
      const response = await fetch(`/api/auth/whatsapp/connection-status/${conn.instanceName}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.status) {
        setConnections(prev => prev.map((c, i) =>
          i === index ? { ...c, status: data.status } : c
        ));
      }
    } catch {
      // Ignore
    } finally {
      setCheckingConnectionId(null);
    }
  };

  const handleCopyInstanceName = (instanceName: string) => {
    navigator.clipboard.writeText(instanceName);
    toast.success('Nome da instância copiado');
  };

  const getStatusIcon = (status: WhatsAppConnection['status']) => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />;
      case 'pending':
        return <QrCode className="w-4 h-4 text-slate-400" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <QrCode className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusLabel = (status: WhatsAppConnection['status']) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'pending':
        return 'Aguardando QR Code';
      case 'disconnected':
        return 'Desconectado';
      case 'failed':
        return 'Erro na conexão';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: WhatsAppConnection['status']) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'connecting':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'pending':
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30';
      case 'disconnected':
        return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30';
      case 'failed':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30';
    }
  };

  if (!configureWhatsApp) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Configurar WhatsApp
          </h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
            Conecte suas contas do WhatsApp para enviar e receber mensagens pelo ZapTI.
            Você pode fazer isso agora ou configurar depois nas Configurações.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => setValue('configureWhatsApp', true)}
            className="w-full"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Configurar WhatsApp agora
          </Button>

          <Button
            type="button"
            onClick={onSkip}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Shield className="w-4 h-4 mr-2" />
            Pular / Configurar depois
          </Button>
        </div>

        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Dica:</strong> Você pode conectar ou editar suas conexões depois em{' '}
            <strong>Configura&#xE7;&#xF5;es &gt; WhatsApp</strong>
            {' '}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Evolution API Configuration */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            Configuração da Evolution API
          </CardTitle>
          <CardDescription>
            Configure a URL e a chave da sua instância da Evolution API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="evolutionApiUrl">URL da Evolution API</Label>
            <Input
              id="evolutionApiUrl"
              type="url"
              placeholder="https://sua-evolution-api.com"
              {...register('evolutionApiUrl')}
              error={errors.evolutionApiUrl?.message}
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="evolutionApiKey">Chave da API (API Key)</Label>
            <div className="relative">
              <Input
                id="evolutionApiKey"
                type={showKey ? 'text' : 'password'}
                placeholder="Sua chave da API"
                {...register('evolutionApiKey')}
                error={errors.evolutionApiKey?.message}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-[38px]"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connections List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Conexões WhatsApp
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddConnection}
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar conexão
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Nenhuma conexão configurada
            </p>
            <Button onClick={handleAddConnection} disabled={isLoading}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar primeira conexão
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <ConnectionCard
                key={field.id}
                index={index}
                connection={connections[index]}
                errors={errors.connections?.[index]}
                onDisplayNameChange={handleDisplayNameChange}
                onRemove={handleRemoveConnection}
                onGenerateQr={handleGenerateQr}
                onCheckConnection={handleCheckConnection}
                onCopyInstanceName={handleCopyInstanceName}
                generatingQrId={generatingQrId}
                checkingConnectionId={checkingConnectionId}
                getStatusIcon={getStatusIcon}
                getStatusLabel={getStatusLabel}
                getStatusColor={getStatusColor}
                isLoading={isLoading}
                canRemove={fields.length > 1}
              />
            ))}
          </div>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          O nome técnico da instância é gerado automaticamente a partir do nome de exibição.
          A Evolution API restringe caracteres especiais e espaços.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isLoading}>
          Voltar
        </Button>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            disabled={isLoading}
          >
            Pular / Configurar depois
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit((data) => onNext({
              configureWhatsApp: data.configureWhatsApp,
              evolutionApiUrl: data.evolutionApiUrl || undefined,
              evolutionApiKey: data.evolutionApiKey || undefined,
              connections: data.connections?.map(c => ({
                id: c.instanceName,
                displayName: c.displayName,
                instanceName: c.instanceName,
                status: 'pending' as const,
              })),
              instanceName: data.connections?.[0]?.instanceName, // backward compat
            }))}
            disabled={isLoading}
            className="ml-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Próximo: Concluir'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ConnectionCardProps {
  index: number;
  connection: WhatsAppConnection;
  errors?: any;
  onDisplayNameChange: (index: number, displayName: string) => void;
  onRemove: (index: number) => void;
  onGenerateQr: (index: number) => void;
  onCheckConnection: (index: number) => void;
  onCopyInstanceName: (instanceName: string) => void;
  generatingQrId: string | null;
  checkingConnectionId: string | null;
  getStatusIcon: (status: WhatsAppConnection['status']) => React.ReactNode;
  getStatusLabel: (status: WhatsAppConnection['status']) => string;
  getStatusColor: (status: WhatsAppConnection['status']) => string;
  isLoading: boolean;
  canRemove: boolean;
}

function ConnectionCard({
  index,
  connection,
  errors,
  onDisplayNameChange,
  onRemove,
  onGenerateQr,
  onCheckConnection,
  onCopyInstanceName,
  generatingQrId,
  checkingConnectionId,
  getStatusIcon,
  getStatusLabel,
  getStatusColor,
  isLoading,
  canRemove,
}: ConnectionCardProps) {
  const isGenerating = generatingQrId === connection.id;
  const isChecking = checkingConnectionId === connection.id;
  const hasQr = !!connection.qrCode;

  return (
    <Card className="border-slate-200 dark:border-slate-700 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Conexão {index + 1}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Instância: <code className="text-primary-600 dark:text-primary-400">{connection.instanceName}</code>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(connection.status))}>
              {getStatusIcon(connection.status)}
              <span className="ml-1">{getStatusLabel(connection.status)}</span>
            </span>
            {canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Display Name */}
        <div>
          <Label htmlFor={`connections.${index}.displayName`}>Nome de exibição</Label>
          <Input
            id={`connections.${index}.displayName`}
            placeholder="Ex: Suporte, Comercial, Atendimento"
            value={connection.displayName}
            onChange={(e) => onDisplayNameChange(index, e.target.value)}
            error={errors?.displayName?.message}
            disabled={isLoading || connection.status === 'connected'}
          />
        </div>

        {/* Instance Name (auto-generated, read-only with copy) */}
        <div>
          <Label htmlFor={`connections.${index}.instanceName`}>Nome da instância (técnico)</Label>
          <div className="relative">
            <Input
              id={`connections.${index}.instanceName`}
              value={connection.instanceName}
              readOnly
              className="bg-slate-100 dark:bg-slate-800 pr-12"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-[38px]"
              onClick={() => onCopyInstanceName(connection.instanceName)}
              disabled={isLoading}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gerado automaticamente. Usado na Evolution API.
          </p>
        </div>

        {/* QR Code Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>QR Code para conexão</Label>
            <div className="flex items-center gap-2">
              {!hasQr && !isGenerating && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onGenerateQr(index)}
                  disabled={isLoading || !connection.displayName}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Gerar QR Code
                </Button>
              )}
              {hasQr && connection.status !== 'connected' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onGenerateQr(index)}
                  disabled={isLoading || isGenerating}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerar novo QR
                </Button>
              )}
              {connection.status === 'connected' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onCheckConnection(index)}
                  disabled={isLoading || isChecking}
                >
                  <RefreshCw className={cn('w-4 h-4 mr-2', isChecking && 'animate-spin')} />
                  Verificar status
                </Button>
              )}
            </div>
          </div>

          {isGenerating && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              <span className="ml-3 text-slate-600 dark:text-slate-400">Gerando QR Code...</span>
            </div>
          )}

          {hasQr && connection.qrCode && (
            <div className="text-center space-y-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="inline-block p-2 bg-white dark:bg-slate-900 rounded shadow">
                <Image
                  src={connection.qrCode}
                  alt={`QR Code para ${connection.displayName}`}
                  width={192}
                  height={192}
                  className="w-48 h-48"
                  unoptimized
                />
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <p className="font-medium text-slate-900 dark:text-white">
                  {connection.status === 'connected' ? 'Conectado!' : 'Escaneie com o WhatsApp'}
                </p>
                <p>
                  Aponte a c&#xE2;mera do WhatsApp (Configura&#xE7;&#xF5;es &gt; Aparelhos conectado&gt;&gt;  Conectar aparelho)
                </p>
              </div>
              {connection.status === 'connected' && (
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">WhatsApp conectado com sucesso!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}