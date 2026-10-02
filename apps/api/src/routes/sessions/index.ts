// ZapTI API — Session Routes
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@zapti/database';

const listSessionsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
});

export async function sessionRoutes(app: FastifyInstance) {
  // GET /sessions - List user's sessions
  app.get('/', {
    schema: { querystring: listSessionsQuerySchema },
    preHandler: [app.requireAuth],
  }, async (request) => {
    const { page, limit, status } = request.query as z.infer<typeof listSessionsQuerySchema>;
    const userId = request.user!.id;

    const where: any = { userId };
    if (status) where.status = status;

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        select: {
          id: true,
          tenantId: true,
          userAgent: true,
          ip: true,
          deviceName: true,
          status: true,
          expiresAt: true,
          lastActiveAt: true,
          createdAt: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { lastActiveAt: 'desc' },
      }),
      prisma.session.count({ where }),
    ]);

    return { data: sessions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  });

  // GET /sessions/current - Get current session
  app.get('/current', {
    preHandler: [app.requireAuth],
  }, async (request) => {
    const userId = request.user!.id;
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      return { session: null };
    }

    const { hashToken } = await import('@zapti/shared/auth');
    const refreshTokenHash = hashToken(refreshToken);

    const session = await prisma.session.findFirst({
      where: { userId, refreshToken: refreshTokenHash },
      select: { id: true, tenantId: true, deviceName: true, ip: true, createdAt: true, lastActiveAt: true, expiresAt: true },
    });

    return { session };
  });

  // DELETE /sessions/:id - Revoke specific session
  app.delete('/:id', {
    preHandler: [app.requireAuth],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    const session = await prisma.session.findFirst({ where: { id, userId } });
    if (!session) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Sessão não encontrada' } });
    }

    if (session.status !== 'ACTIVE') {
      return reply.status(400).send({ error: { code: 'ALREADY_REVOKED', message: 'Sessão já foi revogada' } });
    }

    await prisma.session.update({ where: { id }, data: { status: 'REVOKED', revokedAt: new Date() } });

    await logAudit(request, 'SESSION_REVOKED', { sessionId: id });

    return { success: true, message: 'Sessão revogada' };
  });

  // DELETE /sessions - Revoke all other sessions
  app.delete('/', {
    preHandler: [app.requireAuth],
  }, async (request, reply) => {
    const userId = request.user!.id;
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      return reply.status(400).send({ error: { code: 'NO_SESSION', message: 'Nenhuma sessão atual' } });
    }

    const { hashToken } = await import('@zapti/shared/auth');
    const currentTokenHash = hashToken(refreshToken);

    await prisma.session.updateMany({
      where: { userId, status: 'ACTIVE', NOT: { refreshToken: currentTokenHash } },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });

    await logAudit(request, 'SESSIONS_REVOKED_ALL', { userId, keptCurrent: true });

    return { success: true, message: 'Todas as outras sessões foram revogadas' };
  });

  // Admin: GET /admin/sessions - List all sessions in tenant (supervisor+)
  app.get('/admin/all', {
    schema: { querystring: listSessionsQuerySchema },
    preHandler: [app.requirePermission('sessions:read')],
  }, async (request) => {
    const { page, limit, status } = request.query as z.infer<typeof listSessionsQuerySchema>;
    const tenantId = request.tenant!.id;

    const where: any = { tenantId };
    if (status) where.status = status;

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        include: { user: { select: { id: true, email: true, name: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { lastActiveAt: 'desc' },
      }),
      prisma.session.count({ where }),
    ]);

    return { data: sessions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  });

  // Admin: DELETE /admin/sessions/:id - Revoke any session (supervisor+)
  app.delete('/admin/:id', {
    preHandler: [app.requirePermission('sessions:revoke')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const session = await prisma.session.findFirst({ where: { id, tenantId } });
    if (!session) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Sessão não encontrada' } });
    }

    if (session.status !== 'ACTIVE') {
      return reply.status(400).send({ error: { code: 'ALREADY_REVOKED', message: 'Sessão já foi revogada' } });
    }

    await prisma.session.update({ where: { id }, data: { status: 'REVOKED', revokedAt: new Date() } });

    await logAudit(request, 'SESSION_REVOKED_BY_ADMIN', { sessionId: id, targetUserId: session.userId });

    return { success: true, message: 'Sessão revogada' };
  });
}

async function logAudit(request: any, action: string, metadata: Record<string, any>) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant?.id,
        userId: request.user?.id,
        action,
        description: `${action} - ${metadata.sessionId || metadata.userId || 'unknown'}`,
        metadata: JSON.stringify({ ...metadata, ip: String(request.ip || ''), userAgent: String(request.headers['user-agent'] || '') }),
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}