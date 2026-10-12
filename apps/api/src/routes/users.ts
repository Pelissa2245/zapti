import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { ERROR_CODES } from '@zapti/shared/constants';
import { PaginationQuerySchema, IdParamSchema, SearchQuerySchema } from '@zapti/shared/validation';
import { verifyPassword, hashPassword } from '@zapti/shared/auth';
import { JWTPayload } from '@zapti/shared/auth';

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  // List users (admin only)
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: PaginationQuerySchema.merge(SearchQuerySchema).extend({
        role: z.enum(['ADMIN', 'AGENT', 'SUPERVISOR']).optional(),
        isActive: z.boolean().optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      });
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const { page, limit, sortBy, sortOrder, q, role, isActive } = request.query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId: request.tenant!.id };
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
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

  // Get user by ID
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    // Users can view their own profile, admins can view any
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role) && request.user.sub !== request.params.id) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Access denied' },
      });
    }

    const user = await prisma.user.findFirst({
      where: { id: request.params.id, tenantId: request.tenant!.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        tenant: { select: { id: true, name: true } },
        _count: { select: { conversations: true, tickets: true } },
      },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' },
      });
    }

    return reply.send({ success: true, data: user });
  });

  // Create user (admin only)
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      body: z.object({
        email: z.string().email(),
        name: z.string().min(1).max(100),
        password: z.string().min(8),
        role: z.enum(['AGENT', 'SUPERVISOR']),
        isActive: z.boolean().optional(),
      }),
    },
  }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      });
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    const body = request.body as { email: string; name: string; password: string; role: 'AGENT' | 'SUPERVISOR'; isActive?: boolean };
    const { email, name, password, role, isActive } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { tenantId: request.tenant!.id, email },
    });

    if (existingUser) {
      return reply.status(409).send({
        success: false,
        error: { code: ERROR_CODES.CONFLICT, message: 'User with this email already exists' },
      });
    }

    const { hashPassword } = await import('@zapti/shared/auth');
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        tenantId: request.tenant!.id,
        email,
        name,
        password: hashedPassword,
        role,
        isActive: isActive !== false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant!.id,
        userId: request.user.sub,
        action: 'USER_CREATE',
        entityType: 'User',
        entityId: user.id,
        newData: { email, name, role },
      },
    });

    return reply.status(201).send({ success: true, data: user });
  });

  // Update user (admin only, or self for limited fields)
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
      body: z.object({
        name: z.string().min(1).max(100).optional(),
        avatar: z.string().url().optional(),
        role: z.enum(['ADMIN', 'AGENT', 'SUPERVISOR']).optional(),
        isActive: z.boolean().optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().min(8).optional(),
      }),
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      });
    }
    const body = request.body as { name?: string; avatar?: string; role?: 'ADMIN' | 'AGENT' | 'SUPERVISOR'; isActive?: boolean; currentPassword?: string; newPassword?: string };
    const isSelf = request.user.sub === request.params.id;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(request.user.role);

    if (!isSelf && !isAdmin) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Access denied' },
      });
    }

    const user = await prisma.user.findFirst({
      where: { id: request.params.id, tenantId: request.tenant!.id },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' },
      });
    }

    // Non-admins can only update limited fields
    const allowedFields = isAdmin
      ? ['name', 'avatar', 'role', 'isActive'] as const
      : ['name', 'avatar'] as const;

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      const value = body[field];
      if (value !== undefined) {
        updateData[field] = value;
      }
    }

    // Password change
    if (body.newPassword) {
      if (!body.currentPassword) {
        return reply.status(400).send({
          success: false,
          error: { code: ERROR_CODES.INVALID_INPUT, message: 'Current password required' },
        });
      }

      if (!await verifyPassword(body.currentPassword, user.passwordHash)) {
        return reply.status(401).send({
          success: false,
          error: { code: ERROR_CODES.INVALID_CREDENTIALS, message: 'Current password is incorrect' },
        });
      }

      updateData.passwordHash = await hashPassword(body.newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant!.id,
        userId: request.user.sub,
        action: 'USER_UPDATE',
        entityType: 'User',
        entityId: user.id,
        newData: updateData,
      },
    });

    return reply.send({ success: true, data: updatedUser });
  });

  // Delete user (admin only)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: IdParamSchema,
    },
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      });
    }
    if (!['ADMIN', 'SUPER_ADMIN'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin access required' },
      });
    }

    if (request.user.sub === request.params.id) {
      return reply.status(400).send({
        success: false,
        error: { code: ERROR_CODES.INVALID_INPUT, message: 'Cannot delete yourself' },
      });
    }

    const user = await prisma.user.findFirst({
      where: { id: request.params.id, tenantId: request.tenant!.id },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: { code: ERROR_CODES.NOT_FOUND, message: 'User not found' },
      });
    }

    // Check if user has assigned conversations/tickets
    const [conversationCount, ticketCount] = await Promise.all([
      prisma.conversation.count({ where: { assignedToId: user.id, status: { not: 'CLOSED' } } }),
      prisma.ticket.count({ where: { assignedToId: user.id, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
    ]);

    if (conversationCount > 0 || ticketCount > 0) {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.CONFLICT,
          message: 'User has active conversations or tickets. Reassign them first.'
        },
      });
    }

    // Soft delete - deactivate
    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: false },
    });

    // Invalidate refresh tokens
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokens: [] },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant!.id,
        userId: request.user.sub,
        action: 'USER_DELETE',
        entityType: 'User',
        entityId: user.id,
      },
    });

    return reply.send({ success: true, message: 'User deactivated' });
  });

  // Get user stats (admin only)
  fastify.get('/stats/overview', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' },
      });
    }
    if (!['ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: ERROR_CODES.FORBIDDEN, message: 'Admin or supervisor access required' },
      });
    }

    const tenantId = request.tenant!.id;

    const [total, active, inactive, byRole, recentlyActive] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId, isActive: true } }),
      prisma.user.count({ where: { tenantId, isActive: false } }),
      prisma.user.groupBy({ by: ['role'], where: { tenantId }, _count: true }),
      prisma.user.count({
        where: {
          tenantId,
          lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        total,
        active,
        inactive,
        byRole: byRole.reduce((acc, item) => ({ ...acc, [item.role]: item._count }), {}),
        recentlyActive,
      },
    });
  });
}