// ZapTI Web — Dashboard Stats API Route (proxies the Fastify backend with the
// authenticated user's session; never returns data without a valid session)
import { getAuthenticatedApiFetch } from '@/lib/api-server';
import { NextResponse } from 'next/server';

export async function GET() {
  const apiFetch = await getAuthenticatedApiFetch();
  if (!apiFetch) {
    return NextResponse.json(
      { error: { code: 'UNAUTHENTICATED', message: 'Não autenticado' } },
      { status: 401 }
    );
  }

  const [ticketsRes, whatsappRes, usersRes] = await Promise.all([
    apiFetch('/tickets/stats'),
    apiFetch('/whatsapp/instances/stats'),
    apiFetch('/users/stats'),
  ]);

  const read = async (res: Response) => {
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return json?.stats ?? json ?? null;
  };

  const [tickets, whatsapp, users] = await Promise.all([
    read(ticketsRes),
    read(whatsappRes),
    read(usersRes),
  ]);

  return NextResponse.json({
    tickets: tickets || {},
    whatsapp: whatsapp || {},
    users: users || {},
    // Any backend endpoint failing is surfaced as a flag, not hidden data
    partialFailure: !tickets || !whatsapp || !users,
  });
}
