// ZapTI API — WhatsApp Routes
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@zapti/database';
import { toJsonSchema } from '../../utils/zod-to-json-schema.js';

const createInstanceSchema = z.object({
  name: z.string().min(1).max(100),
  phoneNumber: z.string().optional(),
  webhookUrl: z.string().url().optional(),
});

const createInstanceSchemaJson = toJsonSchema(createInstanceSchema);

const updateInstanceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  webhookUrl: z.string().url().optional().nullable(),
  autoReply: z.boolean().optional(),
  autoReplyMessage: z.string().optional(),
  businessHours: z.object({
    enabled: z.boolean(),
    timezone: z.string(),
    schedule: z.record(z.array(z.object({ start: z.string(), end: z.string() }))),
  }).optional(),
});

const updateInstanceSchemaJson = toJsonSchema(updateInstanceSchema);

const connectSchema = z.object({
  phoneNumber: z.string().optional(),
});

const connectSchemaJson = toJsonSchema(connectSchema);

const sendMessageSchema = z.object({
  to: z.string().min(10).max(20),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER', 'LOCATION', 'CONTACT', 'TEMPLATE']),
  content: z.string(),
  mediaUrl: z.string().url().optional(),
  mediaCaption: z.string().optional(),
  templateName: z.string().optional(),
  templateParams: z.array(z.string()).optional(),
});

const sendMessageSchemaJson = toJsonSchema(sendMessageSchema);

const listInstancesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['DISCONNECTED', 'CONNECTING', 'QR_CODE', 'CONNECTED', 'ERROR']).optional(),
});

const listInstancesQuerySchemaJson = toJsonSchema(listInstancesQuerySchema);

export async function whatsappRoutes(app: FastifyInstance) {
  // GET /whatsapp/instances - List instances
  app.get('/instances', {
    preHandler: [app.requirePermission('whatsapp:read')],
    schema: { querystring: listInstancesQuerySchemaJson },
  }, async (request) => {
    const { page, limit, status } = request.query as z.infer<typeof listInstancesQuerySchema>;
    const tenantId = request.tenant!.id;

    const where: any = { tenantId };
    if (status) where.status = status;

    const [instances, total] = await Promise.all([
      prisma.whatsAppInstance.findMany({
        where,
        include: { _count: { select: { conversations: true, messages: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.whatsAppInstance.count({ where }),
    ]);

    return { data: instances, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  });

  // GET /whatsapp/instances/stats - Instance statistics
  app.get('/instances/stats', { preHandler: [app.requirePermission('whatsapp:read')] }, async (request) => {
    const tenantId = request.tenant!.id;

    const [total, connected, disconnected, totalMessages, todayMessages] = await Promise.all([
      prisma.whatsAppInstance.count({ where: { tenantId } }),
      prisma.whatsAppInstance.count({ where: { tenantId, status: 'CONNECTED' } }),
      prisma.whatsAppInstance.count({ where: { tenantId, status: { in: ['DISCONNECTED', 'ERROR'] } } }),
      prisma.message.count({ where: { tenantId, direction: 'OUTBOUND' } }),
      prisma.message.count({
        where: { tenantId, direction: 'OUTBOUND', createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);

    return {
      stats: {
        total,
        connected,
        disconnected,
        totalMessages,
        todayMessages,
      },
    };
  });

  // GET /whatsapp/instances/:id - Get instance details
  app.get('/instances/:id', { preHandler: [app.requirePermission('whatsapp:read')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const instance = await prisma.whatsAppInstance.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { conversations: true, messages: true } },
      },
    });

    if (!instance) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Instância não encontrada' } });
    }

    // Don't return sensitive data
    const { accessToken, ...safeInstance } = instance as any;

    return { instance: safeInstance };
  });

  // POST /whatsapp/instances - Create instance
  app.post('/instances', {
    preHandler: [app.requirePermission('whatsapp:create')],
    schema: { body: createInstanceSchemaJson },
  }, async (request, reply) => {
    const { name, phoneNumber, webhookUrl } = request.body as { name: string; phoneNumber?: string; webhookUrl?: string };
    const tenantId = request.tenant!.id;

    // Check instance limit
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const settings = tenant?.settings ? JSON.parse(tenant.settings) : {};
    const maxInstances = settings.maxInstances || 5;
    const count = await prisma.whatsAppInstance.count({ where: { tenantId } });
    if (count >= maxInstances) {
      return reply.status(400).send({ error: { code: 'INSTANCE_LIMIT', message: `Limite de ${maxInstances} instâncias atingido` } });
    }

    const instance = await prisma.whatsAppInstance.create({
      data: {
        tenantId,
        name,
        phoneNumber,
        webhookUrl,
        status: 'DISCONNECTED',
        settings: JSON.stringify({}),
        encryptionKey: `enc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      },
    });

    await logAudit(request, 'WHATSAPP_INSTANCE_CREATED', { instanceId: instance.id, name });

    return reply.status(201).send({ instance });
  });

  // PATCH /whatsapp/instances/:id - Update instance
  app.patch('/instances/:id', {
    preHandler: [app.requirePermission('whatsapp:update')],
    schema: { body: updateInstanceSchemaJson },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const instance = await prisma.whatsAppInstance.findFirst({ where: { id, tenantId } });
    if (!instance) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Instância não encontrada' } });
    }

    const { profileName, ...updateData } = request.body as any;
    const updated = await prisma.whatsAppInstance.update({ where: { id }, data: updateData });

    await logAudit(request, 'WHATSAPP_INSTANCE_UPDATED', { instanceId: id, changes: Object.keys(request.body as object) });

    return { instance: updated };
  });

  // POST /whatsapp/instances/:id/connect - Connect instance (generate QR)
  app.post('/instances/:id/connect', {
    preHandler: [app.requirePermission('whatsapp:connect')],
    schema: { body: connectSchemaJson },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const instance = await prisma.whatsAppInstance.findFirst({ where: { id, tenantId } });
    if (!instance) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Instância não encontrada' } });
    }

    if (instance.status === 'CONNECTED') {
      return reply.status(400).send({ error: { code: 'ALREADY_CONNECTED', message: 'Instância já está conectada' } });
    }

    // In production: call WhatsApp Business API to generate QR code
    // For now, simulate QR code generation
    const qrCode = `qr_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    await prisma.whatsAppInstance.update({
      where: { id },
      data: {
        status: 'QR_CODE',
        qrCode: qrCode,
      },
    });

    await logAudit(request, 'WHATSAPP_INSTANCE_CONNECT', { instanceId: id });

    return { qrCode, expiresAt: new Date(Date.now() + 5 * 60 * 1000) };
  });

  // POST /whatsapp/instances/:id/disconnect - Disconnect instance
  app.post('/instances/:id/disconnect', { preHandler: [app.requirePermission('whatsapp:connect')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const instance = await prisma.whatsAppInstance.findFirst({ where: { id, tenantId } });
    if (!instance) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Instância não encontrada' } });
    }

    // In production: call WhatsApp Business API to disconnect
    await prisma.whatsAppInstance.update({
      where: { id },
      data: { status: 'DISCONNECTED', qrCode: null, phoneNumber: null },
    });

    await logAudit(request, 'WHATSAPP_INSTANCE_DISCONNECT', { instanceId: id });

    return { message: 'Instância desconectada' };
  });

  // DELETE /whatsapp/instances/:id - Delete instance
  app.delete('/instances/:id', { preHandler: [app.requirePermission('whatsapp:delete')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const instance = await prisma.whatsAppInstance.findFirst({ where: { id, tenantId } });
    if (!instance) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Instância não encontrada' } });
    }

    if (instance.status === 'CONNECTED') {
      return reply.status(400).send({ error: { code: 'INSTANCE_CONNECTED', message: 'Desconecte a instância antes de deletar' } });
    }

    await prisma.whatsAppInstance.delete({ where: { id } });

    await logAudit(request, 'WHATSAPP_INSTANCE_DELETED', { instanceId: id });

    return { message: 'Instância deletada' };
  });

  // GET /whatsapp/instances/:id/qr - Get current QR code
  app.get('/instances/:id/qr', { preHandler: [app.requirePermission('whatsapp:read')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const instance = await prisma.whatsAppInstance.findFirst({
      where: { id, tenantId },
    });

    if (!instance) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Instância não encontrada' } });
    }

    if (!instance.qrCode) {
      return reply.status(404).send({ error: { code: 'QR_EXPIRED', message: 'QR Code não disponível' } });
    }

    return { qrCode: instance.qrCode, expiresAt: new Date(Date.now() + 5 * 60 * 1000) };
  });

  // POST /whatsapp/instances/:id/send - Send message
  app.post('/instances/:id/send', {
    preHandler: [app.requirePermission('whatsapp:send')],
    schema: { body: sendMessageSchemaJson },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { to, type, content, mediaUrl, mediaCaption, templateName, templateParams } = request.body as z.infer<typeof sendMessageSchema>;
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    const instance = await prisma.whatsAppInstance.findFirst({ where: { id, tenantId, status: 'CONNECTED' } });
    if (!instance) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Instância não encontrada ou não conectada' } });
    }

    // Find or create contact
    const normalizedPhone = to.replace(/\D/g, '');
    let contact = await prisma.contact.findFirst({ where: { tenantId, instanceId: id, phoneNumber: normalizedPhone } });

    if (!contact) {
      contact = await prisma.contact.create({
        data: { tenantId, instanceId: id, phoneNumber: normalizedPhone, name: to },
      });
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: { tenantId, instanceId: id, contactId: contact.id, status: { in: ['OPEN', 'PENDING', 'SNOOZED'] } },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { tenantId, instanceId: id, contactId: contact.id, status: 'OPEN' },
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        tenantId,
        conversationId: conversation.id,
        instanceId: id,
        contactId: contact.id,
        type,
        content,
        mediaUrl,
        mediaCaption,
        direction: 'OUTBOUND',
        status: 'PENDING',
        templateParams: templateParams ? JSON.stringify(templateParams) : null,
      },
    });

    // In production: send via WhatsApp Business API
    // await sendWhatsAppMessage(instance, message);

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), unreadCount: { increment: 0 } }, // Outbound doesn't increment unread
    });

    // Emit real-time event
    app.emitToConversation?.(conversation.id, 'message:created', { message, conversationId: conversation.id });
    app.emitToTenant?.(tenantId, 'message:created', { message, conversationId: conversation.id });

    await logAudit(request, 'WHATSAPP_MESSAGE_SENT', { instanceId: id, messageId: message.id, contactId: contact.id });

    return reply.status(201).send({ message });
  });

  // POST /whatsapp/webhook - Webhook endpoint for WhatsApp
  app.post('/webhook', { config: { rateLimit: { max: 100, timeWindow: 60 * 1000 } } }, async (request, reply) => {
    // Verify webhook signature if configured
    const tenantId = request.headers['x-tenant-id'] as string;
    const instanceId = request.headers['x-instance-id'] as string;

    if (!tenantId || !instanceId) {
      return reply.status(400).send({ error: { code: 'MISSING_HEADERS', message: 'Headers x-tenant-id e x-instance-id obrigatórios' } });
    }

    const instance = await prisma.whatsAppInstance.findFirst({ where: { id: instanceId, tenantId } });
    if (!instance) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Instância não encontrada' } });
    }

    // Process webhook payload
    await processWebhook(instance, request.body, app);

    return { received: true };
  });

  // GET /whatsapp/instances/:id/messages - List messages
  app.get('/instances/:id/messages', { preHandler: [app.requirePermission('whatsapp:read')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { page = 1, limit = 50, direction, type, status } = request.query as { page?: string; limit?: string; direction?: string; type?: string; status?: string };
    const tenantId = request.tenant!.id;

    const instance = await prisma.whatsAppInstance.findFirst({ where: { id, tenantId } });
    if (!instance) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Instância não encontrada' } });
    }

    const where: any = { instanceId: id };
    if (direction) where.direction = direction;
    if (type) where.type = type;
    if (status) where.status = status;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: { contact: { select: { id: true, name: true, phoneNumber: true } }, conversation: { select: { id: true } } },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.message.count({ where }),
    ]);

    return { data: messages, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } };
  });

  // POST /whatsapp/instances/:id/read - Mark messages as read
  app.post('/instances/:id/read', { preHandler: [app.requirePermission('whatsapp:update')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { messageIds } = request.body as { messageIds: string[] };
    const tenantId = request.tenant!.id;

    const instance = await prisma.whatsAppInstance.findFirst({ where: { id, tenantId } });
    if (!instance) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Instância não encontrada' } });
    }

    await prisma.message.updateMany({
      where: { id: { in: messageIds }, instanceId: id, direction: 'INBOUND' },
      data: { status: 'READ', readAt: new Date() },
    });

    return { message: 'Mensagens marcadas como lidas' };
  });
}

async function processWebhook(instance: any, payload: any, app: FastifyInstance) {
  // Process WhatsApp Business API webhook
  // This is a simplified version - production would handle all event types

  const { entry } = payload;
  if (!entry || !Array.isArray(entry)) return;

  for (const e of entry) {
    const { changes } = e;
    if (!changes || !Array.isArray(changes)) continue;

    for (const change of changes) {
      const { value } = change;
      if (!value) continue;

      // Messages
      if (value.messages) {
        for (const msg of value.messages) {
          await handleIncomingMessage(instance, value, msg, app);
        }
      }

      // Status updates
      if (value.statuses) {
        for (const status of value.statuses) {
          await handleStatusUpdate(instance, status);
        }
      }
    }
  }
}

async function handleIncomingMessage(instance: any, value: any, msg: any, app: FastifyInstance) {
  const tenantId = instance.tenantId;
  const contactPhone = msg.from.replace(/\D/g, '');

  // Find or create contact
  let contact = await prisma.contact.findFirst({ where: { tenantId, instanceId: instance.id, phoneNumber: contactPhone } });
  if (!contact) {
    contact = await prisma.contact.create({
      data: { tenantId, instanceId: instance.id, phoneNumber: contactPhone, name: value.contacts?.[0]?.profile?.name || contactPhone },
    });
  }

  // Find or create conversation
  let conversation = await prisma.conversation.findFirst({
    where: { tenantId, instanceId: instance.id, contactId: contact.id, status: { in: ['OPEN', 'PENDING', 'SNOOZED'] } },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { tenantId, instanceId: instance.id, contactId: contact.id, status: 'OPEN', unreadCount: 1 },
    });
  } else {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), unreadCount: { increment: 1 }, status: 'OPEN' },
    });
  }

  // Create message
  const message = await prisma.message.create({
    data: {
      tenantId,
      conversationId: conversation.id,
      instanceId: instance.id,
      contactId: contact.id,
      type: msg.type.toUpperCase(),
      content: msg.text?.body || msg.image?.caption || msg.video?.caption || msg.document?.caption || msg.audio?.caption || '',
      mediaUrl: msg.image?.id || msg.video?.id || msg.document?.id || msg.audio?.id || msg.sticker?.id,
      mediaType: msg.image?.mime_type || msg.video?.mime_type || msg.document?.mime_type || msg.audio?.mime_type,
      direction: 'INBOUND',
      status: 'RECEIVED',
      externalId: msg.id,
    },
  });

  // Trigger automations
  app.triggerAutomation?.('MESSAGE_RECEIVED', { message, conversation, contact, instance }, tenantId, app);

  // Emit real-time events
  app.emitToConversation?.(conversation.id, 'message:created', { message, conversationId: conversation.id });
  app.emitToTenant?.(tenantId, 'message:created', { message, conversationId: conversation.id });
  app.emitToConversation?.(conversation.id, 'conversation:updated', { conversationId: conversation.id, unreadCount: conversation.unreadCount + 1 });
}

async function handleStatusUpdate(instance: any, status: any) {
  await prisma.message.updateMany({
    where: { externalId: status.id, instanceId: instance.id },
    data: { status: status.status.toUpperCase(), deliveredAt: status.status === 'delivered' ? new Date() : undefined, readAt: status.status === 'read' ? new Date() : undefined },
  });
}

async function logAudit(request: any, action: string, metadata: Record<string, any>) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: request?.tenant?.id,
        userId: request?.user?.id,
        action,
        description: `${action} - ${metadata.instanceId || metadata.messageId || 'unknown'}`,
        metadata: JSON.stringify(metadata),
        ip: request?.ip,
        userAgent: request?.headers?.['user-agent'],
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}