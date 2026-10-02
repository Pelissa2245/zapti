// ZapTI API — Team Routes
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@zapti/database';

const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  memberIds: z.array(z.string().uuid()).default([]),
});

const updateTeamSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const listTeamsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  q: z.string().optional(),
});

export async function teamRoutes(app: FastifyInstance) {
  // GET /teams - List teams
  app.get('/', {
    schema: { querystring: listTeamsQuerySchema },
    preHandler: [app.requirePermission('teams:read')],
  }, async (request) => {
    const { page, limit, q } = request.query as z.infer<typeof listTeamsQuerySchema>;
    const tenantId = request.tenant!.id;

    const where: any = { tenantId };
    if (q) where.name = { contains: q, mode: 'insensitive' };

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        include: {
          members: {
            include: {
              userTenant: {
                include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
              },
            },
          },
          _count: { select: { members: true, tickets: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.team.count({ where }),
    ]);

    return {
      data: teams,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  });

  // GET /teams/:id - Get team details
  app.get('/:id', {
    preHandler: [app.requirePermission('teams:read')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const team = await prisma.team.findFirst({
      where: { id, tenantId },
      include: {
        members: {
          include: {
            userTenant: {
              include: { user: { select: { id: true, email: true, name: true, avatarUrl: true, isActive: true } } },
            },
          },
        },
        _count: { select: { tickets: true } },
      },
    });

    if (!team) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Equipe não encontrada' } });
    }

    return { team };
  });

  // POST /teams - Create team
  app.post('/', {
    schema: { body: createTeamSchema },
    preHandler: [app.requirePermission('teams:create')],
  }, async (request, reply) => {
    const body = request.body as { name: string; description?: string; color?: string; memberIds?: string[] };
    const { name, description, color, memberIds = [] } = body;
    const tenantId = request.tenant!.id;

    // Check if team name exists
    const existing = await prisma.team.findFirst({ where: { tenantId, name } });
    if (existing) {
      return reply.status(409).send({ error: { code: 'NAME_EXISTS', message: 'Já existe uma equipe com este nome' } });
    }

    const team = await prisma.$transaction(async (tx) => {
      const newTeam = await tx.team.create({
        data: { tenantId, name, description, color },
      });

      if (memberIds.length > 0) {
        const userTenants = await tx.userTenant.findMany({
          where: { userId: { in: memberIds }, tenantId },
          select: { userId: true, id: true },
        });

        if (userTenants.length !== memberIds.length) {
          throw new Error('INVALID_MEMBERS');
        }

        await tx.userTeam.createMany({
          data: userTenants.map((ut) => ({ userId: ut.userId, teamId: newTeam.id, userTenantId: ut.id })),
        });
      }

      const createdTeam = await tx.team.findUnique({ where: { id: newTeam.id }, include: { members: { include: { userTenant: { include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } } } } } } });
    if (!createdTeam) throw new Error('TEAM_CREATION_FAILED');
    return createdTeam;
    });

    await logAudit(request, 'TEAM_CREATED', { teamId: team.id, name });

    return reply.status(201).send({ team });
  });

  // PATCH /teams/:id - Update team
  app.patch('/:id', {
    schema: { body: updateTeamSchema },
    preHandler: [app.requirePermission('teams:update')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, description, color } = request.body as z.infer<typeof updateTeamSchema>;
    const tenantId = request.tenant!.id;

    const team = await prisma.team.findFirst({ where: { id, tenantId } });
    if (!team) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Equipe não encontrada' } });
    }

    if (name && name !== team.name) {
      const existing = await prisma.team.findFirst({ where: { tenantId, name } });
      if (existing) {
        return reply.status(409).send({ error: { code: 'NAME_EXISTS', message: 'Já existe uma equipe com este nome' } });
      }
    }

    const updated = await prisma.team.update({
      where: { id },
      data: { name, description, color },
      include: { members: { include: { userTenant: { include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } } } } } },
    });

    await logAudit(request, 'TEAM_UPDATED', { teamId: id, changes: request.body });

    return { team: updated };
  });

  // DELETE /teams/:id - Delete team
  app.delete('/:id', {
    preHandler: [app.requirePermission('teams:delete')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant!.id;

    const team = await prisma.team.findFirst({ where: { id, tenantId } });
    if (!team) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Equipe não encontrada' } });
    }

    await prisma.team.delete({ where: { id } });

    await logAudit(request, 'TEAM_DELETED', { teamId: id, name: team.name });

    return { success: true, message: 'Equipe excluída' };
  });

  // POST /teams/:id/members - Add member to team
  app.post('/:id/members', {
    schema: { body: z.object({ userIds: z.array(z.string().uuid()).min(1) }) },
    preHandler: [app.requirePermission('teams:update')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userIds } = request.body as { userIds: string[] };
    const tenantId = request.tenant!.id;

    const team = await prisma.team.findFirst({ where: { id, tenantId } });
    if (!team) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Equipe não encontrada' } });
    }

    const userTenants = await prisma.userTenant.findMany({
      where: { userId: { in: userIds }, tenantId },
      select: { userId: true, id: true },
    });

    if (userTenants.length !== userIds.length) {
      return reply.status(400).send({ error: { code: 'INVALID_MEMBERS', message: 'Um ou mais usuários não pertencem a este tenant' } });
    }

    for (const ut of userTenants) {
      await prisma.userTeam.upsert({
        where: { userId_teamId: { userId: ut.userId, teamId: id } },
        create: { userId: ut.userId, teamId: id, userTenantId: ut.id },
        update: {},
      });
    }

    await logAudit(request, 'TEAM_MEMBER_ADDED', { teamId: id, userIds });

    return { success: true, message: 'Membros adicionados' };
  });

  // DELETE /teams/:id/members/:userId - Remove member from team
  app.delete('/:id/members/:userId', {
    preHandler: [app.requirePermission('teams:update')],
  }, async (request, reply) => {
    const { id, userId } = request.params as { id: string; userId: string };
    const tenantId = request.tenant!.id;

    const team = await prisma.team.findFirst({ where: { id, tenantId } });
    if (!team) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Equipe não encontrada' } });
    }

    const userTeam = await prisma.userTeam.findFirst({
      where: { teamId: id, userId, team: { tenantId } },
    });

    if (!userTeam) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Usuário não é membro desta equipe' } });
    }

    await prisma.userTeam.delete({ where: { id: userTeam.id } });

    await logAudit(request, 'TEAM_MEMBER_REMOVED', { teamId: id, userId });

    return { success: true, message: 'Membro removido da equipe' };
  });
}

async function logAudit(request: any, action: string, metadata: Record<string, any>) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenant?.id,
        userId: request.user?.id,
        action,
        description: `${action} - ${metadata.teamId || metadata.userId || 'unknown'}`,
        metadata: JSON.stringify({ ...metadata, ip: String(request.ip || ''), userAgent: String(request.headers['user-agent'] || '') }),
      },
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}