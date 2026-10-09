import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES, CONTACT_STATUS, CONTACT_SOURCE } from '@zapti/shared/constants';
import { PaginationQuerySchema, IdParamSchema, SearchQuerySchema } from '@zapti/shared/validation';
import { broadcastToWebsocket } from '@zapti/shared/notification';

declare module 'fastify' {
  interface FastifyRequest {
    tenant: any;
    user: any;
  }
}

export async function contactRoutes(fastify: FastifyInstance): Promise<void> {
  // List contacts
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: PaginationQuerySchema.merge(SearchQuerySchema).extend({
        status: z.nativeEnum(CONTACT_STATUS).optional(),
        source: z.nativeEnum(CONTACT_SOURCE).optional(),
        groupId: z.string().cuid().optional(),
        tags: z.array(z.string()).optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    const { page, limit, sortBy, sortOrder, q, status, source, groupId, tags } = request.query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: request.tenant.id };
    if (status) where.status = status;
    if (source) where.source = source;
    if (groupId) where.groups = { some: { groupId } };
    if (tags && tags.length > 0) where.tags = { hasEvery: tags };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
        { document: { contains: q } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        include: {
          groups: { include: { group: { select: { id: true, name: true } } } },
          _count: { select: { conversations: true, tickets: true } },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: contacts,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  // Get contact by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const contact = await prisma.contact.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
      include: {
        groups: { include: { group: true } },
        conversations: {
          take: 10,
          orderBy: { updatedAt: 'desc' },
          include: { assignedTo: { select: { id: true, name: true } } },
        },
        tickets: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { assignedTo: { select: { id: true, name: true } } },
        },
        _count: { select: { conversations: true, tickets: true, messages: true } },
      },
    });

    if (!contact) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Contact not found' },
      });
    }

    return reply.send({ success: true, data: contact });
  });

  // Create contact
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.object({
        name: z.string().max(100).optional(),
        phone: z.string().min(10).max(20),
        email: z.string().email().optional(),
        document: z.string().optional(),
        status: z.nativeEnum(CONTACT_STATUS).optional(),
        source: z.nativeEnum(CONTACT_SOURCE).optional(),
        tags: z.array(z.string()).optional(),
        customFields: z.record(z.unknown()).optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const { name, phone, email, document, status, source, tags, customFields } = request.body;

    // Check if contact with this phone already exists
    const existingContact = await prisma.contact.findFirst({
      where: { tenantId: request.tenant.id, phone },
    });

    if (existingContact) {
      return reply.status(409).send({
        success: false,
        error: { code: ERROR_CODES.CONFLICT, message: 'Contact with this phone number already exists' },
      });
    }

    const contact = await prisma.contact.create({
      data: {
        tenantId: request.tenant.id,
        name,
        phone,
        email,
        document,
        status: status || 'ACTIVE',
        source: source || 'MANUAL',
        tags: tags || [],
        customFields: customFields || {},
      },
      include: { groups: { include: { group: true } } },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'CONTACT_CREATE',
        entityType: 'Contact',
        entityId: contact.id,
        newData: { name, phone, email, status, source },
      },
    });

    // Broadcast
    broadcastToWebsocket(
      (global as any).io,
      'contact:create',
      { contact },
      `tenant:${request.tenant.id}`
    );

    return reply.status(201).send({ success: true, data: contact });
  });

  // Update contact
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        name: z.string().max(100).optional(),
        email: z.string().email().optional(),
        document: z.string().optional(),
        status: z.nativeEnum(CONTACT_STATUS).optional(),
        source: z.nativeEnum(CONTACT_SOURCE).optional(),
        tags: z.array(z.string()).optional(),
        customFields: z.record(z.unknown()).optional(),
        avatar: z.string().url().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    const contact = await prisma.contact.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!contact) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Contact not found' },
      });
    }

    // Don't allow phone number change if it would create a duplicate
    // Phone changes not allowed via this endpoint

    const updateData: any = { ...request.body };
    if (request.body.customFields) {
      updateData.customFields = { ...contact.customFields, ...request.body.customFields };
    }

    const updatedContact = await prisma.contact.update({
      where: { id: contact.id },
      data: updateData,
      include: { groups: { include: { group: true } } },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'CONTACT_UPDATE',
        entityType: 'Contact',
        entityId: contact.id,
        newData: request.body,
      },
    });

    // Broadcast
    broadcastToWebsocket(
      (global as any).io,
      'contact:update',
      { contact: updatedContact },
      `tenant:${request.tenant.id}`
    );

    return reply.send({ success: true, data: updatedContact });
  });

  // Delete contact
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const contact = await prisma.contact.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!contact) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Contact not found' },
      });
    }

    // Check for active conversations/tickets
    const [activeConversations, activeTickets] = await Promise.all([
      prisma.conversation.count({ where: { contactId: contact.id, status: { not: 'CLOSED' } } }),
      prisma.ticket.count({ where: { contactId: contact.id, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
    ]);

    if (activeConversations > 0 || activeTickets > 0) {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.CONFLICT,
          message: 'Contact has active conversations or tickets'
        },
      });
    }

    await prisma.contact.delete({ where: { id: contact.id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'CONTACT_DELETE',
        entityType: 'Contact',
        entityId: contact.id,
      },
    });

    // Broadcast
    broadcastToWebsocket(
      (global as any).io,
      'contact:delete',
      { contactId: contact.id },
      `tenant:${request.tenant.id}`
    );

    return reply.send({ success: true, message: 'Contact deleted' });
  });

  // Bulk create contacts
  fastify.post('/bulk', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.object({
        contacts: z.array(z.object({
          name: z.string().max(100).optional(),
          phone: z.string().min(10).max(20),
          email: z.string().email().optional(),
          document: z.string().optional(),
          status: z.nativeEnum(CONTACT_STATUS).optional(),
          source: z.nativeEnum(CONTACT_SOURCE).optional(),
          tags: z.array(z.string()).optional(),
          customFields: z.record(z.unknown()).optional(),
        })).min(1).max(1000),
      }),
    },
  }, async (request: FastifyRequest<{ Body: { contacts: any[] } }>, reply: FastifyReply) => {
    const results = { created: 0, updated: 0, errors: [] as any[] };

    for (const contactData of request.body.contacts) {
      try {
        const existingContact = await prisma.contact.findFirst({
          where: { tenantId: request.tenant.id, phone: contactData.phone },
        });

        if (existingContact) {
          // Update existing
          await prisma.contact.update({
            where: { id: existingContact.id },
            data: {
              name: contactData.name || existingContact.name,
              email: contactData.email || existingContact.email,
              document: contactData.document || existingContact.document,
              status: contactData.status || existingContact.status,
              tags: contactData.tags ? [...new Set([...existingContact.tags, ...contactData.tags])] : existingContact.tags,
              customFields: contactData.customFields ? { ...existingContact.customFields, ...contactData.customFields } : existingContact.customFields,
            },
          });
          results.updated++;
        } else {
          // Create new
          await prisma.contact.create({
            data: {
              tenantId: request.tenant.id,
              ...contactData,
              status: contactData.status || 'ACTIVE',
              source: contactData.source || 'MANUAL',
            },
          });
          results.created++;
        }
      } catch (error: any) {
        results.errors.push({ phone: contactData.phone, error: error.message });
      }
    }

    return reply.send({ success: true, data: results });
  });

  // Bulk update contact tags
  fastify.patch('/bulk/tags', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.object({
        contactIds: z.array(z.string().cuid()).min(1).max(1000),
        tags: z.array(z.string()),
        action: z.enum(['add', 'remove', 'replace']),
      }),
    },
  }, async (request: FastifyRequest<{ Body: { contactIds: string[]; tags: string[]; action: string } }>, reply: FastifyReply) => {
    const { contactIds, tags, action } = request.body;

    const contacts = await prisma.contact.findMany({
      where: { id: { in: contactIds }, tenantId: request.tenant.id },
    });

    for (const contact of contacts) {
      let newTags = contact.tags;
      if (action === 'add') {
        newTags = [...new Set([...contact.tags, ...tags])];
      } else if (action === 'remove') {
        newTags = contact.tags.filter(t => !tags.includes(t));
      } else if (action === 'replace') {
        newTags = tags;
      }

      await prisma.contact.update({
        where: { id: contact.id },
        data: { tags: newTags },
      });
    }

    return reply.send({ success: true, message: `Updated ${contacts.length} contacts` });
  });

  // Get contact tags
  fastify.get('/tags/list', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const contacts = await prisma.contact.findMany({
      where: { tenantId: request.tenant.id },
      select: { tags: true },
    });

    const tagCounts: Record<string, number> = {};
    for (const contact of contacts) {
      for (const tag of contact.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    const tags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    return reply.send({ success: true, data: tags });
  });

  // Get contact stats
  fastify.get('/stats/overview', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const baseWhere = { tenantId: request.tenant.id };

    const [total, active, inactive, blocked, bySource, byStatus, withEmail, withDocument] = await Promise.all([
      prisma.contact.count({ where: baseWhere }),
      prisma.contact.count({ where: { ...baseWhere, status: 'ACTIVE' } }),
      prisma.contact.count({ where: { ...baseWhere, status: 'INACTIVE' } }),
      prisma.contact.count({ where: { ...baseWhere, status: 'BLOCKED' } }),
      prisma.contact.groupBy({ by: ['source'], where: baseWhere, _count: true }),
      prisma.contact.groupBy({ by: ['status'], where: baseWhere, _count: true }),
      prisma.contact.count({ where: { ...baseWhere, email: { not: null } } }),
      prisma.contact.count({ where: { ...baseWhere, document: { not: null } } }),
    ]);

    return reply.send({
      success: true,
      data: {
        total,
        active,
        inactive,
        blocked,
        bySource: bySource.reduce((acc, item) => ({ ...acc, [item.source]: item._count }), {}),
        byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
        withEmail,
        withDocument,
      },
    });
  });
}