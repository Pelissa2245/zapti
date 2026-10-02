import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { User, Tenant, UserTenant } from '@zapti/shared/types';
import type { Permission } from '@zapti/shared/constants';

// Override fastify-jwt UserType to use our User type
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: User;
    tenantId: string;
    sessionId: string;
    userId: string;
  }
}

declare module 'fastify' {
  // Also override FastifyRequest.user to use our User type
  interface FastifyRequest {
    // Auth properties (overriding fastify-jwt)
    user: User;
    userTenant: UserTenant;
    tenant: Tenant;
    sessionId: string;
    session?: any;

    // Audit log
    auditLog?: {
      action: string;
      entityType?: string;
      entityId?: string;
      description: string;
      metadata?: Record<string, any>;
    };
  }

  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireSuperadmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requirePermission(permission: Permission): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    verifyWebhook(secret: string): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    emitToConversation(conversationId: string, event: string, data: any): void;
    emitToTenant(tenantId: string, event: string, data: any): void;
    triggerAutomation: any;
    io?: any;
  }
}