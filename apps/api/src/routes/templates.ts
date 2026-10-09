import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES, TEMPLATE_STATUS, WEBSOCKET_EVENTS } from '@zapti/shared/constants';
import { PaginationQuerySchema, IdParamSchema, SearchQuerySchema } from '@zapti/shared/validation';
import { broadcastToWebsocket } from '@zapti/shared/notification';

declare module 'fastify' {
  interface FastifyRequest {
    tenant: any;
    user: any;
  }
}

export async function templateRoutes(fastify: FastifyInstance): Promise<void> {
  // List templates
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: PaginationQuerySchema.merge(SearchQuerySchema).extend({
        status: z.nativeEnum(TEMPLATE_STATUS).optional(),
        category: z.string().optional(),
        language: z.string().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    const { page, limit, sortBy, sortOrder, q, status, category, language } = request.query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: request.tenant.id };
    if (status) where.status = status;
    if (category) where.category = category;
    if (language) where.language = language;

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        include: {
          _count: { select: { campaigns: true, messages: true } },
        },
      }),
      prisma.template.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: templates,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  // Get template by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const template = await prisma.template.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
      include: {
        _count: { select: { campaigns: true, messages: true } },
      },
    });

    if (!template) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Template not found' },
      });
    }

    return reply.send({ success: true, data: template });
  });

  // Create template
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.object({
        name: z.string().min(1).max(100),
        content: z.string().min(1),
        category: z.string().optional(),
        language: z.string().optional(),
        variables: z.record(z.string()).optional(),
        headerType: z.enum(['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'LOCATION']).optional(),
        headerContent: z.string().optional(),
        footer: z.string().optional(),
        buttons: z.array(z.object({
          type: z.enum(['QUICK_REPLY', 'URL', 'PHONE']),
          text: z.string(),
          value: z.string().optional(),
          url: z.string().url().optional(),
          phoneNumber: z.string().optional(),
        })).optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const { name, content, category, language, variables, headerType, headerContent, footer, buttons } = request.body;

    // Validate variables in content
    const variableRegex = /{{(\w+)}}/g;
    const contentVariables = content.match(variableRegex)?.map(v => v.slice(2, -2)) || [];
    const declaredVariables = Object.keys(variables || {});

    for (const cv of contentVariables) {
      if (!declaredVariables.includes(cv)) {
        return reply.status(400).send({
          success: false,
          error: { code: ERROR_CODES.INVALID_INPUT, message: `Variable {{${cv}}} used in content but not declared` },
        });
      }
    }

    const template = await prisma.template.create({
      data: {
        tenantId: request.tenant.id,
        name,
        content,
        category,
        language: language || 'pt_BR',
        variables: variables || {},
        headerType: headerType || 'NONE',
        headerContent,
        footer,
        buttons: buttons || [],
        status: 'DRAFT',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'TEMPLATE_CREATE',
        entityType: 'Template',
        entityId: template.id,
        newData: { name, category, language },
      },
    });

    return reply.status(201).send({ success: true, data: template });
  });

  // Update template (only if draft)
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        name: z.string().min(1).max(100).optional(),
        content: z.string().min(1).optional(),
        category: z.string().optional(),
        language: z.string().optional(),
        variables: z.record(z.string()).optional(),
        headerType: z.enum(['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'LOCATION']).optional(),
        headerContent: z.string().optional(),
        footer: z.string().optional(),
        buttons: z.array(z.object({
          type: z.enum(['QUICK_REPLY', 'URL', 'PHONE']),
          text: z.string(),
          value: z.string().optional(),
          url: z.string().url().optional(),
          phoneNumber: z.string().optional(),
        })).optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const template = await prisma.template.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!template) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Template not found' },
      });
    }

    if (template.status !== 'DRAFT') {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Can only edit draft templates' },
      });
    }

    // Validate variables if content is being updated
    if (request.body.content || request.body.variables) {
      const content = request.body.content || template.content;
      const variables = request.body.variables || template.variables;

      const variableRegex = /{{(\w+)}}/g;
      const contentVariables = content.match(variableRegex)?.map(v => v.slice(2, -2)) || [];
      const declaredVariables = Object.keys(variables);

      for (const cv of contentVariables) {
        if (!declaredVariables.includes(cv)) {
          return reply.status(400).send({
            success: false,
            error: { code: ERROR_CODES.INVALID_INPUT, message: `Variable {{${cv}}} used in content but not declared` },
          });
        }
      }
    }

    const updatedTemplate = await prisma.template.update({
      where: { id: template.id },
      data: request.body,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'TEMPLATE_UPDATE',
        entityType: 'Template',
        entityId: template.id,
        newData: request.body,
      },
    });

    return reply.send({ success: true, data: updatedTemplate });
  });

  // Submit template for approval (Meta/WhatsApp Business)
  fastify.post('/:id/submit', {
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

    const template = await prisma.template.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!template) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Template not found' },
      });
    }

    if (template.status !== 'DRAFT') {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Only draft templates can be submitted' },
      });
    }

    // In production, this would call WhatsApp Business API to submit template
    // For now, just update status to PENDING
    const updatedTemplate = await prisma.template.update({
      where: { id: template.id },
      data: {
        status: 'PENDING',
        externalId: `template_${Date.now()}`, // Would come from API response
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'TEMPLATE_SUBMIT',
        entityType: 'Template',
        entityId: template.id,
      },
    });

    return reply.send({ success: true, data: updatedTemplate });
  });

  // Approve template (manual approval for internal use)
  fastify.post('/:id/approve', {
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

    const template = await prisma.template.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!template) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Template not found' },
      });
    }

    if (template.status !== 'DRAFT' && template.status !== 'PENDING') {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Template cannot be approved in current status' },
      });
    }

    const updatedTemplate = await prisma.template.update({
      where: { id: template.id },
      data: {
        status: 'APPROVED',
        isApproved: true,
        approvedAt: new Date(),
        approvedById: request.user.sub,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'TEMPLATE_APPROVE',
        entityType: 'Template',
        entityId: template.id,
      },
    });

    return reply.send({ success: true, data: updatedTemplate });
  });

  // Reject template
  fastify.post('/:id/reject', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        reason: z.string().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: { reason?: string } }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const template = await prisma.template.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!template) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Template not found' },
      });
    }

    if (template.status !== 'PENDING') {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Only pending templates can be rejected' },
      });
    }

    const updatedTemplate = await prisma.template.update({
      where: { id: template.id },
      data: {
        status: 'REJECTED',
        rejectionReason: request.body.reason,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'TEMPLATE_REJECT',
        entityType: 'Template',
        entityId: template.id,
        newData: { reason: request.body.reason },
      },
    });

    return reply.send({ success: true, data: updatedTemplate });
  });

  // Delete template
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

    const template = await prisma.template.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!template) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Template not found' },
      });
    }

    if (template.status === 'APPROVED') {
      // Check if used in active campaigns
      const activeCampaigns = await prisma.campaign.count({
        where: { templateId: template.id, status: { in: ['DRAFT', 'SCHEDULED', 'SENDING'] } },
      });

      if (activeCampaigns > 0) {
        return reply.status(400).send({
          success: false,
          error: { code: ERROR_CODES.CONFLICT, message: 'Template is used by active campaigns' },
        });
      }
    }

    await prisma.template.delete({ where: { id: template.id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'TEMPLATE_DELETE',
        entityType: 'Template',
        entityId: template.id,
      },
    });

    return reply.send({ success: true, message: 'Template deleted' });
  });

  // Get template categories
  fastify.get('/categories/list', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const categories = await prisma.template.findMany({
      where: { tenantId: request.tenant.id, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });

    return reply.send({
      success: true,
      data: categories.map(c => c.category).filter(Boolean)
    });
  });

  // Get template stats
  fastify.get('/stats/overview', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const baseWhere = { tenantId: request.tenant.id };

    const [total, draft, pending, approved, rejected, byCategory, byLanguage] = await Promise.all([
      prisma.template.count({ where: baseWhere }),
      prisma.template.count({ where: { ...baseWhere, status: 'DRAFT' } }),
      prisma.template.count({ where: { ...baseWhere, status: 'PENDING' } }),
      prisma.template.count({ where: { ...baseWhere, status: 'APPROVED' } }),
      prisma.template.count({ where: { ...baseWhere, status: 'REJECTED' } }),
      prisma.template.groupBy({ by: ['category'], where: { ...baseWhere, category: { not: null } }, _count: true }),
      prisma.template.groupBy({ by: ['language'], where: baseWhere, _count: true }),
    ]);

    return reply.send({
      success: true,
      data: {
        total,
        draft,
        pending,
        approved,
        rejected,
        byCategory: byCategory.reduce((acc, item) => ({ ...acc, [item.category]: item._count }), {}),
        byLanguage: byLanguage.reduce((acc, item) => ({ ...acc, [item.language]: item._count }), {}),
      },
    });
  });
}