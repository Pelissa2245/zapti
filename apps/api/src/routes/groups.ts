import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES, WEBSOCKET_EVENTS } from '@zapti/shared/constants';
import { PaginationQuerySchema, IdParamSchema, SearchQuerySchema } from '@zapti/shared/validation';
import { broadcastToWebsocket } from '@zapti/shared/notification';

declare module 'fastify' {
  interface FastifyRequest {
    tenant: any;
    user: any;
  }
}

export async function groupRoutes(fastify: FastifyInstance): Promise<void> {
  // List groups
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: PaginationQuerySchema.merge(SearchQuerySchema).extend({
        isActive: z.boolean().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    const { page, limit, sortBy, sortOrder, q, isActive } = request.query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: request.tenant.id };
    if (isActive !== undefined) where.isActive = isActive;

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        include: {
          _count: { select: { members: true, campaigns: true } },
        },
      }),
      prisma.group.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: groups,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  // Get group by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const group = await prisma.group.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
      include: {
        members: {
          include: {
            contact: { select: { id: true, name: true, phone: true, email: true, status: true } },
          },
          orderBy: { addedAt: 'desc' },
        },
        _count: { select: { members: true, campaigns: true } },
      },
    });

    if (!group) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Group not found' },
      });
    }

    return reply.send({ success: true, data: group });
  });

  // Create group
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        contactIds: z.array(z.string().cuid()).optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const { name, description, isActive, contactIds } = request.body;

    const group = await prisma.group.create({
      data: {
        tenantId: request.tenant.id,
        name,
        description,
        isActive: isActive !== false,
      },
    });

    // Add contacts if provided
    if (contactIds && contactIds.length > 0) {
      const contacts = await prisma.contact.findMany({
        where: { id: { in: contactIds }, tenantId: request.tenant.id },
      });

      await prisma.groupMember.createMany({
        data: contacts.map(c => ({
          groupId: group.id,
          contactId: c.id,
        })),
        skipDuplicates: true,
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'GROUP_CREATE',
        entityType: 'Group',
        entityId: group.id,
        newData: { name, description, contactCount: contactIds?.length || 0 },
      },
    });

    const groupWithCount = await prisma.group.findUnique({
      where: { id: group.id },
      include: { _count: { select: { members: true, campaigns: true } } },
    });

    return reply.status(201).send({ success: true, data: groupWithCount });
  });

  // Update group
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    const group = await prisma.group.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!group) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Group not found' },
      });
    }

    const updatedGroup = await prisma.group.update({
      where: { id: group.id },
      data: request.body,
      include: { _count: { select: { members: true, campaigns: true } } },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'GROUP_UPDATE',
        entityType: 'Group',
        entityId: group.id,
        newData: request.body,
      },
    });

    return reply.send({ success: true, data: updatedGroup });
  });

  // Delete group
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const group = await prisma.group.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!group) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Group not found' },
      });
    }

    // Check if group is used in active campaigns
    const activeCampaigns = await prisma.campaign.count({
      where: { groupId: group.id, status: { in: ['DRAFT', 'SCHEDULED', 'SENDING'] } },
    });

    if (activeCampaigns > 0) {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.CONFLICT, message: 'Group is used by active campaigns' },
      });
    }

    await prisma.group.delete({ where: { id: group.id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'GROUP_DELETE',
        entityType: 'Group',
        entityId: group.id,
      },
    });

    return reply.send({ success: true, message: 'Group deleted' });
  });

  // Add contacts to group
  fastify.post('/:id/members', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        contactIds: z.array(z.string().cuid()).min(1).max(1000),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: { contactIds: string[] } }>, reply: FastifyReply) => {
    const group = await prisma.group.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!group) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Group not found' },
      });
    }

    const contacts = await prisma.contact.findMany({
      where: { id: { in: request.body.contactIds }, tenantId: request.tenant.id },
    });

    const result = await prisma.groupMember.createMany({
      data: contacts.map(c => ({
        groupId: group.id,
        contactId: c.id,
      })),
      skipDuplicates: true,
    });

    return reply.send({ success: true, data: { added: result.count } });
  });

  // Remove contact from group
  fastify.delete('/:id/members/:contactId', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema.extend({ contactId: z.string().cuid() }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string; contactId: string } }>, reply: FastifyReply) => {
    const group = await prisma.group.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!group) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Group not found' },
      });
    }

    await prisma.groupMember.deleteMany({
      where: { groupId: group.id, contactId: request.params.contactId },
    });

    return reply.send({ success: true, message: 'Contact removed from group' });
  });

  // Bulk remove contacts from group
  fastify.delete('/:id/members', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        contactIds: z.array(z.string().cuid()).min(1).max(1000),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: { contactIds: string[] } }>, reply: FastifyReply) => {
    const group = await prisma.group.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!group) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Group not found' },
      });
    }

    await prisma.groupMember.deleteMany({
      where: { groupId: group.id, contactId: { in: request.body.contactIds } },
    });

    return reply.send({ success: true, message: 'Contacts removed from group' });
  });

  // Get group stats
  fastify.get('/stats/overview', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const baseWhere = { tenantId: request.tenant.id };

    const [total, active, inactive, totalMembers, groupsWithMembers] = await Promise.all([
      prisma.group.count({ where: baseWhere }),
      prisma.group.count({ where: { ...baseWhere, isActive: true } }),
      prisma.group.count({ where: { ...baseWhere, isActive: false } }),
      prisma.groupMember.count({ where: { group: { tenantId: request.tenant.id } } }),
      prisma.group.count({ where: { ...baseWhere, members: { some: {} } } }),
    ]);

    return reply.send({
      success: true,
      data: {
        total,
        active,
        inactive,
        totalMembers,
        groupsWithMembers,
        emptyGroups: total - groupsWithMembers,
      },
    });
  });
}