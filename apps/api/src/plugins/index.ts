import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import websocket from '@fastify/websocket';
import { config } from '@zapti/shared/config';

export async function registerPlugins(app: FastifyInstance): Promise<void> {
  const cfg = config();

  // CORS
  await app.register(cors, {
    origin: cfg.app.corsOrigin === '*' ? true : cfg.app.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Helmet for security headers
  await app.register(helmet, {
    contentSecurityPolicy: cfg.app.nodeEnv === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
      },
    } : false,
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorMessage: 'Too many requests, please try again later',
    keyGenerator: (req) => req.ip,
    skipOnError: true,
  });

  // Cookie parser
  await app.register(cookie, {
    secret: cfg.jwt.accessSecret,
    parseOptions: {},
  });

  // JWT authentication
  await app.register(jwt, {
    secret: cfg.jwt.accessSecret,
    sign: { expiresIn: cfg.jwt.accessExpiresIn },
    verify: { algorithms: ['HS256'] },
    cookie: {
      cookieName: 'accessToken',
      signed: true,
    },
  });

  // Multipart for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
      files: 10,
    },
  });

  // WebSocket support
  await app.register(websocket);

  // Swagger/OpenAPI documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'ZapTI API',
        description: 'Multi-tenant WhatsApp Helpdesk Platform API',
        version: '1.0.0',
        contact: {
          name: 'ZapTI Team',
          email: 'support@zapti.com',
        },
      },
      servers: [
        { url: cfg.app.apiUrl, description: 'Development server' },
      ],
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'tenants', description: 'Tenant management' },
        { name: 'users', description: 'User management' },
        { name: 'contacts', description: 'Contact management' },
        { name: 'conversations', description: 'Conversation management' },
        { name: 'messages', description: 'Message handling' },
        { name: 'tickets', description: 'Ticket management' },
        { name: 'groups', description: 'Group management' },
        { name: 'campaigns', description: 'Campaign management' },
        { name: 'automations', description: 'Automation rules' },
        { name: 'webhooks', description: 'Webhook management' },
        { name: 'integrations', description: 'Third-party integrations' },
        { name: 'settings', description: 'System settings' },
        { name: 'audit', description: 'Audit logs' },
        { name: 'health', description: 'Health checks' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'accessToken',
          },
        },
      },
      security: [
        { bearerAuth: [] },
        { cookieAuth: [] },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
  });

  // Add Prisma decorator
  app.decorate('prisma', null);
}