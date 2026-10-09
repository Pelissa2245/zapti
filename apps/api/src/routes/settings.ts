import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES, SETTING_KEYS, WEBSOCKET_EVENTS } from '@zapti/shared/constants';
import { UpdateSettingsSchema, PaginationQuerySchema } from '@zapti/shared/validation';
import { broadcastToWebsocket } from '@zapti/shared/notification';

declare module 'fastify' {
  interface FastifyRequest {
    tenant: any;
    user: any;
  }
}

export async function settingRoutes(fastify: FastifyInstance): Promise<void> {
  // Get all settings
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: PaginationQuerySchema,
    },
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const { page, limit, sortBy, sortOrder } = request.query;
    const skip = (page - 1) * limit;

    const [settings, total] = await Promise.all([
      prisma.setting.findMany({
        where: { tenantId: request.tenant.id },
        skip,
        take: limit,
        orderBy: { [sortBy || 'key']: sortOrder || 'asc' },
      }),
      prisma.setting.count({ where: { tenantId: request.tenant.id } }),
    ]);

    return reply.send({
      success: true,
      data: settings,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  // Get single setting
  fastify.get('/:key', {
    preHandler: [fastify.authenticate],
    schema: {
      params: z.object({ key: z.string() }),
    },
  }, async (request: FastifyRequest<{ Params: { key: string } }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId: request.tenant.id, key: request.params.key } },
    });

    if (!setting) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Setting not found' },
      });
    }

    return reply.send({ success: true, data: setting });
  });

  // Update setting
  fastify.patch('/:key', {
    preHandler: [fastify.authenticate],
    schema: {
      params: z.object({ key: z.string() }),
      body: z.object({ value: z.any(), description: z.string().optional() }),
    },
  }, async (request: FastifyRequest<{ Params: { key: string }; Body: { value: any; description?: string } }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const setting = await prisma.setting.upsert({
      where: { tenantId_key: { tenantId: request.tenant.id, key: request.params.key } },
      create: {
        tenantId: request.tenant.id,
        key: request.params.key,
        value: request.body.value,
        description: request.body.description,
      },
      update: {
        value: request.body.value,
        description: request.body.description ?? undefined,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'SETTING_UPDATE',
        entityType: 'Setting',
        entityId: setting.id,
        newData: { key: request.params.key, value: request.body.value },
      },
    });

    // Broadcast settings change
    broadcastToWebsocket(
      (global as any).io,
      WEBSOCKET_EVENTS.NOTIFICATION,
      { type: 'setting_update', setting },
      `tenant:${request.tenant.id}`
    );

    return reply.send({ success: true, data: setting });
  });

  // Bulk update settings
  fastify.post('/bulk', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.object({ settings: z.array(z.object({ key: z.string(), value: z.any(), description: z.string().optional() })) }),
    },
  }, async (request: FastifyRequest<{ Body: { settings: any[] } }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const results = await Promise.all(
      request.body.settings.map(({ key, value, description }) =>
        prisma.setting.upsert({
          where: { tenantId_key: { tenantId: request.tenant.id, key } },
          create: { tenantId: request.tenant.id, key, value, description },
          update: { value, description: description ?? undefined },
        })
      )
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'SETTINGS_BULK_UPDATE',
        entityType: 'Setting',
        newData: { updated: results.map(r => r.key) },
      },
    });

    // Broadcast
    broadcastToWebsocket(
      (global as any).io,
      WEBSOCKET_EVENTS.NOTIFICATION,
      { type: 'settings_bulk_update', settings: results },
      `tenant:${request.tenant.id}`
    );

    return reply.send({ success: true, data: results });
  });

  // Delete setting
  fastify.delete('/:key', {
    preHandler: [fastify.authenticate],
    schema: {
      params: z.object({ key: z.string() }),
    },
  }, async (request: FastifyRequest<{ Params: { key: string } }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId: request.tenant.id, key: request.params.key } },
    });

    if (!setting) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Setting not found' },
      });
    }

    await prisma.setting.delete({
      where: { tenantId_key: { tenantId: request.tenant.id, key: request.params.key } },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'SETTING_DELETE',
        entityType: 'Setting',
        entityId: setting.id,
      },
    });

    // Broadcast
    broadcastToWebsocket(
      (global as any).io,
      WEBSOCKET_EVENTS.NOTIFICATION,
      { type: 'setting_delete', key: request.params.key },
      `tenant:${request.tenant.id}`
    );

    return reply.send({ success: true, message: 'Setting deleted' });
  });

  // Get public settings (for frontend initialization)
  fastify.get('/public/init', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantSlug } = request.query as { tenantSlug?: string };

    let tenantId: string;

    if (tenantSlug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug, isActive: true },
        select: { id: true },
      });
      if (!tenant) {
        return reply.status(404).send({
          success: false,
          error: { code: ERROR_CODES.NOT_FOUND, message: 'Tenant not found' },
        });
      }
      tenantId = tenant.id;
    } else if (request.headers['x-tenant-id']) {
      tenantId = request.headers['x-tenant-id'] as string;
    } else {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Tenant slug or ID required' },
      });
    }

    const settings = await prisma.setting.findMany({
      where: { tenantId },
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        fontFamily: true,
      },
    });

    return reply.send({
      success: true,
      data: { tenant, settings: settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {}) },
    });
  });

  // Get default settings schema
  fastify.get('/meta/defaults', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const defaults = {
      [SETTING_KEYS.AUTO_ASSIGN_CONVERSATIONS]: { type: 'boolean', default: false, label: 'Auto-assign conversations' },
      [SETTING_KEYS.WELCOME_MESSAGE]: { type: 'string', default: 'Olá! Como posso ajudar você hoje?', label: 'Welcome message' },
      [SETTING_KEYS.AWAY_MESSAGE]: { type: 'string', default: 'No momento estamos fora do horário de atendimento. Responderemos assim que possível.', label: 'Away message' },
      [SETTING_KEYS.BUSINESS_HOURS]: {
        type: 'object',
        default: { enabled: false, timezone: 'America/Sao_Paulo', schedule: {} },
        label: 'Business hours'
      },
      [SETTING_KEYS.MAX_CONVERSATIONS_PER_AGENT]: { type: 'number', default: 20, label: 'Max conversations per agent' },
      [SETTING_KEYS.MESSAGE_RETENTION_DAYS]: { type: 'number', default: 365, label: 'Message retention (days)' },
      [SETTING_KEYS.ENABLE_TYPING_INDICATORS]: { type: 'boolean', default: true, label: 'Enable typing indicators' },
      [SETTING_KEYS.ENABLE_READ_RECEIPTS]: { type: 'boolean', default: true, label: 'Enable read receipts' },
      [SETTING_KEYS.ENABLE_FILE_UPLOAD]: { type: 'boolean', default: true, label: 'Enable file upload' },
      [SETTING_KEYS.ALLOWED_FILE_TYPES]: {
        type: 'array',
        default: ['image/*', 'audio/*', 'video/*', 'application/pdf'],
        label: 'Allowed file types'
      },
      [SETTING_KEYS.MAX_FILE_SIZE]: { type: 'number', default: 10485760, label: 'Max file size (bytes)' },
    };

    return reply.send({ success: true, data: defaults });
  });
}