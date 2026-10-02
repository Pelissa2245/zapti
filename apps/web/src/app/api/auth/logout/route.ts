// ZapTI Web — Logout API Route
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://api:3000/api/v1';

export async function POST() {
  const cookieStore = await cookies();

  // Revoke the session server-side BEFORE clearing cookies, otherwise the
  // database session stays ACTIVE and a copied cookie would still work.
  const accessToken = cookieStore.get('accessToken')?.value;
  if (accessToken) {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => {});
  }

  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');

  return NextResponse.json({ success: true });
}
