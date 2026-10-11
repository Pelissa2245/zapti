import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES, CAMPAIGN_STATUS, WEBSOCKET_EVENTS } from '@zapti/shared/constants';
import { PaginationQuerySchema, IdParamSchema, SearchQuerySchema } from '@zapti/shared/validation';
import { broadcastToWebsocket } from '@zapti/shared/notification';


export async function campaignRoutes(fastify: FastifyInstance): Promise<void> {
  // List campaigns
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: PaginationQuerySchema.merge(SearchQuerySchema).extend({
        status: z.nativeEnum(CAMPAIGN_STATUS).optional(),
        groupId: z.string().cuid().optional(),
        templateId: z.string().cuid().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    const { page, limit, sortBy, sortOrder, q, status, groupId, templateId } = request.query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: request.tenant.id };
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
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const campaign = await prisma.campaign.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
      include: {
        group: { select: { id: true, name: true } },
        template: { select: { id: true, name: true, content: true } },
        logs: {
          take: 100,
          orderBy: { createdAt: 'desc' },
          include: { contact: { select: { id: true, name: true, phone: true } } },
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
        name: z.string().min(1).max(200),
        groupId: z.string().cuid(),
        templateId: z.string().cuid(),
        variables: z.record(z.string()).optional(),
        scheduledAt: z.string().datetime().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const { name, groupId, templateId, variables, scheduledAt } = request.body;

    const group = await prisma.group.findFirst({
      where: { id: groupId, tenantId: request.tenant.id },
    });

    if (!group) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Group not found' },
      });
    }

    if (!group.isActive) {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Group is not active' },
      });
    }

    const template = await prisma.template.findFirst({
      where: { id: templateId, tenantId: request.tenant.id },
    });

    if (!template) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Template not found' },
      });
    }

    if (!template.isApproved) {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Template must be approved before use in campaigns' },
      });
    }

    const campaign = await prisma.campaign.create({
      data: {
        tenantId: request.tenant.id,
        name,
        groupId,
        templateId,
        variables: variables || {},
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
      include: {
        group: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'CAMPAIGN_CREATE',
        entityType: 'Campaign',
        entityId: campaign.id,
        newData: { name, groupId, templateId, scheduledAt },
      },
    });

    // Schedule if needed
    if (scheduledAt) {
      const { scheduleCampaign } = await import('../services/campaign');
      scheduleCampaign(campaign.id).catch(console.error);
    }

    return reply.status(201).send({ success: true, data: campaign });
  });

  // Update campaign (only if draft or scheduled)
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        name: z.string().min(1).max(200).optional(),
        groupId: z.string().cuid().optional(),
        templateId: z.string().cuid().optional(),
        variables: z.record(z.string()).optional(),
        scheduledAt: z.string().datetime().nullable().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!campaign) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' },
      });
    }

    if (!['DRAFT', 'SCHEDULED'].includes(campaign.status)) {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Cannot update campaign in current status' },
      });
    }

    const updateData: any = { ...request.body };
    if (request.body.scheduledAt) {
      updateData.scheduledAt = new Date(request.body.scheduledAt);
      if (campaign.status === 'DRAFT') {
        updateData.status = 'SCHEDULED';
      }
    } else if (request.body.scheduledAt === null) {
      updateData.scheduledAt = null;
      updateData.status = 'DRAFT';
    }

    if (request.body.groupId) {
      const group = await prisma.group.findFirst({
        where: { id: request.body.groupId, tenantId: request.tenant.id },
      });
      if (!group) {
        return reply.status(404).send({
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: 'Group not found' },
        });
      }
    }

    if (request.body.templateId) {
      const template = await prisma.template.findFirst({
        where: { id: request.body.templateId, tenantId: request.tenant.id },
      });
      if (!template) {
        return reply.status(404).send({
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: 'Template not found' },
        });
      }
      if (!template.isApproved) {
        return reply.status(400).send({
          success: false,
          error: { code: ERROR_CODES.INVALID_INPUT, message: 'Template must be approved' },
        });
      }
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaign.id },
      data: updateData,
      include: {
        group: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'CAMPAIGN_UPDATE',
        entityType: 'Campaign',
        entityId: campaign.id,
        newData: request.body,
      },
    });

    // Reschedule if needed
    if (request.body.scheduledAt && updatedCampaign.status === 'SCHEDULED') {
      const { scheduleCampaign } = await import('../services/campaign');
      scheduleCampaign(campaign.id).catch(console.error);
    }

    return reply.send({ success: true, data: updatedCampaign });
  });

  // Send campaign (immediately)
  fastify.post('/:id/send', {
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

    const campaign = await prisma.campaign.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
      include: { group: true, template: true },
    });

    if (!campaign) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' },
      });
    }

    if (!['DRAFT', 'SCHEDULED', 'PAUSED'].includes(campaign.status)) {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Campaign cannot be sent in current status' },
      });
    }

    // Update status to SENDING
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'SENDING', sentAt: new Date() },
    });

    // Start sending in background
    const { sendCampaign } = await import('../services/campaign');
    sendCampaign(campaign.id, request.tenant.id).catch(console.error);

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'CAMPAIGN_SEND',
        entityType: 'Campaign',
        entityId: campaign.id,
      },
    });

    return reply.send({ success: true, message: 'Campaign sending started' });
  });

  // Pause campaign
  fastify.post('/:id/pause', {
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

    const campaign = await prisma.campaign.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!campaign) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' },
      });
    }

    if (campaign.status !== 'SENDING') {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Can only pause sending campaigns' },
      });
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'PAUSED' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'CAMPAIGN_PAUSE',
        entityType: 'Campaign',
        entityId: campaign.id,
      },
    });

    return reply.send({ success: true, message: 'Campaign paused' });
  });

  // Resume campaign
  fastify.post('/:id/resume', {
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

    const campaign = await prisma.campaign.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!campaign) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' },
      });
    }

    if (campaign.status !== 'PAUSED') {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Can only resume paused campaigns' },
      });
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'SENDING' },
    });

    // Resume sending
    const { resumeCampaign } = await import('../services/campaign');
    resumeCampaign(campaign.id).catch(console.error);

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'CAMPAIGN_RESUME',
        entityType: 'Campaign',
        entityId: campaign.id,
      },
    });

    return reply.send({ success: true, message: 'Campaign resumed' });
  });

  // Cancel campaign
  fastify.post('/:id/cancel', {
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

    const campaign = await prisma.campaign.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!campaign) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' },
      });
    }

    if (!['DRAFT', 'SCHEDULED', 'SENDING', 'PAUSED'].includes(campaign.status)) {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Cannot cancel campaign in current status' },
      });
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'CANCELLED' },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'CAMPAIGN_CANCEL',
        entityType: 'Campaign',
        entityId: campaign.id,
      },
    });

    return reply.send({ success: true, message: 'Campaign cancelled' });
  });

  // Delete campaign
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

    const campaign = await prisma.campaign.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!campaign) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' },
      });
    }

    if (!['DRAFT', 'CANCELLED', 'FAILED'].includes(campaign.status)) {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Cannot delete campaign in current status' },
      });
    }

    await prisma.campaign.delete({ where: { id: campaign.id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'CAMPAIGN_DELETE',
        entityType: 'Campaign',
        entityId: campaign.id,
      },
    });

    return reply.send({ success: true, message: 'Campaign deleted' });
  });

  // Get campaign logs
  fastify.get('/:id/logs', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      querystring: PaginationQuerySchema.extend({
        status: z.string().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Querystring: any }>, reply: FastifyReply) => {
    const { page, limit, status } = request.query;
    const skip = (page - 1) * limit;

    const campaign = await prisma.campaign.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!campaign) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Campaign not found' },
      });
    }

    const where: any = { campaignId: campaign.id };
    if (status) where.status = status;

    const [logs, total] = await Promise.all([
      prisma.campaignLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { contact: { select: { id: true, name: true, phone: true } } },
      }),
      prisma.campaignLog.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: logs,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  // Get campaign stats
  fastify.get('/stats/overview', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const baseWhere = { tenantId: request.tenant.id };

    const [total, draft, scheduled, sending, sent, paused, cancelled, failed, totalSent, totalFailed] = await Promise.all([
      prisma.campaign.count({ where: baseWhere }),
      prisma.campaign.count({ where: { ...baseWhere, status: 'DRAFT' } }),
      prisma.campaign.count({ where: { ...baseWhere, status: 'SCHEDULED' } }),
      prisma.campaign.count({ where: { ...baseWhere, status: 'SENDING' } }),
      prisma.campaign.count({ where: { ...baseWhere, status: 'SENT' } }),
      prisma.campaign.count({ where: { ...baseWhere, status: 'PAUSED' } }),
      prisma.campaign.count({ where: { ...baseWhere, status: 'CANCELLED' } }),
      prisma.campaign.count({ where: { ...baseWhere, status: 'FAILED' } }),
      prisma.campaign.aggregate({ where: baseWhere, _sum: { sentCount: true } }),
      prisma.campaign.aggregate({ where: baseWhere, _sum: { failedCount: true } }),
    ]);

    return reply.send({
      success: true,
      data: {
        total,
        draft,
        scheduled,
        sending,
        sent,
        paused,
        cancelled,
        failed,
        totalSent: totalSent._sum.sentCount || 0,
        totalFailed: totalFailed._sum.failedCount || 0,
      },
    });
  });
}