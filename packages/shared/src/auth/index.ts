// ZapTI Shared — Auth Utilities
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Get secrets at runtime (not build time) to support Docker environment variables
function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
}

function getJwtRefreshSecret(): string {
  return process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  sessionId: string;
  userId: string;
  tenantId: string;
}

export interface BackupCode {
  code: string;
  used: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateTokenPair(sessionId: string, userId: string, tenantId: string, rememberMe: boolean): TokenPair {
  const accessToken = jwt.sign(
    { sessionId, userId, tenantId },
    getJwtSecret(),
    { expiresIn: rememberMe ? '30d' : '15m' }
  );
  const refreshToken = jwt.sign(
    { sessionId, userId, tenantId, type: 'refresh' },
    getJwtRefreshSecret(),
    { expiresIn: rememberMe ? '30d' : '7d' }
  );
  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, getJwtRefreshSecret()) as JWTPayload;
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, getJwtSecret()) as JWTPayload;
}

export function createSession(userId: string, tenantId: string, ip: string, userAgent: string, rememberMe: boolean) {
  const sessionId = generateSessionId();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));
  return {
    id: sessionId,
    userId,
    tenantId,
    ip,
    userAgent,
    expiresAt,
    status: 'ACTIVE' as const,
    refreshTokenHash: '',
  };
}

export function verifyTOTP(secret: string, code: string): boolean {
  // Simple TOTP verification - in production use a proper library like otplib
  const timeStep = Math.floor(Date.now() / 1000 / 30);
  const expectedCode = generateTOTP(secret, timeStep);
  return constantTimeCompare(expectedCode, code);
}

function base32Decode(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of base32.toUpperCase()) {
    if (char === '=') break;
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((value >> bits) & 0xff);
    }
  }
  return Buffer.from(output);
}

export function generateTOTP(secret: string, timeStep: number): string {
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeUInt32BE(Math.floor(timeStep / 0x100000000), 0);
  timeBuffer.writeUInt32BE(timeStep & 0xffffffff, 4);
  const hash = crypto.createHmac('sha1', base32Decode(secret)).update(timeBuffer).digest();
  const offset = hash[hash.length - 1] & 0xf;
  const truncatedHash = ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  const otp = truncatedHash % 1000000;
  return otp.toString().padStart(6, '0');
}

export function verifyHash(value: string, hash: string): boolean {
  return hashToken(value) === hash;
}

export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateId(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyToken(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}

export function generateResetToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = hashToken(token);
  return { token, hash };
}

export function generateEncryptionKey(): Buffer {
  return crypto.randomBytes(32);
}

export function encrypt(text: string, key: Buffer): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(encryptedText: string, key: Buffer): string {
  const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function generateApiKey(): string {
  const prefix = 'zpt_';
  const key = crypto.randomBytes(32).toString('base64url');
  return prefix + key;
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

export function generateOtpCode(length: number = 6): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[crypto.randomInt(0, digits.length)];
  }
  return code;
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateTOTPSecret(): string {
  // base32 encoding - using base32 encoding via base64 then converting
  // For simplicity, we'll use a base64 approach without padding
  return crypto.randomBytes(20).toString('base64').replace(/[+/=]/g, '').substring(0, 32);
}

export async function generateQRCode(label: string, secret: string): Promise<string> {
  const otpauth = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=ZapTI`;
  // In production, use a proper QR code library like 'qrcode'
  return otpauth;
}

export function generateBackupCodes(count: number = 10): BackupCode[] {
  const codes: BackupCode[] = [];
  for (let i = 0; i < count; i++) {
    codes.push({ code: crypto.randomBytes(4).toString('hex').toUpperCase(), used: false });
  }
  return codes;
}

export function generateBackupCode(): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return code;
}