// ZapTI API — User Routes
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@zapti/database';
import { toJsonSchema } from '../../utils/zod-to-json-schema.js';

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  language: z.string().optional(),
  timezone: z.string().optional(),
});

const updateProfileSchemaJson = toJsonSchema(updateProfileSchema);

const updatePreferencesSchema = z.object({
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    inApp: z.boolean().optional(),
    conversationAssigned: z.boolean().optional(),
    conversationMentioned: z.boolean().optional(),
    ticketAssigned: z.boolean().optional(),
    ticketUpdated: z.boolean().optional(),
    slaBreach: z.boolean().optional(),
  }).optional(),
  ui: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    density: z.enum(['compact', 'comfortable', 'spacious']).optional(),
    sidebarCollapsed: z.boolean().optional(),
  }).optional(),
});

const updatePreferencesSchemaJson = toJsonSchema(updatePreferencesSchema);

const listUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  role: z.enum(['OWNER', 'ADMIN', 'SUPERVISOR', 'AGENT']).optional(),
  teamId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  q: z.string().optional(),
});

const listUsersQuerySchemaJson = toJsonSchema(listUsersQuerySchema);

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'AGENT']),
  teamIds: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
});

const inviteUserSchemaJson = toJsonSchema(inviteUserSchema);

const updateUserSchema = z.object({
  role: z.enum(['ADMIN', 'SUPERVISOR', 'AGENT']).optional(),
  teamIds: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const updateUserSchemaJson = toJsonSchema(updateUserSchema);

export async function userRoutes(app: FastifyInstance) {
  // GET /users - List users in tenant
  app.get('/', {
    preHandler: [app.requirePermission('users:read')],
    schema: { querystring: listUsersQuerySchemaJson },
  }, async (request) => {
    const { page, limit, role, teamId, isActive, q } = request.query as z.infer<typeof listUsersQuerySchema>;
    const tenantId = request.tenant!.id;

    const where: any = { tenantId };
    if (role) where.role = role;
    if (teamId) where.teams = { some: { teamId } };
    if (isActive !== undefined) where.user = { isActive };

    if (q) {
      where.OR = [
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [userTenants, total] = await Promise.all([
      prisma.userTenant.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true, isActive: true, isSuperadmin: true, lastLoginAt: true, twoFactorEnabled: true } },
          teams: { include: { team: { select: { id: true, name: true, color: true } } } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { user: { name: 'asc' } },
      }),
      prisma.userTenant.count({ where }),
    ]);

    return { data: userTenants, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  });

  // GET /users/stats - User statistics
  app.get('/stats', { preHandler: [app.requirePermission('users:read')] }, async (request) => {
    const tenantId = request.tenant!.id;

    const [total, active, byRole, online] = await Promise.all([
      prisma.userTenant.count({ where: { tenantId } }),
      prisma.userTenant.count({ where: { tenantId, user: { isActive: true } } }),
      prisma.userTenant.groupBy({ by: ['role'], where: { tenantId }, _count: true }),
      prisma.session.count({ where: { tenantId, status: 'ACTIVE', lastActiveAt: { gt: new Date(Date.now() - 5 * 60 * 1000) } } }),
    ]);

    return {
      stats: {
        total,
        active,
        inactive: total - active,
        online,
        byRole: byRole.map((r) => ({ role: r.role, count: r._count })),
      },
    };
  });

  // GET /users/:id - Get user details
  app.get('/:id', { preHandler: [app.requirePermission('users:read')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const userTenant = await prisma.userTenant.findFirst({
      where: { userId: id, tenantId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, isActive: true, isSuperadmin: true, lastLoginAt: true, twoFactorEnabled: true, language: true, timezone: true, createdAt: true } },
        teams: { include: { team: { select: { id: true, name: true, color: true } } } },
      },
    });

    if (!userTenant) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Usuário não encontrado' } });
    }

    // Get recent sessions
    const sessions = await prisma.session.findMany({
      where: { userId: id, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, ip: true, userAgent: true, createdAt: true, lastActiveAt: true, expiresAt: true, status: true },
    });

    // Get assigned conversations/tickets count
    const [conversationCount, ticketCount] = await Promise.all([
      prisma.conversation.count({ where: { assignedTo: id, tenantId } }),
      prisma.ticket.count({ where: { assignedTo: id, tenantId } }),
    ]);

    return { user: userTenant, sessions, stats: { conversations: conversationCount, tickets: ticketCount } };
  });

  // GET /users/me/profile - Get current user profile
  app.get('/me/profile', async (request, reply) => {
    const user = request.user!;
    const userTenant = request.userTenant!;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        language: user.language,
        timezone: user.timezone,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
      },
      tenant: {
        id: request.tenant!.id,
        name: request.tenant!.name,
        slug: request.tenant!.slug,
      },
      role: userTenant.role,
      permissions: userTenant.permissions,
      teams: userTenant.teams?.map((ut) => ({ id: ut.team!.id, name: ut.team!.name, color: ut.team!.color })) || [],
    };
  });

  // PATCH /users/me/profile - Update current user profile
  app.patch('/me/profile', { schema: { body: updateProfileSchemaJson } }, async (request, reply) => {
    const { name, avatarUrl, language, timezone } = request.body as z.infer<typeof updateProfileSchema>;
    const userId = request.user!.id;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name, avatarUrl, language, timezone },
      select: { id: true, name: true, email: true, avatarUrl: true, language: true, timezone: true },
    });

    await logAudit(request, 'PROFILE_UPDATED', { userId });

    return { user: updated };
  });

  // PATCH /users/me/preferences - Update user preferences
  app.patch('/me/preferences', { schema: { body: updatePreferencesSchemaJson } }, async (request, reply) => {
    // Preferences stored in user metadata or separate table
    // For now, we'll store in tenant settings or user settings
    const userId = request.user!.id;

    // This would typically go to a user_preferences table
    // For simplicity, we'll return the updated preferences
    return { preferences: request.body };
  });

  // POST /users/invite - Invite user to tenant
  app.post('/invite', {
    preHandler: [app.requirePermission('users:invite')],
    schema: { body: inviteUserSchemaJson },
  }, async (request, reply) => {
    const { email, role, teamIds, permissions } = request.body as z.infer<typeof inviteUserSchema>;
    const tenantId = request.tenant!.id;

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (user) {
      // Check if already in tenant
      const existing = await prisma.userTenant.findUnique({
        where: { userId_tenantId: { userId: user.id, tenantId } },
      });
      if (existing) {
        return reply.status(409).send({ error: { code: 'ALREADY_IN_TENANT', message: 'Usuário já faz parte deste tenant' } });
      }
    } else {
      // Create user with temporary password (they'll set on first login)
      const { hashPassword, generateSecureToken } = await import('@zapti/shared/auth');
      const tempPassword = generateSecureToken(16);
      const passwordHash = await hashPassword(tempPassword);

      user = await prisma.user.create({
        data: { name: email.split('@')[0], email: email.toLowerCase(), passwordHash },
      });

      // Send invitation email
      const { sendEmail } = await import('@zapti/shared/email');
      const { config } = await import('../../config.js');
      await sendEmail({
        to: email,
        subject: `Convite para ${request.tenant!.name} - ZapTI`,
        template: 'invitation',
        data: { tenantName: request.tenant!.name, tempPassword, loginUrl: config.frontendUrl },
      }).catch(console.error);
    }

    // Add user to tenant
    const userTenant = await prisma.userTenant.create({
      data: {
        userId: user.id,
        tenantId,
        role,
        permissions: JSON.stringify(permissions.length > 0 ? permissions : getDefaultPermissions(role)),
      },
    });

    // Add to teams
    if (teamIds.length > 0) {
      await prisma.userTeam.createMany({
        data: teamIds.map((teamId) => ({ userId: user.id, tenantId, teamId })),
        skipDuplicates: true,
      });
    }

    await logAudit(request, 'USER_INVITED', { userId: user.id, role, teamIds });

    return reply.status(201).send({ userTenant });
  });

  // PATCH /users/:id - Update user
  app.patch('/:id', {
    preHandler: [app.requirePermission('users:update')],
    schema: { body: updateUserSchemaJson },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { role, teamIds, permissions, isActive } = request.body as z.infer<typeof updateUserSchema>;
    const tenantId = request.tenant!.id;

    // Can't modify owner
    const target = await prisma.userTenant.findFirst({ where: { userId: id, tenantId } });
    if (!target) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Usuário não encontrado' } });
    }

    if (target.role === 'OWNER') {
      return reply.status(403).send({ error: { code: 'CANNOT_MODIFY_OWNER', message: 'Não pode modificar o proprietário' } });
    }

    // Can't modify self to remove admin
    if (id === request.user!.id && role && role !== 'ADMIN' && target.role === 'ADMIN') {
      return reply.status(403).send({ error: { code: 'CANNOT_DEMOTE_SELF', message: 'Não pode remover seu próprio acesso de admin' } });
    }

    const updateData: any = {};
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = JSON.stringify(permissions);
    if (isActive !== undefined) updateData.user = { update: { isActive } };

    const updated = await prisma.userTenant.update({
      where: { userId_tenantId: { userId: id, tenantId } },
      data: updateData,
      include: { user: true, teams: { include: { team: true } } },
    });

    // Update teams
    if (teamIds !== undefined) {
      await prisma.userTeam.deleteMany({ where: { userId: id } });
      if (teamIds.length > 0) {
        await prisma.userTeam.createMany({
          data: teamIds.map((teamId) => ({ userId: id, teamId })),
        });
      }
    }

    await logAudit(request, 'USER_UPDATED', { userId: id, changes: Object.keys(request.body as object) });

    return { user: updated };
  });

  // DELETE /users/:id - Remove user from tenant
  app.delete('/:id', { preHandler: [app.requirePermission('users:delete')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    if (id === request.user!.id) {
      return reply.status(403).send({ error: { code: 'CANNOT_REMOVE_SELF', message: 'Não pode se remover' } });
    }

    const target = await prisma.userTenant.findFirst({ where: { userId: id, tenantId } });
    if (!target) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Usuário não encontrado' } });
    }

    if (target.role === 'OWNER') {
      return reply.status(403).send({ error: { code: 'CANNOT_REMOVE_OWNER', message: 'Não pode remover o proprietário' } });
    }

    // Revoke sessions
    await prisma.session.updateMany({ where: { userId: id, tenantId }, data: { status: 'REVOKED' } });

    // Remove from tenant
    await prisma.userTenant.delete({ where: { userId_tenantId: { userId: id, tenantId } } });

    await logAudit(request, 'USER_REMOVED', { userId: id });

    return { message: 'Usuário removido do tenant' };
  });

  // GET /users/:id/sessions - Get user sessions
  app.get('/:id/sessions', { preHandler: [app.requirePermission('users:read')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const userTenant = await prisma.userTenant.findFirst({ where: { userId: id, tenantId } });
    if (!userTenant) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Usuário não encontrado' } });
    }

    const sessions = await prisma.session.findMany({
      where: { userId: id, tenantId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, ip: true, userAgent: true, createdAt: true, lastActiveAt: true, expiresAt: true, status: true },
    });

    return { sessions };
  });

  // DELETE /users/:id/sessions/:sessionId - Revoke session
  app.delete('/:id/sessions/:sessionId', { preHandler: [app.requirePermission('users:update')] }, async (request, reply) => {
    const { id, sessionId } = request.params as { id: string; sessionId: string };
    const tenantId = request.tenant!.id;

    const session = await prisma.session.findFirst({ where: { id: sessionId, userId: id, tenantId } });
    if (!session) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Sessão não encontrada' } });
    }

    if (session.id === request.sessionId) {
      return reply.status(403).send({ error: { code: 'CANNOT_REVOKE_CURRENT', message: 'Não pode revogar sua sessão atual' } });
    }

    await prisma.session.update({ where: { id: sessionId }, data: { status: 'REVOKED' } });

    await logAudit(request, 'SESSION_REVOKED', { userId: id, sessionId });

    return { message: 'Sessão revogada' };
  });
}

function getDefaultPermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    ADMIN: ['*'],
    SUPERVISOR: [
      'conversations:read', 'conversations:update', 'conversations:send',
      'tickets:read', 'tickets:create', 'tickets:update', 'tickets:comment',
      'contacts:read', 'contacts:create', 'contacts:update',
      'flows:read', 'automations:read',
      'users:read',
    ],
    AGENT: [
      'conversations:read', 'conversations:update', 'conversations:send',
      'tickets:read', 'tickets:create', 'tickets:comment',
      'contacts:read', 'contacts:create',
    ],
  };
  return permissions[role] || [];
}

async function logAudit(request: any, action: string, metadata: Record<string, any>) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: request?.tenant?.id,
        userId: request?.user?.id,
        action,
        description: `${action} - ${metadata.userId || 'unknown'}`,
        metadata: JSON.stringify({ ...metadata, ip: request?.ip, userAgent: request?.headers?.['user-agent'] }),
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}