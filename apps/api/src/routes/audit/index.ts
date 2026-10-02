// ZapTI API — Audit Log Routes
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@zapti/database';
import { toJsonSchema } from '../../utils/zod-to-json-schema.js';

const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  action: z.string().optional(),
  userId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const listAuditLogsQuerySchemaJson = toJsonSchema(listAuditLogsQuerySchema);

const exportAuditLogsQuerySchema = z.object({
  action: z.string().optional(),
  userId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  format: z.enum(['json', 'csv']).default('json'),
});

const exportAuditLogsQuerySchemaJson = toJsonSchema(exportAuditLogsQuerySchema);

export async function auditRoutes(app: FastifyInstance) {
  // GET /audit - List audit logs
  app.get('/', {
    preHandler: [app.requirePermission('audit:read')],
    schema: { querystring: listAuditLogsQuerySchemaJson },
  }, async (request) => {
    const { page, limit, action, userId, entityType, entityId, startDate, endDate, sortBy, sortOrder } = request.query as z.infer<typeof listAuditLogsQuerySchema>;
    const tenantId = request.tenant!.id;

    const where: any = { tenantId };
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data: logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  });

  // GET /audit/stats - Audit statistics
  app.get('/stats', { preHandler: [app.requirePermission('audit:read')] }, async (request) => {
    const tenantId = request.tenant!.id;

    const [total, byAction, topUsers, last24h, last7d] = await Promise.all([
      prisma.auditLog.count({ where: { tenantId } }),
      prisma.auditLog.groupBy({ by: ['action'], where: { tenantId }, _count: true, orderBy: { _count: { action: 'desc' } }, take: 10 }),
      prisma.auditLog.groupBy({ by: ['userId'], where: { tenantId, userId: { not: null } }, _count: true, orderBy: { _count: { userId: 'desc' } }, take: 10 }),
      prisma.auditLog.count({ where: { tenantId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      prisma.auditLog.count({ where: { tenantId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    ]);

    // Get user details for top users
    const topUserIds = topUsers.map((u: any) => u.userId).filter(Boolean);
    const topUserDetails = topUserIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: topUserIds } }, select: { id: true, name: true, email: true } })
      : [];

    const topUsersWithDetails = topUsers.map((u: any) => ({
      ...u,
      user: topUserDetails.find((du: any) => du.id === u.userId) || null,
    }));

    return {
      stats: {
        total,
        byAction,
        topUsers: topUsersWithDetails,
        last24h,
        last7d,
      },
    };
  });

  // GET /audit/export - Export audit logs
  app.get('/export', {
    preHandler: [app.requirePermission('audit:export')],
    schema: { querystring: exportAuditLogsQuerySchemaJson },
  }, async (request, reply) => {
    const { action, userId, entityType, entityId, startDate, endDate, format } = request.query as z.infer<typeof exportAuditLogsQuerySchema>;
    const tenantId = request.tenant!.id;

    const where: any = { tenantId };
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      const header = 'Data,Hora,Usuário,Ação,Tipo Entidade,ID Entidade,Descrição,IP,User Agent\n';
      const rows = logs.map((log) => {
        const user = log.user ? `${log.user.name} (${log.user.email})` : 'Sistema';
        return `${new Date(log.createdAt).toLocaleDateString('pt-BR')},${new Date(log.createdAt).toLocaleTimeString('pt-BR')},${user},${log.action},${log.entityType || ''},${log.entityId || ''},${log.description.replace(/"/g, '""')},${log.ip || ''},${log.userAgent || ''}`;
      }).join('\n');
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      return header + rows;
    }

    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`);
    return logs;
  });

  // GET /audit/:id - Get audit log details
  app.get('/:id', { preHandler: [app.requirePermission('audit:read')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const log = await prisma.auditLog.findFirst({
      where: { id, tenantId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!log) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Log de auditoria não encontrado' } });
    }

    return { log };
  });
}