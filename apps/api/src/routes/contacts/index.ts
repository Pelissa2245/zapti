// ZapTI API — Contact Routes
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@zapti/database';
import { toJsonSchema } from '../../utils/zod-to-json-schema.js';

const createContactSchema = z.object({
  phoneNumber: z.string().min(10).max(20),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.any()).default({}),
  source: z.enum(['MANUAL', 'WHATSAPP', 'IMPORT', 'API']).default('MANUAL'),
  instanceId: z.string().optional(),
});

const createContactSchemaJson = toJsonSchema(createContactSchema);

const updateContactSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  isBlocked: z.boolean().optional(),
});

const updateContactSchemaJson = toJsonSchema(updateContactSchema);

const listContactsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isBlocked: z.coerce.boolean().optional(),
  optedOut: z.coerce.boolean().optional(),
  instanceId: z.string().optional(),
  sortBy: z.enum(['name', 'phoneNumber', 'createdAt', 'updatedAt', 'lastMessageAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const listContactsQuerySchemaJson = toJsonSchema(listContactsQuerySchema);

const importContactsSchema = z.object({
  contacts: z.array(z.object({
    phoneNumber: z.string().min(10).max(20),
    name: z.string().optional(),
    email: z.string().email().optional(),
    tags: z.array(z.string()).default([]),
    customFields: z.record(z.any()).default({}),
  })).min(1).max(5000),
  skipDuplicates: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
});

const importContactsSchemaJson = toJsonSchema(importContactsSchema);

export async function contactRoutes(app: FastifyInstance) {
  // GET /contacts - List contacts
  app.get('/', {
    preHandler: [app.requirePermission('contacts:read')],
    schema: { querystring: listContactsQuerySchemaJson },
  }, async (request) => {
    const { page, limit, search, tags, isBlocked, optedOut, instanceId, sortBy, sortOrder } = request.query as z.infer<typeof listContactsQuerySchema>;
    const tenantId = request.tenant!.id;

    const where: any = { tenantId };
    if (isBlocked !== undefined) where.isBlocked = isBlocked;
    if (optedOut !== undefined) where.optedOut = optedOut;
    if (instanceId) where.instanceId = instanceId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          _count: { select: { conversations: true, tickets: true } },
          instance: { select: { id: true, name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.contact.count({ where }),
    ]);

    return { data: contacts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  });

  // GET /contacts/stats - Contact statistics
  app.get('/stats', { preHandler: [app.requirePermission('contacts:read')] }, async (request) => {
    const tenantId = request.tenant!.id;

    const [total, blocked, withEmail, bySource, recent] = await Promise.all([
      prisma.contact.count({ where: { tenantId } }),
      prisma.contact.count({ where: { tenantId, isBlocked: true } }),
      prisma.contact.count({ where: { tenantId, email: { not: null } } }),
      Promise.resolve([]), // source grouping not available in schema
      prisma.contact.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    return {
      stats: {
        total,
        blocked,
        optedOut: 0,
        withEmail,
        bySource: [],
        recent,
      },
    };
  });

  // GET /contacts/tags - Get all tags
  app.get('/tags', { preHandler: [app.requirePermission('contacts:read')] }, async (request) => {
    const tenantId = request.tenant!.id;

    const contacts = await prisma.contact.findMany({
      where: { tenantId },
      select: { tags: true },
    });

    const tagCount = new Map<string, number>();
    contacts.forEach((c) => {
      try {
        const tags = JSON.parse(c.tags || '[]');
        tags.forEach((tag: string) => tagCount.set(tag, (tagCount.get(tag) || 0) + 1));
      } catch {
        // Ignore malformed legacy tag JSON and continue with valid contacts.
      }
    });

    return { tags: Array.from(tagCount.entries()).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count) };
  });

  // GET /contacts/:id - Get contact details
  app.get('/:id', { preHandler: [app.requirePermission('contacts:read')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const contact = await prisma.contact.findFirst({
      where: { id, tenantId },
      include: {
        instance: { select: { id: true, name: true, phoneNumber: true } },
        conversations: { include: { assignee: { select: { id: true, name: true } }, team: { select: { id: true, name: true } } }, orderBy: { updatedAt: 'desc' }, take: 10 },
        tickets: { include: { category: true, assignee: { select: { id: true, name: true } } }, orderBy: { updatedAt: 'desc' }, take: 10 },
      },
    });

    if (!contact) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Contato não encontrado' } });
    }

    return { contact };
  });

  // POST /contacts - Create contact
  app.post('/', {
    preHandler: [app.requirePermission('contacts:create')],
    schema: { body: createContactSchemaJson },
  }, async (request, reply) => {
    const { phoneNumber, name, email, avatarUrl, tags, customFields, source, instanceId } = request.body as z.infer<typeof createContactSchema>;
    const tenantId = request.tenant!.id;

    const normalizedPhone = phoneNumber.replace(/\D/g, '');

    // Check for duplicate
    const existing = await prisma.contact.findFirst({ where: { tenantId, phoneNumber: normalizedPhone } });
    if (existing) {
      return reply.status(409).send({ error: { code: 'DUPLICATE_PHONE', message: 'Contato com este telefone já existe', existingId: existing.id } });
    }

    const contact = await prisma.contact.create({
      data: {
        tenantId,
        phoneNumber: normalizedPhone,
        name: name || normalizedPhone,
        email,
        profilePicUrl: avatarUrl,
        tags: JSON.stringify(tags || []),
        metadata: JSON.stringify(customFields || {}),
        instanceId: instanceId || '',
      },
    });

    await logAudit(request, 'CONTACT_CREATED', { contactId: contact.id, phoneNumber: normalizedPhone });

    return reply.status(201).send({ contact });
  });

  // PATCH /contacts/:id - Update contact
  app.patch('/:id', {
    preHandler: [app.requirePermission('contacts:update')],
    schema: { body: updateContactSchemaJson },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const contact = await prisma.contact.findFirst({ where: { id, tenantId } });
    if (!contact) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Contato não encontrado' } });
    }

    const { name, email, avatarUrl, tags, customFields, isBlocked } = request.body as z.infer<typeof updateContactSchema>;
    const updated = await prisma.contact.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(avatarUrl !== undefined && { profilePicUrl: avatarUrl }),
        ...(tags !== undefined && { tags: JSON.stringify(tags) }),
        ...(customFields !== undefined && { metadata: JSON.stringify(customFields) }),
        ...(isBlocked !== undefined && { isBlocked }),
      }
    });

    await logAudit(request, 'CONTACT_UPDATED', { contactId: id, changes: Object.keys(request.body as Record<string, any>) });

    return { contact: updated };
  });

  // DELETE /contacts/:id - Delete contact
  app.delete('/:id', { preHandler: [app.requirePermission('contacts:delete')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const contact = await prisma.contact.findFirst({ where: { id, tenantId } });
    if (!contact) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Contato não encontrado' } });
    }

    // Check if has active conversations
    const activeConversations = await prisma.conversation.count({
      where: { contactId: id, tenantId, status: { in: ['OPEN', 'PENDING', 'SNOOZED'] } },
    });

    if (activeConversations > 0) {
      return reply.status(400).send({ error: { code: 'HAS_ACTIVE_CONVERSATIONS', message: 'Contato tem conversas ativas' } });
    }

    await prisma.contact.delete({ where: { id } });

    await logAudit(request, 'CONTACT_DELETED', { contactId: id });

    return { message: 'Contato deletado' };
  });

  // POST /contacts/import - Bulk import contacts
  app.post('/import', {
    preHandler: [app.requirePermission('contacts:import')],
    schema: { body: importContactsSchemaJson },
  }, async (request, reply) => {
    const { contacts, skipDuplicates, updateExisting } = request.body as z.infer<typeof importContactsSchema>;
    const tenantId = request.tenant!.id;
    const userId = request.user!.id;

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (const c of contacts) {
      try {
        const normalizedPhone = c.phoneNumber.replace(/\D/g, '');

        const existing = await prisma.contact.findFirst({ where: { tenantId, phoneNumber: normalizedPhone } });

        if (existing) {
          if (skipDuplicates && !updateExisting) {
            skipped++;
            continue;
          }

          if (updateExisting) {
            await prisma.contact.update({
              where: { id: existing.id },
              data: { name: c.name, email: c.email, tags: JSON.stringify(c.tags || []), metadata: JSON.stringify(c.customFields || {}) },
            });
            updated++;
          } else {
            skipped++;
          }
        } else {
          await prisma.contact.create({
            data: { tenantId, phoneNumber: normalizedPhone, name: c.name || normalizedPhone, email: c.email, tags: JSON.stringify(c.tags || []), metadata: JSON.stringify(c.customFields || {}), instanceId: '' },
          });
          created++;
        }
      } catch (err: any) {
        errors.push({ phoneNumber: c.phoneNumber, error: err.message });
      }
    }

    await logAudit(request, 'CONTACTS_IMPORTED', { created, updated, skipped, errorCount: errors.length });

    return { created, updated, skipped, errors };
  });

  // POST /contacts/:id/block - Block contact
  app.post('/:id/block', { preHandler: [app.requirePermission('contacts:update')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const contact = await prisma.contact.findFirst({ where: { id, tenantId } });
    if (!contact) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Contato não encontrado' } });
    }

    await prisma.contact.update({ where: { id }, data: { isBlocked: true } });

    await logAudit(request, 'CONTACT_BLOCKED', { contactId: id });

    return { message: 'Contato bloqueado' };
  });

  // POST /contacts/:id/unblock - Unblock contact
  app.post('/:id/unblock', { preHandler: [app.requirePermission('contacts:update')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const contact = await prisma.contact.findFirst({ where: { id, tenantId } });
    if (!contact) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Contato não encontrado' } });
    }

    await prisma.contact.update({ where: { id }, data: { isBlocked: false } });

    await logAudit(request, 'CONTACT_UNBLOCKED', { contactId: id });

    return { message: 'Contato desbloqueado' };
  });

  // GET /contacts/:id/conversations - Get contact conversations
  app.get('/:id/conversations', { preHandler: [app.requirePermission('contacts:read')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { page = 1, limit = 20 } = request.query as { page?: string; limit?: string };
    const tenantId = request.tenant!.id;

    const contact = await prisma.contact.findFirst({ where: { id, tenantId } });
    if (!contact) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Contato não encontrado' } });
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: { contactId: id, tenantId },
        include: { instance: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true } } },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.conversation.count({ where: { contactId: id, tenantId } }),
    ]);

    return { data: conversations, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } };
  });
}

async function logAudit(request: any, action: string, metadata: Record<string, any>) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: request?.tenant?.id,
        userId: request?.user?.id,
        action,
        description: `${action} - ${metadata.contactId || 'unknown'}`,
        metadata: JSON.stringify({ ...metadata, ip: request?.ip || 'unknown', userAgent: request?.headers?.['user-agent'] || 'unknown' }),
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
