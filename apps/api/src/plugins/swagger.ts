import { FastifyPluginAsync } from 'fastify';
import { config } from '@zapti/shared/config';

const swaggerPlugin: FastifyPluginAsync = async (app) => {
  const cfg = config();

  await app.register(require('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'ZapTI API',
        description: 'Multi-tenant WhatsApp Business API Platform',
        version: cfg.APP_VERSION,
      },
      servers: [
        { url: `http://localhost:${cfg.APP_PORT}`, description: 'Development server' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          tenantHeader: {
            type: 'apiKey',
            in: 'header',
            name: 'X-Tenant-ID',
          },
        },
      },
      security: [{ bearerAuth: [], tenantHeader: [] }],
    },
  });

  await app.register(require('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
    transformStaticCSP: (header: string) => header.replace('script-src', "script-src 'unsafe-eval'"),
  });
};

export default swaggerPlugin;