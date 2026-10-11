import { FastifyPluginAsync } from 'fastify';
import { config } from '@zapti/shared/config';

const corsPlugin: FastifyPluginAsync = async (app) => {
  const cfg = config();

  app.register(require('@fastify/cors'), {
    origin: cfg.CORS_ORIGIN || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-ID'],
  });
};

export default corsPlugin;