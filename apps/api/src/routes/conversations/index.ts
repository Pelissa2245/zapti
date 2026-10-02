// ZapTI API — Conversation Routes
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@zapti/database';
import { toJsonSchema } from '../../utils/zod-to-json-schema.js';

const listConversationsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['OPEN', 'PENDING', 'CLOSED', 'SNOOZED']).optional(),
  assigneeId: z.string().optional(),
  teamId: z.string().optional(),
  instanceId: z.string().optional(),
  contactId: z.string().optional(),
  unreadOnly: z.coerce.boolean().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  sortBy: z.enum(['updatedAt', 'createdAt', 'lastMessageAt', 'priority', 'unreadCount']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const listConversationsQuerySchemaJson = toJsonSchema(listConversationsQuerySchema);

const updateConversationSchema = z.object({
  status: z.enum(['OPEN', 'PENDING', 'CLOSED', 'SNOOZED']).optional(),
  assigneeId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  tags: z.array(z.string()).optional(),
  snoozedUntil: z.string().datetime().optional().nullable(),
});

const updateConversationSchemaJson = toJsonSchema(updateConversationSchema);

const assignConversationSchema = z.object({
  assigneeId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
});

const assignConversationSchemaJson = toJsonSchema(assignConversationSchema);

const sendMessageSchema = z.object({
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER', 'LOCATION', 'CONTACT', 'TEMPLATE', 'INTERACTIVE', 'SYSTEM']),
  content: z.string(),
  mediaUrl: z.string().url().optional(),
  mediaCaption: z.string().optional(),
  templateParams: z.array(z.string()).optional(),
  replyToId: z.string().optional(),
});

const sendMessageSchemaJson = toJsonSchema(sendMessageSchema);

const snoozeSchema = z.object({
  until: z.string().datetime(),
});

const snoozeSchemaJson = toJsonSchema(snoozeSchema);

export async function conversationRoutes(app: FastifyInstance) {
  // GET /conversations - List conversations
  app.get('/', {
    preHandler: [app.requirePermission('conversations:read')],
    schema: { querystring: listConversationsQuerySchemaJson },
  }, async (request) => {
    const { page, limit, status, assigneeId, teamId, instanceId, contactId, unreadOnly, priority, sortBy, sortOrder } = request.query as z.infer<typeof listConversationsQuerySchema>;
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;
    const userTenant = request.userTenant!;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (instanceId) where.instanceId = instanceId;
    if (contactId) where.contactId = contactId;
    if (priority) where.priority = priority;
    if (unreadOnly) where.unreadCount = { gt: 0 };

    // Role-based filtering
    if (!['OWNER', 'ADMIN', 'SUPERVISOR'].includes(userTenant.role)) {
      // Agents only see assigned conversations or unassigned
      where.OR = [
        { assignedTo: userId },
        { teamId: { in: (userTenant.teams || []).map((ut) => ut.teamId) } },
        { assignedTo: null, teamId: null },
      ];
    } else if (assigneeId) {
      where.assignedTo = assigneeId;
    } else if (teamId) {
      where.teamId = teamId;
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          contact: { select: { id: true, name: true, phoneNumber: true, profilePicUrl: true, email: true, tags: true } },
          instance: { select: { id: true, name: true, phoneNumber: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          team: { select: { id: true, name: true, color: true } },
          _count: { select: { messages: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.conversation.count({ where }),
    ]);

    return { data: conversations, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  });

  // GET /conversations/stats - Conversation statistics
  app.get('/stats', { preHandler: [app.requirePermission('conversations:read')] }, async (request) => {
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;
    const userTenant = request.userTenant!;

    const baseWhere = { tenantId };
    const agentWhere = !['OWNER', 'ADMIN', 'SUPERVISOR'].includes(userTenant.role)
      ? { OR: [{ assignedTo: userId }, { teamId: { in: (userTenant.teams || []).map((ut) => ut.teamId) } }, { assignedTo: null, teamId: null }] }
      : {};

    const [total, open, pending, closed, snoozed, unread, myOpen] = await Promise.all([
      prisma.conversation.count({ where: { ...baseWhere, ...agentWhere } }),
      prisma.conversation.count({ where: { ...baseWhere, ...agentWhere, status: 'OPEN' } }),
      prisma.conversation.count({ where: { ...baseWhere, ...agentWhere, status: 'PENDING' } }),
      prisma.conversation.count({ where: { ...baseWhere, ...agentWhere, status: 'CLOSED' } }),
      prisma.conversation.count({ where: { ...baseWhere, ...agentWhere, status: 'SNOOZED' } }),
      prisma.conversation.aggregate({ where: { ...baseWhere, ...agentWhere }, _sum: { unreadCount: true } }),
      prisma.conversation.count({ where: { ...baseWhere, assignedTo: userId, status: { in: ['OPEN', 'PENDING'] } } }),
    ]);

    return {
      stats: {
        total,
        open,
        pending,
        closed,
        snoozed,
        totalUnread: unread._sum.unreadCount || 0,
        myOpen,
      },
    };
  });

  // GET /conversations/:id - Get conversation details
  app.get('/:id', { preHandler: [app.requirePermission('conversations:read')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const conversation = await prisma.conversation.findFirst({
      where: { id, tenantId },
      include: {
        contact: { select: { id: true, name: true, phoneNumber: true, profilePicUrl: true, email: true, tags: true, metadata: true, isBlocked: true } },
        instance: { select: { id: true, name: true, phoneNumber: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true, email: true } },
        team: { select: { id: true, name: true, color: true } },
        messages: {
          include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    });

    if (!conversation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Conversa não encontrada' } });
    }

    return { conversation };
  });

  // GET /conversations/:id/messages - Get conversation messages (paginated)
  app.get('/:id/messages', { preHandler: [app.requirePermission('conversations:read')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { page = 1, limit = 50, before } = request.query as { page?: string; limit?: string; before?: string };
    const tenantId = request.tenant!.id;

    const conversation = await prisma.conversation.findFirst({ where: { id, tenantId } });
    if (!conversation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Conversa não encontrada' } });
    }

    const where: any = { conversationId: id };
    if (before) where.createdAt = { lt: new Date(before) };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.message.count({ where }),
    ]);

    return { data: messages.reverse(), pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } };
  });

  // PATCH /conversations/:id - Update conversation
  app.patch('/:id', {
    preHandler: [app.requirePermission('conversations:update')],
    schema: { body: updateConversationSchemaJson },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof updateConversationSchema>;
    const { status, assigneeId, teamId, priority, tags, snoozedUntil } = body;
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;
    const userTenant = request.userTenant!;

    const conversation = await prisma.conversation.findFirst({ where: { id, tenantId } });
    if (!conversation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Conversa não encontrada' } });
    }

    // Check permission to assign
    if (assigneeId !== undefined || teamId !== undefined) {
      if (!['OWNER', 'ADMIN', 'SUPERVISOR'].includes(userTenant.role)) {
        // Agents can only assign to themselves or unassign
        if (assigneeId && assigneeId !== userId) {
          return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Não pode atribuir a outro usuário' } });
        }
      }
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (assigneeId !== undefined) updateData.assignedTo = assigneeId;
    if (teamId !== undefined) updateData.teamId = teamId;
    if (priority !== undefined) updateData.priority = priority;
    if (tags !== undefined) updateData.tags = tags;
    if (snoozedUntil !== undefined) updateData.snoozedUntil = snoozedUntil ? new Date(snoozedUntil) : null;

    // Handle status transitions
    if (status === 'CLOSED' && conversation.status !== 'CLOSED') {
      updateData.closedAt = new Date();
      updateData.closedBy = userId;
    }
    if (status === 'OPEN' && conversation.status === 'CLOSED') {
      updateData.closedAt = null;
      updateData.closedBy = null;
    }
    if (status === 'OPEN' && conversation.status === 'SNOOZED') {
      updateData.snoozedUntil = null;
    }

    const updated = await prisma.conversation.update({ where: { id }, data: updateData, include: { assignee: true, team: true } });

    // Emit real-time event
    app.emitToConversation?.(id, 'conversation:updated', { conversationId: id, updates: updateData });
    app.emitToTenant?.(tenantId, 'conversation:updated', { conversationId: id, updates: updateData });

    await logAudit(request, 'CONVERSATION_UPDATED', { conversationId: id, changes: Object.keys(updateData) });

    return { conversation: updated };
  });

  // POST /conversations/:id/assign - Assign conversation
  app.post('/:id/assign', {
    preHandler: [app.requirePermission('conversations:update')],
    schema: { body: assignConversationSchemaJson },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof assignConversationSchema>;
    const { assigneeId, teamId } = body;
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    const conversation = await prisma.conversation.findFirst({ where: { id, tenantId } });
    if (!conversation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Conversa não encontrada' } });
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { assignedTo: assigneeId, teamId, status: assigneeId ? 'OPEN' : conversation.status },
    });

    app.emitToConversation?.(id, 'conversation:assigned', { conversationId: id, assigneeId, teamId });
    app.emitToTenant?.(tenantId, 'conversation:assigned', { conversationId: id, assigneeId, teamId });

    await logAudit(request, 'CONVERSATION_ASSIGNED', { conversationId: id, assigneeId, teamId });

    return { conversation: updated };
  });

  // POST /conversations/:id/snooze - Snooze conversation
  app.post('/:id/snooze', { preHandler: [app.requirePermission('conversations:update')], schema: { body: snoozeSchemaJson } }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { until } = request.body as { until: string };
    const tenantId = request.tenant!.id;

    const conversation = await prisma.conversation.findFirst({ where: { id, tenantId } });
    if (!conversation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Conversa não encontrada' } });
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { status: 'SNOOZED', snoozedUntil: new Date(until) },
    });

    app.emitToConversation?.(id, 'conversation:snoozed', { conversationId: id, snoozedUntil: until });

    await logAudit(request, 'CONVERSATION_SNOOZED', { conversationId: id, until });

    return { conversation: updated };
  });

  // POST /conversations/:id/close - Close conversation
  app.post('/:id/close', { preHandler: [app.requirePermission('conversations:update')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    const conversation = await prisma.conversation.findFirst({ where: { id, tenantId } });
    if (!conversation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Conversa não encontrada' } });
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), closedBy: userId },
    });

    app.emitToConversation?.(id, 'conversation:closed', { conversationId: id });
    app.emitToTenant?.(tenantId, 'conversation:closed', { conversationId: id });

    await logAudit(request, 'CONVERSATION_CLOSED', { conversationId: id });

    return { conversation: updated };
  });

  // POST /conversations/:id/reopen - Reopen conversation
  app.post('/:id/reopen', { preHandler: [app.requirePermission('conversations:update')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const conversation = await prisma.conversation.findFirst({ where: { id, tenantId } });
    if (!conversation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Conversa não encontrada' } });
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: { status: 'OPEN', closedAt: null, closedBy: null },
    });

    app.emitToConversation?.(id, 'conversation:reopened', { conversationId: id });
    app.emitToTenant?.(tenantId, 'conversation:reopened', { conversationId: id });

    await logAudit(request, 'CONVERSATION_REOPENED', { conversationId: id });

    return { conversation: updated };
  });

  // POST /conversations/:id/messages - Send message
  app.post('/:id/messages', {
    preHandler: [app.requirePermission('conversations:send')],
    schema: { body: sendMessageSchemaJson },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof sendMessageSchema>;
    const { type, content, mediaUrl, mediaCaption, templateParams, replyToId } = body;
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    const conversation = await prisma.conversation.findFirst({ where: { id, tenantId } });
    if (!conversation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Conversa não encontrada' } });
    }

    if (conversation.status === 'CLOSED') {
      return reply.status(400).send({ error: { code: 'CONVERSATION_CLOSED', message: 'Conversa está fechada' } });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        tenantId,
        conversationId: id,
        instanceId: conversation.instanceId,
        contactId: conversation.contactId,
        senderId: userId,
        type,
        content,
        mediaUrl,
        mediaCaption,
        direction: 'OUTBOUND',
        status: 'PENDING',
        templateParams: templateParams ? JSON.stringify(templateParams) : null,
        repliedToId: replyToId,
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date(), unreadCount: 0 },
    });

    // In production: send via WhatsApp Business API
    // await sendWhatsAppMessage(conversation.instanceId, message);

    // Emit real-time event
    app.emitToConversation?.(id, 'message:created', { message, conversationId: id });
    app.emitToTenant?.(tenantId, 'message:created', { message, conversationId: id });

    await logAudit(request, 'MESSAGE_SENT', { conversationId: id, messageId: message.id });

    return reply.status(201).send({ message });
  });

  // POST /conversations/:id/read - Mark messages as read
  app.post('/:id/read', { preHandler: [app.requirePermission('conversations:update')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { messageIds } = request.body as { messageIds?: string[] };
    const tenantId = request.tenant!.id;

    const conversation = await prisma.conversation.findFirst({ where: { id, tenantId } });
    if (!conversation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Conversa não encontrada' } });
    }

    const where: any = { conversationId: id, direction: 'INBOUND', status: { in: ['RECEIVED', 'DELIVERED'] } };
    if (messageIds) where.id = { in: messageIds };

    await prisma.message.updateMany({ where, data: { status: 'READ', readAt: new Date() } });

    // Reset unread count
    await prisma.conversation.update({ where: { id }, data: { unreadCount: 0 } });

    app.emitToConversation?.(id, 'conversation:read', { conversationId: id });

    return { message: 'Mensagens marcadas como lidas' };
  });

  // DELETE /conversations/:id - Delete conversation (soft close)
  app.delete('/:id', { preHandler: [app.requirePermission('conversations:delete')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const conversation = await prisma.conversation.findFirst({ where: { id, tenantId } });
    if (!conversation) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Conversa não encontrada' } });
    }

    await prisma.conversation.update({ where: { id }, data: { status: 'CLOSED' } });

    await logAudit(request, 'CONVERSATION_DELETED', { conversationId: id });

    return { message: 'Conversa fechada' };
  });
}

async function logAudit(request: any, action: string, metadata: Record<string, any>) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: request?.tenant?.id,
        userId: request?.user?.id,
        action,
        description: `${action} - ${metadata.conversationId || metadata.messageId || 'unknown'}`,
        metadata: JSON.stringify({ ...metadata, ip: request?.ip, userAgent: request?.headers?.['user-agent'] }),
        ip: request?.ip,
        userAgent: request?.headers?.['user-agent'],
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}