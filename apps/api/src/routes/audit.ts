import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES, USER_ROLES } from '@zapti/shared/constants';
import { PaginationQuerySchema, IdParamSchema } from '@zapti/shared/validation';

declare module 'fastify' {
  interface FastifyRequest {
    tenant: any;
    user: any;
  }
}

export async function auditRoutes(fastify: FastifyInstance): Promise<void> {
  // List audit logs
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: PaginationQuerySchema.extend({
        userId: z.string().cuid().optional(),
        action: z.string().optional(),
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const { page, limit, sortBy, sortOrder, userId, action, entityType, entityId, startDate, endDate } = request.query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: request.tenant.id };
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
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: logs,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  // Get audit log by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const log = await prisma.auditLog.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!log) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Audit log not found' },
      });
    }

    return reply.send({ success: true, data: log });
  });

  // Get audit stats
  fastify.get('/stats/overview', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const [totalLogs, byAction, byEntity, recentActivity] = await Promise.all([
      prisma.auditLog.count({ where: { tenantId: request.tenant.id } }),
      prisma.auditLog.groupBy({ by: ['action'], where: { tenantId: request.tenant.id }, _count: true, orderBy: { _count: { action: 'desc' } }, take: 10 }),
      prisma.auditLog.groupBy({ by: ['entityType'], where: { tenantId: request.tenant.id }, _count: true, orderBy: { _count: { entityType: 'desc' } } }),
      prisma.auditLog.findMany({
        where: { tenantId: request.tenant.id },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        totalLogs,
        byAction: byAction.reduce((acc, item) => ({ ...acc, [item.action]: item._count }), {}),
        byEntity: byEntity.reduce((acc, item) => ({ ...acc, [item.entityType]: item._count }), {}),
        recentActivity,
      },
    });
  });
}