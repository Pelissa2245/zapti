import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES, CONVERSATION_STATUS, CONVERSATION_PRIORITY, WEBSOCKET_EVENTS } from '@zapti/shared/constants';
import { PaginationQuerySchema, IdParamSchema, SearchQuerySchema } from '@zapti/shared/validation';
import { broadcastToWebsocket } from '@zapti/shared/notification';


export async function conversationRoutes(fastify: FastifyInstance): Promise<void> {
  // List conversations
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: PaginationQuerySchema.merge(SearchQuerySchema).extend({
        status: z.nativeEnum(CONVERSATION_STATUS).optional(),
        priority: z.nativeEnum(CONVERSATION_PRIORITY).optional(),
        assignedToId: z.string().cuid().optional(),
        contactId: z.string().cuid().optional(),
        unassigned: z.boolean().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    const { page, limit, sortBy, sortOrder, q, status, priority, assignedToId, contactId, unassigned } = request.query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: request.tenant.id };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (contactId) where.contactId = contactId;
    if (unassigned) where.assignedToId = null;

    if (q) {
      where.OR = [
        { contact: { name: { contains: q, mode: 'insensitive' } } },
        { contact: { phone: { contains: q } } },
        { subject: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'updatedAt']: sortOrder || 'desc' },
        include: {
          contact: { select: { id: true, name: true, phone: true, email: true, avatar: true, tags: true } },
          assignedTo: { select: { id: true, name: true, avatar: true } },
          lastMessage: { select: { id: true, content: true, type: true, direction: true, createdAt: true } },
          _count: { select: { messages: true } },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: conversations,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  // Get conversation by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const conversation = await prisma.conversation.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
      include: {
        contact: true,
        assignedTo: { select: { id: true, name: true, avatar: true, email: true } },
        messages: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: { id: true, name: true, avatar: true } } },
        },
        tags: true,
        _count: { select: { messages: true } },
      },
    });

    if (!conversation) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Conversation not found' },
      });
    }

    // Mark as read for current user
    if (conversation.assignedToId === request.user.sub) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { unreadCount: 0 },
      });
    }

    return reply.send({ success: true, data: conversation });
  });

  // Create conversation (start new chat)
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.object({
        contactId: z.string().cuid(),
        subject: z.string().max(200).optional(),
        priority: z.nativeEnum(CONVERSATION_PRIORITY).optional(),
        initialMessage: z.string().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const { contactId, subject, priority, initialMessage } = request.body;

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, tenantId: request.tenant.id },
    });

    if (!contact) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Contact not found' },
      });
    }

    // Check if there's already an open conversation
    const existingConversation = await prisma.conversation.findFirst({
      where: { tenantId: request.tenant.id, contactId, status: { not: 'CLOSED' } },
      orderBy: { updatedAt: 'desc' },
    });

    if (existingConversation) {
      return reply.status(409).send({
        success: false,
        error: { code: ERROR_CODES.CONFLICT, message: 'Active conversation already exists', data: existingConversation },
      });
    }

    const conversation = await prisma.conversation.create({
      data: {
        tenantId: request.tenant.id,
        contactId,
        subject,
        priority: priority || 'NORMAL',
        status: 'OPEN',
        assignedToId: request.user.sub,
      },
      include: {
        contact: { select: { id: true, name: true, phone: true, email: true, avatar: true } },
        assignedTo: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Create initial message if provided
    if (initialMessage) {
      const message = await prisma.message.create({
        data: {
          tenantId: request.tenant.id,
          conversationId: conversation.id,
          contactId,
          senderId: request.user.sub,
          direction: 'OUTBOUND',
          type: 'TEXT',
          content: initialMessage,
          status: 'SENT',
        },
      });

      // Send via WhatsApp
      const { sendWhatsAppMessage } = await import('../services/whatsapp');
      sendWhatsAppMessage(conversation, message, request.tenant.id).catch(console.error);

      // Update conversation
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'CONVERSATION_CREATE',
        entityType: 'Conversation',
        entityId: conversation.id,
        newData: { contactId, subject, priority },
      },
    });

    // Broadcast
    broadcastToWebsocket(
      (global as any).io,
      WEBSOCKET_EVENTS.CONVERSATION_CREATE,
      { conversation },
      `tenant:${request.tenant.id}`
    );

    return reply.status(201).send({ success: true, data: conversation });
  });

  // Update conversation
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        subject: z.string().max(200).optional(),
        status: z.nativeEnum(CONVERSATION_STATUS).optional(),
        priority: z.nativeEnum(CONVERSATION_PRIORITY).optional(),
        assignedToId: z.string().cuid().nullable().optional(),
        tags: z.array(z.string()).optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    const conversation = await prisma.conversation.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!conversation) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Conversation not found' },
      });
    }

    // Check permissions - only assignee or admin can update
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role) && conversation.assignedToId !== request.user.sub) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Not authorized to update this conversation' },
      });
    }

    const updateData = { ...request.body };

    // If closing conversation, set closedAt
    if (request.body.status === 'CLOSED' && conversation.status !== 'CLOSED') {
      updateData.closedAt = new Date();
      updateData.closedById = request.user.sub;
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: updateData,
      include: {
        contact: { select: { id: true, name: true, phone: true, email: true, avatar: true } },
        assignedTo: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'CONVERSATION_UPDATE',
        entityType: 'Conversation',
        entityId: conversation.id,
        newData: request.body,
      },
    });

    // Broadcast
    broadcastToWebsocket(
      (global as any).io,
      WEBSOCKET_EVENTS.CONVERSATION_UPDATE,
      { conversation: updatedConversation },
      `tenant:${request.tenant.id}`
    );

    broadcastToWebsocket(
      (global as any).io,
      WEBSOCKET_EVENTS.CONVERSATION_UPDATE,
      { conversation: updatedConversation },
      `conversation:${conversation.id}`
    );

    return reply.send({ success: true, data: updatedConversation });
  });

  // Assign conversation
  fastify.post('/:id/assign', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        userId: z.string().cuid().nullable(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: { userId: string | null } }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Supervisor access required' },
      });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!conversation) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Conversation not found' },
      });
    }

    if (request.body.userId) {
      const user = await prisma.user.findFirst({
        where: { id: request.body.userId, tenantId: request.tenant.id, isActive: true },
      });
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found or inactive' },
        });
      }
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: { assignedToId: request.body.userId, status: request.body.userId ? 'OPEN' : conversation.status },
      include: {
        contact: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: request.body.userId ? 'CONVERSATION_ASSIGN' : 'CONVERSATION_UNASSIGN',
        entityType: 'Conversation',
        entityId: conversation.id,
        newData: { assignedToId: request.body.userId },
      },
    });

    // Broadcast
    broadcastToWebsocket(
      (global as any).io,
      WEBSOCKET_EVENTS.CONVERSATION_UPDATE,
      { conversation: updatedConversation },
      `tenant:${request.tenant.id}`
    );

    return reply.send({ success: true, data: updatedConversation });
  });

  // Close conversation
  fastify.post('/:id/close', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        resolution: z.string().optional(),
      }).optional(),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: { resolution?: string } }>, reply: FastifyReply) => {
    const conversation = await prisma.conversation.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!conversation) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Conversation not found' },
      });
    }

    if (conversation.status === 'CLOSED') {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Conversation already closed' },
      });
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedById: request.user.sub,
        resolution: request.body?.resolution,
      },
      include: {
        contact: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'CONVERSATION_CLOSE',
        entityType: 'Conversation',
        entityId: conversation.id,
        newData: { resolution: request.body?.resolution },
      },
    });

    // Broadcast
    broadcastToWebsocket(
      (global as any).io,
      WEBSOCKET_EVENTS.CONVERSATION_UPDATE,
      { conversation: updatedConversation },
      `tenant:${request.tenant.id}`
    );

    return reply.send({ success: true, data: updatedConversation });
  });

  // Reopen conversation
  fastify.post('/:id/reopen', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const conversation = await prisma.conversation.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!conversation) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Conversation not found' },
      });
    }

    if (conversation.status !== 'CLOSED') {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Conversation is not closed' },
      });
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: 'OPEN',
        closedAt: null,
        closedById: null,
        resolution: null,
        assignedToId: request.user.sub,
      },
      include: {
        contact: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'CONVERSATION_REOPEN',
        entityType: 'Conversation',
        entityId: conversation.id,
      },
    });

    // Broadcast
    broadcastToWebsocket(
      (global as any).io,
      WEBSOCKET_EVENTS.CONVERSATION_UPDATE,
      { conversation: updatedConversation },
      `tenant:${request.tenant.id}`
    );

    return reply.send({ success: true, data: updatedConversation });
  });

  // Add tag to conversation
  fastify.post('/:id/tags', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({ tag: z.string().min(1).max(50) }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: { tag: string } }>, reply: FastifyReply) => {
    const conversation = await prisma.conversation.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!conversation) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Conversation not found' },
      });
    }

    const tags = conversation.tags || [];
    if (!tags.includes(request.body.tag)) {
      tags.push(request.body.tag);
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { tags },
      });
    }

    return reply.send({ success: true, data: { tags } });
  });

  // Remove tag from conversation
  fastify.delete('/:id/tags/:tag', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema.extend({ tag: z.string() }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string; tag: string } }>, reply: FastifyReply) => {
    const conversation = await prisma.conversation.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!conversation) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Conversation not found' },
      });
    }

    const tags = (conversation.tags || []).filter(t => t !== request.params.tag);
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { tags },
    });

    return reply.send({ success: true, data: { tags } });
  });

  // Get conversation stats
  fastify.get('/stats/overview', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const baseWhere = { tenantId: request.tenant.id };

    const [total, open, pending, closed, byPriority, unassigned, avgResponseTime, totalMessages] = await Promise.all([
      prisma.conversation.count({ where: baseWhere }),
      prisma.conversation.count({ where: { ...baseWhere, status: 'OPEN' } }),
      prisma.conversation.count({ where: { ...baseWhere, status: 'PENDING' } }),
      prisma.conversation.count({ where: { ...baseWhere, status: 'CLOSED' } }),
      prisma.conversation.groupBy({ by: ['priority'], where: baseWhere, _count: true }),
      prisma.conversation.count({ where: { ...baseWhere, assignedToId: null, status: { not: 'CLOSED' } } }),
      prisma.conversation.aggregate({
        where: { ...baseWhere, closedAt: { not: null } },
        _avg: {
          // This would need a computed field or raw query
        },
      }),
      prisma.message.count({ where: { tenantId: request.tenant.id } }),
    ]);

    return reply.send({
      success: true,
      data: {
        total,
        open,
        pending,
        closed,
        byPriority: byPriority.reduce((acc, item) => ({ ...acc, [item.priority]: item._count }), {}),
        unassigned,
        totalMessages,
      },
    });
  });
}