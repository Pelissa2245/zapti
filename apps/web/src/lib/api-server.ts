// ZapTI Web — Server-side API helper (route handlers only, Node runtime).
// Proxies requests to the Fastify API using the httpOnly session cookie of the
// incoming request, so the browser never needs tokens in localStorage.
import { cookies } from 'next/headers';

function getApiBaseUrl(): string {
  // Inside Docker the API is reachable as http://api:3000; locally as
  // localhost:3000. Server-side code must never use NEXT_PUBLIC_* vars.
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
}

export async function getAuthenticatedApiFetch(): Promise<
  ((path: string, init?: RequestInit) => Promise<Response>) | null
> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  if (!accessToken) {
    return null;
  }

  const baseUrl = getApiBaseUrl();

  return (path: string, init?: RequestInit) =>
    fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${accessToken}`,
        'X-Tenant-Id': cookieStore.get('tenantId')?.value || '',
      },
    });
}
