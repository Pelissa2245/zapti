import { FastifyPluginAsync } from 'fastify';
import { config } from '@zapti/shared/config';

const rateLimitPlugin: FastifyPluginAsync = async (app) => {
  const cfg = config();

  app.register(require('@fastify/rate-limit'), {
    max: cfg.RATE_LIMIT_MAX || 100,
    timeWindow: cfg.RATE_LIMIT_WINDOW_MS || '1 minute',
    allowList: ['127.0.0.1', '::1'],
    keyGenerator: (request: any) => {
      // Use user ID if authenticated, otherwise IP
      return request.user?.sub || request.ip;
    },
    errorResponseBuilder: (request: any, context: any) => {
      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Limit: ${context.max} per ${context.timeWindow}`,
        },
      };
    },
  });
};

export default rateLimitPlugin;