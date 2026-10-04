import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  connectEvolutionInstance,
  extractEvolutionMessageId,
  extractEvolutionQr,
  EvolutionApiError,
} from './evolution.js';

describe('Evolution API client', () => {
  const originalUrl = process.env.EVOLUTION_API_URL;
  const originalKey = process.env.EVOLUTION_API_KEY;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalUrl === undefined) delete process.env.EVOLUTION_API_URL;
    else process.env.EVOLUTION_API_URL = originalUrl;
    if (originalKey === undefined) delete process.env.EVOLUTION_API_KEY;
    else process.env.EVOLUTION_API_KEY = originalKey;
  });

  it('fails closed when Evolution credentials are absent', async () => {
    delete process.env.EVOLUTION_API_URL;
    delete process.env.EVOLUTION_API_KEY;
    await expect(connectEvolutionInstance('zapti')).rejects.toMatchObject({
      status: 503,
      message: 'Evolution API não configurada',
    } satisfies Partial<EvolutionApiError>);
  });

  it('extracts QR and message ids from Evolution responses', () => {
    expect(extractEvolutionQr({ base64: 'data:image/png;base64,qr' })).toBe('data:image/png;base64,qr');
    expect(extractEvolutionQr({ qrcode: { base64: 'nested-qr' } })).toBe('nested-qr');
    expect(extractEvolutionMessageId({ key: { id: 'ABC123' } })).toBe('ABC123');
    expect(extractEvolutionMessageId({ id: 'DEF456' })).toBe('DEF456');
  });
});
