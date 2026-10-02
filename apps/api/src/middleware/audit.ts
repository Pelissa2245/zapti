// ZapTI API — Audit Log Middleware
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@zapti/database';
import type { User, Tenant } from '@zapti/shared';

type RequestWithAuth = FastifyRequest & {
  user?: User;
  tenant?: Tenant;
};

export async function auditMiddleware(app: FastifyInstance) {
  app.decorateRequest('auditLog', null);

  // Decorator to set audit log for current request
  app.decorate('audit', function (options: {
    action: string;
    entityType?: string;
    entityId?: string | ((request: FastifyRequest) => string);
    description: string;
    metadata?: Record<string, any> | ((request: FastifyRequest) => Record<string, any>);
  }) {
    return async function (request: FastifyRequest) {
      const entityId = typeof options.entityId === 'function' ? options.entityId(request) : options.entityId;
      const metadata = typeof options.metadata === 'function' ? options.metadata(request) : options.metadata;

      request.auditLog = {
        action: options.action,
        entityType: options.entityType,
        entityId,
        description: options.description,
        metadata: metadata || {},
      };
    };
  });

  // Write audit log after response
  app.addHook('onResponse', async (request, reply) => {
    // Skip if no audit log or if it's a health check/docs
    if (!request.auditLog || request.url.startsWith('/health') || request.url.startsWith('/docs')) {
      return;
    }

    const req = request as unknown as RequestWithAuth;

    // Skip if response is error (we might want to log errors too, but separately)
    // For now, log everything

    try {
      await prisma.auditLog.create({
        data: {
          tenantId: req.tenant?.id || null,
          userId: req.user?.id || null,
          action: request.auditLog.action,
          entityType: request.auditLog.entityType,
          entityId: request.auditLog.entityId,
          description: request.auditLog.description,
          metadata: JSON.stringify({
            ...request.auditLog.metadata,
            method: request.method,
            url: request.url,
            statusCode: reply.statusCode,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
          }),
        },
      });
    } catch (err) {
      request.log.error({ err }, 'Failed to write audit log');
    }
  });
}