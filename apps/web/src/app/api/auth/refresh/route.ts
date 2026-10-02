// ZapTI Web — Refresh Token API Route
import { refreshTokenAction } from '@/actions/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await refreshTokenAction();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar token' }, { status: 401 });
  }
}
