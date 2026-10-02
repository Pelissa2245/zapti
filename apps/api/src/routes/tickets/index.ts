// ZapTI API — Ticket Routes
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@zapti/database';
import { toJsonSchema } from '../../utils/zod-to-json-schema.js';

const createTicketSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  contactId: z.string().optional(),
  categoryId: z.string().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  assigneeId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  dueAt: z.string().datetime().optional(),
});

const createTicketSchemaJson = toJsonSchema(createTicketSchema);

const updateTicketSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(10000).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_AGENT', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  categoryId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  dueAt: z.string().datetime().optional().nullable(),
  resolvedAt: z.string().datetime().optional().nullable(),
});

const updateTicketSchemaJson = toJsonSchema(updateTicketSchema);

const listTicketsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_AGENT', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  categoryId: z.string().optional(),
  assigneeId: z.string().optional(),
  teamId: z.string().optional(),
  contactId: z.string().optional(),
  overdue: z.coerce.boolean().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueAt', 'priority', 'status']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const listTicketsQuerySchemaJson = toJsonSchema(listTicketsQuerySchema);

const addCommentSchema = z.object({
  content: z.string().min(1).max(10000),
  isInternal: z.boolean().default(false),
});

const addCommentSchemaJson = toJsonSchema(addCommentSchema);

const addAttachmentSchema = z.object({
  fileName: z.string(),
  fileUrl: z.string().url(),
  mimeType: z.string(),
  size: z.number(),
});

const addAttachmentSchemaJson = toJsonSchema(addAttachmentSchema);

export async function ticketRoutes(app: FastifyInstance) {
  // GET /tickets - List tickets
  app.get('/', {
    preHandler: [app.requirePermission('tickets:read')],
    schema: { querystring: listTicketsQuerySchemaJson },
  }, async (request) => {
    const { page, limit, status, priority, categoryId, assigneeId, teamId, contactId, overdue, tags, sortBy, sortOrder } = request.query as z.infer<typeof listTicketsQuerySchema>;
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;
    const userTenant = request.userTenant!;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (categoryId) where.categoryId = categoryId;
    if (contactId) where.contactId = contactId;
    if (overdue) where.dueAt = { lt: new Date() };

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    // Role-based filtering
    if (!['OWNER', 'ADMIN', 'SUPERVISOR'].includes(userTenant.role)) {
      const teamIds = userTenant.teams?.map((ut) => ut.teamId) || [];
      where.OR = [
        { assignedTo: userId },
        { teamId: { in: teamIds } },
        { assignedTo: null, teamId: null },
      ];
    } else if (assigneeId) {
      where.assignedTo = assigneeId;
    } else if (teamId) {
      where.teamId = teamId;
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          contact: { select: { id: true, name: true, phoneNumber: true, email: true, profilePicUrl: true } },
          category: { select: { id: true, name: true, color: true, slaHours: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          team: { select: { id: true, name: true, color: true } },
          _count: { select: { comments: true, attachments: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.ticket.count({ where }),
    ]);

    return { data: tickets, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  });

  // GET /tickets/stats - Ticket statistics
  app.get('/stats', { preHandler: [app.requirePermission('tickets:read')] }, async (request) => {
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;
    const userTenant = request.userTenant!;

    const teamIds = userTenant.teams?.map((ut) => ut.teamId) || [];
    const baseWhere = { tenantId };
    const agentWhere = !['OWNER', 'ADMIN', 'SUPERVISOR'].includes(userTenant.role)
      ? { OR: [{ assigneeId: userId }, { teamId: { in: teamIds } }, { assigneeId: null, teamId: null }] }
      : {};

    const [total, open, inProgress, waitingCustomer, waitingAgent, resolved, closed, overdue, myOpen, byPriority, byCategory, avgResolutionTime] = await Promise.all([
      prisma.ticket.count({ where: { ...baseWhere, ...agentWhere } }),
      prisma.ticket.count({ where: { ...baseWhere, ...agentWhere, status: 'OPEN' } }),
      prisma.ticket.count({ where: { ...baseWhere, ...agentWhere, status: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { ...baseWhere, ...agentWhere, status: 'WAITING_CUSTOMER' } }),
      prisma.ticket.count({ where: { ...baseWhere, ...agentWhere, status: 'WAITING_AGENT' } }),
      prisma.ticket.count({ where: { ...baseWhere, ...agentWhere, status: 'RESOLVED' } }),
      prisma.ticket.count({ where: { ...baseWhere, ...agentWhere, status: 'CLOSED' } }),
      prisma.ticket.count({ where: { ...baseWhere, ...agentWhere, dueAt: { lt: new Date() }, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
      prisma.ticket.count({ where: { ...baseWhere, assignedTo: userId, status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_AGENT', 'WAITING_CUSTOMER'] } } }),
      prisma.ticket.groupBy({ by: ['priority'], where: { ...baseWhere, ...agentWhere }, _count: true }),
      prisma.ticket.groupBy({ by: ['categoryId'], where: { ...baseWhere, ...agentWhere }, _count: true }),
      prisma.ticket.aggregate({
        where: { ...baseWhere, ...agentWhere, status: { in: ['RESOLVED', 'CLOSED'] }, resolvedAt: { not: null } },
        _avg: { slaHours: true },
      }),
    ]);

    return {
      stats: {
        total,
        open,
        inProgress,
        waitingCustomer,
        waitingAgent,
        resolved,
        closed,
        overdue,
        myOpen,
        byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count })),
        byCategory: byCategory.map((c) => ({ categoryId: c.categoryId, count: c._count })),
        avgResolutionTime: avgResolutionTime._avg.slaHours || 0,
      },
    };
  });

  // GET /tickets/:id - Get ticket details
  app.get('/:id', { preHandler: [app.requirePermission('tickets:read')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const ticket = await prisma.ticket.findFirst({
      where: { id, tenantId },
      include: {
        contact: { select: { id: true, name: true, phoneNumber: true, email: true, profilePicUrl: true, tags: true } },
        category: { select: { id: true, name: true, color: true, slaHours: true, slaResponseHours: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true, email: true } },
        team: { select: { id: true, name: true, color: true } },
        comments: { include: { author: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: 'asc' } },
        attachments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!ticket) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Ticket não encontrado' } });
    }

    return { ticket };
  });

  // POST /tickets - Create ticket
  app.post('/', {
    preHandler: [app.requirePermission('tickets:create')],
    schema: { body: createTicketSchemaJson },
  }, async (request, reply) => {
    const { title, description, contactId, categoryId, priority, assigneeId, teamId, tags, dueAt } = request.body as z.infer<typeof createTicketSchema>;
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    // Verify contact exists if provided
    if (contactId) {
      const contact = await prisma.contact.findFirst({ where: { id: contactId, tenantId } });
      if (!contact) {
        return reply.status(404).send({ error: { code: 'CONTACT_NOT_FOUND', message: 'Contato não encontrado' } });
      }
    }

    // Verify category exists if provided
    if (categoryId) {
      const category = await prisma.ticketCategory.findFirst({ where: { id: categoryId, tenantId } });
      if (!category) {
        return reply.status(404).send({ error: { code: 'CATEGORY_NOT_FOUND', message: 'Categoria não encontrada' } });
      }
    }

    // Generate ticket number
    const count = await prisma.ticket.count({ where: { tenantId } });
    const number = `TK-${String(count + 1).padStart(6, '0')}`;

    const ticket = await prisma.ticket.create({
      data: {
        tenantId,
        title,
        description,
        contactId,
        categoryId,
        priority,
        assignedTo: assigneeId,
        teamId,
        tags: JSON.stringify(tags || []),
        dueAt: dueAt ? new Date(dueAt) : null,
        status: 'OPEN',
        createdBy: userId,
      },
      include: { category: true, assignee: true, team: true },
    });

    // Create activity log (commented out - TicketActivity model not in schema)
    // await prisma.ticketActivity.create({
    //   data: { ticketId: ticket.id, userId, type: 'CREATED', description: 'Ticket criado' },
    // });

    // Send notification if assigned
    if (assigneeId && assigneeId !== userId) {
      // Notification logic here
    }

    await logAudit(request, 'TICKET_CREATED', { ticketId: ticket.id, number });

    return reply.status(201).send({ ticket });
  });

  // PATCH /tickets/:id - Update ticket
  app.patch('/:id', {
    preHandler: [app.requirePermission('tickets:update')],
    schema: { body: updateTicketSchemaJson },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    const ticket = await prisma.ticket.findFirst({ where: { id, tenantId } });
    if (!ticket) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Ticket não encontrado' } });
    }

    const { dueAt, resolvedAt, ...restBody } = request.body as z.infer<typeof updateTicketSchema>;
    const updateData: any = { ...restBody };
    if (dueAt !== undefined) updateData.dueAt = dueAt ? new Date(dueAt) : null;
    if (resolvedAt !== undefined) updateData.resolvedAt = resolvedAt ? new Date(resolvedAt) : null;

    // Track status changes
    const oldStatus = ticket.status;
    const newStatus = restBody.status;

    if (newStatus && newStatus !== oldStatus) {
      // await prisma.ticketActivity.create({
      //   data: { ticketId: id, userId, type: 'STATUS_CHANGED', description: `Status alterado de ${oldStatus} para ${newStatus}` },
      // });

      // Set resolvedAt on resolve
      if (['RESOLVED', 'CLOSED'].includes(newStatus) && !['RESOLVED', 'CLOSED'].includes(oldStatus)) {
        updateData.resolvedAt = new Date();
      }
      // Clear resolvedAt on reopen
      if (['OPEN', 'IN_PROGRESS'].includes(newStatus) && ['RESOLVED', 'CLOSED'].includes(oldStatus)) {
        updateData.resolvedAt = null;
      }
    }

    const updated = await prisma.ticket.update({ where: { id }, data: updateData, include: { category: true, assignee: true, team: true } });

    await logAudit(request, 'TICKET_UPDATED', { ticketId: id, changes: Object.keys(restBody) });

    return { ticket: updated };
  });

  // POST /tickets/:id/assign - Assign ticket
  app.post('/:id/assign', { preHandler: [app.requirePermission('tickets:assign')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { assigneeId, teamId } = request.body as { assigneeId?: string; teamId?: string };
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    const ticket = await prisma.ticket.findFirst({ where: { id, tenantId } });
    if (!ticket) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Ticket não encontrado' } });
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: { assignedTo: assigneeId, teamId, status: assigneeId && ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status },
    });

    // await prisma.ticketActivity.create({ ... });

    await logAudit(request, 'TICKET_ASSIGNED', { ticketId: id, assigneeId, teamId });

    return { ticket: updated };
  });

  // POST /tickets/:id/comments - Add comment
  app.post('/:id/comments', {
    preHandler: [app.requirePermission('tickets:comment')],
    schema: { body: addCommentSchemaJson },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { content, isInternal } = request.body as z.infer<typeof addCommentSchema>;
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    const ticket = await prisma.ticket.findFirst({ where: { id, tenantId } });
    if (!ticket) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Ticket não encontrado' } });
    }

    const comment = await prisma.ticketComment.create({
      data: { tenantId, ticketId: id, authorId: userId, content, isInternal },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });

    // Update ticket updatedAt
    await prisma.ticket.update({ where: { id }, data: { updatedAt: new Date() } });

    await logAudit(request, 'TICKET_COMMENT_ADDED', { ticketId: id, commentId: comment.id, isInternal });

    return reply.status(201).send({ comment });
  });

  // DELETE /tickets/:id/comments/:commentId - Delete comment
  app.delete('/:id/comments/:commentId', { preHandler: [app.requirePermission('tickets:comment')] }, async (request, reply) => {
    const { id, commentId } = request.params as { id: string; commentId: string };
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    const comment = await prisma.ticketComment.findFirst({ where: { id: commentId, ticketId: id } });
    if (!comment) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Comentário não encontrado' } });
    }

    if (comment.authorId !== userId && !['OWNER', 'ADMIN'].includes(request.userTenant!.role)) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Não pode deletar comentário de outro usuário' } });
    }

    await prisma.ticketComment.delete({ where: { id: commentId } });

    return { message: 'Comentário deletado' };
  });

  // POST /tickets/:id/attachments - Add attachment
  app.post('/:id/attachments', {
    preHandler: [app.requirePermission('tickets:update')],
    schema: { body: addAttachmentSchemaJson },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { fileName, fileUrl, mimeType, size } = request.body as { fileName: string; fileUrl: string; mimeType: string; size: number };
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    const ticket = await prisma.ticket.findFirst({ where: { id, tenantId } });
    if (!ticket) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Ticket não encontrado' } });
    }

    const attachment = await prisma.ticketAttachment.create({
      data: { tenantId, ticketId: id, fileName, fileUrl, fileType: mimeType, fileSize: size },
    });

    return reply.status(201).send({ attachment });
  });

  // DELETE /tickets/:id/attachments/:attachmentId - Delete attachment
  app.delete('/:id/attachments/:attachmentId', { preHandler: [app.requirePermission('tickets:update')] }, async (request, reply) => {
    const { id, attachmentId } = request.params as { id: string; attachmentId: string };
    const tenantId = request.tenant!.id;

    const attachment = await prisma.ticketAttachment.findFirst({ where: { id: attachmentId, ticketId: id } });
    if (!attachment) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Anexo não encontrado' } });
    }

    // In production: delete file from storage
    await prisma.ticketAttachment.delete({ where: { id: attachmentId } });

    return { message: 'Anexo deletado' };
  });

  // GET /tickets/categories - List ticket categories
  app.get('/categories', { preHandler: [app.requirePermission('tickets:read')] }, async (request) => {
    const tenantId = request.tenant!.id;

    const categories = await prisma.ticketCategory.findMany({
      where: { tenantId },
      include: { _count: { select: { tickets: true } } },
      orderBy: { name: 'asc' },
    });

    return { categories };
  });

  // POST /tickets/categories - Create ticket category
  app.post('/categories', { preHandler: [app.requirePermission('tickets:admin')] }, async (request, reply) => {
    const { name, description, color, slaHours, slaResponseHours, parentId } = request.body as any;
    const tenantId = request.tenant!.id;

    const category = await prisma.ticketCategory.create({
      data: { tenantId, name, description, color: color || '#3B82F6', slaHours, slaResponseHours, parentId },
    });

    return reply.status(201).send({ category });
  });

  // PATCH /tickets/categories/:id - Update category
  app.patch('/categories/:id', { preHandler: [app.requirePermission('tickets:admin')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const category = await prisma.ticketCategory.findFirst({ where: { id, tenantId } });
    if (!category) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Categoria não encontrada' } });
    }

    const { name, description, color, slaHours, slaResponseHours, parentId } = request.body as any;
    const updated = await prisma.ticketCategory.update({ where: { id }, data: { name, description, color, slaHours, slaResponseHours, parentId } });

    return { category: updated };
  });

  // DELETE /tickets/categories/:id - Delete category
  app.delete('/categories/:id', { preHandler: [app.requirePermission('tickets:admin')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const category = await prisma.ticketCategory.findFirst({ where: { id, tenantId } });
    if (!category) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Categoria não encontrada' } });
    }

    // Check if has tickets
    const ticketCount = await prisma.ticket.count({ where: { categoryId: id } });
    if (ticketCount > 0) {
      return reply.status(400).send({ error: { code: 'HAS_TICKETS', message: 'Categoria possui tickets associados' } });
    }

    await prisma.ticketCategory.delete({ where: { id } });

    return { message: 'Categoria deletada' };
  });
}

async function logAudit(request: any, action: string, metadata: Record<string, any>) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: request?.tenant?.id,
        userId: request?.user?.id,
        action,
        description: `${action} - ${metadata.ticketId || metadata.categoryId || 'unknown'}`,
        metadata: JSON.stringify({ ...metadata, ip: request?.ip, userAgent: request?.headers?.['user-agent'] }),
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}