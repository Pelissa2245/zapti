import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES } from '@zapti/shared/constants';
import { PaginationQuerySchema, IdParamSchema, SearchQuerySchema } from '@zapti/shared/validation';

const AuditQuerySchema = PaginationQuerySchema.merge(SearchQuerySchema).extend({
  userId: z.string().cuid().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type AuditQuery = z.infer<typeof AuditQuerySchema>;

export async function auditRoutes(fastify: FastifyInstance): Promise<void> {
  // List audit logs
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: AuditQuerySchema,
    },
  }, async (request: FastifyRequest<{ Querystring: AuditQuery }>, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      });
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const { page, limit, sortBy, sortOrder, userId, action, entityType, entityId, startDate, endDate } = request.query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: request.tenant!.id };
    if (userId) where.userId = userId;
    if (action) where.action = action;
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
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // Get single audit log
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      });
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const log = await prisma.auditLog.findFirst({
      where: { id: request.params.id, tenantId: request.tenant!.id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!log) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Audit log not found' },
      });
    }

    return reply.send({
      success: true,
      data: log,
    });
  });

  // Get audit statistics
  fastify.get('/stats', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: z.object({
        tenantId: z.string().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Querystring: { tenantId?: string } }>, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      });
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const tenantId = request.tenant!.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalLogs, recentLogs, logsByAction, logsByEntityType] = await Promise.all([
      prisma.auditLog.count({ where: { tenantId } }),
      prisma.auditLog.count({ where: { tenantId, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.auditLog.groupBy({ by: ['action'], where: { tenantId, createdAt: { gte: thirtyDaysAgo } }, _count: true }),
      prisma.auditLog.groupBy({ by: ['entityType'], where: { tenantId, createdAt: { gte: thirtyDaysAgo } }, _count: true }),
    ]);

    return reply.send({
      success: true,
      data: {
        totalLogs,
        recentLogs,
        logsByAction: logsByAction.map((item) => ({ action: item.action, count: item._count })),
        logsByEntityType: logsByEntityType.map((item) => ({ entityType: item.entityType, count: item._count })),
      },
    });
  });
}