// ZapTI API — Route Registration
import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth/index.js';
import { userRoutes } from './users/index.js';
import { tenantRoutes } from './tenants/index.js';
import { whatsappRoutes } from './whatsapp/index.js';
import { contactRoutes } from './contacts/index.js';
import { conversationRoutes } from './conversations/index.js';
import { ticketRoutes } from './tickets/index.js';
import { flowRoutes } from './flows/index.js';
import { automationRoutes } from './automations/index.js';
import { auditRoutes } from './audit/index.js';
import { backupRoutes } from './backups/index.js';

export async function registerRoutes(app: FastifyInstance) {
  // API v1 prefix
  await app.register(async function (api) {
    api.register(authRoutes, { prefix: '/auth' });
    api.register(userRoutes, { prefix: '/users' });
    api.register(tenantRoutes, { prefix: '/tenants' });
    api.register(whatsappRoutes, { prefix: '/whatsapp' });
    api.register(contactRoutes, { prefix: '/contacts' });
    api.register(conversationRoutes, { prefix: '/conversations' });
    api.register(ticketRoutes, { prefix: '/tickets' });
    api.register(flowRoutes, { prefix: '/flows' });
    api.register(automationRoutes, { prefix: '/automations' });
    api.register(auditRoutes, { prefix: '/audit' });
    api.register(backupRoutes, { prefix: '/backups' });
  }, { prefix: '/api/v1' });
}