// ZapTI Web — Complete Onboarding API Route
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { language, timezone, theme, notificationPreferences, whatsappConfig } = body;

    // Forward to backend API - include Authorization header if present
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const authHeader = request.headers.get('authorization');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const cookie = request.headers.get('cookie');
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const response = await fetch(`${apiUrl}/auth/complete-onboarding`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ language, timezone, theme, notificationPreferences, whatsappConfig }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || { message: 'Erro ao completar onboarding' } },
        { status: response.status }
      );
    }

    // Forward cookies from backend
    const nextResponse = NextResponse.json(data);
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      nextResponse.headers.set('set-cookie', setCookieHeader);
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