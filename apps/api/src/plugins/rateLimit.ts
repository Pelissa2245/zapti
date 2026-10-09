import { FastifyPluginAsync } from 'fastify';
import { config } from '@zapti/shared/config';

const rateLimitPlugin: FastifyPluginAsync = async (app) => {
  const cfg = config();

  app.register(require('@fastify/rate-limit'), {
    max: cfg.rateLimitMax || 100,
    timeWindow: cfg.rateLimitWindow || '1 minute',
    allowList: ['127.0.0.1', '::1'],
    keyGenerator: (request) => {
      // Use user ID if authenticated, otherwise IP
      return (request as any).user?.sub || request.ip;
    },
    errorResponseBuilder: (request, context) => {
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