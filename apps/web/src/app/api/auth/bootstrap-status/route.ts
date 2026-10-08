// ZapTI Web — Bootstrap Status API Route
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Get the backend API URL for server-side fetches
// In Docker: http://api:3000/api/v1
// In local dev: http://localhost:3000/api/v1
function getBackendApiUrl(): string {
  // Use explicit API_URL or BACKEND_URL for server-side calls
  if (process.env.API_URL) {
    return process.env.API_URL;
  }
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL;
  }
  // Default to Docker internal hostname
  return 'http://api:3000/api/v1';
}

export async function GET(request: NextRequest) {
  try {
    const apiUrl = getBackendApiUrl();
    const response = await fetch(`${apiUrl}/auth/bootstrap-status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      credentials: 'include',
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || { message: 'Erro ao verificar status de bootstrap' } },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Bootstrap status error:', error);
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor' } },
      { status: 500 }
    );
  }
}