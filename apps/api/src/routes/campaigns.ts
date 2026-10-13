import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES, CAMPAIGN_STATUS } from '@zapti/shared/constants';
import { PaginationQuerySchema, IdParamSchema, SearchQuerySchema } from '@zapti/shared/validation';
import { broadcastToWebsocket } from '@zapti/shared/notification';

const CampaignStatusEnum = z.enum(Object.values(CAMPAIGN_STATUS) as [string, ...string[]]);

export async function campaignRoutes(fastify: FastifyInstance): Promise<void> {
  // List campaigns
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: PaginationQuerySchema.merge(SearchQuerySchema).extend({
        status: CampaignStatusEnum.optional(),
        groupId: z.string().cuid().optional(),
        templateId: z.string().cuid().optional(),
      }),
    },
  }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      });
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const { page, limit, sortBy, sortOrder, q, status, groupId, templateId } = request.query as any;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: request.tenant!.id };
    if (status) where.status = status;
    if (groupId) where.groupId = groupId;
    if (templateId) where.templateId = templateId;

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { group: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        include: {
          group: { select: { id: true, name: true } },
          template: { select: { id: true, name: true } },
          _count: { select: { logs: true } },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: campaigns,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  // Get campaign by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      });
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: request.params.id, tenantId: request.tenant!.id },
      include: {
        group: { select: { id: true, name: true } },
        template: { select: { id: true, name: true, content: true } },
        logs: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { logs: true } },
      },
    });

    if (!campaign) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' },
      });
    }

    return reply.send({ success: true, data: campaign });
  });

  // Create campaign
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        groupId: z.string().cuid(),
        templateId: z.string().cuid(),
        scheduledAt: z.string().datetime().optional(),
      }),
    },
  }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      });
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const { name, description, groupId, templateId, scheduledAt } = request.body as any;

    const [group, template] = await Promise.all([
      prisma.group.findFirst({ where: { id: groupId, tenantId: request.tenant!.id } }),
      prisma.template.findFirst({ where: { id: templateId, tenantId: request.tenant!.id } }),
    ]);

    if (!group) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Contact group not found' },
      });
    }

    if (!template) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Message template not found' },
      });
    }

    const campaign = await prisma.campaign.create({
      data: {
        tenantId: request.tenant!.id,
        name,
        description,
        groupId,
        templateId,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant!.id,
        userId: request.user.sub,
        action: 'CAMPAIGN_CREATE',
        entityType: 'Campaign',
        entityId: campaign.id,
        newData: { name, groupId, templateId, scheduledAt },
      },
    });

    return reply.status(201).send({ success: true, data: campaign });
  });

  // Update campaign
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        groupId: z.string().cuid().optional(),
        templateId: z.string().cuid().optional(),
        status: CampaignStatusEnum.optional(),
        scheduledAt: z.string().datetime().optional().nullable(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      });
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const existing = await prisma.campaign.findFirst({
      where: { id: request.params.id, tenantId: request.tenant!.id },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' },
      });
    }

    const { name, description, groupId, templateId, status, scheduledAt } = request.body as any;

    if (groupId) {
      const group = await prisma.group.findFirst({ where: { id: groupId, tenantId: request.tenant!.id } });
      if (!group) {
        return reply.status(404).send({
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: 'Contact group not found' },
        });
      }
    }

    if (templateId) {
      const template = await prisma.template.findFirst({ where: { id: templateId, tenantId: request.tenant!.id } });
      if (!template) {
        return reply.status(404).send({
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: 'Message template not found' },
        });
      }
    }

    const campaign = await prisma.campaign.update({
      where: { id: request.params.id },
      data: {
        name,
        description,
        groupId,
        templateId,
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant!.id,
        userId: request.user.sub,
        action: 'CAMPAIGN_UPDATE',
        entityType: 'Campaign',
        entityId: campaign.id,
        newData: { name, groupId, templateId, status, scheduledAt },
      },
    });

    return reply.send({ success: true, data: campaign });
  });

  // Delete campaign
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      });
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const existing = await prisma.campaign.findFirst({
      where: { id: request.params.id, tenantId: request.tenant!.id },
    });

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' },
      });
    }

    await prisma.campaign.delete({ where: { id: request.params.id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant!.id,
        userId: request.user.sub,
        action: 'CAMPAIGN_DELETE',
        entityType: 'Campaign',
        entityId: request.params.id,
      },
    });

    return reply.send({ success: true, message: 'Campaign deleted' });
  });

  // Send campaign
  fastify.post('/:id/send', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      });
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: request.params.id, tenantId: request.tenant!.id },
      include: { template: true, group: { include: { members: { include: { contact: true } } } } },
    });

    if (!campaign) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' },
      });
    }

    if (campaign.status === 'SENT' || campaign.status === 'SENDING') {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Campaign already sent or sending' },
      });
    }

    // Update status to sending
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'SENDING', sentAt: new Date() },
    });

    // TODO: Actually send campaign messages
    // For now, just log and return

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant!.id,
        userId: request.user.sub,
        action: 'CAMPAIGN_SEND',
        entityType: 'Campaign',
        entityId: campaign.id,
        newData: { contactCount: campaign.group?.members?.length || 0 },
      },
    });

    return reply.send({ success: true, data: { message: 'Campaign sending started' } });
  });

  // Get campaign logs
  fastify.get('/:id/logs', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      querystring: PaginationQuerySchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      });
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const { page, limit, sortBy, sortOrder } = request.query as any;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.campaignLog.findMany({
        where: { campaignId: request.params.id },
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
      }),
      prisma.campaignLog.count({ where: { campaignId: request.params.id } }),
    ]);

    return reply.send({
      success: true,
      data: logs,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });
}