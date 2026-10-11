import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES, WEBHOOK_EVENTS } from '@zapti/shared/constants';
import { broadcastToWebsocket } from '@zapti/shared/notification';
import { processWhatsAppWebhook, processEvolutionWebhook } from '../services/whatsapp.js';
import { testIntegration } from '../services/integration.js';

// WhatsApp webhook verification (public - no auth required)
export async function whatsappWebhookRoutes(fastify: FastifyInstance): Promise<void> {
  // GET - Verify webhook (Meta/WhatsApp Business API)
  fastify.get('/webhooks/whatsapp', {
    schema: {
      querystring: z.object({
        'hub.mode': z.string().optional(),
        'hub.challenge': z.string().optional(),
        'hub.verify_token': z.string().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Querystring: { 'hub.mode'?: string; 'hub.challenge'?: string; 'hub.verify_token'?: string } }>, reply: FastifyReply) => {
    const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': verifyToken } = request.query;

    // In production, you'd verify against a configured verify token
    const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (mode === 'subscribe' && challenge) {
      if (verifyToken === expectedToken) {
        return reply.send(challenge);
      }
    }

    return reply.status(403).send({ error: 'Forbidden' });
  });

  // POST - Receive WhatsApp messages and status updates
  fastify.post('/webhooks/whatsapp', {
    schema: {
      body: z.object({
        object: z.string().optional(),
        entry: z.array(z.object({
          id: z.string(),
          changes: z.array(z.object({
            value: z.object({
              messaging_product: z.string().optional(),
              metadata: z.object({
                display_phone_number: z.string().optional(),
                phone_number_id: z.string().optional(),
              }).optional(),
              contacts: z.array(z.object({
                profile: z.object({
                  name: z.string().optional(),
                }).optional(),
                wa_id: z.string().optional(),
              })).optional(),
              messages: z.array(z.object({
                from: z.string().optional(),
                id: z.string().optional(),
                timestamp: z.string().optional(),
                type: z.string().optional(),
                text: z.object({
                  body: z.string().optional(),
                }).optional(),
              })).optional(),
              statuses: z.array(z.object({
                id: z.string().optional(),
                status: z.string().optional(),
                timestamp: z.string().optional(),
                recipient_id: z.string().optional(),
              })).optional(),
            }).optional(),
            field: z.string(),
          })),
        })),
      }),
    },
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    // Process webhook asynchronously
    processWhatsAppWebhook(request.body, request).catch(console.error);

    // Always return 200 to acknowledge receipt
    return reply.send({ success: true });
  });
}

// Evolution API webhook (public - no auth required)
export async function evolutionWebhookRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/webhooks/evolution', {
    schema: {
      body: z.object({
        event: z.string(),
        instance: z.string(),
        data: z.any(),
        date_time: z.string().optional(),
        server_url: z.string().optional(),
        apikey: z.string().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Body: { event: string; instance: string; data: any; date_time?: string; server_url?: string; apikey?: string } }>, reply: FastifyReply) => {
    const { event, instance, data } = request.body;

    // Find tenant by instance name
    const integration = await prisma.integration.findFirst({
      where: {
        type: 'EVOLUTION_API',
        config: { path: ['instanceName'], equals: instance },
        status: 'ACTIVE',
      },
      include: { tenant: true },
    });

    if (!integration) {
      return reply.status(404).send({ success: false, message: 'Integration not found' });
    }

    // Process webhook asynchronously
    processEvolutionWebhook(event, data, integration.tenant.id).catch(console.error);

    return reply.send({ success: true });
  });
}

// Generic webhook routes (authenticated)
export async function webhookRoutes(fastify: FastifyInstance): Promise<void> {
  // List webhooks
  fastify.get('/webhooks', async (request: FastifyRequest, reply: FastifyReply) => {
    const tenant = (request as any).tenant;
    const webhooks = await prisma.webhook.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(webhooks);
  });

  // Create webhook
  fastify.post('/webhooks', {
    schema: {
      body: z.object({
        name: z.string().min(1).max(100),
        url: z.string().url(),
        events: z.array(z.string()).min(1),
        secret: z.string().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Body: { name: string; url: string; events: string[]; secret?: string } }>, reply: FastifyReply) => {
    const tenant = (request as any).tenant;
    const { name, url, events, secret } = request.body;

    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        events,
        secret,
        tenantId: tenant.id,
      },
    });

    return reply.status(201).send(webhook);
  });

  // Test webhook
  fastify.post('/webhooks/:id/test', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const tenant = (request as any).tenant;
    const { id } = request.params;

    const webhook = await prisma.webhook.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!webhook) {
      return reply.status(404).send({ success: false, message: 'Webhook not found' });
    }

    try {
      await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhook.secret ? { 'X-Webhook-Signature': webhook.secret } : {}),
        },
        body: JSON.stringify({
          event: 'test',
          data: { message: 'Test webhook from ZapTI' },
          timestamp: new Date().toISOString(),
        }),
      });

      return reply.send({ success: true, message: 'Test webhook sent successfully' });
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: `Failed to send test webhook: ${error.message}` });
    }
  });

  // Delete webhook
  fastify.delete('/webhooks/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const tenant = (request as any).tenant;
    const { id } = request.params;

    const webhook = await prisma.webhook.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!webhook) {
      return reply.status(404).send({ success: false, message: 'Webhook not found' });
    }

    await prisma.webhook.delete({ where: { id } });

    return reply.send({ success: true });
  });
}

export async function registerWebhookRoutes(fastify: FastifyInstance): Promise<void> {
  await whatsappWebhookRoutes(fastify);
  await evolutionWebhookRoutes(fastify);
  await webhookRoutes(fastify);
}