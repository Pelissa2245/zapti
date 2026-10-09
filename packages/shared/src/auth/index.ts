import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from './config';

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  iat?: number;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const cfg = config();
  return jwt.sign(payload, cfg.jwt.secret, { expiresIn: cfg.jwt.accessExpiry });
}

export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const cfg = config();
  return jwt.sign({ ...payload, type: 'refresh' }, cfg.jwt.secret, { expiresIn: cfg.jwt.refreshExpiry });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const cfg = config();
    return jwt.verify(token, cfg.jwt.secret) as JWTPayload;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}