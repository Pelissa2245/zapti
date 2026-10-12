import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { config } from '@zapti/shared/config';
import { JWTPayload } from '@zapti/shared/auth';

// Extended tenant type with timezone and locale
interface TenantWithMeta {
  id: string;
  name: string;
  isActive: boolean;
  slug: string;
  domain: string | null;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string | null;
  timezone: string;
  locale: string;
}

const tenantPlugin: FastifyPluginAsync = async (app) => {
  const cfg = config();

  // Tenant resolution middleware
  app.addHook('preHandler', async (request: FastifyRequest, reply) => {
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
    const user = request.user as JWTPayload | undefined;
    if (!tenantId && user?.tenantId) {
      tenantId = user.tenantId;
    }
    // Priority 3: From subdomain (for multi-tenant deployments)
    // Disabled - requires ENABLE_SUBDOMAIN_TENANTS env var and config
    // else if (cfg.ENABLE_SUBDOMAIN_TENANTS) {
    //   const host = request.headers.host;
    //   if (host) {
    //     const subdomain = host.split('.')[0];
    //     if (subdomain && subdomain !== 'www' && subdomain !== 'api' && subdomain !== 'app') {
    //       const { prisma } = await import('../services/prisma.js');
    //       const tenant = await prisma.tenant.findUnique({
    //         where: { slug: subdomain },
    //       });
    //       if (tenant) tenantId = tenant.id;
    //     }
    //   }
    // }

    if (!tenantId) {
      return reply.status(400).send({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant context required' },
      });
    }

    // Fetch tenant
    const { prisma } = await import('../services/prisma.js');
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

    // Attach tenant with only needed fields to match Fastify type declarations
    request.tenant = {
      id: tenant.id,
      name: tenant.name,
      isActive: tenant.isActive,
      slug: tenant.slug,
      domain: tenant.domain,
      logo: tenant.logo,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      accentColor: tenant.accentColor,
      fontFamily: tenant.fontFamily,
      timezone: tenant.timezone ?? 'UTC',
      locale: tenant.locale ?? 'en',
    } satisfies TenantWithMeta;
  });

  // Decorate with tenant helper
  app.decorate('getTenant', (request: any) => request.tenant);
};

export default tenantPlugin;