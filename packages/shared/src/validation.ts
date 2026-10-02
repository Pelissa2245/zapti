// ZapTI Shared Validation Schemas (Zod)
import { z } from 'zod';

// ============================================
// COMMON SCHEMAS
// ============================================

export const uuidSchema = z.string().uuid('ID inválido');
export const emailSchema = z.string().email('Email inválido');
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Telefone inválido (formato E.164)');
export const urlSchema = z.string().url('URL inválida');
export const slugSchema = z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens');

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// Date range
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// Search
export const searchSchema = z.object({
  q: z.string().optional(),
  ...paginationSchema.shape,
  ...dateRangeSchema.shape,
});

// ============================================
// TENANT SCHEMAS
// ============================================

export const createTenantSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  adminEmail: emailSchema,
  adminName: z.string().min(2).max(100),
  adminPassword: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  settings: z.record(z.unknown()).optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const tenantQuerySchema = searchSchema.extend({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
});

// ============================================
// USER SCHEMAS
// ============================================

export const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').optional(), // Optional if sending invite
  role: z.enum(['ADMIN', 'SUPERVISOR', 'AGENT', 'READONLY']).default('AGENT'),
  permissions: z.array(z.string()).optional(),
  teamIds: z.array(uuidSchema).optional(),
  sendInvite: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'AGENT', 'READONLY']).optional(),
  permissions: z.array(z.string()).optional(),
  teamIds: z.array(uuidSchema).optional(),
  isActive: z.boolean().optional(),
});

export const userQuerySchema = searchSchema.extend({
  role: z.enum(['ADMIN', 'SUPERVISOR', 'AGENT', 'READONLY']).optional(),
  isActive: z.boolean().optional(),
  teamId: uuidSchema.optional(),
});

// ============================================
// TEAM SCHEMAS
// ============================================

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hexadecimal (ex: #3B82F6)').default('#3B82F6'),
  memberIds: z.array(uuidSchema).optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  memberIds: z.array(uuidSchema).optional(),
});

export const teamQuerySchema = searchSchema;

// ============================================
// SESSION SCHEMAS
// ============================================

export const sessionQuerySchema = searchSchema.extend({
  status: z.enum(['ACTIVE', 'EXPIRED', 'REVOKED', 'ALL_REVOKED']).optional(),
  userId: uuidSchema.optional(),
});

// ============================================
// WHATSAPP INSTANCE SCHEMAS (Fase 2+)
// ============================================

export const createWhatsAppInstanceSchema = z.object({
  name: z.string().min(2).max(100),
  evolutionInstanceName: z.string().min(2).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  webhookUrl: z.string().url().optional().nullable(),
  settings: z.record(z.unknown()).optional(),
});

export const updateWhatsAppInstanceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  webhookUrl: z.string().url().optional().nullable(),
  settings: z.record(z.unknown()).optional(),
});

export const whatsAppInstanceQuerySchema = searchSchema.extend({
  status: z.enum(['connecting', 'connected', 'disconnected', 'qr_required']).optional(),
});

// ============================================
// CONTACT SCHEMAS
// ============================================

export const createContactSchema = z.object({
  phoneNumber: phoneSchema,
  name: z.string().max(100).optional(),
  whatsappInstanceId: uuidSchema.optional(),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.unknown()).default({}),
});

export const updateContactSchema = z.object({
  name: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
  isBlocked: z.boolean().optional(),
});

export const contactQuerySchema = searchSchema.extend({
  whatsappInstanceId: uuidSchema.optional(),
  isBlocked: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================
// CONVERSATION SCHEMAS
// ============================================

export const conversationQuerySchema = searchSchema.extend({
  status: z.enum(['open', 'closed', 'archived']).optional(),
  whatsappInstanceId: uuidSchema.optional(),
  assignedUserId: uuidSchema.optional(),
  assignedTeamId: uuidSchema.optional(),
  isGroup: z.boolean().optional(),
  contactId: uuidSchema.optional(),
});

// ============================================
// MESSAGE SCHEMAS
// ============================================

export const sendMessageSchema = z.object({
  conversationId: uuidSchema,
  contactId: uuidSchema,
  type: z.enum(['text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'contact', 'reaction']),
  content: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  mediaMimeType: z.string().optional(),
  mediaFilename: z.string().optional(),
  quotedMessageId: uuidSchema.optional(),
});

export const messageQuerySchema = searchSchema.extend({
  conversationId: uuidSchema.optional(),
  contactId: uuidSchema.optional(),
  fromMe: z.boolean().optional(),
  messageType: z.string().optional(),
  whatsappInstanceId: uuidSchema.optional(),
});

// ============================================
// TICKET SCHEMAS (Fase 4+)
// ============================================

export const createTicketSchema = z.object({
  conversationId: uuidSchema,
  contactId: uuidSchema,
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  category: z.string().max(50).optional(),
  tags: z.array(z.string()).default([]),
  assigneeId: uuidSchema.optional(),
  teamId: uuidSchema.optional(),
  slaHours: z.number().int().min(1).max(720).optional(),
});

export const updateTicketSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(['open', 'in_progress', 'waiting_customer', 'waiting_agent', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  category: z.string().max(50).optional().nullable(),
  tags: z.array(z.string()).optional(),
  assigneeId: uuidSchema.optional().nullable(),
  teamId: uuidSchema.optional().nullable(),
  slaHours: z.number().int().min(1).max(720).optional().nullable(),
});

export const ticketQuerySchema = searchSchema.extend({
  status: z.enum(['open', 'in_progress', 'waiting_customer', 'waiting_agent', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assigneeId: uuidSchema.optional(),
  teamId: uuidSchema.optional(),
  contactId: uuidSchema.optional(),
  category: z.string().optional(),
  slaBreached: z.boolean().optional(),
});

// ============================================
// BOT/FLOW SCHEMAS (Fase 5+)
// ============================================

export const createFlowSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  nodes: z.array(z.record(z.unknown())).default([]),
  edges: z.array(z.record(z.unknown())).default([]),
  settings: z.record(z.unknown()).default({}),
});

export const updateFlowSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  nodes: z.array(z.record(z.unknown())).optional(),
  edges: z.array(z.record(z.unknown())).optional(),
  settings: z.record(z.unknown()).optional(),
  isPublished: z.boolean().optional(),
});

export const createBotRuleSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  trigger: z.enum(['new_contact', 'new_message', 'tag_added', 'group_mention', 'keyword']),
  conditions: z.record(z.unknown()).default({}),
  flowId: uuidSchema.optional().nullable(),
  action: z.enum(['start_flow', 'send_message', 'add_tag', 'remove_tag', 'assign_user', 'assign_team', 'create_ticket']),
  actionConfig: z.record(z.unknown()).default({}),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const createAutomationSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  trigger: z.enum(['schedule', 'webhook', 'event']),
  schedule: z.string().optional(), // Cron expression
  conditions: z.record(z.unknown()).default({}),
  actions: z.array(z.record(z.unknown())).default([]),
  isActive: z.boolean().default(true),
});

// ============================================
// SETTINGS SCHEMAS
// ============================================

export const appearanceSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#64748B'),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FFFFFF'),
  surfaceColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#F8FAFC'),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#1E293B'),
  fontFamily: z.string().default('Inter, system-ui, sans-serif'),
  fontSize: z.enum(['sm', 'md', 'lg']).default('md'),
  borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).default('md'),
  density: z.enum(['compact', 'comfortable', 'spacious']).default('comfortable'),
  darkMode: z.boolean().default(false),
  logoUrl: z.string().url().optional().nullable(),
  faviconUrl: z.string().url().optional().nullable(),
  companyName: z.string().max(100).optional(),
});

export const smtpSettingsSchema = z.object({
  host: z.string().min(1, 'Host é obrigatório'),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  user: z.string().min(1, 'Usuário é obrigatório'),
  pass: z.string().min(1, 'Senha é obrigatória'),
  from: emailSchema,
  preset: z.enum(['gmail', 'outlook', 'yahoo', 'custom']).optional(),
});

export const notificationSettingsSchema = z.object({
  pushEnabled: z.boolean().default(true),
  soundEnabled: z.boolean().default(true),
  events: z.object({
    newMessage: z.boolean().default(true),
    newTicket: z.boolean().default(true),
    ticketAssigned: z.boolean().default(true),
    ticketMessage: z.boolean().default(true),
    mention: z.boolean().default(true),
    whatsappDisconnected: z.boolean().default(true),
    backupCompleted: z.boolean().default(true),
    backupFailed: z.boolean().default(true),
    systemError: z.boolean().default(true),
    updateAvailable: z.boolean().default(true),
  }).default({}),
});

// ============================================
// AUDIT SCHEMAS
// ============================================

export const auditLogQuerySchema = searchSchema.extend({
  userId: uuidSchema.optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: uuidSchema.optional(),
  tenantId: uuidSchema.optional(),
});

// ============================================
// BACKUP SCHEMAS
// ============================================

export const createBackupSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(['full', 'partial', 'media', 'database']),
  includes: z.array(z.string()).default([]),
  tenantId: uuidSchema.optional(),
});

// ============================================
// DANGER ZONE SCHEMAS
// ============================================

export const dangerZoneConfirmSchema = z.object({
  confirmation: z.string().min(1, 'Confirmação é obrigatória'),
  // The confirmation must match the expected string (entity name, ID, etc.)
});

// ============================================
// EXPORTS
// ============================================

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type CreateWhatsAppInstanceInput = z.infer<typeof createWhatsAppInstanceSchema>;
export type UpdateWhatsAppInstanceInput = z.infer<typeof updateWhatsAppInstanceSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateFlowInput = z.infer<typeof createFlowSchema>;
export type UpdateFlowInput = z.infer<typeof updateFlowSchema>;
export type CreateBotRuleInput = z.infer<typeof createBotRuleSchema>;
export type CreateAutomationInput = z.infer<typeof createAutomationSchema>;
export type AppearanceSettingsInput = z.infer<typeof appearanceSettingsSchema>;
export type SmtpSettingsInput = z.infer<typeof smtpSettingsSchema>;
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;
export type CreateBackupInput = z.infer<typeof createBackupSchema>;
export type DangerZoneConfirmInput = z.infer<typeof dangerZoneConfirmSchema>;