// ZapTI API — Plugin Registration
import { FastifyInstance } from 'fastify';
import { config } from '../config.js';

export async function registerPlugins(app: FastifyInstance) {
  // Helmet - Security headers
  await app.register(import('@fastify/helmet'), {
    contentSecurityPolicy: config.env === 'development' ? false : undefined,
  });

  // CORS
  await app.register(import('@fastify/cors'), {
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Cookie parser
  await app.register(import('@fastify/cookie'), {
    secret: config.jwt.secret,
    parseOptions: { httpOnly: true, secure: config.env === 'production', sameSite: 'lax' },
  });

  // JWT
  await app.register(import('@fastify/jwt'), {
    secret: config.jwt.secret,
    sign: { expiresIn: config.jwt.accessTokenExpiry },
    verify: { algorithms: ['HS256'] },
    cookie: { cookieName: 'accessToken', signed: false },
  });

  // Rate limiting
  const rateLimitPlugin = await import('@fastify/rate-limit');
  await app.register(rateLimitPlugin.default, {
    global: false, // We'll apply selectively
    max: config.rateLimit.global.max,
    timeWindow: config.rateLimit.global.windowMs,
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: (req, context) => ({
      error: {
        code: 'RATE_LIMITED',
        message: 'Muitas requisições, tente novamente mais tarde',
        retryAfter: Math.ceil(context.ttl / 1000),
      },
    }),
    addHeaders: { 'x-ratelimit-limit': true, 'x-ratelimit-remaining': true, 'x-ratelimit-reset': true },
  });

  // Multipart (file uploads)
  await app.register(import('@fastify/multipart'), {
    limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  });

  // Swagger/OpenAPI
  await app.register(import('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'ZapTI API',
        description: 'API para gestão de atendimento via WhatsApp',
        version: '1.0.0',
        contact: { name: 'ZapTI Team', email: 'support@zapti.app' },
      },
      servers: [{ url: `http://${config.host}:${config.port}`, description: 'Development server' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          cookieAuth: { type: 'apiKey', in: 'cookie', name: 'accessToken' },
        },
      },
      security: [{ bearerAuth: [], cookieAuth: [] }],
      tags: [
        { name: 'Auth', description: 'Autenticação e autorização' },
        { name: 'Users', description: 'Gestão de usuários' },
        { name: 'Tenants', description: 'Gestão de tenants (superadmin)' },
        { name: 'WhatsApp', description: 'Instâncias e mensagens WhatsApp' },
        { name: 'Contacts', description: 'Gestão de contatos' },
        { name: 'Conversations', description: 'Conversas e mensagens' },
        { name: 'Tickets', description: 'Sistema de tickets' },
        { name: 'Flows', description: 'Automações visuais (flows)' },
        { name: 'Automations', description: 'Automações baseadas em eventos' },
        { name: 'Audit', description: 'Logs de auditoria' },
        { name: 'Backups', description: 'Backups e restauração' },
      ],
    },
  });

  // Swagger UI
  await app.register(import('@fastify/swagger-ui'), {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      persistAuthorization: true,
    },
    staticCSP: true,
  });

  // Health check
  const healthcheck = await import('fastify-healthcheck');
  await app.register(healthcheck.default, {
    healthcheckUrl: '/health',
    exposeUptime: true,
  });

  // Ready check (for Kubernetes)
  app.get('/ready', async () => ({ status: 'ready' }));

  // Metrics endpoint (for Prometheus)
  if (config.env !== 'production' && config.env !== 'test') {
    const fastifyMetricsModule = await import('fastify-metrics');
    const fastifyMetricsPlugin = fastifyMetricsModule.default || fastifyMetricsModule;
    await app.register(fastifyMetricsPlugin as any, {
      endpoint: '/metrics',
      defaultMetrics: { enabled: true },
    } as any);
  }

  // Request ID
  app.addHook('onRequest', async (request) => {
    request.id = request.headers['x-request-id'] as string || crypto.randomUUID();
  });

  // Response headers
  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('X-Request-ID', request.id);
    reply.header('X-Powered-By', 'ZapTI');
    return payload;
  });
}