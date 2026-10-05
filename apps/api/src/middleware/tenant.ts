// ZapTI API — Tenant Middleware
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma, setTenantContext, setSuperadminContext, clearContext } from '@zapti/database';

export async function tenantMiddleware(app: FastifyInstance) {
  // Tenant resolution hook - runs after auth
  app.addHook('preHandler', async (request, reply) => {
    // Skip for health check, docs, and superadmin-only routes
    if (request.url.startsWith('/health') || request.url.startsWith('/docs') || request.url.startsWith('/superadmin')) {
      return;
    }

    // Clear any previous context
    clearContext();

    // If superadmin, set superadmin context
    if (request.user?.isSuperadmin) {
      setSuperadminContext(true);
      return;
    }

    // For regular users, resolve tenant from:
    // 1. Header X-Tenant-ID (for API clients)
    // 2. User's default tenant (first tenant they belong to)
    // 3. Query parameter (for testing)

    let tenantId = request.headers['x-tenant-id'] as string;

    if (!tenantId && request.user) {
      // Get user's first active tenant
      const userTenant = await prisma.userTenant.findFirst({
        where: {
          userId: request.user.id,
          tenant: { status: 'ACTIVE' },
        },
        include: { tenant: true },
        orderBy: { joinedAt: 'asc' },
      });

      if (userTenant) {
        tenantId = userTenant.tenantId;
        (request as any).userTenantId = userTenant.id;
      }
    }

    if (!tenantId) {
      return; // No tenant found, let route handlers deal with it
    }

    // Fetch tenant details
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        status: true,
        settings: true,
      },
    });

    if (!tenant) {
      return;
    }

    // Check if tenant is active
    if (tenant.status !== 'ACTIVE') {
      return reply.status(403).send({
        error: {
          code: 'TENANT_SUSPENDED',
          message: `Tenant está ${tenant.status === 'SUSPENDED' ? 'suspenso' : 'excluído'}`,
        },
      });
    }

    // Get user's role in this tenant
    const userTenant = await prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId: request.user!.id, tenantId } },
      select: { id: true, role: true, permissions: true },
    });

    (request as any).tenant = {
      ...tenant,
      role: userTenant?.role || 'AGENT',
      permissions: userTenant?.permissions || [],
    };
    (request as any).userTenantId = userTenant?.id;

    // Set tenant context for Prisma middleware
    setTenantContext(tenantId);
  });

  // Decorator to require specific permission
  app.decorate('requirePermission', function (permission: string) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Autenticação necessária' } });
      }
      if (request.user.isSuperadmin) return; // Superadmin has all permissions

      if (!request.tenant) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Tenant não encontrado' } });
      }

      const permissions = (request.tenant as any).permissions as string[] || [];

      // Check for wildcard permission
      if (permissions.includes('*')) {
        return;
      }

      const hasPermission =
        permissions.includes(permission) ||
        (request.tenant as any).role === 'ADMIN' ||
        // OWNER is the tenant creator and must always have access to their
        // own tenant's data (was previously limited to ADMIN, which locked
        // fresh signups out of their own dashboard with 403s).
        (request.tenant as any).role === 'OWNER';

      if (!hasPermission) {
        return reply.status(403).send({
          error: { code: 'FORBIDDEN', message: `Permissão necessária: ${permission}` },
        });
      }
    };
  });

  // Decorator to require specific role
  app.decorate('requireRole', function (...roles: string[]) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      if (!request.user) {
        return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Autenticação necessária' } });
      }
      if (request.user.isSuperadmin) return;

      if (!request.tenant) {
        return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Tenant não encontrado' } });
      }

      const hasRole = (request.tenant as any).role ? roles.includes((request.tenant as any).role) : false;

      if (!hasRole) {
        return reply.status(403).send({
          error: { code: 'FORBIDDEN', message: `Permissão necessária: role ${roles.join(' ou ')}` },
        });
      }
    };
  });
}