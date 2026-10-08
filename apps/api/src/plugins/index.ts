// ZapTI API — Plugin Registration
import { FastifyInstance } from 'fastify';
import { config } from '../config.js';

export async function registerPlugins(app: FastifyInstance) {
  // Helmet - Security headers
  await app.register(import('@fastify/helmet'), {
    contentSecurityPolicy: config.env === 'development' ? false : undefined,
  });

  // CORS - Allow multiple origins for development
  const corsOrigins = [
    config.frontendUrl,
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://192.168.1.193:3001',
  ];
  await app.register(import('@fastify/cors'), {
    origin: corsOrigins,
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
        message: 'Muitas requisicoes, tente novamente mais tarde',
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
        description: 'API para gestao de atendimento via WhatsApp',
        version: '1.0.0',
        contact: { name: 'ZapTI Team', email: 'support@zapti.app' },
      },
      servers: [{ url: config.frontendUrl || 'http://localhost:3000', description: 'Development server' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          cookieAuth: { type: 'apiKey', in: 'cookie', name: 'accessToken' },
        },
      },
      security: [{ bearerAuth: [], cookieAuth: [] }],
      tags: [
        { name: 'Auth', description: 'Autenticacao e autorizacao' },
        { name: 'Users', description: 'Gestao de usuarios' },
        { name: 'Tenants', description: 'Gestao de tenants (superadmin)' },
        { name: 'WhatsApp', description: 'Instancias e mensagens WhatsApp' },
        { name: 'Contacts', description: 'Gestao de contatos' },
        { name: 'Conversations', description: 'Conversas e mensagens' },
        { name: 'Tickets', description: 'Sistema de tickets' },
        { name: 'Flows', description: 'Automacoes visuais (flows)' },
        { name: 'Automations', description: 'Automacoes baseadas em eventos' },
        { name: 'Audit', description: 'Logs de auditoria' },
        { name: 'Backups', description: 'Backups e restauracao' },
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
