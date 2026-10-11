import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES, MESSAGE_TYPE, MESSAGE_DIRECTION, MESSAGE_STATUS, WEBSOCKET_EVENTS } from '@zapti/shared/constants';
import { PaginationQuerySchema, IdParamSchema } from '@zapti/shared/validation';
import { broadcastToWebsocket } from '@zapti/shared/notification';


export async function messageRoutes(fastify: FastifyInstance): Promise<void> {
  // List messages (with conversation filter)
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: PaginationQuerySchema.extend({
        conversationId: z.string().cuid(),
        direction: z.nativeEnum(MESSAGE_DIRECTION).optional(),
        type: z.nativeEnum(MESSAGE_TYPE).optional(),
        status: z.nativeEnum(MESSAGE_STATUS).optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    const { page, limit, sortBy, sortOrder, conversationId, direction, type, status } = request.query;
    const skip = (page - 1) * limit;

    if (!conversationId) {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'conversationId is required' },
      });
    }

    // Verify conversation belongs to tenant
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, tenantId: request.tenant.id },
    });

    if (!conversation) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Conversation not found' },
      });
    }

    const where: any = { conversationId };
    if (direction) where.direction = direction;
    if (type) where.type = type;
    if (status) where.status = status;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'asc' },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
          template: { select: { id: true, name: true } },
        },
      }),
      prisma.message.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: messages,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  // Send message
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.object({
        conversationId: z.string().cuid(),
        type: z.nativeEnum(MESSAGE_TYPE).default('TEXT'),
        content: z.string().optional(),
        mediaUrl: z.string().url().optional(),
        templateId: z.string().cuid().optional(),
        variables: z.record(z.string()).optional(),
        replyToId: z.string().cuid().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const { conversationId, type, content, mediaUrl, templateId, variables, replyToId } = request.body;

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, tenantId: request.tenant.id },
      include: { contact: true },
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
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Cannot send message to closed conversation' },
      });
    }

    let messageContent = content || '';

    // Handle template messages
    if (templateId) {
      const template = await prisma.template.findFirst({
        where: { id: templateId, tenantId: request.tenant.id, isApproved: true },
      });

      if (!template) {
        return reply.status(404).send({
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: 'Template not found or not approved' },
        });
      }

      messageContent = template.content;
      if (variables) {
        for (const [key, value] of Object.entries(variables)) {
          messageContent = messageContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }
      }
      // Also apply contact variables
      const contactVars = {
        contact_name: conversation.contact.name || '',
        contact_phone: conversation.contact.phone,
        contact_email: conversation.contact.email || '',
      };
      for (const [key, value] of Object.entries(contactVars)) {
        messageContent = messageContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }
    }

    if (!messageContent && !mediaUrl) {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Message content or media is required' },
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        tenantId: request.tenant.id,
        conversationId,
        contactId: conversation.contactId,
        senderId: request.user.sub,
        direction: 'OUTBOUND',
        type,
        content: messageContent,
        mediaUrl,
        templateId,
        replyToId,
        status: 'SENT',
        metadata: { variables },
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        template: { select: { id: true, name: true } },
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        status: 'OPEN',
        assignedToId: conversation.assignedToId || request.user.sub,
      },
    });

    // Send via WhatsApp
    const { sendWhatsAppMessage } = await import('../services/whatsapp');
    sendWhatsAppMessage(conversation, message, request.tenant.id).catch(console.error);

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'MESSAGE_SEND',
        entityType: 'Message',
        entityId: message.id,
        newData: { conversationId, type, content: messageContent?.substring(0, 100) },
      },
    });

    // Broadcast
    broadcastToWebsocket(
      (global as any).io,
      WEBSOCKET_EVENTS.MESSAGE_CREATE,
      { message },
      `tenant:${request.tenant.id}`
    );

    broadcastToWebsocket(
      (global as any).io,
      WEBSOCKET_EVENTS.MESSAGE_CREATE,
      { message },
      `conversation:${conversationId}`
    );

    return reply.status(201).send({ success: true, data: message });
  });

  // Send quick reply (for agents)
  fastify.post('/quick-reply', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.object({
        conversationId: z.string().cuid(),
        content: z.string().min(1),
        mediaUrl: z.string().url().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    return fastify.inject({
      method: 'POST',
      url: '/messages',
      body: {
        conversationId: request.body.conversationId,
        type: 'TEXT',
        content: request.body.content,
        mediaUrl: request.body.mediaUrl,
      },
    });
  });

  // Get message by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const message = await prisma.message.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
      include: {
        conversation: { select: { id: true, contactId: true, status: true } },
        sender: { select: { id: true, name: true, avatar: true } },
        template: { select: { id: true, name: true } },
        replyTo: { select: { id: true, content: true } },
      },
    });

    if (!message) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Message not found' },
      });
    }

    return reply.send({ success: true, data: message });
  });

  // Update message status (webhook callback)
  fastify.patch('/:id/status', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        status: z.nativeEnum(MESSAGE_STATUS),
        externalId: z.string().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: { status: string; externalId?: string } }>, reply: FastifyReply) => {
    const message = await prisma.message.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!message) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Message not found' },
      });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: message.id },
      data: {
        status: request.body.status,
        externalId: request.body.externalId || message.externalId,
      },
    });

    // Broadcast status update
    broadcastToWebsocket(
      (global as any).io,
      WEBSOCKET_EVENTS.MESSAGE_STATUS,
      { messageId: message.id, status: request.body.status },
      `tenant:${request.tenant.id}`
    );

    return reply.send({ success: true, data: updatedMessage });
  });

  // Delete message (soft delete - mark as deleted)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const message = await prisma.message.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!message) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Message not found' },
      });
    }

    // Only allow deletion within 5 minutes and by sender or admin
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (message.createdAt < fiveMinutesAgo && !['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Can only delete messages within 5 minutes' },
      });
    }

    if (message.senderId !== request.user.sub && !['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Can only delete your own messages' },
      });
    }

    await prisma.message.update({
      where: { id: message.id },
      data: {
        content: '[Deleted]',
        mediaUrl: null,
        metadata: { ...message.metadata as any, deleted: true, deletedAt: new Date().toISOString(), deletedBy: request.user.sub },
      },
    });

    // Broadcast
    broadcastToWebsocket(
      (global as any).io,
      WEBSOCKET_EVENTS.MESSAGE_DELETE,
      { messageId: message.id },
      `tenant:${request.tenant.id}`
    );

    broadcastToWebsocket(
      (global as any).io,
      WEBSOCKET_EVENTS.MESSAGE_DELETE,
      { messageId: message.id },
      `conversation:${message.conversationId}`
    );

    return reply.send({ success: true, message: 'Message deleted' });
  });

  // Get message stats for conversation
  fastify.get('/conversation/:conversationId/stats', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema.extend({ conversationId: z.string().cuid() }),
    },
  }, async (request: FastifyRequest<{ Params: { conversationId: string } }>, reply: FastifyReply) => {
    const conversation = await prisma.conversation.findFirst({
      where: { id: request.params.conversationId, tenantId: request.tenant.id },
    });

    if (!conversation) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Conversation not found' },
      });
    }

    const [total, inbound, outbound, byType, byStatus, unread] = await Promise.all([
      prisma.message.count({ where: { conversationId: conversation.id } }),
      prisma.message.count({ where: { conversationId: conversation.id, direction: 'INBOUND' } }),
      prisma.message.count({ where: { conversationId: conversation.id, direction: 'OUTBOUND' } }),
      prisma.message.groupBy({ by: ['type'], where: { conversationId: conversation.id }, _count: true }),
      prisma.message.groupBy({ by: ['status'], where: { conversationId: conversation.id }, _count: true }),
      prisma.message.count({ where: { conversationId: conversation.id, direction: 'INBOUND', status: 'RECEIVED' } }),
    ]);

    return reply.send({
      success: true,
      data: {
        total,
        inbound,
        outbound,
        byType: byType.reduce((acc, item) => ({ ...acc, [item.type]: item._count }), {}),
        byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
        unread,
      },
    });
  });
}