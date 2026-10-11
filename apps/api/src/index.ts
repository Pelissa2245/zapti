import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import staticPlugin from '@fastify/static';
import { config } from '@zapti/shared/config';
import { setupWebSocket } from './services/websocket';
import { prisma } from './services/prisma';
import { authPlugin } from './plugins/auth';

// Import routes
import { healthRoutes } from './routes/health';
import { tenantRoutes } from './routes/tenants';
import { userRoutes } from './routes/users';
import { contactRoutes } from './routes/contacts';
import { conversationRoutes } from './routes/conversations';
import { messageRoutes } from './routes/messages';
import { ticketRoutes } from './routes/tickets';
import { groupRoutes } from './routes/groups';
import { campaignRoutes } from './routes/campaigns';
import { automationRoutes } from './routes/automations';
import { webhookRoutes } from './routes/webhooks';
import { integrationRoutes } from './routes/integrations';
import { settingRoutes } from './routes/settings';
import { auditRoutes } from './routes/audit';

async function buildApp(): Promise<FastifyInstance> {
  const cfg = config();

  const app = Fastify({
    logger: {
      level: cfg.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: cfg.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: { colorize: true },
      } : undefined,
    },
  });

  // Register plugins
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: cfg.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(rateLimit, {
    max: cfg.RATE_LIMIT_MAX,
    timeWindow: cfg.RATE_LIMIT_WINDOW_MS,
  });

  await app.register(jwt, {
    secret: cfg.JWT_SECRET,
    sign: { expiresIn: cfg.JWT_ACCESS_EXPIRY },
  });

  // Register auth plugin
  await app.register(authPlugin);

  // Swagger documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'ZapTI API',
        description: 'API for ZapTI - WhatsApp Business Management Platform',
        version: cfg.APP_VERSION,
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Static files
  await app.register(staticPlugin, {
    root: cfg.UPLOAD_DIR,
    prefix: '/uploads/',
  });

  // Setup WebSocket
  setupWebSocket(app);

  // Authentication decorator
  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return reply.status(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const decoded = await app.jwt.verify(token);
      (request as any).user = decoded;

      // Get tenant from user or header
      const tenantId = (decoded as any).tenantId || request.headers['x-tenant-id'];
      if (!tenantId) {
        return reply.status(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
        });
      }

      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant || !tenant.isActive) {
        return reply.status(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid or inactive tenant' },
        });
      }

      (request as any).tenant = tenant;
    } catch (error) {
      return reply.status(401).send({
        success: false,
        error: { code: 'TOKEN_INVALID', message: 'Invalid or expired token' },
      });
    }
  });

  // Error handler
  app.setErrorHandler(async (error, request, reply) => {
    app.log.error(error);

    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.validation,
        },
      });
    }

    if (error.code === 'P2002') {
      return reply.status(409).send({
        success: false,
        error: { code: 'CONFLICT', message: 'Resource already exists' },
      });
    }

    if (error.code === 'P2025') {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
      });
    }

    return reply.status(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  });

  // Health routes
  await app.register(healthRoutes, { prefix: '/health' });

  // API routes
  await app.register(async (fastify) => {
    // Tenant routes (some need super admin)
    await fastify.register(tenantRoutes, { prefix: '/tenants' });

    // User routes
    await fastify.register(userRoutes, { prefix: '/users' });

    // Contact routes
    await fastify.register(contactRoutes, { prefix: '/contacts' });

    // Conversation routes
    await fastify.register(conversationRoutes, { prefix: '/conversations' });

    // Message routes
    await fastify.register(messageRoutes, { prefix: '/messages' });

    // Ticket routes
    await fastify.register(ticketRoutes, { prefix: '/tickets' });

    // Group routes
    await fastify.register(groupRoutes, { prefix: '/groups' });

    // Campaign routes
    await fastify.register(campaignRoutes, { prefix: '/campaigns' });

    // Automation routes
    await fastify.register(automationRoutes, { prefix: '/automations' });

    // Webhook routes (public and protected)
    await fastify.register(webhookRoutes, { prefix: '/webhooks' });

    // Integration routes
    await fastify.register(integrationRoutes, { prefix: '/integrations' });

    // Setting routes
    await fastify.register(settingRoutes, { prefix: '/settings' });

    // Audit routes
    await fastify.register(auditRoutes, { prefix: '/audit' });
  }, { prefix: '/api' });

  // Root endpoint
  app.get('/', async (request, reply) => {
    return reply.send({
      success: true,
      name: cfg.APP_NAME,
      version: cfg.APP_VERSION,
      docs: '/docs',
      health: '/health',
    });
  });

  return app;
}

async function start(): Promise<void> {
  try {
    const cfg = config();
    const app = await buildApp();

    await app.listen({ port: cfg.APP_PORT, host: '0.0.0.0' });

    console.log(`🚀 ${cfg.APP_NAME} API running on port ${cfg.APP_PORT}`);
    console.log(`📚 Documentation: http://localhost:${cfg.APP_PORT}/docs`);
    console.log(`💚 Health check: http://localhost:${cfg.APP_PORT}/health`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

start();