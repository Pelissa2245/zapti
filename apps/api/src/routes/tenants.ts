import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { config } from '@zapti/shared/config';
import { ERROR_CODES, WEBSOCKET_EVENTS } from '@zapti/shared/constants';
import { IdParamSchema } from '@zapti/shared/validation';
import { broadcastToWebsocket } from '@zapti/shared/notification';


export async function tenantRoutes(fastify: FastifyInstance): Promise<void> {
  // Get current tenant (own tenant)
  fastify.get('/current', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: request.tenant.id },
      include: {
        _count: { select: { users: true, contacts: true, conversations: true, integrations: true } },
        settings: true,
      },
    });

    if (!tenant) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Tenant not found' },
      });
    }

    // Get subscription info
    const subscription = await prisma.subscription.findFirst({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: { ...tenant, subscription } });
  });

  // Update tenant (admin only)
  fastify.patch('/current', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.object({
        name: z.string().min(1).max(200).optional(),
        logo: z.string().url().optional(),
        primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        timezone: z.string().optional(),
        locale: z.string().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: request.tenant.id },
      data: request.body,
      include: { settings: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'TENANT_UPDATE',
        entityType: 'Tenant',
        entityId: request.tenant.id,
        newData: request.body,
      },
    });

    return reply.send({ success: true, data: updatedTenant });
  });

  // Get tenant settings
  fastify.get('/current/settings', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const settings = await prisma.setting.findMany({
      where: { tenantId: request.tenant.id },
      orderBy: { key: 'asc' },
    });

    const settingsMap = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});

    return reply.send({ success: true, data: settingsMap });
  });

  // Update tenant settings
  fastify.patch('/current/settings', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.record(z.unknown()),
    },
  }, async (request: FastifyRequest<{ Body: Record<string, any> }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const updates = Object.entries(request.body).map(([key, value]) =>
      prisma.setting.upsert({
        where: { tenantId_key: { tenantId: request.tenant.id, key } },
        create: { tenantId: request.tenant.id, key, value },
        update: { value },
      })
    );

    await Promise.all(updates);

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'TENANT_SETTINGS_UPDATE',
        entityType: 'Tenant',
        entityId: request.tenant.id,
        newData: request.body,
      },
    });

    const settings = await prisma.setting.findMany({
      where: { tenantId: request.tenant.id },
      orderBy: { key: 'asc' },
    });

    const settingsMap = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});

    return reply.send({ success: true, data: settingsMap });
  });

  // Get tenant users (admin only)
  fastify.get('/current/users', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
        role: z.enum(['ADMIN', 'AGENT', 'SUPERVISOR']).optional(),
        isActive: z.boolean().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const { page, limit, role, isActive } = request.query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: request.tenant.id };
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { conversations: true, tickets: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  // Get tenant stats (admin only)
  fastify.get('/current/stats', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin or supervisor access required' },
      });
    }

    const tenantId = request.tenant.id;

    const [
      totalUsers,
      activeUsers,
      totalContacts,
      activeContacts,
      totalConversations,
      openConversations,
      totalMessages,
      todayMessages,
      totalTickets,
      openTickets,
      totalCampaigns,
      sentCampaigns,
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId, isActive: true } }),
      prisma.contact.count({ where: { tenantId } }),
      prisma.contact.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.conversation.count({ where: { tenantId } }),
      prisma.conversation.count({ where: { tenantId, status: 'OPEN' } }),
      prisma.message.count({ where: { tenantId } }),
      prisma.message.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.ticket.count({ where: { tenantId } }),
      prisma.ticket.count({ where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'] } } }),
      prisma.campaign.count({ where: { tenantId } }),
      prisma.campaign.count({ where: { tenantId, status: 'SENT' } }),
    ]);

    return reply.send({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers },
        contacts: { total: totalContacts, active: activeContacts },
        conversations: { total: totalConversations, open: openConversations },
        messages: { total: totalMessages, today: todayMessages },
        tickets: { total: totalTickets, open: openTickets },
        campaigns: { total: totalCampaigns, sent: sentCampaigns },
      },
    });
  });

  // Invite user to tenant
  fastify.post('/current/invite', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.object({
        email: z.string().email(),
        role: z.enum(['AGENT', 'SUPERVISOR']),
        name: z.string().min(1).max(100),
      }),
    },
  }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const { email, role, name } = request.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { tenantId: request.tenant.id, email },
    });

    if (existingUser) {
      return reply.status(409).send({
        success: false,
        error: { code: ERROR_CODES.CONFLICT, message: 'User with this email already exists' },
      });
    }

    // Create invitation token
    const { generateInvitationToken } = await import('@zapti/shared/auth');
    const token = generateInvitationToken();
    const { hashToken } = await import('@zapti/shared/auth');
    const tokenHash = await hashToken(token);

    const invitation = await prisma.invitation.create({
      data: {
        tenantId: request.tenant.id,
        email,
        role,
        name,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        invitedById: request.user.sub,
      },
    });

    // In production, send invitation email
    const inviteUrl = `${config().appUrl}/accept-invitation?token=${token}&email=${email}`;
    console.log(`Invitation sent to ${email}: ${inviteUrl}`);

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant.id,
        userId: request.user.sub,
        action: 'TENANT_INVITE_CREATE',
        entityType: 'Invitation',
        entityId: invitation.id,
        newData: { email, role },
      },
    });

    return reply.status(201).send({ success: true, data: { invitationId: invitation.id, inviteUrl } });
  });

  // Accept invitation
  fastify.post('/accept-invitation', {
    schema: {
      body: z.object({
        token: z.string(),
        email: z.string().email(),
        password: z.string().min(8),
      }),
    },
  }, async (request: FastifyRequest<{ Body: { token: string; email: string; password: string } }>, reply: FastifyReply) => {
    const { token, email, password } = request.body;

    const { verifyTokenHash } = await import('@zapti/shared/auth');

    const invitation = await prisma.invitation.findFirst({
      where: { email, expiresAt: { gt: new Date() } },
    });

    if (!invitation || !await verifyTokenHash(token, invitation.tokenHash)) {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.TOKEN_INVALID, message: 'Invalid or expired invitation' },
      });
    }

    const { hashPassword } = await import('@zapti/shared/auth');
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        tenantId: invitation.tenantId,
        email: invitation.email,
        name: invitation.name,
        password: hashedPassword,
        role: invitation.role,
      },
    });

    // Delete used invitation
    await prisma.invitation.delete({ where: { id: invitation.id } });

    // Generate tokens
    const { generateTokens } = await import('@zapti/shared/auth');
    const { accessToken, refreshToken } = generateTokens({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    });

    // Store refresh token
    const { hashToken } = await import('@zapti/shared/auth');
    const refreshTokenHash = await hashToken(refreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set cookie
    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth/refresh',
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'INVITATION_ACCEPT',
        entityType: 'User',
        entityId: user.id,
      },
    });

    return reply.status(201).send({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  });
}