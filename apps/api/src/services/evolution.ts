// ZapTI — Evolution API client
// This module deliberately fails closed when Evolution is not configured.

export class EvolutionApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'EvolutionApiError';
  }
}

function getConfig() {
  const baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
  const apiKey = process.env.EVOLUTION_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new EvolutionApiError(503, 'Evolution API não configurada');
  }
  return { baseUrl, apiKey };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { baseUrl, apiKey } = getConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      apikey: apiKey,
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let body: unknown = undefined;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }
  if (!response.ok) {
    const detail = typeof body === 'string' ? body : JSON.stringify(body);
    throw new EvolutionApiError(response.status, `Evolution API respondeu ${response.status}: ${detail}`);
  }
  return body as T;
}

export async function createEvolutionInstance(instanceName: string, webhookUrl?: string) {
  return request<Record<string, unknown>>('/instance/create', {
    method: 'POST',
    body: JSON.stringify({
      instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
      ...(webhookUrl
        ? {
            webhook: {
              url: webhookUrl,
              enabled: true,
              base64: true,
              events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE'],
            },
          }
        : {}),
    }),
  });
}

export async function connectEvolutionInstance(instanceName: string) {
  return request<Record<string, unknown>>(`/instance/connect/${encodeURIComponent(instanceName)}`);
}

export async function logoutEvolutionInstance(instanceName: string) {
  return request<Record<string, unknown>>(`/instance/logout/${encodeURIComponent(instanceName)}`, { method: 'DELETE' });
}

export async function sendEvolutionMessage(
  instanceName: string,
  input: { to: string; type: string; content: string; mediaUrl?: string; mediaCaption?: string },
) {
  const number = input.to.replace(/\D/g, '');
  if (input.type === 'TEXT') {
    return request<Record<string, unknown>>(`/message/sendText/${encodeURIComponent(instanceName)}`, {
      method: 'POST',
      body: JSON.stringify({ number, text: input.content }),
    });
  }
  if (!input.mediaUrl) {
    throw new EvolutionApiError(400, 'mediaUrl é obrigatório para mensagens de mídia');
  }
  return request<Record<string, unknown>>(`/message/sendMedia/${encodeURIComponent(instanceName)}`, {
    method: 'POST',
    body: JSON.stringify({
      number,
      mediatype: input.type.toLowerCase(),
      media: input.mediaUrl,
      caption: input.mediaCaption || input.content,
    }),
  });
}

export function extractEvolutionMessageId(payload: Record<string, unknown>): string | undefined {
  const key = payload.key;
  if (key && typeof key === 'object' && key !== null && 'id' in key && typeof key.id === 'string') {
    return key.id;
  }
  return typeof payload.id === 'string' ? payload.id : undefined;
}

export function extractEvolutionQr(payload: Record<string, unknown>): string | undefined {
  const candidates = [payload.base64, payload.qrcode];
  for (const candidate of candidates) {
    if (typeof candidate === 'string') return candidate;
    if (candidate && typeof candidate === 'object' && 'base64' in candidate && typeof candidate.base64 === 'string') {
      return candidate.base64;
    }
  }
  return undefined;
}
