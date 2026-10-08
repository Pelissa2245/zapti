// ZapTI Web — Complete Onboarding API Route
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { language, timezone, theme, notificationPreferences, whatsappConfig } = body;

    // Forward to backend API
    const apiUrl = getBackendApiUrl();

    // Forward all cookies from the incoming request to the backend
    const cookie = request.headers.get('cookie');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (cookie) {
      headers['Cookie'] = cookie;
    }

    // Build request body - only include whatsappConfig if it has values
    const requestBody: Record<string, any> = { language, timezone, theme, notificationPreferences };
    if (whatsappConfig && whatsappConfig.evolutionApiUrl && whatsappConfig.evolutionApiKey && whatsappConfig.instanceName) {
      requestBody.whatsappConfig = whatsappConfig;
    }

    const response = await fetch(`${apiUrl}/auth/complete-onboarding`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || { message: 'Erro ao completar onboarding' } },
        { status: response.status }
      );
    }

    // Forward cookies from backend (use getSetCookie to get all cookies, not just the first)
    const nextResponse = NextResponse.json(data);
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    for (const cookie of setCookieHeaders) {
      nextResponse.headers.append('Set-Cookie', cookie);
    }

    return nextResponse;
  } catch (error) {
    console.error('Complete onboarding error:', error);
    return NextResponse.json(
      { error: { message: 'Erro interno do servidor' } },
      { status: 500 }
    );
  }
}