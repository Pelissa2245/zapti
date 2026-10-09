import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES, INTEGRATION_TYPE, INTEGRATION_STATUS, WEBSOCKET_EVENTS } from '@zapti/shared/constants';
import { PaginationQuerySchema, IdParamSchema, SearchQuerySchema } from '@zapti/shared/validation';
import { broadcastToWebsocket } from '@zapti/shared/notification';

declare module 'fastify' {
  interface FastifyRequest {
    tenant: any;
    user: any;
  }
}

export async function integrationRoutes(fastify: FastifyInstance): Promise<void> {
  // List integrations
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: PaginationQuerySchema.merge(SearchQuerySchema).extend({
        type: z.nativeEnum(INTEGRATION_TYPE).optional(),
        status: z.nativeEnum(INTEGRATION_STATUS).optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    const { page, limit, sortBy, sortOrder, q, type, status } = request.query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: request.tenant.id };
    if (type) where.type = type;
    if (status) where.status = status;

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { type: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [integrations, total] = await Promise.all([
      prisma.integration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        // Don't return sensitive config data
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          config: true, // Will be sanitized
          isDefault: true,
          lastSyncedAt: true,
          errorMessage: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { webhooks: true } },
        },
      }),
      prisma.integration.count({ where }),
    ]);

    // Sanitize config (remove secrets)
    const sanitizedIntegrations = integrations.map(i => ({
      ...i,
      config: sanitizeConfig(i.config, i.type),
    }));

    return reply.send({
      success: true,
      data: sanitizedIntegrations,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  // Get integration by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const integration = await prisma.integration.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
      include: {
        webhooks: { select: { id: true, url: true, events: true, isActive: true, createdAt: true } },
      },
    });

    if (!integration) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Integration not found' },
      });
    }

    // Sanitize config
    const sanitized = {
      ...integration,
      config: sanitizeConfig(integration.config, integration.type),
    };

    return reply.send({ success: true, data: sanitized });
  });

  // Create integration
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.object({
        name: z.string().min(1).max(100),
        type: z.nativeEnum(INTEGRATION_TYPE),
        config: z.record(z.unknown()),
        isDefault: z.boolean().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const { name, type, config, isDefault } = request.body;

    // Validate config based on type
    const validationError = validateIntegrationConfig(type, config);
    if (validationError) {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: validationError },
      });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.integration.updateMany({
        where: { tenantId: request.tenant.id, type, isDefault: true },
        data: { isDefault: false },
      });
    }

    const integration = await prisma.integration.create({
      data: {
        tenantId: request.tenant.id,
        name,
        type,
        config,
        status: 'DISCONNECTED',
        isDefault: isDefault || false,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'INTEGRATION_CREATE',
        entityType: 'Integration',
        entityId: integration.id,
        newData: { name, type, isDefault },
      },
    });

    return reply.status(201).send({
      success: true,
      data: { ...integration, config: sanitizeConfig(integration.config, type) }
    });
  });

  // Update integration
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        name: z.string().min(1).max(100).optional(),
        config: z.record(z.unknown()).optional(),
        status: z.nativeEnum(INTEGRATION_STATUS).optional(),
        isDefault: z.boolean().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const integration = await prisma.integration.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!integration) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Integration not found' },
      });
    }

    // Validate config if provided
    if (request.body.config) {
      const validationError = validateIntegrationConfig(integration.type, request.body.config);
      if (validationError) {
        return reply.status(400).send({
          success: false,
          error: { code: ERROR_CODES.INVALID_INPUT, message: validationError },
        });
      }
    }

    // If setting as default, unset other defaults
    if (request.body.isDefault) {
      await prisma.integration.updateMany({
        where: { tenantId: request.tenant.id, type: integration.type, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updatedIntegration = await prisma.integration.update({
      where: { id: integration.id },
      data: request.body,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'INTEGRATION_UPDATE',
        entityType: 'Integration',
        entityId: integration.id,
        newData: request.body,
      },
    });

    return reply.send({
      success: true,
      data: { ...updatedIntegration, config: sanitizeConfig(updatedIntegration.config, integration.type) }
    });
  });

  // Test integration
  fastify.post('/:id/test', {
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

    const integration = await prisma.integration.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!integration) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Integration not found' },
      });
    }

    const { testIntegration } = await import('../services/integration');
    const result = await testIntegration(integration);

    // Update integration status
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        status: result.success ? 'CONNECTED' : 'ERROR',
        errorMessage: result.success ? null : result.message,
      },
    });

    return reply.send({ success: true, data: result });
  });

  // Connect integration (test and set connected)
  fastify.post('/:id/connect', {
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

    const integration = await prisma.integration.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!integration) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Integration not found' },
      });
    }

    const { testIntegration } = await import('../services/integration');
    const result = await testIntegration(integration);

    if (!result.success) {
      await prisma.integration.update({
        where: { id: integration.id },
        data: { status: 'ERROR', errorMessage: result.message },
      });
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: result.message },
      });
    }

    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'CONNECTED', errorMessage: null, lastSyncedAt: new Date() },
    });

    return reply.send({ success: true, message: 'Integration connected successfully' });
  });

  // Disconnect integration
  fastify.post('/:id/disconnect', {
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

    const integration = await prisma.integration.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!integration) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Integration not found' },
      });
    }

    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'DISCONNECTED', errorMessage: null },
    });

    return reply.send({ success: true, message: 'Integration disconnected' });
  });

  // Sync integration
  fastify.post('/:id/sync', {
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

    const integration = await prisma.integration.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!integration) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Integration not found' },
      });
    }

    if (integration.status !== 'CONNECTED') {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Integration must be connected first' },
      });
    }

    const { syncIntegration } = await import('../services/integration');
    const result = await syncIntegration(integration);

    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncedAt: new Date() },
    });

    return reply.send({ success: true, data: result });
  });

  // Delete integration
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

    const integration = await prisma.integration.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!integration) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Integration not found' },
      });
    }

    await prisma.integration.delete({ where: { id: integration.id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'INTEGRATION_DELETE',
        entityType: 'Integration',
        entityId: integration.id,
      },
    });

    return reply.send({ success: true, message: 'Integration deleted' });
  });

  // Get integration types
  fastify.get('/types/list', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const types = Object.values(INTEGRATION_TYPE).map(type => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      configSchema: getIntegrationConfigSchema(type),
      description: getIntegrationDescription(type),
    }));

    return reply.send({ success: true, data: types });
  });

  // Webhook management
  fastify.get('/:id/webhooks', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const integration = await prisma.integration.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!integration) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Integration not found' },
      });
    }

    const webhooks = await prisma.webhook.findMany({
      where: { integrationId: integration.id },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: webhooks });
  });

  fastify.post('/:id/webhooks', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        url: z.string().url(),
        events: z.array(z.string()).min(1),
        secret: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const integration = await prisma.integration.findFirst({
      where: { id: request.params.id, tenantId: request.tenant.id },
    });

    if (!integration) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Integration not found' },
      });
    }

    const webhook = await prisma.webhook.create({
      data: {
        integrationId: integration.id,
        url: request.body.url,
        events: request.body.events,
        secret: request.body.secret,
        isActive: request.body.isActive !== false,
      },
    });

    return reply.status(201).send({ success: true, data: webhook });
  });

  fastify.patch('/:id/webhooks/:webhookId', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema.extend({ webhookId: z.string().cuid() }),
      body: z.object({
        url: z.string().url().optional(),
        events: z.array(z.string()).optional(),
        secret: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string; webhookId: string }; Body: any }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const webhook = await prisma.webhook.findFirst({
      where: { id: request.params.webhookId, integrationId: request.params.id },
    });

    if (!webhook) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Webhook not found' },
      });
    }

    const updatedWebhook = await prisma.webhook.update({
      where: { id: webhook.id },
      data: request.body,
    });

    return reply.send({ success: true, data: updatedWebhook });
  });

  fastify.delete('/:id/webhooks/:webhookId', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema.extend({ webhookId: z.string().cuid() }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string; webhookId: string } }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const webhook = await prisma.webhook.findFirst({
      where: { id: request.params.webhookId, integrationId: request.params.id },
    });

    if (!webhook) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Webhook not found' },
      });
    }

    await prisma.webhook.delete({ where: { id: webhook.id } });

    return reply.send({ success: true, message: 'Webhook deleted' });
  });
}

function sanitizeConfig(config: any, type: string): any {
  if (!config) return {};

  const sensitiveKeys = ['apiKey', 'secretKey', 'accessToken', 'password', 'secret', 'token'];
  const sanitized = { ...config };

  for (const key of sensitiveKeys) {
    if (sanitized[key]) {
      sanitized[key] = '***';
    }
  }

  return sanitized;
}

function validateIntegrationConfig(type: string, config: any): string | null {
  const requiredFields: Record<string, string[]> = {
    EVOLUTION_API: ['apiUrl', 'instanceName', 'apiKey'],
    WHATSAPP_BUSINESS: ['phoneNumberId', 'accessToken'],
    WEBHOOK: ['url'],
    CRM: ['provider', 'apiKey'],
    EMAIL: ['provider', 'apiKey', 'fromEmail'],
    PAYMENT: ['provider', 'secretKey'],
  };

  const required = requiredFields[type];
  if (!required) return null;

  for (const field of required) {
    if (!config[field]) {
      return `Missing required field: ${field}`;
    }
  }

  return null;
}

function getIntegrationConfigSchema(type: string): any {
  const schemas: Record<string, any> = {
    EVOLUTION_API: {
      type: 'object',
      properties: {
        apiUrl: { type: 'string', format: 'uri', description: 'Evolution API base URL' },
        instanceName: { type: 'string', description: 'Instance name' },
        apiKey: { type: 'string', description: 'API key' },
      },
      required: ['apiUrl', 'instanceName', 'apiKey'],
    },
    WHATSAPP_BUSINESS: {
      type: 'object',
      properties: {
        phoneNumberId: { type: 'string', description: 'Phone number ID from Meta' },
        accessToken: { type: 'string', description: 'Access token from Meta' },
        verifyToken: { type: 'string', description: 'Webhook verify token' },
      },
      required: ['phoneNumberId', 'accessToken'],
    },
    WEBHOOK: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri', description: 'Webhook URL' },
        secret: { type: 'string', description: 'Optional secret for signature verification' },
        events: { type: 'array', items: { type: 'string' }, description: 'Events to subscribe to' },
      },
      required: ['url'],
    },
    CRM: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['PIPEDRIVE', 'HUBSPOT', 'SALESFORCE'] },
        apiKey: { type: 'string', description: 'API key or access token' },
        baseUrl: { type: 'string', format: 'uri', description: 'Base URL (for self-hosted)' },
      },
      required: ['provider', 'apiKey'],
    },
    EMAIL: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['SENDGRID', 'MAILGUN', 'AWS_SES', 'SMTP'] },
        apiKey: { type: 'string', description: 'API key' },
        fromEmail: { type: 'string', format: 'email', description: 'From email address' },
        smtpHost: { type: 'string', description: 'SMTP host (for SMTP)' },
        smtpPort: { type: 'number', description: 'SMTP port (for SMTP)' },
        smtpUser: { type: 'string', description: 'SMTP username (for SMTP)' },
        smtpPassword: { type: 'string', description: 'SMTP password (for SMTP)' },
      },
      required: ['provider', 'apiKey', 'fromEmail'],
    },
    PAYMENT: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['MERCADO_PAGO', 'STRIPE', 'PAYPAL'] },
        publicKey: { type: 'string', description: 'Public key' },
        secretKey: { type: 'string', description: 'Secret key' },
        webhookSecret: { type: 'string', description: 'Webhook secret' },
      },
      required: ['provider', 'secretKey'],
    },
  };
  return schemas[type] || { type: 'object', properties: {} };
}

function getIntegrationDescription(type: string): string {
  const descriptions: Record<string, string> = {
    EVOLUTION_API: 'Connect to Evolution API for WhatsApp messaging',
    WHATSAPP_BUSINESS: 'Connect to Meta WhatsApp Business API',
    WEBHOOK: 'Receive events from external systems via webhooks',
    CRM: 'Sync contacts and data with CRM systems',
    EMAIL: 'Send emails through email service providers',
    PAYMENT: 'Process payments through payment gateways',
  };
  return descriptions[type] || '';
}