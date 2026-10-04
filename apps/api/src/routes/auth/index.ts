// ZapTI API — Auth Routes
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@zapti/database';
import { generateTokenPair, verifyRefreshToken, hashToken, createSession } from '@zapti/shared/auth';
import { sendEmail } from '@zapti/shared/email';
import { config } from '../../config.js';
import type { User, Tenant } from '@zapti/shared/types';
import { toJsonSchema } from '../../utils/zod-to-json-schema.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().default(false),
  tenantSlug: z.string().optional(),
  twoFactorToken: z.string().optional(),
});

const loginSchemaJson = toJsonSchema(loginSchema);


const refreshSchema = z.object({
  refreshToken: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const forgotPasswordSchemaJson = toJsonSchema(forgotPasswordSchema);

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(128),
});

const resetPasswordSchemaJson = toJsonSchema(resetPasswordSchema);

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(128),
});

const changePasswordSchemaJson = toJsonSchema(changePasswordSchema);

const setup2FASchema = z.object({
  secret: z.string(),
  code: z.string().length(6),
});

const setup2FASchemaJson = toJsonSchema(setup2FASchema);

const verify2FASchema = z.object({
  code: z.string().length(6),
});

const verify2FASchemaJson = toJsonSchema(verify2FASchema);

// Bootstrap schemas (first admin creation)
const bootstrapStatusSchema = z.object({
  needsBootstrap: z.boolean(),
});

const bootstrapStatusSchemaJson = toJsonSchema(bootstrapStatusSchema);

const bootstrapResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    avatarUrl: z.string().nullable(),
    isSuperadmin: z.boolean(),
    onboardingCompleted: z.boolean(),
  }),
  tenant: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    plan: z.string(),
  }),
  session: z.object({
    id: z.string(),
    expiresAt: z.date(),
  }),
  accessToken: z.string(),
  refreshToken: z.string(),
  requiresTwoFactor: z.boolean(),
});

const bootstrapResponseSchemaJson = toJsonSchema(bootstrapResponseSchema);

const bootstrapSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').max(128),
  confirmPassword: z.string(),
  tenantName: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres').max(100),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

const bootstrapSchemaJson = toJsonSchema(bootstrapSchema);

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/login
  app.post('/login', {
    schema: { body: loginSchemaJson },
    config: { rateLimit: { max: 10, timeWindow: 60 * 1000 } },
  }, async (request, reply) => {
    const { email, password, rememberMe, tenantSlug, twoFactorToken } = request.body as z.infer<typeof loginSchema>;
    const ip = request.ip;
    const userAgent = request.headers['user-agent'] || '';

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { tenants: { include: { tenant: true } } },
    });

    if (!user || !user.isActive) {
      await logAuthAttempt(request, 'LOGIN_FAILED', { email, reason: 'user_not_found' });
      return reply.status(401).send({ error: { code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas' } });
    }

    // Check password
    const { verifyPassword } = await import('@zapti/shared/auth');
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await logAuthAttempt(request, 'LOGIN_FAILED', { email, reason: 'invalid_password' });
      return reply.status(401).send({ error: { code: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas' } });
    }

    // Determine tenant
    let tenant;
    if (tenantSlug) {
      const userTenant = user.tenants.find((ut: any) => ut.tenant.slug === tenantSlug);
      if (!userTenant) {
        return reply.status(403).send({ error: { code: 'NO_TENANT_ACCESS', message: 'Sem acesso a este tenant' } });
      }
      tenant = userTenant.tenant;
    } else if (user.tenants.length === 1) {
      tenant = user.tenants[0].tenant;
    } else {
      return reply.status(400).send({ error: { code: 'TENANT_REQUIRED', message: 'Múltiplos tenants, informe o tenantSlug' } });
    }

    if (tenant.status !== 'ACTIVE') {
      return reply.status(403).send({ error: { code: 'TENANT_INACTIVE', message: 'Tenant inativo ou suspenso' } });
    }

    // Check 2FA
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        return reply.status(200).send({ requiresTwoFactor: true, message: 'Código 2FA necessário' });
      }

      const { verifyTOTP } = await import('@zapti/shared/auth');
      if (!verifyTOTP(user.twoFactorSecret!, twoFactorToken)) {
        await logAuthAttempt(request, 'LOGIN_FAILED', { email, reason: 'invalid_2fa' });
        return reply.status(401).send({ error: { code: 'INVALID_2FA', message: 'Código 2FA inválido' } });
      }
    }

    // Create session
    const sessionData = createSession(user.id, tenant.id, ip, userAgent, rememberMe);
    const refreshTokenHash = hashToken(crypto.randomUUID());
    const session = await prisma.session.create({
      data: {
        id: sessionData.id,
        userId: sessionData.userId,
        tenantId: sessionData.tenantId,
        ip: sessionData.ip,
        userAgent: sessionData.userAgent,
        expiresAt: sessionData.expiresAt,
        status: sessionData.status,
        refreshToken: refreshTokenHash,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(session.id, user.id, tenant.id, rememberMe);

    // Set cookies
    const cookieOptions = {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax' as const,
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 15 * 60,
      path: '/',
    };

    reply.setCookie('accessToken', accessToken, cookieOptions);
    reply.setCookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60 });

    // Update user last login
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    await logAuthAttempt(request, 'LOGIN_SUCCESS', { userId: user.id, tenantId: tenant.id });

    return {
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, isSuperadmin: user.isSuperadmin, onboardingCompleted: user.onboardingCompleted },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan },
      session: { id: session.id, expiresAt: session.expiresAt },
      accessToken,
      refreshToken,
      requiresTwoFactor: false,
    };
  });

  // GET /auth/bootstrap-status - Public endpoint to check if bootstrap is needed
  app.get('/bootstrap-status', {
    schema: { response: { 200: bootstrapStatusSchemaJson } },
    config: { rateLimit: { max: 10, timeWindow: 60 * 1000 } },
  }, async (request, reply) => {
    const userCount = await prisma.user.count();
    return { needsBootstrap: userCount === 0 };
  });

  // POST /auth/bootstrap - Create first admin (only works when no users exist)
  app.post('/bootstrap', {
    schema: { body: bootstrapSchemaJson, response: { 200: bootstrapResponseSchemaJson } },
    config: { rateLimit: { max: 3, timeWindow: 60 * 1000 } },
  }, async (request, reply) => {
    // Check if bootstrap is still allowed (no users exist)
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return reply.status(403).send({ error: { code: 'BOOTSTRAP_NOT_ALLOWED', message: 'Bootstrap não permitido: já existem usuários cadastrados' } });
    }

    const { name, email, password, tenantName } = request.body as z.infer<typeof bootstrapSchema>;
    const ip = request.ip;
    const userAgent = request.headers['user-agent'] || '';

    // Hash password
    const { hashPassword } = await import('@zapti/shared/auth');
    const passwordHash = await hashPassword(password);

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Double-check inside transaction
      const count = await tx.user.count();
      if (count > 0) {
        throw new Error('BOOTSTRAP_RACE_CONDITION');
      }

      // Create tenant
      const slug = tenantName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

      // Ensure unique slug
      let finalSlug = slug;
      let counter = 1;
      while (await tx.tenant.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }

      // Create user as superadmin first
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          passwordHash,
          isSuperadmin: true,
          onboardingCompleted: false,
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        },
      });

      // Create tenant with ownerId set to the new user
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: finalSlug,
          settings: JSON.stringify({}),
          ownerId: user.id,
        },
      });

      // Create user-tenant relationship with OWNER role
      await tx.userTenant.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: 'OWNER',
          permissions: JSON.stringify(['*']),
        },
      });

      return { user, tenant };
    });

    // Create session for the new admin
    const { generateTokenPair, createSession, hashToken } = await import('@zapti/shared/auth');
    const sessionData = createSession(result.user.id, result.tenant.id, ip, userAgent, true);
    const { accessToken, refreshToken } = generateTokenPair(sessionData.id, result.user.id, result.tenant.id, true);
    const refreshTokenHash = await hashToken(refreshToken);

    await prisma.session.create({
      data: {
        id: sessionData.id,
        userId: sessionData.userId,
        tenantId: sessionData.tenantId,
        refreshToken: refreshTokenHash,
        userAgent: sessionData.userAgent,
        ip: sessionData.ip,
        expiresAt: sessionData.expiresAt,
        status: 'ACTIVE',
      },
    });

    // Set cookies
    const cookieOptions = {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'lax' as const,
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    };

    reply.setCookie('accessToken', accessToken, cookieOptions);
    reply.setCookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 });

    await logAuthAttempt(request, 'BOOTSTRAP_COMPLETED', { userId: result.user.id, tenantId: result.tenant.id });

    return {
      user: { id: result.user.id, name: result.user.name, email: result.user.email, avatarUrl: result.user.avatarUrl, isSuperadmin: result.user.isSuperadmin, onboardingCompleted: result.user.onboardingCompleted },
      tenant: { id: result.tenant.id, name: result.tenant.name, slug: result.tenant.slug, plan: result.tenant.plan },
      session: { id: sessionData.id, expiresAt: sessionData.expiresAt },
      accessToken,
      refreshToken,
      requiresTwoFactor: false,
    };
  });

  // POST /auth/refresh
  const refreshSchemaJson = toJsonSchema(refreshSchema);

app.post('/refresh', { schema: { body: refreshSchemaJson } }, async (request, reply) => {
    // Accept refresh token from body or cookie
    const bodyToken = (request.body as { refreshToken?: string } | undefined)?.refreshToken;
    const refreshToken = bodyToken || request.cookies?.refreshToken;

    if (!refreshToken) {
      return reply.status(401).send({ error: { code: 'MISSING_REFRESH_TOKEN', message: 'Refresh token não fornecido' } });
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);
      const session = await prisma.session.findUnique({
        where: { id: decoded.sessionId },
        include: { user: true, tenant: true },
      });

      if (!session || session.status !== 'ACTIVE' || session.expiresAt < new Date()) {
        return reply.status(401).send({ error: { code: 'SESSION_EXPIRED', message: 'Sessão expirada' } });
      }

      // Rotate refresh token
      const newRefreshToken = await hashToken(crypto.randomUUID());
      await prisma.session.update({ where: { id: session.id }, data: { refreshToken: newRefreshToken } });

      const { accessToken, refreshToken: newRefresh } = await generateTokenPair(
        session.id, session.userId, session.tenantId,
        session.expiresAt > new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      );

      const cookieOptions = {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'lax' as const,
        path: '/',
      };

      reply.setCookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 });
      reply.setCookie('refreshToken', newRefresh, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 });

      // Return new tokens in body so server actions can propagate cookies to the browser
      return {
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          avatarUrl: session.user.avatarUrl,
          isSuperadmin: session.user.isSuperadmin,
          onboardingCompleted: session.user.onboardingCompleted,
        },
        tenant: {
          id: session.tenant.id,
          name: session.tenant.name,
          slug: session.tenant.slug,
          plan: session.tenant.plan,
        },
        session: { id: session.id, expiresAt: session.expiresAt },
        accessToken,
        refreshToken: newRefresh,
        requiresTwoFactor: false,
      };
    } catch {
      return reply.status(401).send({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token inválido' } });
    }
  });

  // POST /auth/logout
  app.post('/logout', async (request, reply) => {
    if (request.sessionId) {
      await prisma.session.update({ where: { id: request.sessionId }, data: { status: 'REVOKED' } }).catch(() => {});
    }

    reply.clearCookie('accessToken', { path: '/' });
    reply.clearCookie('refreshToken', { path: '/' });

    await logAuthAttempt(request, 'LOGOUT', { userId: request.user?.id });

    return { message: 'Desconectado com sucesso' };
  });

  // POST /auth/logout-all
  app.post('/logout-all', async (request, reply) => {
    await prisma.session.updateMany({
      where: { userId: request.user!.id, status: 'ACTIVE' },
      data: { status: 'REVOKED' },
    });

    reply.clearCookie('accessToken', { path: '/' });
    reply.clearCookie('refreshToken', { path: '/' });

    await logAuthAttempt(request, 'LOGOUT_ALL', { userId: request.user!.id });

    return { message: 'Todas as sessões encerradas' };
  });

  // GET /auth/me
  app.get('/me', async (request, reply) => {
    const user = request.user!;
    const userTenant = request.userTenant!;

    const [sessions, userTenants] = await Promise.all([
      prisma.session.findMany({
        where: { userId: user.id, status: 'ACTIVE' },
        select: { id: true, ip: true, userAgent: true, createdAt: true, lastActiveAt: true, expiresAt: true },
      }),
      prisma.userTenant.findMany({
        where: { userId: user.id, tenant: { status: 'ACTIVE' } },
        select: {
          role: true,
          tenant: { select: { id: true, name: true, slug: true, plan: true } },
        },
        orderBy: { joinedAt: 'asc' },
      }),
    ]);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isSuperadmin: user.isSuperadmin,
        twoFactorEnabled: user.twoFactorEnabled,
        onboardingCompleted: user.onboardingCompleted,
        lastLoginAt: user.lastLoginAt,
        tenants: userTenants.map((ut) => ({
          id: ut.tenant.id,
          name: ut.tenant.name,
          slug: ut.tenant.slug,
          plan: ut.tenant.plan,
          role: ut.role,
        })),
      },
      tenant: {
        id: request.tenant!.id,
        name: request.tenant!.name,
        slug: request.tenant!.slug,
        plan: request.tenant!.plan,
        settings: request.tenant!.settings,
      },
      role: userTenant.role,
      permissions: userTenant.permissions,
      teams: userTenant.teams?.map((ut) => ({ id: ut.team!.id, name: ut.team!.name, color: ut.team!.color })) ?? [],
      sessions,
    };
  });

  // GET /auth/onboarding-status
  app.get('/onboarding-status', async (request, reply) => {
    const user = request.user!;
    return { onboardingCompleted: user.onboardingCompleted };
  });

  const completeOnboardingSchema = z.object({
  language: z.string().optional(),
  timezone: z.string().optional(),
  notificationPreferences: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    whatsapp: z.boolean().optional(),
  }).optional(),
}).strict();

const completeOnboardingSchemaJson = toJsonSchema(completeOnboardingSchema);

  // POST /auth/complete-onboarding
  app.post('/complete-onboarding', {
    schema: { body: completeOnboardingSchemaJson },
  }, async (request, reply) => {
    const user = request.user!;
    const { language, timezone, notificationPreferences } = request.body as {
      language?: string;
      timezone?: string;
      notificationPreferences?: { email?: boolean; push?: boolean; whatsapp?: boolean };
    };

    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingCompleted: true,
        language: language || 'pt-BR',
        timezone: timezone || 'America/Sao_Paulo',
      },
    });

    await logAuthAttempt(request, 'ONBOARDING_COMPLETED', { userId: user.id });

    return { message: 'Onboarding concluído com sucesso' };
  });

  // POST /auth/forgot-password
  app.post('/forgot-password', {
    schema: { body: forgotPasswordSchemaJson },
    config: { rateLimit: { max: 3, timeWindow: 60 * 60 * 1000 } },
  }, async (request, reply) => {
    const { email } = request.body as z.infer<typeof forgotPasswordSchema>;

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'Se o e-mail existir, você receberá instruções' };
    }

    // Generate reset token
    const { generateSecureToken } = await import('@zapti/shared/auth');
    const resetToken = generateSecureToken(32);
    const resetTokenHash = await hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: resetTokenHash, expiresAt },
    });

    // Send email
    if (config.features.email) {
      const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
      await sendEmail({
        to: email,
        subject: 'Redefinição de senha - ZapTI',
        template: 'password-reset',
        data: { name: user.name, resetUrl, expiresIn: '1 hora' },
      }).catch(console.error);
    }

    await logAuthAttempt(request, 'PASSWORD_RESET_REQUESTED', { userId: user.id });

    return { message: 'Se o e-mail existir, você receberá instruções' };
  });

  // POST /auth/reset-password
  app.post('/reset-password', { schema: { body: resetPasswordSchemaJson } }, async (request, reply) => {
    const { token, password } = request.body as z.infer<typeof resetPasswordSchema>;

    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: { expiresAt: { gt: new Date() } },
    });

    if (!resetRecord) {
      return reply.status(400).send({ error: { code: 'INVALID_TOKEN', message: 'Token inválido ou expirado' } });
    }

    const { verifyToken: verifyHash } = await import('@zapti/shared/auth');
    const isValid = await verifyHash(token, resetRecord.tokenHash);
    if (!isValid) {
      return reply.status(400).send({ error: { code: 'INVALID_TOKEN', message: 'Token inválido ou expirado' } });
    }

    // Hash new password
    const { hashPassword } = await import('@zapti/shared/auth');
    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({ where: { id: resetRecord.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.delete({ where: { id: resetRecord.id } }),
      prisma.session.updateMany({ where: { userId: resetRecord.userId }, data: { status: 'REVOKED' } }),
    ]);

    await logAuthAttempt(request, 'PASSWORD_RESET_COMPLETED', { userId: resetRecord.userId });

    return { message: 'Senha redefinida com sucesso' };
  });

  // POST /auth/change-password
  app.post('/change-password', { schema: { body: changePasswordSchemaJson } }, async (request, reply) => {
    const { currentPassword, newPassword } = request.body as z.infer<typeof changePasswordSchema>;
    const userId = request.user!.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Usuário não encontrado' } });
    }

    const { verifyPassword, hashPassword } = await import('@zapti/shared/auth');
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return reply.status(400).send({ error: { code: 'INVALID_PASSWORD', message: 'Senha atual incorreta' } });
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      prisma.session.updateMany({ where: { userId, id: { not: request.sessionId } }, data: { status: 'REVOKED' } }),
    ]);

    await logAuthAttempt(request, 'PASSWORD_CHANGED', { userId });

    return { message: 'Senha alterada com sucesso' };
  });

  // 2FA Setup
  app.get('/2fa/setup', async (request, reply) => {
    const user = request.user!;

    const { generateTOTPSecret, generateQRCode } = await import('@zapti/shared/auth');
    const secret = generateTOTPSecret();
    const qrCode = await generateQRCode(`ZapTI:${user.email}`, secret);

    // Store secret temporarily (not enabled yet)
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } });

    return { secret, qrCode };
  });

  app.post('/2fa/enable', { schema: { body: setup2FASchemaJson } }, async (request, reply) => {
    const { secret, code } = request.body as z.infer<typeof setup2FASchema>;
    const user = request.user!;

    const { verifyTOTP } = await import('@zapti/shared/auth');
    if (!verifyTOTP(secret, code)) {
      return reply.status(400).send({ error: { code: 'INVALID_2FA_CODE', message: 'Código inválido' } });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true, twoFactorSecret: secret },
    });

    // Generate backup codes
    const { generateBackupCodes } = await import('@zapti/shared/auth');
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map((bc: any) => hashToken(bc.code)).join(',');
    await prisma.user.update({ where: { id: user.id }, data: { twoFactorRecoveryCodes: hashedBackupCodes } });

    await logAuthAttempt(request, '2FA_ENABLED', { userId: user.id });

    return { message: '2FA ativado com sucesso', backupCodes };
  });

  app.post('/2fa/disable', { schema: { body: verify2FASchemaJson } }, async (request, reply) => {
    const { code } = request.body as z.infer<typeof verify2FASchema>;
    const user = request.user!;

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return reply.status(400).send({ error: { code: '2FA_NOT_ENABLED', message: '2FA não está ativado' } });
    }

    const { verifyTOTP } = await import('@zapti/shared/auth');
    if (!verifyTOTP(user.twoFactorSecret, code)) {
      // Check backup codes
      const { verifyHash } = await import('@zapti/shared/auth');
      const recoveryCodes = user.twoFactorRecoveryCodes;
      let backupCodes: string[] = [];
      if (Array.isArray(recoveryCodes)) {
        backupCodes = recoveryCodes;
      } else if (typeof recoveryCodes === 'string' && recoveryCodes.length > 0) {
        backupCodes = recoveryCodes.split(',');
      }
      const isBackup = backupCodes.some((bc: string) => verifyHash(code, bc));
      if (!isBackup) {
        return reply.status(400).send({ error: { code: 'INVALID_2FA_CODE', message: 'Código inválido' } });
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorRecoveryCodes: '' },
    });

    await logAuthAttempt(request, '2FA_DISABLED', { userId: user.id });

    return { message: '2FA desativado com sucesso' };
  });

  app.post('/2fa/verify', { schema: { body: verify2FASchemaJson } }, async (request, reply) => {
    const { code } = request.body as z.infer<typeof verify2FASchema>;
    const user = request.user!;

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return reply.status(400).send({ error: { code: '2FA_NOT_ENABLED', message: '2FA não está ativado' } });
    }

    const { verifyTOTP, verifyHash } = await import('@zapti/shared/auth');
    if (!verifyTOTP(user.twoFactorSecret, code)) {
      const backupCodesRaw = user.twoFactorRecoveryCodes;
      // Ensure we're working with a string array (stored as comma-separated in DB)
      let backupCodes: string[] = [];
      if (backupCodesRaw) {
        if (typeof backupCodesRaw === 'string') {
          backupCodes = backupCodesRaw.split(',').filter(Boolean);
        } else if (Array.isArray(backupCodesRaw)) {
          backupCodes = [...backupCodesRaw];
        }
      }
      const isBackup = backupCodes.some((bc) => verifyHash(code, bc));
      if (isBackup) {
        // Remove used backup code
        const updatedCodes = backupCodes.filter((bc: string) => !verifyHash(code, bc));
        await prisma.user.update({ where: { id: user.id }, data: { twoFactorRecoveryCodes: updatedCodes.join(',') } });
        return { message: 'Código de backup válido' };
      }
      return reply.status(400).send({ error: { code: 'INVALID_2FA_CODE', message: 'Código inválido' } });
    }

    return { message: 'Código 2FA válido' };
  });
}

async function logAuthAttempt(request: any, action: string, metadata: Record<string, any>) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant?.id,
        userId: request.user?.id,
        action,
        description: `${action} - ${metadata.userId || metadata.email || 'unknown'}`,
        metadata: JSON.stringify({ ...metadata, ip: request.ip || 'unknown', userAgent: request.headers['user-agent'] || 'unknown' }),
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}