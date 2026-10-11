import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES, TICKET_STATUS, TICKET_PRIORITY, WEBSOCKET_EVENTS } from '@zapti/shared/constants';
import { PaginationQuerySchema, IdParamSchema, SearchQuerySchema } from '@zapti/shared/validation';
import { broadcastToWebsocket } from '@zapti/shared/notification';


export async function ticketRoutes(fastify: FastifyInstance): Promise<void> {
  // List tickets
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: PaginationQuerySchema.merge(SearchQuerySchema).extend({
        status: z.nativeEnum(TICKET_STATUS).optional(),
        priority: z.nativeEnum(TICKET_PRIORITY).optional(),
        assignedToId: z.string().cuid().optional(),
        contactId: z.string().cuid().optional(),
        category: z.string().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    const { page, limit, sortBy, sortOrder, q, status, priority, assignedToId, contactId, category } = request.query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: request.tenant.id };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (contactId) where.contactId = contactId;
    if (category) where.category = category;

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { contact: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        include: {
          contact: { select: { id: true, name: true, phone: true, email: true } },
          assignedTo: { select: { id: true, name: true, avatar: true } },
          createdBy: { select: { id: true, name: true } },
          _count: { select: { comments: true, attachments: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: tickets,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  // Get ticket by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const ticket = await prisma.ticket.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
      include: {
        contact: true,
        assignedTo: { select: { id: true, name: true, avatar: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        conversation: { select: { id: true, subject: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true, avatar: true } } },
        },
        attachments: { orderBy: { createdAt: 'desc' } },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (!ticket) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Ticket not found' },
      });
    }

    return reply.send({ success: true, data: ticket });
  });

  // Create ticket
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        priority: z.nativeEnum(TICKET_PRIORITY).optional(),
        contactId: z.string().cuid(),
        conversationId: z.string().cuid().optional(),
        category: z.string().optional(),
        assignedToId: z.string().cuid().optional(),
        tags: z.array(z.string()).optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const { title, description, priority, contactId, conversationId, category, assignedToId, tags } = request.body;

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, tenantId: request.tenant.id },
    });

    if (!contact) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Contact not found' },
      });
    }

    if (conversationId) {
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, tenantId: request.tenant.id },
      });
      if (!conversation) {
        return reply.status(404).send({
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: 'Conversation not found' },
        });
      }
    }

    if (assignedToId) {
      const assignee = await prisma.user.findFirst({
        where: { id: assignedToId, tenantId: request.tenant.id, isActive: true },
      });
      if (!assignee) {
        return reply.status(404).send({
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: 'Assignee not found or inactive' },
        });
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        tenantId: request.tenant.id,
        title,
        description,
        priority: priority || 'NORMAL',
        contactId,
        conversationId,
        category,
        assignedToId,
        tags: tags || [],
        createdById: request.user.sub,
        status: 'OPEN',
      },
      include: {
        contact: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Create activity
    await prisma.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        userId: request.user.sub,
        type: 'CREATED',
        description: 'Ticket created',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'TICKET_CREATE',
        entityType: 'Ticket',
        entityId: ticket.id,
        newData: { title, priority, contactId, assignedToId },
      },
    });

    // Broadcast
    broadcastToWebsocket(
      (global as any).io,
      WEBSOCKET_EVENTS.TICKET_CREATE,
      { ticket },
      `tenant:${request.tenant.id}`
    );

    return reply.status(201).send({ success: true, data: ticket });
  });

  // Update ticket
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        status: z.nativeEnum(TICKET_STATUS).optional(),
        priority: z.nativeEnum(TICKET_PRIORITY).optional(),
        assignedToId: z.string().cuid().nullable().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        resolution: z.string().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    const ticket = await prisma.ticket.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!ticket) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Ticket not found' },
      });
    }

    // Check permissions
    if (!['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(request.user.role) && ticket.assignedToId !== request.user.sub) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Not authorized to update this ticket' },
      });
    }

    const updateData: any = { ...request.body };
    const oldStatus = ticket.status;

    // Handle status transitions
    if (request.body.status && request.body.status !== oldStatus) {
      if (request.body.status === 'RESOLVED' || request.body.status === 'CLOSED') {
        updateData.resolvedAt = new Date();
        updateData.resolvedById = request.user.sub;
      }
      if (request.body.status === 'IN_PROGRESS' && oldStatus === 'OPEN') {
        updateData.startedAt = new Date();
      }
    }

    if (request.body.assignedToId !== undefined && request.body.assignedToId !== ticket.assignedToId) {
      await prisma.ticketActivity.create({
        data: {
          ticketId: ticket.id,
          userId: request.user.sub,
          type: 'ASSIGNED',
          description: request.body.assignedToId ? 'Ticket assigned' : 'Ticket unassigned',
          metadata: { previousAssigneeId: ticket.assignedToId, newAssigneeId: request.body.assignedToId },
        },
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: updateData,
      include: {
        contact: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Create activity
    await prisma.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        userId: request.user.sub,
        type: 'UPDATED',
        description: `Ticket updated${request.body.status ? ` (status: ${oldStatus} → ${request.body.status})` : ''}`,
        metadata: { changes: request.body },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'TICKET_UPDATE',
        entityType: 'Ticket',
        entityId: ticket.id,
        newData: request.body,
      },
    });

    // Broadcast
    broadcastToWebsocket(
      (global as any).io,
      WEBSOCKET_EVENTS.TICKET_UPDATE,
      { ticket: updatedTicket },
      `tenant:${request.tenant.id}`
    );

    return reply.send({ success: true, data: updatedTicket });
  });

  // Add comment to ticket
  fastify.post('/:id/comments', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        content: z.string().min(1),
        isInternal: z.boolean().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: { content: string; isInternal?: boolean } }>, reply: FastifyReply) => {
    const ticket = await prisma.ticket.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!ticket) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Ticket not found' },
      });
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: ticket.id,
        authorId: request.user.sub,
        content: request.body.content,
        isInternal: request.body.isInternal || false,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Create activity
    await prisma.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        userId: request.user.sub,
        type: 'COMMENTED',
        description: 'Comment added',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'TICKET_COMMENT',
        entityType: 'TicketComment',
        entityId: comment.id,
        newData: { content: request.body.content, isInternal: request.body.isInternal },
      },
    });

    // Broadcast
    broadcastToWebsocket(
      (global as any).io,
      'ticket:comment',
      { ticketId: ticket.id, comment },
      `tenant:${request.tenant.id}`
    );

    return reply.status(201).send({ success: true, data: comment });
  });

  // Add attachment to ticket
  fastify.post('/:id/attachments', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        fileName: z.string(),
        fileUrl: z.string().url(),
        fileSize: z.number(),
        mimeType: z.string(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    const ticket = await prisma.ticket.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!ticket) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Ticket not found' },
      });
    }

    const attachment = await prisma.ticketAttachment.create({
      data: {
        ticketId: ticket.id,
        fileName: request.body.fileName,
        fileUrl: request.body.fileUrl,
        fileSize: request.body.fileSize,
        mimeType: request.body.mimeType,
        uploadedById: request.user.sub,
      },
    });

    return reply.status(201).send({ success: true, data: attachment });
  });

  // Delete ticket
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

    const ticket = await prisma.ticket.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!ticket) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Ticket not found' },
      });
    }

    await prisma.ticket.delete({ where: { id: ticket.id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'TICKET_DELETE',
        entityType: 'Ticket',
        entityId: ticket.id,
      },
    });

    // Broadcast
    broadcastToWebsocket(
      (global as any).io,
      WEBSOCKET_EVENTS.TICKET_DELETE,
      { ticketId: ticket.id },
      `tenant:${request.tenant.id}`
    );

    return reply.send({ success: true, message: 'Ticket deleted' });
  });

  // Get ticket stats
  fastify.get('/stats/overview', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const baseWhere = { tenantId: request.tenant.id };

    const [total, open, inProgress, waiting, resolved, closed, byPriority, byCategory, avgResolutionTime] = await Promise.all([
      prisma.ticket.count({ where: baseWhere }),
      prisma.ticket.count({ where: { ...baseWhere, status: 'OPEN' } }),
      prisma.ticket.count({ where: { ...baseWhere, status: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { ...baseWhere, status: 'WAITING_CUSTOMER' } }),
      prisma.ticket.count({ where: { ...baseWhere, status: 'RESOLVED' } }),
      prisma.ticket.count({ where: { ...baseWhere, status: 'CLOSED' } }),
      prisma.ticket.groupBy({ by: ['priority'], where: baseWhere, _count: true }),
      prisma.ticket.groupBy({ by: ['category'], where: { ...baseWhere, category: { not: null } }, _count: true }),
      // This would need raw query for proper avg resolution time
      Promise.resolve({ _avg: { resolutionTime: null } }),
    ]);

    return reply.send({
      success: true,
      data: {
        total,
        open,
        inProgress,
        waiting,
        resolved,
        closed,
        byPriority: byPriority.reduce((acc, item) => ({ ...acc, [item.priority]: item._count }), {}),
        byCategory: byCategory.reduce((acc, item) => ({ ...acc, [item.category]: item._count }), {}),
      },
    });
  });
}