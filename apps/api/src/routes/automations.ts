import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES, AUTOMATION_TRIGGERS } from '@zapti/shared/constants';
import { PaginationQuerySchema, IdParamSchema, SearchQuerySchema } from '@zapti/shared/validation';
import { broadcastToWebsocket } from '@zapti/shared/notification';

const AutomationTriggerEnum = z.enum(Object.values(AUTOMATION_TRIGGERS) as [string, ...string[]]);

export async function automationRoutes(fastify: FastifyInstance): Promise<void> {
  // List automations
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: PaginationQuerySchema.merge(SearchQuerySchema).extend({
        trigger: AutomationTriggerEnum.optional(),
        isActive: z.boolean().optional(),
      }),
    },
  }, async (request, reply) => {
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

    const { page, limit, sortBy, sortOrder, q, trigger, isActive } = request.query as any;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: request.tenant!.id };
    if (trigger) where.trigger = trigger;
    if (isActive !== undefined) where.isActive = isActive;

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [automations, total] = await Promise.all([
      prisma.automation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        include: {
          _count: { select: { executions: true } },
        },
      }),
      prisma.automation.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: automations,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  // Get automation by ID
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

    const automation = await prisma.automation.findFirst({
      where: { id: request.params.id, tenantId: request.tenant!.id },
      include: {
        executions: {
          take: 20,
          orderBy: { startedAt: 'desc' },
        },
        _count: { select: { executions: true } },
      },
    });

    if (!automation) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Automation not found' },
      });
    }

    return reply.send({ success: true, data: automation });
  });

  // Create automation
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        trigger: AutomationTriggerEnum,
        conditions: z.record(z.unknown()).optional(),
        actions: z.array(z.object({
          type: z.string(),
          config: z.record(z.unknown()),
        })).min(1),
        isActive: z.boolean().optional(),
      }),
    },
  }, async (request, reply) => {
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

    const { name, description, trigger, conditions, actions, isActive } = request.body as any;

    const automation = await prisma.automation.create({
      data: {
        tenantId: request.tenant!.id,
        name,
        description,
        trigger,
        conditions,
        actions,
        isActive: isActive !== false,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant!.id,
        userId: request.user.sub,
        action: 'AUTOMATION_CREATE',
        entityType: 'Automation',
        entityId: automation.id,
        newData: { name, trigger, actions },
      },
    });

    return reply.status(201).send({ success: true, data: automation });
  });

  // Update automation
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        trigger: AutomationTriggerEnum.optional(),
        conditions: z.record(z.unknown()).optional(),
        actions: z.array(z.object({
          type: z.string(),
          config: z.record(z.unknown()),
        })).optional(),
        isActive: z.boolean().optional(),
      }),
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

    const existing = await prisma.automation.findFirst({
      where: { id: request.params.id, tenantId: request.tenant!.id },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Automation not found' },
      });
    }

    const { name, description, trigger, conditions, actions, isActive } = request.body as any;

    const automation = await prisma.automation.update({
      where: { id: request.params.id },
      data: {
        name,
        description,
        trigger,
        conditions,
        actions,
        isActive,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant!.id,
        userId: request.user.sub,
        action: 'AUTOMATION_UPDATE',
        entityType: 'Automation',
        entityId: automation.id,
        newData: { name, trigger, actions },
      },
    });

    return reply.send({ success: true, data: automation });
  });

  // Delete automation
  fastify.delete('/:id', {
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

    const existing = await prisma.automation.findFirst({
      where: { id: request.params.id, tenantId: request.tenant!.id },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Automation not found' },
      });
    }

    await prisma.automation.delete({ where: { id: request.params.id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant!.id,
        userId: request.user.sub,
        action: 'AUTOMATION_DELETE',
        entityType: 'Automation',
        entityId: request.params.id,
      },
    });

    return reply.send({ success: true, message: 'Automation deleted' });
  });

  // Trigger automation manually
  fastify.post('/:id/trigger', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        context: z.record(z.unknown()).optional(),
      }),
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

    const automation = await prisma.automation.findFirst({
      where: { id: request.params.id, tenantId: request.tenant!.id, isActive: true },
    });

    if (!automation) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Automation not found or inactive' },
      });
    }

    // This would trigger the automation - for now just log it
    const execution = await prisma.automationExecution.create({
      data: {
        automationId: automation.id,
        trigger: automation.trigger,
        status: 'PENDING',
        triggerData: request.body as any,
      },
    });

    // TODO: Actually execute the automation
    // await executeAutomation(automation, request.body.context);

    // Broadcast update
    broadcastToWebsocket(undefined, 'automation:triggered', {
      automationId: automation.id,
      executionId: execution.id,
    }, `tenant:${request.tenant!.id}`);

    return reply.send({ success: true, data: execution });
  });

  // Get automation executions
  fastify.get('/:id/executions', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      querystring: PaginationQuerySchema,
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

    const { page, limit, sortBy, sortOrder } = request.query as any;
    const skip = (page - 1) * limit;

    const [executions, total] = await Promise.all([
      prisma.automationExecution.findMany({
        where: { automationId: request.params.id },
        skip,
        take: limit,
        orderBy: { [sortBy || 'startedAt']: sortOrder || 'desc' },
      }),
      prisma.automationExecution.count({ where: { automationId: request.params.id } }),
    ]);

    return reply.send({
      success: true,
      data: executions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });
}