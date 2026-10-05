// ZapTI API — Authentication Middleware
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@zapti/database';
import type { User, Tenant, UserTenant, UserRole, Permission } from '@zapti/shared';

// Type conversions from Prisma to our types
function mapTenant(prismaTenant: any): Tenant {
  return {
    ...prismaTenant,
    settings: typeof prismaTenant.settings === 'string' ? JSON.parse(prismaTenant.settings) : prismaTenant.settings,
    plan: prismaTenant.plan || undefined,
  };
}

function mapUser(prismaUser: any): User {
  return {
    ...prismaUser,
    twoFactorRecoveryCodes: typeof prismaUser.twoFactorRecoveryCodes === 'string'
      ? prismaUser.twoFactorRecoveryCodes.split(',')
      : prismaUser.twoFactorRecoveryCodes || [],
    backupCodes: [],
    language: prismaUser.language,
    timezone: prismaUser.timezone,
    onboardingCompleted: prismaUser.onboardingCompleted,
    avatarUrl: prismaUser.avatarUrl || undefined,
    lastLoginAt: prismaUser.lastLoginAt || undefined,
  };
}

function mapUserTenant(prismaUserTenant: any): UserTenant {
  // permissions is stored in the DB as a TEXT column holding a JSON array
  // (e.g. '["*"]'). Older code called .split(',') on it, which turned '["*"]'
  // into '["*"]'.split(',') = ['["*"]'] — the wildcard was never matched and
  // every OWNER got 403 on permission-checked routes.
  const rawPermissions = prismaUserTenant.permissions;
  let permissions: string[] = [];
  if (Array.isArray(rawPermissions)) {
    permissions = rawPermissions;
  } else if (typeof rawPermissions === 'string' && rawPermissions.length > 0) {
    try {
      const parsed = JSON.parse(rawPermissions);
      permissions = Array.isArray(parsed) ? parsed : rawPermissions.split(',');
    } catch {
      permissions = rawPermissions.split(',');
    }
  }

  return {
    ...prismaUserTenant,
    role: prismaUserTenant.role as UserRole,
    permissions: permissions as Permission[],
    teams: prismaUserTenant.teams?.map((ut: any) => ({
      ...ut,
      team: ut.team ? {
        ...ut.team,
        description: ut.team.description || undefined,
      } : undefined,
    })) || [],
  };
}

export async function setupAuth(app: FastifyInstance) {
  // Global authentication hook
  app.addHook('preHandler', async (request, reply) => {
    // Skip auth for public routes
    const publicPaths = [
      '/health',
      '/ready',
      '/metrics',
      '/documentation',
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/refresh',
      '/api/v1/auth/forgot-password',
      '/api/v1/auth/reset-password',
      '/api/v1/auth/2fa/setup',
      '/api/v1/auth/bootstrap-status',
      '/api/v1/auth/bootstrap',
      '/api/v1/whatsapp/webhook',
    ];

    // Also check without /api/v1 prefix (for direct access)
    const publicPathsNoPrefix = [
      '/health',
      '/ready',
      '/metrics',
      '/documentation',
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/2fa/setup',
      '/auth/bootstrap-status',
      '/auth/bootstrap',
      '/whatsapp/webhook',
    ];

    // Check against both full URL (including query string) and just pathname
    const requestUrl = request.url;
    const isPublic = publicPaths.some((p) => requestUrl.startsWith(p)) || publicPathsNoPrefix.some((p) => requestUrl.startsWith(p));

    if (isPublic) {
      return;
    }

    try {
      // Verify JWT - fastify-jwt automatically extracts token from cookie or Authorization header
      const decoded = await request.jwtVerify<{ sessionId: string; userId: string; tenantId: string }>();

      // Check session
      const session = await prisma.session.findUnique({
        where: { id: decoded.sessionId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
              isSuperadmin: true,
              avatarUrl: true,
              twoFactorEnabled: true,
              lastLoginAt: true,
              passwordHash: true,
              twoFactorRecoveryCodes: true,
              onboardingCompleted: true,
              createdAt: true,
              updatedAt: true,
            }
          },
          tenant: {
            select: {
              id: true,
              name: true,
              settings: true,
              status: true,
              plan: true,
              ownerId: true,
              createdAt: true,
              updatedAt: true,
            }
          }
        },
      });

      if (!session || session.status !== 'ACTIVE' || session.expiresAt < new Date()) {
        return reply.status(401).send({ error: { code: 'SESSION_EXPIRED', message: 'Sessão expirada ou inválida' } });
      }

      if (!session.user.isActive) {
        return reply.status(401).send({ error: { code: 'USER_INACTIVE', message: 'Usuário inativo' } });
      }

      if (session.tenant.status !== 'ACTIVE') {
        return reply.status(403).send({ error: { code: 'TENANT_INACTIVE', message: 'Tenant inativo ou suspenso' } });
      }

      // Get user-tenant relationship
      const userTenant = await prisma.userTenant.findUnique({
        where: { userId_tenantId: { userId: session.user.id, tenantId: session.tenant.id } },
        include: { teams: { include: { team: true } } },
      });

      if (!userTenant) {
        return reply.status(403).send({ error: { code: 'NO_TENANT_ACCESS', message: 'Sem acesso a este tenant' } });
      }

      // Attach to request
      request.user = mapUser(session.user);
      request.tenant = mapTenant(session.tenant);
      request.sessionId = session.id;
      request.session = session;
      request.userTenant = mapUserTenant(userTenant);

      // Update last activity
      await prisma.session.update({ where: { id: session.id }, data: { lastActiveAt: new Date() } }).catch(() => {});
    } catch (err: any) {
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return reply.status(401).send({ error: { code: 'TOKEN_INVALID', message: 'Token inválido ou expirado' } });
      }
      throw err;
    }
  });

  // Auth required decorator
  app.decorate('requireAuth', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user || !request.userTenant) {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } });
    }
  });

  // Permission check decorator
  app.decorate('requirePermission', (permission: string) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user || !request.userTenant) {
        return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } });
      }

      // Superadmin has all permissions
      if (request.user.isSuperadmin) {
        return;
      }

      const permissions = request.userTenant.permissions as string[];

      // Check for wildcard permission
      if (permissions.includes('*')) {
        return;
      }

      // Check specific permission
      if (!permissions.includes(permission)) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: `Permissão necessária: ${permission}` } });
      }
    };
  });

  // Webhook verification decorator
  app.decorate('verifyWebhook', (secret: string) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const signature = request.headers['x-webhook-signature'] as string;
      if (!signature) {
        return reply.status(401).send({ error: { code: 'MISSING_SIGNATURE', message: 'Assinatura do webhook não fornecida' } });
      }

      // Verify signature (HMAC SHA256)
      const crypto = await import('crypto');
      const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(request.body)).digest('hex');

      if (signature !== expected) {
        return reply.status(401).send({ error: { code: 'INVALID_SIGNATURE', message: 'Assinatura do webhook inválida' } });
      }
    };
  });

  // Real-time event emitters (to be implemented with Socket.io)
  app.decorate('emitToConversation', (conversationId: string, event: string, data: any) => {
    // Will be implemented in websocket service
    app.io?.to(`conversation:${conversationId}`).emit(event, data);
  });

  app.decorate('emitToTenant', (tenantId: string, event: string, data: any) => {
    app.io?.to(`tenant:${tenantId}`).emit(event, data);
  });

  // Role-based access decorators
  app.decorate('requireRole', (...roles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.userTenant) {
        return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } });
      }

      if (request.user.isSuperadmin) return;

      if (!roles.includes(request.userTenant.role)) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: `Função necessária: ${roles.join(' ou ')}` } });
      }
    };
  });

  // Owner or Admin only
  app.decorate('requireAdminOrOwner', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.userTenant) {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } });
    }

    if (request.user.isSuperadmin) return;

    if (!['OWNER', 'ADMIN'].includes(request.userTenant.role)) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Acesso restrito a administradores' } });
    }
  });

  // Superadmin only
  app.decorate('requireSuperadmin', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user || !request.user.isSuperadmin) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Acesso restrito a superadmin' } });
    }
  });
}