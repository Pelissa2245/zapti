import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES } from '@zapti/shared/constants';
import { PaginationQuerySchema, IdParamSchema, SearchQuerySchema } from '@zapti/shared/validation';
import { broadcastToWebsocket } from '@zapti/shared/notification';


export async function contactRoutes(fastify: FastifyInstance): Promise<void> {
  // List contacts
  fastify.get<{
    Querystring: z.infer<typeof PaginationQuerySchema> & z.infer<typeof SearchQuerySchema> & { groupId?: string; tags?: string[] }
  }>('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: PaginationQuerySchema.merge(SearchQuerySchema).extend({
        groupId: z.string().cuid().optional(),
        tags: z.array(z.string()).optional(),
      }),
    },
  }, async (request, reply) => {
    const { page, limit, sortBy, sortOrder, q, groupId, tags } = request.query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: request.tenant!.id };
    if (groupId) where.groupMembers = { some: { groupId } };
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
          groupMembers: { include: { group: { select: { id: true, name: true } } } },
          _count: { select: { conversations: true, messages: true } },
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
  fastify.get<{ Params: { id: string } }>('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request, reply) => {
    const contact = await prisma.contact.findFirst({
      where: { id: request.params.id, tenantId: request.tenant!.id },
      include: {
        groupMembers: { include: { group: { select: { id: true, name: true } } } },
        conversations: { take: 10, orderBy: { createdAt: 'desc' } },
        messages: { take: 20, orderBy: { createdAt: 'desc' } },
        _count: { select: { conversations: true, messages: true, tickets: true } },
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
        name: z.string().min(1).max(100),
        phone: z.string().min(10).max(20),
        email: z.string().email().optional(),
        avatar: z.string().url().optional(),
        tags: z.array(z.string()).optional(),
        customFields: z.record(z.unknown()).optional(),
        groupIds: z.array(z.string().cuid()).optional(),
      }),
    },

  }, async (request, reply) => {
    if (!['ADMIN', 'SUPER_ADMIN', 'AGENT'].includes(request.user!.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Access denied' },
      });
    }

    const { name, phone, email, avatar, tags, customFields, groupIds } = request.body as any;

    // Check if contact already exists
    const existing = await prisma.contact.findFirst({
      where: { phone, tenantId: request.tenant!.id },
    });

    if (existing) {
      return reply.status(409).send({
        success: false,
        error: { code: ERROR_CODES.CONFLICT, message: 'Contact with this phone number already exists' },
      });
    }

    const contact = await prisma.contact.create({
      data: {
        tenantId: request.tenant!.id,
        name,
        phone,
        email,
        avatar,
        tags: tags || [],
        customFields,
        groupMembers: groupIds ? {
          create: groupIds.map((groupId: string) => ({ groupId })),
        } : undefined,
      },
      include: {
        groupMembers: { include: { group: { select: { id: true, name: true } } } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant!.id,
        userId: request.user!.sub,
        action: 'CONTACT_CREATE',
        entityType: 'Contact',
        entityId: contact.id,
        newData: { name, phone, email },
      },
    });

    // Broadcast
    broadcastToWebsocket(undefined, 'contact:created', { contact }, `tenant:${request.tenant!.id}`);

    return reply.status(201).send({ success: true, data: contact });
  });

  // Update contact
  fastify.patch<{
    Params: { id: string };
    Body: { name?: string; phone?: string; email?: string | null; avatar?: string | null; tags?: string[]; customFields?: Record<string, unknown>; groupIds?: string[] }
  }>('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        name: z.string().min(1).max(100).optional(),
        phone: z.string().min(10).max(20).optional(),
        email: z.string().email().optional().nullable(),
        avatar: z.string().url().optional().nullable(),
        tags: z.array(z.string()).optional(),
        customFields: z.record(z.unknown()).optional(),
        groupIds: z.array(z.string().cuid()).optional(),
      }),
    },
  }, async (request, reply) => {
    if (!['ADMIN', 'SUPER_ADMIN', 'AGENT'].includes(request.user!.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Access denied' },
      });
    }

    const existing = await prisma.contact.findFirst({
      where: { id: request.params.id, tenantId: request.tenant!.id },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Contact not found' },
      });
    }

    const { name, phone, email, avatar, tags, customFields, groupIds } = request.body as any;

    // Check phone uniqueness if changing
    if (phone && phone !== existing.phone) {
      const phoneExists = await prisma.contact.findFirst({
        where: { phone, tenantId: request.tenant!.id, NOT: { id: request.params.id } },
      });
      if (phoneExists) {
        return reply.status(409).send({
          success: false,
          error: { code: ERROR_CODES.CONFLICT, message: 'Contact with this phone number already exists' },
        });
      }
    }

    // Update group memberships if groupIds provided
    if (groupIds !== undefined) {
      // Delete existing group memberships
      await prisma.groupMember.deleteMany({
        where: { contactId: request.params.id },
      });
      // Create new group memberships
      if (groupIds.length > 0) {
        await prisma.groupMember.createMany({
          data: groupIds.map((groupId: string) => ({
            contactId: request.params.id,
            groupId,
          })),
        });
      }
    }

    const contact = await prisma.contact.update({
      where: { id: request.params.id },
      data: { name, phone, email, avatar, tags, customFields },
      include: {
        groupMembers: { include: { group: { select: { id: true, name: true } } } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant!.id,
        userId: request.user!.sub,
        action: 'CONTACT_UPDATE',
        entityType: 'Contact',
        entityId: contact.id,
        newData: { name, phone, email },
      },
    });

    // Broadcast
    broadcastToWebsocket(undefined, 'contact:updated', { contact }, `tenant:${request.tenant!.id}`);

    return reply.send({ success: true, data: contact });
  });

  // Delete contact
  fastify.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request, reply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user!.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const existing = await prisma.contact.findFirst({
      where: { id: request.params.id, tenantId: request.tenant!.id },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Contact not found' },
      });
    }

    await prisma.contact.delete({ where: { id: request.params.id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant!.id,
        userId: request.user!.sub,
        action: 'CONTACT_DELETE',
        entityType: 'Contact',
        entityId: request.params.id,
      },
    });

    // Broadcast
    broadcastToWebsocket(undefined, 'contact:deleted', { contactId: request.params.id }, `tenant:${request.tenant!.id}`);

    return reply.send({ success: true, message: 'Contact deleted' });
  });

  // Add contact to group
  fastify.post<{
    Params: { id: string };
    Body: { groupId: string }
  }>('/:id/groups', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        groupId: z.string().cuid(),
      }),
    },
  }, async (request, reply) => {
    if (!['ADMIN', 'SUPER_ADMIN', 'AGENT'].includes(request.user!.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Access denied' },
      });
    }

    const { groupId } = request.body as any;

    const [contact, group] = await Promise.all([
      prisma.contact.findFirst({ where: { id: request.params.id, tenantId: request.tenant!.id } }),
      prisma.group.findFirst({ where: { id: groupId, tenantId: request.tenant!.id } }),
    ]);

    if (!contact || !group) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Contact or group not found' },
      });
    }

    await prisma.groupMember.upsert({
      where: { groupId_contactId: { groupId, contactId: request.params.id } },
      create: { groupId, contactId: request.params.id },
      update: {},
    });

    return reply.send({ success: true, message: 'Contact added to group' });
  });

  // Remove contact from group
  fastify.delete<{
    Params: { id: string; groupId: string }
  }>('/:id/groups/:groupId', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema.extend({ groupId: z.string().cuid() }),
    },
  }, async (request, reply) => {
    if (!['ADMIN', 'SUPER_ADMIN', 'AGENT'].includes(request.user!.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Access denied' },
      });
    }

    await prisma.groupMember.deleteMany({
      where: { groupId: request.params.groupId, contactId: request.params.id },
    });

    return reply.send({ success: true, message: 'Contact removed from group' });
  });
}