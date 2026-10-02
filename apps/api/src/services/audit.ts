// ZapTI API — Audit Service
import { prisma } from '@zapti/database';

export interface AuditLogInput {
  userId?: string;
  tenantId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, any> | string;
  ip?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 * This is a fire-and-forget operation - failures are logged but don't block the main flow
 */
export async function logAuditAction(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        tenantId: input.tenantId,
        action: input.action as any,
        entityType: input.entityType,
        entityId: input.entityId,
        description: input.description,
        metadata: typeof input.metadata === 'string' ? input.metadata : JSON.stringify(input.metadata || {}),
        ip: input.ip,
        userAgent: input.userAgent || 'API',
      },
    });
  } catch (error) {
    // Log error but don't throw - audit should never break the main flow
    console.error('[AUDIT] Failed to create audit log:', error);
  }
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(params: {
  tenantId?: string;
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const {
    tenantId,
    userId,
    action,
    entityType,
    entityId,
    startDate,
    endDate,
    page,
    limit,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params;

  const where: any = {};

  if (tenantId) where.tenantId = tenantId;
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Get audit log statistics for a tenant
 */
export async function getAuditStats(tenantId: string, days: number = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    totalLogs,
    byAction,
    byUser,
    recentActions,
  ] = await Promise.all([
    prisma.auditLog.count({ where: { tenantId, createdAt: { gte: startDate } } }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where: { tenantId, createdAt: { gte: startDate } },
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    }),
    prisma.auditLog.groupBy({
      by: ['userId'],
      where: { tenantId, createdAt: { gte: startDate }, userId: { not: null } },
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    }),
    prisma.auditLog.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  // Get user details for top users
  const topUserIds = byUser.map((u) => u.userId!).filter(Boolean);
  const topUsers = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true, email: true },
  });

  const userMap = new Map(topUsers.map((u) => [u.id, u]));

  return {
    totalLogs,
    byAction: byAction.map((a) => ({ action: a.action, count: a._count.action })),
    byUser: byUser.map((u) => ({
      userId: u.userId,
      count: u._count.userId,
      user: u.userId ? userMap.get(u.userId) : null,
    })),
    recentActions,
  };
}

/**
 * Export audit logs to CSV
 */
export async function exportAuditLogs(params: {
  tenantId?: string;
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<string> {
  const where: any = {};

  if (params.tenantId) where.tenantId = params.tenantId;
  if (params.userId) where.userId = params.userId;
  if (params.action) where.action = params.action;
  if (params.entityType) where.entityType = params.entityType;
  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) where.createdAt.gte = params.startDate;
    if (params.endDate) where.createdAt.lte = params.endDate;
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 10000, // Limit export
    include: {
      user: { select: { id: true, name: true, email: true } },
      tenant: { select: { id: true, name: true, slug: true } },
    },
  });

  // CSV headers
  const headers = [
    'ID',
    'Data/Hora',
    'Tenant',
    'Usuário',
    'Email',
    'Ação',
    'Tipo Entidade',
    'ID Entidade',
    'Descrição',
    'IP',
    'User Agent',
  ];

  const rows = logs.map((log) => [
    log.id,
    log.createdAt.toISOString(),
    log.tenant?.name || 'Sistema',
    log.user?.name || 'Sistema',
    log.user?.email || '-',
    log.action,
    log.entityType || '-',
    log.entityId || '-',
    `"${log.description.replace(/"/g, '""')}"`,
    log.ip || '-',
    log.userAgent || '-',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}