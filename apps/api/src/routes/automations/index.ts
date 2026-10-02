// ZapTI API — Automation Routes (Schedule-based Automations)
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@zapti/database';
import { sendEmail } from '@zapti/shared/email';
import { toJsonSchema } from '../../utils/zod-to-json-schema.js';

const createAutomationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  schedule: z.object({
    type: z.enum(['CRON', 'INTERVAL', 'ONCE']),
    cronExpression: z.string().optional(),
    intervalMs: z.number().optional(),
    runAt: z.string().datetime().optional(),
  }),
  action: z.object({
    type: z.enum([
      'SEND_MESSAGE', 'ASSIGN_CONVERSATION', 'CLOSE_CONVERSATION', 'SNOOZE_CONVERSATION',
      'CREATE_TICKET', 'UPDATE_TICKET', 'ASSIGN_TICKET', 'ADD_TAG', 'REMOVE_TAG',
      'UPDATE_CONTACT', 'SEND_EMAIL', 'WEBHOOK', 'RUN_FLOW', 'SET_PRIORITY'
    ]),
    config: z.record(z.any()),
  }),
  target: z.object({
    type: z.enum(['CONVERSATION', 'CONTACT', 'TICKET']),
    filters: z.record(z.any()).optional(),
  }).optional(),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'exists', 'not_exists']),
    value: z.any(),
  })).default([]),
  settings: z.object({
    maxRetries: z.number().default(3),
    retryDelayMs: z.number().default(5000),
    timeoutMs: z.number().default(30000),
  }).default({}),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
});

const createAutomationSchemaJson = toJsonSchema(createAutomationSchema);

const updateAutomationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  schedule: z.object({
    type: z.enum(['CRON', 'INTERVAL', 'ONCE']),
    cronExpression: z.string().optional(),
    intervalMs: z.number().optional(),
    runAt: z.string().datetime().optional(),
  }).optional(),
  action: z.object({
    type: z.enum([
      'SEND_MESSAGE', 'ASSIGN_CONVERSATION', 'CLOSE_CONVERSATION', 'SNOOZE_CONVERSATION',
      'CREATE_TICKET', 'UPDATE_TICKET', 'ASSIGN_TICKET', 'ADD_TAG', 'REMOVE_TAG',
      'UPDATE_CONTACT', 'SEND_EMAIL', 'WEBHOOK', 'RUN_FLOW', 'SET_PRIORITY'
    ]),
    config: z.record(z.any()),
  }).optional(),
  target: z.object({
    type: z.enum(['CONVERSATION', 'CONTACT', 'TICKET']),
    filters: z.record(z.any()).optional(),
  }).optional(),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'exists', 'not_exists']),
    value: z.any(),
  })).optional(),
  settings: z.object({
    maxRetries: z.number().default(3),
    retryDelayMs: z.number().default(5000),
    timeoutMs: z.number().default(30000),
  }).optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

const updateAutomationSchemaJson = toJsonSchema(updateAutomationSchema);

const listAutomationsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  isActive: z.coerce.boolean().optional(),
  q: z.string().optional(),
});

const listAutomationsQuerySchemaJson = toJsonSchema(listAutomationsQuerySchema);

const testAutomationSchema = z.object({
  testData: z.record(z.any()),
});

const testAutomationSchemaJson = toJsonSchema(testAutomationSchema);

const executeAutomationSchema = z.object({
  triggerData: z.record(z.any()).optional(),
});

const executeAutomationSchemaJson = toJsonSchema(executeAutomationSchema);

export async function automationRoutes(app: FastifyInstance) {
  // GET /automations - List automations
  app.get('/', {
    preHandler: [app.requirePermission('automations:read')],
    schema: { querystring: listAutomationsQuerySchemaJson },
  }, async (request) => {
    const { page, limit, isActive, q } = request.query as z.infer<typeof listAutomationsQuerySchema>;
    const tenantId = request.tenant!.id;

    const where: any = { tenantId };
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
        include: {
          _count: { select: { executions: true } },
          creator: { select: { id: true, name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.automation.count({ where }),
    ]);

    return { data: automations, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  });

  // GET /automations/stats - Automation statistics
  app.get('/stats', { preHandler: [app.requirePermission('automations:read')] }, async (request) => {
    const tenantId = request.tenant!.id;

    const [total, active, totalExecutions, successfulExecutions, failedExecutions, byStatus, last24h] = await Promise.all([
      prisma.automation.count({ where: { tenantId } }),
      prisma.automation.count({ where: { tenantId, isActive: true } }),
      prisma.automationExecution.count({ where: { automation: { tenantId } } }),
      prisma.automationExecution.count({ where: { automation: { tenantId }, status: 'COMPLETED' } }),
      prisma.automationExecution.count({ where: { automation: { tenantId }, status: 'FAILED' } }),
      prisma.automationExecution.groupBy({ by: ['status'], where: { automation: { tenantId } }, _count: true }),
      prisma.automationExecution.count({
        where: { automation: { tenantId }, startedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      stats: {
        total,
        active,
        inactive: total - active,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate: totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0,
        byStatus: byStatus.map((e) => ({ status: e.status, count: e._count })),
        last24h,
      },
    };
  });

  // GET /automations/:id - Get automation details
  app.get('/:id', { preHandler: [app.requirePermission('automations:read')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const automation = await prisma.automation.findFirst({
      where: { id, tenantId },
      include: {
        creator: { select: { id: true, name: true } },
        executions: { orderBy: { startedAt: 'desc' }, take: 20 },
      },
    });

    if (!automation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Automação não encontrada' } });
    }

    return { automation };
  });

  // POST /automations - Create automation
  app.post('/', {
    preHandler: [app.requirePermission('automations:create')],
    schema: { body: createAutomationSchemaJson },
  }, async (request, reply) => {
    const { name, description, schedule, action, target, conditions, settings, isActive, tags } = request.body as z.infer<typeof createAutomationSchema>;
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    // Validate action
    const validation = validateAutomationAction(action);
    if (!validation.valid) {
      return reply.status(400).send({ error: { code: 'INVALID_ACTION', message: validation.error } });
    }

    // Calculate next run time for cron/interval
    const nextRunAt = calculateNextRun(schedule);

    const automation = await prisma.automation.create({
      data: {
        tenantId,
        name,
        description,
        schedule: JSON.stringify(schedule),
        action: JSON.stringify(action),
        target: target ? JSON.stringify(target) : null,
        conditions: JSON.stringify(conditions),
        settings: JSON.stringify(settings),
        isActive,
        tags: tags.join(','),
        createdBy: userId,
        nextRunAt,
      },
    });

    await logAudit(request, 'AUTOMATION_CREATED', { automationId: automation.id, name });

    // Schedule if active
    if (isActive) {
      scheduleAutomation(automation, app);
    }

    return reply.status(201).send({ automation });
  });

  // PATCH /automations/:id - Update automation
  app.patch('/:id', {
    preHandler: [app.requirePermission('automations:update')],
    schema: { body: updateAutomationSchemaJson },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const automation = await prisma.automation.findFirst({ where: { id, tenantId } });
    if (!automation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Automação não encontrada' } });
    }

    const body = request.body as z.infer<typeof updateAutomationSchema>;

    // Validate action if provided
    if (body.action) {
      const validation = validateAutomationAction(body.action);
      if (!validation.valid) {
        return reply.status(400).send({ error: { code: 'INVALID_ACTION', message: validation.error } });
      }
    }

    // Calculate next run time if schedule changed
    const nextRunAt = body.schedule ? calculateNextRun(body.schedule) : undefined;

    const updateData: any = { nextRunAt };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.schedule !== undefined) updateData.schedule = JSON.stringify(body.schedule);
    if (body.action !== undefined) updateData.action = JSON.stringify(body.action);
    if (body.target !== undefined) updateData.target = body.target ? JSON.stringify(body.target) : null;
    if (body.conditions !== undefined) updateData.conditions = JSON.stringify(body.conditions);
    if (body.settings !== undefined) updateData.settings = JSON.stringify(body.settings);
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.tags !== undefined) updateData.tags = body.tags.join(',');

    const updated = await prisma.automation.update({
      where: { id },
      data: updateData,
    });

    await logAudit(request, 'AUTOMATION_UPDATED', { automationId: id, changes: Object.keys(request.body as object) });

    // Reschedule if active
    if (updated.isActive) {
      scheduleAutomation(updated, app);
    }

    return { automation: updated };
  });

  // POST /automations/:id/toggle - Toggle automation active status
  app.post('/:id/toggle', { preHandler: [app.requirePermission('automations:update')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const automation = await prisma.automation.findFirst({ where: { id, tenantId } });
    if (!automation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Automação não encontrada' } });
    }

    const updated = await prisma.automation.update({
      where: { id },
      data: { isActive: !automation.isActive },
    });

    await logAudit(request, updated.isActive ? 'AUTOMATION_ACTIVATED' : 'AUTOMATION_DEACTIVATED', { automationId: id });

    // Schedule or unschedule
    if (updated.isActive) {
      scheduleAutomation(updated, app);
    } else {
      unscheduleAutomation(id);
    }

    return { automation: updated };
  });

  // POST /automations/:id/test - Test automation with sample data
  app.post('/:id/test', {
    preHandler: [app.requirePermission('automations:execute')],
    schema: { body: testAutomationSchemaJson },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { testData } = request.body as { testData: Record<string, any> };
    const tenantId = request.tenant!.id;

    const automation = await prisma.automation.findFirst({ where: { id, tenantId } });
    if (!automation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Automação não encontrada' } });
    }

    // Check conditions
    const conditions = automation.conditions ? JSON.parse(automation.conditions) : [];
    const conditionsMet = evaluateConditions(conditions, testData);

    if (!conditionsMet) {
      return {
        wouldExecute: false,
        reason: 'Condições não atendidas',
        testData,
      };
    }

    // Simulate action
    const action = automation.action ? JSON.parse(automation.action) : { type: '', config: {} };
    const result = await executeAction(action.type, action.config, testData, tenantId, app, true);

    return {
      wouldExecute: true,
      action: automation.action,
      result,
      testData,
    };
  });

  // POST /automations/:id/execute - Execute automation manually
  app.post('/:id/execute', {
    preHandler: [app.requirePermission('automations:execute')],
    schema: { body: executeAutomationSchemaJson },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { triggerData = {} } = request.body as { triggerData?: Record<string, any> };
    const tenantId = request.tenant!.id;

    const automation = await prisma.automation.findFirst({ where: { id, tenantId } });
    if (!automation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Automação não encontrada' } });
    }

    // Create execution record
    const execution = await prisma.automationExecution.create({
      data: {
        automationId: automation.id,
        tenantId,
        triggeredBy: request.user!.id,
        triggerType: 'MANUAL',
        triggerData: JSON.stringify(triggerData),
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    // Execute asynchronously
    executeAutomationAsync(automation, execution, triggerData, app).catch(console.error);

    return { execution, message: 'Execução iniciada' };
  });

  // GET /automations/:id/executions - List automation executions
  app.get('/:id/executions', { preHandler: [app.requirePermission('automations:read')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { page = 1, limit = 20, status } = request.query as { page?: string; limit?: string; status?: string };
    const tenantId = request.tenant!.id;

    const automation = await prisma.automation.findFirst({ where: { id, tenantId } });
    if (!automation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Automação não encontrada' } });
    }

    const where: any = { automationId: id };
    if (status) where.status = status;

    const [executions, total] = await Promise.all([
      prisma.automationExecution.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { startedAt: 'desc' },
      }),
      prisma.automationExecution.count({ where }),
    ]);

    return { data: executions, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } };
  });

  // GET /automations/:id/executions/:executionId - Get execution details
  app.get('/:id/executions/:executionId', { preHandler: [app.requirePermission('automations:read')] }, async (request, reply) => {
    const { id, executionId } = request.params as { id: string; executionId: string };
    const tenantId = request.tenant!.id;

    const execution = await prisma.automationExecution.findFirst({
      where: { id: executionId, automationId: id },
    });

    if (!execution) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Execução não encontrada' } });
    }

    return { execution };
  });

  // DELETE /automations/:id - Delete automation
  app.delete('/:id', { preHandler: [app.requirePermission('automations:delete')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const automation = await prisma.automation.findFirst({ where: { id, tenantId } });
    if (!automation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Automação não encontrada' } });
    }

    unscheduleAutomation(id);
    await prisma.automation.delete({ where: { id } });

    await logAudit(request, 'AUTOMATION_DELETED', { automationId: id });

    return { message: 'Automação deletada' };
  });
}

// Automation scheduler storage
export const scheduledJobs = new Map<string, NodeJS.Timeout>();

export function scheduleAutomation(automation: any, app: FastifyInstance) {
  unscheduleAutomation(automation.id);

  if (!automation.isActive || !automation.nextRunAt) return;

  const delay = automation.nextRunAt.getTime() - Date.now();
  if (delay <= 0) return; // Already past due

  const timeout = setTimeout(() => {
    triggerAutomation(automation, app);
  }, delay);

  scheduledJobs.set(automation.id, timeout);
}

export function unscheduleAutomation(automationId: string) {
  const timeout = scheduledJobs.get(automationId);
  if (timeout) {
    clearTimeout(timeout);
    scheduledJobs.delete(automationId);
  }
}

function calculateNextRun(schedule: any): Date | null {
  if (!schedule) return null;

  const now = new Date();
  switch (schedule.type) {
    case 'ONCE':
      return schedule.runAt ? new Date(schedule.runAt) : null;
    case 'INTERVAL':
      return new Date(now.getTime() + (schedule.intervalMs || 60000));
    case 'CRON':
      // For cron, we'd use a cron library. For now, return next minute
      return new Date(now.getTime() + 60000);
    default:
      return null;
  }
}

async function triggerAutomation(automation: any, app: FastifyInstance) {
  try {
    // Create execution record
    const execution = await prisma.automationExecution.create({
      data: {
        automationId: automation.id,
        tenantId: automation.tenantId,
        triggeredBy: automation.createdBy,
        triggerType: 'SCHEDULED',
        triggerData: '{}',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    // Execute
    await executeAutomationAsync(automation, execution, {}, app);

    // Schedule next run
    const schedule = typeof automation.schedule === 'string' ? JSON.parse(automation.schedule) : automation.schedule;
    const nextRunAt = calculateNextRun(schedule);
    if (nextRunAt) {
      await prisma.automation.update({
        where: { id: automation.id },
        data: { nextRunAt, executionCount: { increment: 1 } },
      });
      scheduleAutomation({ ...automation, nextRunAt }, app);
    }
  } catch (error) {
    console.error('Automation trigger error:', error);
  }
}

function validateAutomationAction(action: any): { valid: boolean; error?: string } {
  switch (action.type) {
    case 'SEND_MESSAGE':
      if (!action.config.to || !action.config.content) {
        return { valid: false, error: 'SEND_MESSAGE requer "to" e "content"' };
      }
      break;
    case 'CREATE_TICKET':
      if (!action.config.title || !action.config.description) {
        return { valid: false, error: 'CREATE_TICKET requer "title" e "description"' };
      }
      break;
    case 'WEBHOOK':
      if (!action.config.url) {
        return { valid: false, error: 'WEBHOOK requer "url"' };
      }
      break;
    case 'RUN_FLOW':
      if (!action.config.flowId) {
        return { valid: false, error: 'RUN_FLOW requer "flowId"' };
      }
      break;
  }
  return { valid: true };
}

function evaluateConditions(conditions: any[], data: Record<string, any>): boolean {
  for (const condition of conditions) {
    const value = getNestedValue(data, condition.field);
    let result = false;

    switch (condition.operator) {
      case 'equals':
        result = value === condition.value;
        break;
      case 'not_equals':
        result = value !== condition.value;
        break;
      case 'contains':
        result = String(value).includes(String(condition.value));
        break;
      case 'not_contains':
        result = !String(value).includes(String(condition.value));
        break;
      case 'gt':
        result = Number(value) > Number(condition.value);
        break;
      case 'gte':
        result = Number(value) >= Number(condition.value);
        break;
      case 'lt':
        result = Number(value) < Number(condition.value);
        break;
      case 'lte':
        result = Number(value) <= Number(condition.value);
        break;
      case 'in':
        result = Array.isArray(condition.value) && condition.value.includes(value);
        break;
      case 'not_in':
        result = Array.isArray(condition.value) && !condition.value.includes(value);
        break;
      case 'exists':
        result = value !== undefined && value !== null;
        break;
      case 'not_exists':
        result = value === undefined || value === null;
        break;
    }

    if (!result) return false;
  }
  return true;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

async function executeAutomationAsync(automation: any, execution: any, data: Record<string, any>, app: FastifyInstance) {
  try {
    const result = await executeAction(automation.action.type, automation.action.config, data, automation.tenantId, app);

    await prisma.automationExecution.update({
      where: { id: execution.id },
      data: { status: 'COMPLETED', completedAt: new Date(), output: result },
    });
  } catch (error: any) {
    await prisma.automationExecution.update({
      where: { id: execution.id },
      data: { status: 'FAILED', error: error.message, completedAt: new Date() },
    });
  }
}

async function executeAction(
  type: string,
  config: any,
  data: Record<string, any>,
  tenantId: string,
  app: FastifyInstance,
  simulate = false
): Promise<any> {
  switch (type) {
    case 'SEND_MESSAGE': {
      if (simulate) return { simulated: true, message: 'Mensagem seria enviada' };
      const { to, content, type: msgType = 'TEXT', mediaUrl } = config;
      // In production: send via WhatsApp API
      return { sent: true, messageId: `msg_${Date.now()}` };
    }

    case 'ASSIGN_CONVERSATION': {
      if (simulate) return { simulated: true };
      const { conversationId, assigneeId, teamId } = config;
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { assignedTo: assigneeId, teamId },
      });
      return { assigned: true };
    }

    case 'CLOSE_CONVERSATION': {
      if (simulate) return { simulated: true };
      await prisma.conversation.update({
        where: { id: config.conversationId },
        data: { status: 'CLOSED', closedAt: new Date() },
      });
      return { closed: true };
    }

    case 'SNOOZE_CONVERSATION': {
      if (simulate) return { simulated: true };
      const until = config.until ? new Date(config.until) : new Date(Date.now() + 60 * 60 * 1000);
      await prisma.conversation.update({
        where: { id: config.conversationId },
        data: { status: 'SNOOZED', snoozedUntil: until },
      });
      return { snoozed: true };
    }

    case 'CREATE_TICKET': {
      if (simulate) return { simulated: true, ticketId: 'tk_simulated' };
      const { title, description, categoryId, priority, contactId } = config;
      const ticket = await prisma.ticket.create({
        data: { tenantId, title, description, categoryId, priority, contactId, status: 'OPEN', createdBy: config.createdBy || 'system' },
      });
      return { ticketId: ticket.id };
    }

    case 'UPDATE_TICKET': {
      if (simulate) return { simulated: true };
      await prisma.ticket.update({
        where: { id: config.ticketId },
        data: config.updates || {},
      });
      return { updated: true };
    }

    case 'ASSIGN_TICKET': {
      if (simulate) return { simulated: true };
      await prisma.ticket.update({
        where: { id: config.ticketId },
        data: { assignedTo: config.assigneeId, teamId: config.teamId },
      });
      return { assigned: true };
    }

    case 'ADD_TAG': {
      if (simulate) return { simulated: true };
      const { target, targetId, tags } = config;
      if (target === 'contact') {
        const contact = await prisma.contact.findUnique({ where: { id: targetId } });
        const currentTags = contact ? JSON.parse(contact.tags || '[]') : [];
        await prisma.contact.update({ where: { id: targetId }, data: { tags: JSON.stringify([...currentTags, ...tags]) } });
      } else if (target === 'conversation') {
        const conv = await prisma.conversation.findUnique({ where: { id: targetId } });
        const currentTags = conv ? JSON.parse(conv.tags || '[]') : [];
        await prisma.conversation.update({ where: { id: targetId }, data: { tags: JSON.stringify([...currentTags, ...tags]) } });
      } else if (target === 'ticket') {
        const ticket = await prisma.ticket.findUnique({ where: { id: targetId } });
        const currentTags = ticket ? JSON.parse(ticket.tags || '[]') : [];
        await prisma.ticket.update({ where: { id: targetId }, data: { tags: JSON.stringify([...currentTags, ...tags]) } });
      }
      return { tagged: true };
    }

    case 'REMOVE_TAG': {
      if (simulate) return { simulated: true };
      const { target, targetId, tags } = config;
      if (target === 'contact') {
        const contact = await prisma.contact.findUnique({ where: { id: targetId } });
        const currentTags = contact ? JSON.parse(contact.tags || '[]') : [];
        await prisma.contact.update({ where: { id: targetId }, data: { tags: JSON.stringify(currentTags.filter((t: string) => !tags.includes(t))) } });
      } else if (target === 'conversation') {
        const conv = await prisma.conversation.findUnique({ where: { id: targetId } });
        const currentTags = conv ? JSON.parse(conv.tags || '[]') : [];
        await prisma.conversation.update({ where: { id: targetId }, data: { tags: JSON.stringify(currentTags.filter((t: string) => !tags.includes(t))) } });
      } else if (target === 'ticket') {
        const ticket = await prisma.ticket.findUnique({ where: { id: targetId } });
        const currentTags = ticket ? JSON.parse(ticket.tags || '[]') : [];
        await prisma.ticket.update({ where: { id: targetId }, data: { tags: JSON.stringify(currentTags.filter((t: string) => !tags.includes(t))) } });
      }
      return { untagged: true };
    }

    case 'UPDATE_CONTACT': {
      if (simulate) return { simulated: true };
      await prisma.contact.update({
        where: { id: config.contactId },
        data: config.updates || {},
      });
      return { updated: true };
    }

    case 'SEND_EMAIL': {
      if (simulate) return { simulated: true };
      await sendEmail({ to: config.to, subject: config.subject, template: config.template, data: { ...data, ...config.data } });
      return { sent: true };
    }

    case 'WEBHOOK': {
      if (simulate) return { simulated: true };
      const response = await fetch(config.url, {
        method: config.method || 'POST',
        headers: { 'Content-Type': 'application/json', ...config.headers },
        body: JSON.stringify({ ...data, ...config.payload }),
      });
      return { status: response.status, data: await response.json().catch(() => ({})) };
    }

    case 'RUN_FLOW': {
      if (simulate) return { simulated: true };
      const { flowId, variables } = config;
      const flow = await prisma.flow.findFirst({ where: { id: flowId, tenantId } });
      if (flow && flow.isActive) {
        // Execute flow
        return { flowTriggered: true, flowId };
      }
      return { flowTriggered: false, reason: 'Flow não encontrado ou inativo' };
    }

    case 'SET_PRIORITY': {
      if (simulate) return { simulated: true };
      const { target, targetId, priority } = config;
      if (target === 'conversation') {
        await prisma.conversation.update({ where: { id: targetId }, data: { priority } });
      } else if (target === 'ticket') {
        await prisma.ticket.update({ where: { id: targetId }, data: { priority } });
      }
      return { prioritySet: true };
    }

    default:
      return { executed: true };
  }
}

async function logAudit(request: any, action: string, metadata: Record<string, any>) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: request?.tenant?.id,
        userId: request?.user?.id,
        action,
        description: `${action} - ${metadata.automationId || metadata.executionId || 'unknown'}`,
        metadata: JSON.stringify({ ...metadata, ip: request?.ip || 'unknown', userAgent: request?.headers?.['user-agent'] || 'unknown' }),
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

// Export for event-based triggers (from other routes)
export async function triggerAutomationByEvent(
  event: string,
  data: Record<string, any>,
  tenantId: string,
  app: FastifyInstance
) {
  // This is for event-based triggers (different from scheduled automations)
  // Implementation would go here if needed
}