import { FastifyInstance, FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { config } from '@zapti/shared/config';
import { ERROR_CODES } from '@zapti/shared/constants';
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, verifyToken, extractTokenFromHeader, JWTPayload } from '@zapti/shared/auth';
import crypto from 'crypto';

// Properly typed authenticated request
interface AuthenticatedRequest extends FastifyRequest {
  user: JWTPayload;
  tenant: {
    id: string;
    name: string;
    isActive: boolean;
    slug: string;
    domain: string | null;
    logo: string | null;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string | null;
    timezone: string;
    locale: string;
  };
}

// Helper to get authenticated request with proper typing
function getAuthRequest(request: FastifyRequest): AuthenticatedRequest {
  return request as AuthenticatedRequest;
}

// Helper type for authenticated route handlers
type AuthenticatedHandler<RouteGeneric extends RouteGenericInterface = RouteGenericInterface> = (
  request: FastifyRequest<RouteGeneric> & { user: JWTPayload; tenant: AuthenticatedRequest['tenant'] },
  reply: FastifyReply
) => Promise<void>;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function verifyTokenHash(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}


export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // Login
  fastify.post('/login', {
    schema: {
      body: z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
    },
  }, async (request: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) => {
    const { email, password } = request.body;

    const user = await prisma.user.findFirst({
      where: { email, isActive: true },
      include: { tenant: true },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_CREDENTIALS, message: 'Invalid email or password' },
      });
    }

    if (!user.tenant.isActive) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Tenant is inactive' },
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    });

    // Store refresh token
    const refreshTokenHash = await hashToken(refreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set cookie
    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth/refresh',
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
      },
    });

    return reply.send({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          tenant: {
            id: user.tenant.id,
            name: user.tenant.name,
            logo: user.tenant.logo,
            primaryColor: user.tenant.primaryColor,
          },
        },
      },
    });
  });

  // Refresh token
  fastify.post('/refresh', {
    schema: {
      body: z.object({}).optional(),
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Refresh token required' },
      });
    }

    const refreshTokenHash = await hashToken(refreshToken);

    const storedToken = await prisma.refreshToken.findFirst({
      where: { tokenHash: refreshTokenHash, expiresAt: { gt: new Date() } },
      include: { user: { include: { tenant: true } } },
    });

    if (!storedToken || !storedToken.user.isActive || !storedToken.user.tenant.isActive) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.TOKEN_INVALID, message: 'Invalid or expired refresh token' },
      });
    }

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens({
      sub: storedToken.user.id,
      email: storedToken.user.email,
      name: storedToken.user.name,
      role: storedToken.user.role,
      tenantId: storedToken.user.tenantId,
    });

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const newRefreshTokenHash = await hashToken(newRefreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        tokenHash: newRefreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set new cookie
    reply.setCookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth/refresh',
    });

    return reply.send({
      success: true,
      data: {
        accessToken: newAccessToken,
        user: {
          id: storedToken.user.id,
          email: storedToken.user.email,
          name: storedToken.user.name,
          avatar: storedToken.user.avatar,
          role: storedToken.user.role,
          tenant: {
            id: storedToken.user.tenant.id,
            name: storedToken.user.tenant.name,
            logo: storedToken.user.tenant.logo,
            primaryColor: storedToken.user.tenant.primaryColor,
          },
        },
      },
    });
  });

  // Logout
  fastify.post<{ Querystring: Record<string, never> }>('/logout', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Querystring: Record<string, never> }> & { user: JWTPayload; tenant: { id: string } }, reply: FastifyReply) => {
    const refreshToken = request.cookies.refreshToken;

    if (refreshToken) {
      const refreshTokenHash = await hashToken(refreshToken);
      await prisma.refreshToken.deleteMany({ where: { tokenHash: refreshTokenHash } });
    }

    // Clear cookie
    reply.clearCookie('refreshToken', { path: '/auth/refresh' });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'LOGOUT',
        entityType: 'User',
        entityId: request.user.sub,
      },
    });

    return reply.send({ success: true, message: 'Logged out successfully' });
  });

  // Get current user
  fastify.get<{ Querystring: Record<string, never> }>('/me', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Querystring: Record<string, never> }> & { user: JWTPayload }, reply: FastifyReply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.sub },
      include: {
        tenant: {
          select: { id: true, name: true, logo: true, primaryColor: true, secondaryColor: true, timezone: true, locale: true },
        },
      },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' },
      });
    }

    return reply.send({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        tenant: user.tenant,
      },
    });
  });

  // Update current user profile
  fastify.patch<{ Body: { name?: string; avatar?: string; currentPassword?: string; newPassword?: string } }>('/me', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.object({
        name: z.string().min(1).max(100).optional(),
        avatar: z.string().url().optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().min(8).optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Body: { name?: string; avatar?: string; currentPassword?: string; newPassword?: string } }> & { user: JWTPayload }, reply: FastifyReply) => {
    const { name, avatar, currentPassword, newPassword } = request.body;

    const user = await prisma.user.findUnique({ where: { id: request.user.sub } });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' },
      });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;

    if (newPassword) {
      if (!currentPassword) {
        return reply.status(400).send({
          success: false,
          error: { code: ERROR_CODES.INVALID_INPUT, message: 'Current password required' },
        });
      }

      if (!await verifyPassword(currentPassword, user.passwordHash)) {
        return reply.status(401).send({
          success: false,
          error: { code: ERROR_CODES.INVALID_CREDENTIALS, message: 'Current password is incorrect' },
        });
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: { id: true, email: true, name: true, avatar: true, role: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: authRequest.tenant.id,
        userId: authRequest.user.sub,
        action: 'USER_PROFILE_UPDATE',
        entityType: 'User',
        entityId: user.id,
        newData: { name, avatar, passwordChanged: !!newPassword },
      },
    });

    return reply.send({ success: true, data: updatedUser });
  });

  // Forgot password
  fastify.post('/forgot-password', {
    schema: {
      body: z.object({ email: z.string().email() }),
    },
  }, async (request: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) => {
    const { email } = request.body;

    const user = await prisma.user.findFirst({
      where: { email, isActive: true },
      include: { tenant: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return reply.send({ success: true, message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const token = generateInvitationToken();
    const tokenHash = await hashToken(token);

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // In production, send reset email
    const resetUrl = `${config().CORS_ORIGIN}/reset-password?token=${token}&email=${email}`;
    console.log(`Password reset for ${email}: ${resetUrl}`);

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'PASSWORD_RESET_REQUEST',
        entityType: 'User',
        entityId: user.id,
      },
    });

    return reply.send({ success: true, message: 'If the email exists, a reset link has been sent' });
  });

  // Reset password
  fastify.post('/reset-password', {
    schema: {
      body: z.object({
        token: z.string(),
        email: z.string().email(),
        password: z.string().min(8),
      }),
    },
  }, async (request: FastifyRequest<{ Body: { token: string; email: string; password: string } }>, reply: FastifyReply) => {
    const { token, email, password } = request.body;

    const user = await prisma.user.findFirst({ where: { email, isActive: true } });

    if (!user) {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.TOKEN_INVALID, message: 'Invalid or expired reset token' },
      });
    }

    const resetRecord = await prisma.passwordReset.findFirst({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
    });

    if (!resetRecord || !await verifyTokenHash(token, resetRecord.tokenHash)) {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.TOKEN_INVALID, message: 'Invalid or expired reset token' },
      });
    }

    // Update password
    const hashedPassword = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    // Delete used reset token
    await prisma.passwordReset.delete({ where: { id: resetRecord.id } });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'PASSWORD_RESET',
        entityType: 'User',
        entityId: user.id,
      },
    });

    return reply.send({ success: true, message: 'Password reset successfully' });
  });

  // Register (for initial setup or public registration if enabled)
  fastify.post('/register', {
    schema: {
      body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1).max(100),
        tenantName: z.string().min(1).max(200).optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Body: { email: string; password: string; name: string; tenantName?: string } }>, reply: FastifyReply) => {
    const { email, password, name, tenantName } = request.body;

    // Check if registration is allowed
    const cfg = config();
    if (cfg.NODE_ENV !== 'development') {
      // Only allow registration in development mode by default
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Registration is not allowed' },
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      return reply.status(409).send({
        success: false,
        error: { code: ERROR_CODES.CONFLICT, message: 'User with this email already exists' },
      });
    }

    // Create tenant and user
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName || `${name}'s Workspace`,
        slug: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-'),
      },
    });

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        name,
        passwordHash: hashedPassword,
        role: 'ADMIN',
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    });

    // Store refresh token
    const refreshTokenHash = await hashToken(refreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set cookie
    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth/refresh',
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        action: 'USER_REGISTER',
        entityType: 'User',
        entityId: user.id,
      },
    });

    return reply.status(201).send({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          tenant: {
            id: tenant.id,
            name: tenant.name,
            logo: tenant.logo,
            primaryColor: tenant.primaryColor,
          },
        },
      },
    });
  });
}