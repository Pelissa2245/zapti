export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  iat?: number;
  exp?: number;
}

export type UserRole = 'ADMIN' | 'SUPER_ADMIN' | 'AGENT' | 'VIEWER';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily?: string;
  settings?: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  twoFactorEnabled: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  tags: string[];
  customFields?: Record<string, unknown>;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ConversationStatus = 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED' | 'SPAM';

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Conversation {
  id: string;
  contactId: string;
  tenantId: string;
  status: ConversationStatus;
  priority: Priority;
  assignedToId?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  contact?: Contact;
  assignedTo?: Pick<User, 'id' | 'name' | 'avatar'>;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'LOCATION' | 'CONTACT' | 'STICKER' | 'REACTION' | 'TEMPLATE';

export type MessageDirection = 'INBOUND' | 'OUTBOUND';

export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface Message {
  id: string;
  conversationId: string;
  contactId: string;
  tenantId: string;
  userId?: string;
  content: string;
  type: MessageType;
  mediaUrl?: string;
  mediaType?: string;
  direction: MessageDirection;
  status: MessageStatus;
  externalId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  user?: Pick<User, 'id' | 'name' | 'avatar'>;
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED';

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: Priority;
  conversationId?: string;
  tenantId: string;
  assignedToId?: string;
  createdById: string;
  dueDate?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type GroupRole = 'ADMIN' | 'MEMBER';

export interface GroupMember {
  id: string;
  groupId: string;
  contactId: string;
  role: GroupRole;
  joinedAt: Date;
  contact?: Contact;
}

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'PAUSED' | 'CANCELLED';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  templateId?: string;
  tenantId: string;
  status: CampaignStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  completedAt?: Date;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type AutomationTrigger =
  | 'NEW_MESSAGE'
  | 'NEW_CONVERSATION'
  | 'KEYWORD_MATCH'
  | 'TIME_BASED'
  | 'CONTACT_TAG_ADDED'
  | 'TICKET_CREATED'
  | 'TICKET_STATUS_CHANGED';

export interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IntegrationType = 'EVOLUTION_API' | 'WHATSAPP_BUSINESS' | 'SMTP' | 'WEBHOOK';

export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  config: Record<string, unknown>;
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Setting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  createdAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: Record<string, unknown>;
}

export interface WebSocketMessage<T = unknown> {
  event: string;
  data: T;
  timestamp: string;
}

export interface TypingIndicator {
  userId: string;
  conversationId: string;
}