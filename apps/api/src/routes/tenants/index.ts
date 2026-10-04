// ZapTI API — Tenant Routes (Superadmin only)
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@zapti/database';
import { toJsonSchema } from '../../utils/zod-to-json-schema.js';

const createTenantSchema = z.object({
  name: z.string().min(2).max(100),
  plan: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']).default('FREE'),
  ownerEmail: z.string().email(),
  ownerName: z.string().min(2).max(100),
  ownerPassword: z.string().min(8).max(128).optional(),
});

const createTenantSchemaJson = toJsonSchema(createTenantSchema);

const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  plan: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
  settings: z.record(z.any()).optional(),
  maxUsers: z.coerce.number().min(1).max(10000).optional(),
  maxInstances: z.coerce.number().min(1).max(100).optional(),
  maxConversationsPerMonth: z.coerce.number().min(100).max(1000000).optional(),
  maxMessagesPerMonth: z.coerce.number().min(1000).max(10000000).optional(),
  maxStorageGB: z.coerce.number().min(1).max(1000).optional(),
  features: z.record(z.boolean()).optional(),
});

const updateTenantSchemaJson = toJsonSchema(updateTenantSchema);

const listTenantsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
  plan: z.enum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']).optional(),
  q: z.string().optional(),
});

const listTenantsQuerySchemaJson = toJsonSchema(listTenantsQuerySchema);

export async function tenantRoutes(app: FastifyInstance) {
  // All routes require superadmin
  app.addHook('preHandler', app.requireSuperadmin);

  // GET /tenants - List all tenants
  app.get('/', { schema: { querystring: listTenantsQuerySchemaJson } }, async (request) => {
    const { page, limit, status, plan, q } = request.query as z.infer<typeof listTenantsQuerySchema>;

    const where: any = {};
    if (status) where.status = status;
    if (plan) where.plan = plan;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { users: true, whatsappInstances: true, conversations: true, tickets: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tenant.count({ where }),
    ]);

    return { data: tenants, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  });

  // GET /tenants/stats - Platform statistics
  app.get('/stats', async (request) => {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalConversations,
      totalMessages,
      totalInstances,
      byPlan,
      byStatus,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.whatsAppInstance.count(),
      prisma.tenant.groupBy({ by: ['plan'], _count: true }),
      prisma.tenant.groupBy({ by: ['status'], _count: true }),
    ]);

    return {
      stats: {
        totalTenants,
        activeTenants,
        suspendedTenants: totalTenants - activeTenants,
        totalUsers,
        totalConversations,
        totalMessages,
        totalInstances,
        byPlan: byPlan.map((p) => ({ plan: p.plan, count: p._count })),
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
        monthlyRevenue: 0,
      },
    };
  });

  // GET /tenants/:id - Get tenant details
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, isActive: true } },
        users: {
          include: { user: { select: { id: true, name: true, email: true, isActive: true, lastLoginAt: true } } },
        },
        whatsappInstances: { select: { id: true, name: true, status: true, phoneNumber: true } },
        _count: { select: { conversations: true, contacts: true, tickets: true, flows: true, automations: true } },
      },
    });

    if (!tenant) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant não encontrado' } });
    }

    return { tenant };
  });

  // POST /tenants - Create tenant
  app.post('/', { schema: { body: createTenantSchemaJson } }, async (request, reply) => {
    const { name, plan, ownerEmail, ownerName, ownerPassword } = request.body as z.infer<typeof createTenantSchema>;

    // Generate slug from tenant name
    const generateSlug = (name: string) => {
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      return slug.substring(0, 50);
    };

    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists and find unique one
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create owner user
    const { hashPassword, generateSecureToken } = await import('@zapti/shared/auth');
    const password = ownerPassword || generateSecureToken(16);
    const passwordHash = await hashPassword(password);
    const owner = await prisma.user.create({
      data: { name: ownerName, email: ownerEmail.toLowerCase(), passwordHash },
    });

    // Create tenant with owner
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        plan,
        ownerId: owner.id,
        settings: JSON.stringify({}),
      },
    });

    // Link owner to tenant
    await prisma.userTenant.create({
      data: { userId: owner.id, tenantId: tenant.id, role: 'OWNER', permissions: JSON.stringify(['*']) },
    });

    // Send welcome email
    const { sendEmail } = await import('@zapti/shared/email');
    const { config } = await import('../../config.js');
    await sendEmail({
      to: ownerEmail,
      subject: `Bem-vindo ao ${name} - ZapTI`,
      template: 'tenant-created',
      data: { tenantName: name, ownerName, password, loginUrl: config.frontendUrl },
    }).catch(console.error);

    await logAudit(request, 'TENANT_CREATED', { tenantId: tenant.id, ownerId: owner.id });

    return reply.status(201).send({ tenant, owner: { ...owner, tempPassword: ownerPassword ? undefined : password } });
  });

  // PATCH /tenants/:id - Update tenant
  app.patch('/:id', { schema: { body: updateTenantSchemaJson } }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as z.infer<typeof updateTenantSchema>;

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant não encontrado' } });
    }

    // If plan changed, update limits
    if (data.plan && data.plan !== tenant.plan) {
      // Plan limits would need to be stored in settings or handled differently
    }

    const updateData: any = { ...data };
    if (data.settings) {
      updateData.settings = JSON.stringify(data.settings);
    }

    const updated = await prisma.tenant.update({ where: { id }, data: updateData });

    await logAudit(request, 'TENANT_UPDATED', { tenantId: id, changes: Object.keys(data) });

    return { tenant: updated };
  });

  // POST /tenants/:id/suspend - Suspend tenant
  app.post('/:id/suspend', async (request, reply) => {
    const { id } = request.params as { id: string };

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant não encontrado' } });
    }

    if (tenant.status === 'SUSPENDED') {
      return reply.status(400).send({ error: { code: 'ALREADY_SUSPENDED', message: 'Tenant já está suspenso' } });
    }

    await prisma.tenant.update({ where: { id }, data: { status: 'SUSPENDED' } });
    await prisma.session.updateMany({ where: { tenantId: id }, data: { status: 'REVOKED' } });

    await logAudit(request, 'TENANT_SUSPENDED', { tenantId: id });

    return { message: 'Tenant suspenso' };
  });

  // POST /tenants/:id/activate - Activate tenant
  app.post('/:id/activate', async (request, reply) => {
    const { id } = request.params as { id: string };

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant não encontrado' } });
    }

    await prisma.tenant.update({ where: { id }, data: { status: 'ACTIVE' } });

    await logAudit(request, 'TENANT_ACTIVATED', { tenantId: id });

    return { message: 'Tenant ativado' };
  });

  // DELETE /tenants/:id - Delete tenant (soft delete)
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant não encontrado' } });
    }

    await prisma.tenant.update({ where: { id }, data: { status: 'CANCELLED' } });
    await prisma.session.updateMany({ where: { tenantId: id }, data: { status: 'REVOKED' } });

    await logAudit(request, 'TENANT_DELETED', { tenantId: id });

    return { message: 'Tenant cancelado' };
  });

  // GET /tenants/:id/usage - Get tenant usage
  app.get('/:id/usage', async (request, reply) => {
    const { id } = request.params as { id: string };

    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Tenant não encontrado' } });
    }

    // Parse settings JSON to get limits
    const settings = tenant.settings ? JSON.parse(tenant.settings) : {};

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [users, instances, conversations, messages] = await Promise.all([
      prisma.userTenant.count({ where: { tenantId: id } }),
      prisma.whatsAppInstance.count({ where: { tenantId: id } }),
      prisma.conversation.count({ where: { tenantId: id, createdAt: { gte: monthStart, lte: monthEnd } } }),
      prisma.message.count({ where: { tenantId: id, createdAt: { gte: monthStart, lte: monthEnd } } }),
    ]);

    return {
      usage: {
        users: { current: users, limit: settings.maxUsers || 0, percentage: settings.maxUsers ? Math.round((users / settings.maxUsers) * 100) : 0 },
        instances: { current: instances, limit: settings.maxInstances || 0, percentage: settings.maxInstances ? Math.round((instances / settings.maxInstances) * 100) : 0 },
        conversations: { current: conversations, limit: settings.maxConversationsPerMonth || 0, percentage: settings.maxConversationsPerMonth ? Math.round((conversations / settings.maxConversationsPerMonth) * 100) : 0 },
        messages: { current: messages, limit: settings.maxMessagesPerMonth || 0, percentage: settings.maxMessagesPerMonth ? Math.round((messages / settings.maxMessagesPerMonth) * 100) : 0 },
      },
    };
  });

  // GET /tenants/:id/audit - Get tenant audit logs
  app.get('/:id/audit', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { page = 1, limit = 50 } = request.query as { page?: string; limit?: string };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { tenantId: id },
        include: { user: { select: { id: true, name: true, email: true } } },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where: { tenantId: id } }),
    ]);

    return { data: logs, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } };
  });
}

function getPlanLimits(plan: string) {
  return {
    FREE: { users: 3, instances: 1, conversations: 1000, messages: 10000, storage: 1 },
    STARTER: { users: 10, instances: 3, conversations: 10000, messages: 100000, storage: 5 },
    PRO: { users: 50, instances: 10, conversations: 100000, messages: 1000000, storage: 20 },
    ENTERPRISE: { users: 1000, instances: 50, conversations: 1000000, messages: 10000000, storage: 100 },
  }[plan] || { users: 3, instances: 1, conversations: 1000, messages: 10000, storage: 1 };
}

function getPlanFeatures(plan: string) {
  return {
    FREE: { flows: true, automations: true, api: false, webhooks: false, customBranding: false, sso: false, auditLogs: false, backups: false },
    STARTER: { flows: true, automations: true, api: true, webhooks: true, customBranding: false, sso: false, auditLogs: true, backups: true },
    PRO: { flows: true, automations: true, api: true, webhooks: true, customBranding: true, sso: false, auditLogs: true, backups: true },
    ENTERPRISE: { flows: true, automations: true, api: true, webhooks: true, customBranding: true, sso: true, auditLogs: true, backups: true },
  }[plan] || { flows: true, automations: true, api: false, webhooks: false, customBranding: false, sso: false, auditLogs: false, backups: false };
}

async function logAudit(request: any, action: string, metadata: Record<string, any>) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: request?.tenant?.id,
        userId: request?.user?.id,
        action,
        description: `${action} - ${metadata.tenantId || 'unknown'}`,
        metadata: JSON.stringify({ ...metadata, ip: request?.ip, userAgent: request?.headers?.['user-agent'] }),
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
