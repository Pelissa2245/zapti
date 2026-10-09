import { z } from 'zod';

// Pagination
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ID params
export const IdParamSchema = z.object({
  id: z.string().cuid(),
});

export const ContactIdParamSchema = z.object({
  contactId: z.string().cuid(),
});

export const ConversationIdParamSchema = z.object({
  conversationId: z.string().cuid(),
});

export const MessageIdParamSchema = z.object({
  messageId: z.string().cuid(),
});

export const TicketIdParamSchema = z.object({
  ticketId: z.string().cuid(),
});

// Search
export const SearchQuerySchema = z.object({
  q: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Tenant
export const CreateTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  domain: z.string().max(100).optional(),
  logo: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#1E40AF'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#F59E0B'),
  fontFamily: z.string().default('Inter'),
  adminEmail: z.string().email().optional(),
  adminName: z.string().optional(),
  adminPassword: z.string().min(8).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const UpdateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
  domain: z.string().max(100).optional(),
  logo: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontFamily: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

// User
export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'AGENT', 'VIEWER']).default('AGENT'),
  avatar: z.string().url().optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['ADMIN', 'AGENT', 'VIEWER']).optional(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url().optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

// Contact
export const CreateContactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(10).max(20),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const UpdateContactSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(10).max(20).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
  isBlocked: z.boolean().optional(),
});

// Conversation
export const CreateConversationSchema = z.object({
  contactId: z.string().cuid(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  assignedToId: z.string().cuid().optional(),
});

export const UpdateConversationSchema = z.object({
  status: z.enum(['OPEN', 'PENDING', 'RESOLVED', 'CLOSED', 'SPAM']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().cuid().nullable().optional(),
});

// Message
export const SendMessageSchema = z.object({
  conversationId: z.string().cuid(),
  content: z.string().min(1).max(4096),
  type: z.enum(['TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'LOCATION', 'CONTACT', 'STICKER', 'REACTION', 'TEMPLATE']).default('TEXT'),
  mediaUrl: z.string().url().optional(),
  mediaType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Ticket
export const CreateTicketSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000).optional(),
  conversationId: z.string().cuid().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  assignedToId: z.string().cuid().optional(),
  dueDate: z.string().datetime().optional(),
});

export const UpdateTicketSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().cuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

// Group
export const CreateGroupSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export const UpdateGroupSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const AddGroupMemberSchema = z.object({
  contactId: z.string().cuid(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

// Campaign
export const CreateCampaignSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  templateId: z.string().cuid().optional(),
  scheduledAt: z.string().datetime().optional(),
  contactIds: z.array(z.string().cuid()).min(1),
});

export const UpdateCampaignSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  templateId: z.string().cuid().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

// Automation
export const CreateAutomationSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  trigger: z.string(),
  conditions: z.record(z.unknown()).optional(),
  actions: z.array(z.record(z.unknown())).min(1),
  isActive: z.boolean().default(true),
});

export const UpdateAutomationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  trigger: z.string().optional(),
  conditions: z.record(z.unknown()).optional(),
  actions: z.array(z.record(z.unknown())).optional(),
  isActive: z.boolean().optional(),
});

// Webhook
export const CreateWebhookSchema = z.object({
  name: z.string().min(2).max(100),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateWebhookSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  secret: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Integration
export const CreateIntegrationSchema = z.object({
  type: z.enum(['EVOLUTION_API', 'WHATSAPP_BUSINESS', 'SMTP', 'WEBHOOK']),
  name: z.string().min(2).max(100),
  config: z.record(z.unknown()),
  isActive: z.boolean().default(true),
});

export const UpdateIntegrationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  config: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

// Setting
export const CreateSettingSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.-]+$/),
  value: z.any(),
});

export const UpdateSettingSchema = z.object({
  value: z.any(),
});