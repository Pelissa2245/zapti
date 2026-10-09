import Fastify from 'fastify';
import fp from 'fastify-plugin';
import { config } from '@zapti/shared/config';
import { setupWebSocket } from './services/websocket';
import { triggerAutomations } from './services/automation';

// Plugins
import corsPlugin from './plugins/cors';
import rateLimitPlugin from './plugins/rateLimit';
import loggingPlugin from './plugins/logging';
import swaggerPlugin from './plugins/swagger';
import multipartPlugin from './plugins/multipart';
import authPlugin from './plugins/auth';
import tenantPlugin from './plugins/tenant';

// Routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import tenantRoutes from './routes/tenants';
import contactRoutes from './routes/contacts';
import conversationRoutes from './routes/conversations';
import messageRoutes from './routes/messages';
import ticketRoutes from './routes/tickets';
import groupRoutes from './routes/groups';
import campaignRoutes from './routes/campaigns';
import automationRoutes from './routes/automations';
import integrationRoutes from './routes/integrations';
import settingRoutes from './routes/settings';
import auditRoutes from './routes/audit';
import webhookRoutes from './routes/webhooks';

// Error handler
import { errorHandler } from './middleware/errorHandler';

async function buildApp(): Promise<FastifyInstance> {
  const cfg = config();

  const app = Fastify({
    logger: cfg.nodeEnv === 'development' ? {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
      },
    } : true,
    disableRequestLogging: false,
    trustProxy: true,
  });

  // Set error handler
  app.setErrorHandler(errorHandler);

  // Register plugins in order
  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);
  await app.register(loggingPlugin);
  await app.register(swaggerPlugin);
  await app.register(multipartPlugin);
  await app.register(authPlugin);
  await app.register(tenantPlugin);

  // Register routes
  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(userRoutes, { prefix: '/users' });
  await app.register(tenantRoutes, { prefix: '/tenants' });
  await app.register(contactRoutes, { prefix: '/contacts' });
  await app.register(conversationRoutes, { prefix: '/conversations' });
  await app.register(messageRoutes, { prefix: '/messages' });
  await app.register(ticketRoutes, { prefix: '/tickets' });
  await app.register(groupRoutes, { prefix: '/groups' });
  await app.register(campaignRoutes, { prefix: '/campaigns' });
  await app.register(automationRoutes, { prefix: '/automations' });
  await app.register(integrationRoutes, { prefix: '/integrations' });
  await app.register(settingRoutes, { prefix: '/settings' });
  await app.register(auditRoutes, { prefix: '/audit' });
  await app.register(webhookRoutes, { prefix: '/webhooks' });

  // Global hook to trigger automations on events
  app.addHook('onResponse', async (request, reply) => {
    // Trigger automations based on route patterns
    const { url, method } = request;

    // Extract tenant ID
    const tenantId = request.tenant?.id;
    if (!tenantId) return;

    // Conversation created
    if (method === 'POST' && url === '/conversations' && reply.statusCode === 201) {
      const body = reply.body as any;
      if (body?.data?.id) {
        await triggerAutomations('CONVERSATION_CREATED', {
          conversationId: body.data.id,
          contactId: body.data.contactId,
          tenantId,
        }, tenantId);
      }
    }

    // Message received (inbound)
    if (method === 'POST' && url === '/messages' && reply.statusCode === 201) {
      const body = reply.body as any;
      if (body?.data?.direction === 'INBOUND') {
        await triggerAutomations('MESSAGE_RECEIVED', {
          conversationId: body.data.conversationId,
          contactId: body.data.contactId,
          messageId: body.data.id,
          messageContent: body.data.content,
          tenantId,
        }, tenantId);
      }
    }

    // Ticket created
    if (method === 'POST' && url === '/tickets' && reply.statusCode === 201) {
      const body = reply.body as any;
      if (body?.data?.id) {
        await triggerAutomations('TICKET_CREATED', {
          ticketId: body.data.id,
          conversationId: body.data.conversationId,
          contactId: body.data.contactId,
          tenantId,
        }, tenantId);
      }
    }

    // Contact created
    if (method === 'POST' && url === '/contacts' && reply.statusCode === 201) {
      const body = reply.body as any;
      if (body?.data?.id) {
        await triggerAutomations('CONTACT_CREATED', {
          contactId: body.data.id,
          tenantId,
        }, tenantId);
      }
    }
  });

  // Setup WebSocket
  setupWebSocket(app);

  // Ready hook
  app.ready(() => {
    console.log(`Server ready on port ${cfg.appPort}`);
    console.log(`Environment: ${cfg.nodeEnv}`);
    console.log(`WebSocket enabled: true`);
  });

  return app;
}

// Start server
async function start(): Promise<void> {
  try {
    const app = await buildApp();
    const cfg = config();

    await app.listen({ port: cfg.appPort, host: '0.0.0.0' });

    console.log(`🚀 ZapTI API running on http://localhost:${cfg.appPort}`);
    console.log(`📚 Swagger docs: http://localhost:${cfg.appPort}/docs`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Export for testing
export { buildApp };

// Run if main module
if (require.main === module) {
  start();
}