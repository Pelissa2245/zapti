import { FastifyPluginAsync } from 'fastify';
import { config } from '@zapti/shared/config';

declare module 'fastify' {
  interface FastifyRequest {
    tenant?: any;
  }
}

const tenantPlugin: FastifyPluginAsync = async (app) => {
  const cfg = config();

  // Tenant resolution middleware
  app.addHook('preHandler', async (request, reply) => {
    // Skip tenant resolution for health checks and public endpoints
    const publicPaths = ['/health', '/docs', '/auth/login', '/auth/register', '/auth/refresh', '/settings/public'];

    if (publicPaths.some(path => request.url.startsWith(path))) {
      return;
    }

    // Get tenant from header or user
    let tenantId: string | undefined;

    // Priority 1: X-Tenant-ID header
    if (request.headers['x-tenant-id']) {
      tenantId = request.headers['x-tenant-id'] as string;
    }
    // Priority 2: From authenticated user
    else if (request.user?.tenantId) {
      tenantId = request.user.tenantId;
    }
    // Priority 3: From subdomain (for multi-tenant deployments)
    else if (cfg.enableSubdomainTenants) {
      const host = request.headers.host;
      if (host) {
        const subdomain = host.split('.')[0];
        if (subdomain && subdomain !== 'www' && subdomain !== 'api' && subdomain !== 'app') {
          const { prisma } = await import('../services/prisma');
          const tenant = await prisma.tenant.findUnique({
            where: { slug: subdomain },
          });
          if (tenant) tenantId = tenant.id;
        }
      }
    }

    if (!tenantId) {
      return reply.status(400).send({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant context required' },
      });
    }

    // Fetch tenant
    const { prisma } = await import('../services/prisma');
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return reply.status(404).send({
        success: false,
        error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' },
      });
    }

    if (!tenant.isActive) {
      return reply.status(403).send({
        success: false,
        error: { code: 'TENANT_INACTIVE', message: 'Tenant is inactive' },
      });
    }

    request.tenant = tenant;
  });

  // Decorate with tenant helper
  app.decorate('getTenant', (request: any) => request.tenant);
};

export default tenantPlugin;