import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES, AUTOMATION_TRIGGER, AUTOMATION_ACTION } from '@zapti/shared/constants';
import { PaginationQuerySchema, IdParamSchema, SearchQuerySchema } from '@zapti/shared/validation';
import { broadcastToWebsocket } from '@zapti/shared/notification';

declare module 'fastify' {
  interface FastifyRequest {
    tenant: any;
    user: any;
  }
}

export async function automationRoutes(fastify: FastifyInstance): Promise<void> {
  // List automations
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: PaginationQuerySchema.merge(SearchQuerySchema).extend({
        trigger: z.nativeEnum(AUTOMATION_TRIGGER).optional(),
        isActive: z.boolean().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    const { page, limit, sortBy, sortOrder, q, trigger, isActive } = request.query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: request.tenant.id };
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
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const automation = await prisma.automation.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
      include: {
        executions: {
          take: 20,
          orderBy: { createdAt: 'desc' },
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
        trigger: z.nativeEnum(AUTOMATION_TRIGGER),
        conditions: z.record(z.unknown()).optional(),
        actions: z.array(z.object({
          type: z.nativeEnum(AUTOMATION_ACTION),
          config: z.record(z.unknown()),
        })).min(1),
        isActive: z.boolean().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const { name, description, trigger, conditions, actions, isActive } = request.body;

    const automation = await prisma.automation.create({
      data: {
        tenantId: request.tenant.id,
        name,
        description,
        trigger,
        conditions: conditions || {},
        actions,
        isActive: isActive !== false,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'AUTOMATION_CREATE',
        entityType: 'Automation',
        entityId: automation.id,
        newData: { name, trigger, actionsCount: actions.length },
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
        trigger: z.nativeEnum(AUTOMATION_TRIGGER).optional(),
        conditions: z.record(z.unknown()).optional(),
        actions: z.array(z.object({
          type: z.nativeEnum(AUTOMATION_ACTION),
          config: z.record(z.unknown()),
        })).optional(),
        isActive: z.boolean().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const automation = await prisma.automation.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!automation) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Automation not found' },
      });
    }

    const updatedAutomation = await prisma.automation.update({
      where: { id: automation.id },
      data: request.body,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'AUTOMATION_UPDATE',
        entityType: 'Automation',
        entityId: automation.id,
        newData: request.body,
      },
    });

    return reply.send({ success: true, data: updatedAutomation });
  });

  // Delete automation
  fastify.delete('/:id', {
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

    const automation = await prisma.automation.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!automation) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Automation not found' },
      });
    }

    await prisma.automation.delete({ where: { id: automation.id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'AUTOMATION_DELETE',
        entityType: 'Automation',
        entityId: automation.id,
      },
    });

    return reply.send({ success: true, message: 'Automation deleted' });
  });

  // Toggle automation active status
  fastify.post('/:id/toggle', {
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

    const automation = await prisma.automation.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!automation) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Automation not found' },
      });
    }

    const updatedAutomation = await prisma.automation.update({
      where: { id: automation.id },
      data: { isActive: !automation.isActive },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: updatedAutomation.isActive ? 'AUTOMATION_ENABLE' : 'AUTOMATION_DISABLE',
        entityType: 'Automation',
        entityId: automation.id,
      },
    });

    return reply.send({ success: true, data: updatedAutomation });
  });

  // Test automation
  fastify.post('/:id/test', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        testData: z.record(z.unknown()).optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: { testData?: any } }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const automation = await prisma.automation.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!automation) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Automation not found' },
      });
    }

    // Execute with test data
    const { executeAutomation } = await import('../services/automation');
    const testData = { ...request.body.testData, automationId: automation.id };

    try {
      await executeAutomation(automation.id, request.tenant.id, testData);
      return reply.send({ success: true, message: 'Automation test executed' });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: { code: ERROR_CODES.INTERNAL_ERROR, message: `Test failed: ${error.message}` },
      });
    }
  });

  // Get automation executions
  fastify.get('/:id/executions', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      querystring: PaginationQuerySchema.extend({
        status: z.enum(['RUNNING', 'SUCCESS', 'FAILED']).optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Querystring: any }>, reply: FastifyReply) => {
    const { page, limit, status } = request.query;
    const skip = (page - 1) * limit;

    const automation = await prisma.automation.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!automation) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Automation not found' },
      });
    }

    const where: any = { automationId: automation.id };
    if (status) where.status = status;

    const [executions, total] = await Promise.all([
      prisma.automationExecution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.automationExecution.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: executions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  // Get automation triggers list
  fastify.get('/triggers/list', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const triggers = Object.values(AUTOMATION_TRIGGER).map(trigger => ({
      value: trigger,
      label: trigger.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: getTriggerDescription(trigger),
    }));

    return reply.send({ success: true, data: triggers });
  });

  // Get automation actions list
  fastify.get('/actions/list', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const actions = Object.values(AUTOMATION_ACTION).map(action => ({
      value: action,
      label: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: getActionDescription(action),
      configSchema: getActionConfigSchema(action),
    }));

    return reply.send({ success: true, data: actions });
  });

  // Get automation stats
  fastify.get('/stats/overview', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const baseWhere = { tenantId: request.tenant.id };

    const [total, active, inactive, byTrigger, totalExecutions, successfulExecutions, failedExecutions] = await Promise.all([
      prisma.automation.count({ where: baseWhere }),
      prisma.automation.count({ where: { ...baseWhere, isActive: true } }),
      prisma.automation.count({ where: { ...baseWhere, isActive: false } }),
      prisma.automation.groupBy({ by: ['trigger'], where: baseWhere, _count: true }),
      prisma.automationExecution.count({ where: { automation: { tenantId: request.tenant.id } } }),
      prisma.automationExecution.count({ where: { automation: { tenantId: request.tenant.id }, status: 'SUCCESS' } }),
      prisma.automationExecution.count({ where: { automation: { tenantId: request.tenant.id }, status: 'FAILED' } }),
    ]);

    return reply.send({
      success: true,
      data: {
        total,
        active,
        inactive,
        byTrigger: byTrigger.reduce((acc, item) => ({ ...acc, [item.trigger]: item._count }), {}),
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions * 100).toFixed(2) : 0,
      },
    });
  });
}

function getTriggerDescription(trigger: string): string {
  const descriptions: Record<string, string> = {
    MESSAGE_RECEIVED: 'Triggered when a new message is received',
    MESSAGE_SENT: 'Triggered when a message is sent',
    CONVERSATION_CREATED: 'Triggered when a new conversation starts',
    CONVERSATION_CLOSED: 'Triggered when a conversation is closed',
    TICKET_CREATED: 'Triggered when a new ticket is created',
    TICKET_UPDATED: 'Triggered when a ticket is updated',
    TICKET_RESOLVED: 'Triggered when a ticket is resolved',
    CONTACT_CREATED: 'Triggered when a new contact is added',
    CONTACT_UPDATED: 'Triggered when a contact is updated',
    CAMPAIGN_SENT: 'Triggered when a campaign is sent',
    SCHEDULE: 'Triggered on a schedule',
    WEBHOOK: 'Triggered by an external webhook',
  };
  return descriptions[trigger] || '';
}

function getActionDescription(action: string): string {
  const descriptions: Record<string, string> = {
    SEND_MESSAGE: 'Send a WhatsApp message',
    CREATE_TICKET: 'Create a support ticket',
    ASSIGN_CONVERSATION: 'Assign conversation to an agent',
    ADD_TAG: 'Add a tag to conversation or contact',
    UPDATE_CONTACT: 'Update contact information',
    WEBHOOK: 'Call an external webhook',
    DELAY: 'Wait for a specified time',
    CONDITION: 'Branch based on conditions',
  };
  return descriptions[action] || '';
}

function getActionConfigSchema(action: string): any {
  const schemas: Record<string, any> = {
    SEND_MESSAGE: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', format: 'cuid' },
        contactId: { type: 'string', format: 'cuid' },
        templateId: { type: 'string', format: 'cuid' },
        content: { type: 'string' },
        variables: { type: 'object' },
      },
    },
    CREATE_TICKET: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
        contactId: { type: 'string', format: 'cuid' },
        assignedToId: { type: 'string', format: 'cuid' },
      },
    },
    ASSIGN_CONVERSATION: {
      type: 'object',
      properties: {
        conversationId: { type: 'string', format: 'cuid' },
        agentId: { type: 'string', format: 'cuid' },
      },
    },
    ADD_TAG: {
      type: 'object',
      properties: {
        entityType: { type: 'string', enum: ['conversation', 'contact'] },
        entityId: { type: 'string', format: 'cuid' },
        tag: { type: 'string' },
      },
    },
    UPDATE_CONTACT: {
      type: 'object',
      properties: {
        contactId: { type: 'string', format: 'cuid' },
        updates: { type: 'object' },
      },
    },
    WEBHOOK: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH'] },
        headers: { type: 'object' },
        body: { type: 'object' },
      },
    },
    DELAY: {
      type: 'object',
      properties: {
        milliseconds: { type: 'number', minimum: 100 },
      },
    },
    CONDITION: {
      type: 'object',
      properties: {
        conditions: { type: 'object' },
        actionsIfTrue: { type: 'array' },
        actionsIfFalse: { type: 'array' },
      },
    },
  };
  return schemas[action] || { type: 'object', properties: {} };
}