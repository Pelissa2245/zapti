// ZapTI API — Rate Limit Middleware (Custom per-endpoint limits)
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function rateLimitMiddleware(app: FastifyInstance) {
  // Custom rate limit store using in-memory (for production, use Redis)
  const stores = new Map<string, { count: number; resetAt: number }>();

  // Clean up expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of stores.entries()) {
      if (value.resetAt < now) {
        stores.delete(key);
      }
    }
  }, 60000);

  // Decorator for custom rate limits
  (app.decorate as any)('rateLimit', function (options: {
    max: number;
    windowMs: number;
    keyGenerator?: (request: FastifyRequest) => string;
    message?: string;
  }) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      const key = options.keyGenerator ? options.keyGenerator(request) : request.ip;
      const now = Date.now();
      const windowStart = now - options.windowMs;

      let entry = stores.get(key);

      if (!entry || entry.resetAt < now) {
        entry = { count: 0, resetAt: now + options.windowMs };
        stores.set(key, entry);
      }

      entry.count++;

      // Set rate limit headers
      reply.header('X-RateLimit-Limit', options.max.toString());
      reply.header('X-RateLimit-Remaining', Math.max(0, options.max - entry.count).toString());
      reply.header('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000).toString());

      if (entry.count > options.max) {
        reply.header('Retry-After', Math.ceil((entry.resetAt - now) / 1000).toString());
        return reply.status(429).send({
          error: {
            code: 'RATE_LIMITED',
            message: options.message || 'Muitas requisições. Tente novamente mais tarde.',
            retryAfter: Math.ceil((entry.resetAt - now) / 1000),
          },
        });
      }
    };
  });

  // Pre-configured rate limiters
  const strictRateLimit = app.rateLimit({
    max: 10,
    timeWindow: 60000, // 10 requests per minute
    errorResponseBuilder: (req, context) => ({
      error: {
        code: 'RATE_LIMITED',
        message: 'Muitas tentativas. Aguarde um minuto.',
        retryAfter: Math.ceil(context.ttl / 1000),
      },
    }),
  });

  const authRateLimit = app.rateLimit({
    max: 5,
    timeWindow: 60000, // 5 requests per minute for auth endpoints
    errorResponseBuilder: (req, context) => ({
      error: {
        code: 'RATE_LIMITED',
        message: 'Muitas tentativas de login. Aguarde um minuto.',
        retryAfter: Math.ceil(context.ttl / 1000),
      },
    }),
  });

  const apiRateLimit = app.rateLimit({
    max: 100,
    timeWindow: 60000, // 100 requests per minute for API
    errorResponseBuilder: (req, context) => ({
      error: {
        code: 'RATE_LIMITED',
        message: 'Muitas requisições. Tente novamente mais tarde.',
        retryAfter: Math.ceil(context.ttl / 1000),
      },
    }),
  });

  const uploadRateLimit = app.rateLimit({
    max: 20,
    timeWindow: 60000, // 20 uploads per minute
    errorResponseBuilder: (req, context) => ({
      error: {
        code: 'RATE_LIMITED',
        message: 'Muitas requisições de upload. Tente novamente mais tarde.',
        retryAfter: Math.ceil(context.ttl / 1000),
      },
    }),
  });

  (app.decorate as any)('strictRateLimit', strictRateLimit);
  (app.decorate as any)('authRateLimit', authRateLimit);
  (app.decorate as any)('apiRateLimit', apiRateLimit);
  (app.decorate as any)('uploadRateLimit', uploadRateLimit);
}