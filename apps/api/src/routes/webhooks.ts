import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES, WEBHOOK_EVENTS } from '@zapti/shared/constants';
import { broadcastToWebsocket } from '@zapti/shared/notification';

declare module 'fastify' {
  interface FastifyRequest {
    tenant?: any;
    user?: any;
  }
}

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
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
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
                profile: z.object({ name: z.string() }).optional(),
                wa_id: z.string(),
              })).optional(),
              messages: z.array(z.object({
                id: z.string(),
                from: z.string(),
                timestamp: z.string(),
                type: z.string(),
                text: z.object({ body: z.string() }).optional(),
                image: z.object({ id: z.string(), mime_type: z.string(), sha256: z.string(), caption: z.string().optional() }).optional(),
                video: z.object({ id: z.string(), mime_type: z.string(), sha256: z.string(), caption: z.string().optional() }).optional(),
                audio: z.object({ id: z.string(), mime_type: z.string(), sha256: z.string() }).optional(),
                document: z.object({ id: z.string(), mime_type: z.string(), sha256: z.string(), filename: z.string().optional(), caption: z.string().optional() }).optional(),
                location: z.object({ latitude: z.number(), longitude: z.number(), name: z.string().optional(), address: z.string().optional() }).optional(),
                contacts: z.array(z.object({ name: z.object({ formatted_name: z.string() }), phones: z.array(z.object({ phone: z.string(), type: z.string() })) })).optional(),
                interactive: z.object({
                  type: z.string(),
                  button_reply: z.object({ id: z.string(), title: z.string() }).optional(),
                  list_reply: z.object({ id: z.string(), title: z.string(), description: z.string().optional() }).optional(),
                }).optional(),
                context: z.object({ from: z.string(), id: z.string() }).optional(),
              })).optional(),
              statuses: z.array(z.object({
                id: z.string(),
                status: z.enum(['sent', 'delivered', 'read', 'failed']),
                timestamp: z.string(),
                recipient_id: z.string(),
                conversation: z.object({ id: z.string(), origin: z.object({ type: z.string() }) }).optional(),
                pricing: z.object({ billable: z.boolean(), pricing_model: z.string(), category: z.string() }).optional(),
                errors: z.array(z.object({ code: z.string(), title: z.string(), message: z.string(), error_data: z.object({ details: z.string() }).optional() })).optional(),
              })).optional(),
            }),
            field: z.string(),
          })),
        })),
      }),
    },
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    // Process webhook asynchronously
    const { processWhatsAppWebhook } = await import('../services/whatsapp');
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
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const { event, instance, data } = request.body;

    // Find tenant by instance name
    const integration = await prisma.integration.findFirst({
      where: {
        type: 'EVOLUTION_API',
        config: { path: ['instanceName'], equals: instance },
        status: 'CONNECTED',
      },
      include: { tenant: true },
    });

    if (!integration) {
      return reply.status(404).send({ success: false, message: 'Integration not found' });
    }

    // Process webhook asynchronously
    const { processEvolutionWebhook } = await import('../services/whatsapp');
    processEvolutionWebhook(event, data, integration.tenant.id).catch(console.error);

    return reply.send({ success: true });
  });
}

// Generic webhook for external integrations (requires API key)
export async function genericWebhookRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/webhooks/:tenantId/:webhookId', {
    schema: {
      params: z.object({
        tenantId: z.string().cuid(),
        webhookId: z.string().cuid(),
      }),
      headers: z.object({
        'x-webhook-secret': z.string().optional(),
        'x-signature': z.string().optional(),
      }).optional(),
      body: z.any(),
    },
  }, async (request: FastifyRequest<{ Params: { tenantId: string; webhookId: string }; Body: any }>, reply: FastifyReply) => {
    const { tenantId, webhookId } = request.params;

    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, integration: { tenantId } },
      include: { integration: true },
    });

    if (!webhook) {
      return reply.status(404).send({ success: false, message: 'Webhook not found' });
    }

    if (!webhook.isActive) {
      return reply.status(400).send({ success: false, message: 'Webhook is inactive' });
    }

    // Verify secret if configured
    if (webhook.secret) {
      const providedSecret = request.headers['x-webhook-secret'] || request.headers['x-signature'];
      if (providedSecret !== webhook.secret) {
        return reply.status(401).send({ success: false, message: 'Invalid webhook secret' });
      }
    }

    // Check if event is subscribed
    // For generic webhooks, we'll accept all events

    // Process webhook
    const { processGenericWebhook } = await import('../services/integration');
    processGenericWebhook(webhook, request.body).catch(console.error);

    return reply.send({ success: true });
  });
}

// Contact form / lead capture webhook (public)
export async function leadCaptureRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/webhooks/lead-capture', {
    schema: {
      body: z.object({
        name: z.string().optional(),
        phone: z.string().min(10),
        email: z.string().email().optional(),
        source: z.string().optional(),
        customFields: z.record(z.unknown()).optional(),
        utm: z.object({
          source: z.string().optional(),
          medium: z.string().optional(),
          campaign: z.string().optional(),
          term: z.string().optional(),
          content: z.string().optional(),
        }).optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    const { name, phone, email, source, customFields, utm } = request.body;

    // Find default WhatsApp integration for this request
    // In production, you'd identify tenant by domain or API key
    const integration = await prisma.integration.findFirst({
      where: { type: 'EVOLUTION_API', isDefault: true, status: 'CONNECTED' },
      include: { tenant: true },
    });

    if (!integration) {
      return reply.status(503).send({ success: false, message: 'No active WhatsApp integration' });
    }

    const tenantId = integration.tenantId;

    // Create or find contact
    let contact = await prisma.contact.findFirst({
      where: { tenantId, phone },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          tenantId,
          name,
          phone,
          email,
          source: source || 'WEB_FORM',
          customFields: { ...customFields, utm },
        },
      });
    } else {
      // Update contact with new info
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          name: name || contact.name,
          email: email || contact.email,
          customFields: { ...contact.customFields, ...customFields, utm },
        },
      });
    }

    // Optionally create conversation
    const { createConversation } = await import('../services/conversation');
    const conversation = await createConversation(tenantId, contact.id, null, 'New lead from web form');

    // Broadcast
    broadcastToWebsocket(
      (global as any).io,
      'lead:captured',
      { contact, conversation },
      `tenant:${tenantId}`
    );

    return reply.send({ success: true, data: { contact, conversation } });
  });
}

// Register all webhook routes
export async function webhookRoutes(fastify: FastifyInstance): Promise<void> {
  await whatsappWebhookRoutes(fastify);
  await evolutionWebhookRoutes(fastify);
  await genericWebhookRoutes(fastify);
  await leadCaptureRoutes(fastify);
}