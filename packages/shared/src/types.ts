// ZapTI Shared — Type Definitions
import type { UserRole, Permission, TenantStatus, WhatsAppInstanceStatus, ConversationStatus, ConversationPriority, MessageType, MessageDirection, MessageStatus, TicketPriority, TicketStatus, FlowTriggerType, FlowNodeType, FlowExecutionStatus, AutomationScheduleType, AutomationActionType, AutomationTargetType, AutomationExecutionStatus, BackupType, BackupStatus, SessionStatus } from './constants';

// Error types
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(code: string, message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// Base entity types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantEntity extends BaseEntity {
  tenantId: string;
}

// User types
export interface User extends BaseEntity {
  email: string;
  name: string;
  passwordHash: string;
  avatarUrl?: string;
  isActive: boolean;
  isSuperadmin: boolean;
  lastLoginAt?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorRecoveryCodes: string | string[]; // Stored as comma-separated string in DB, parsed to array in middleware
  onboardingCompleted: boolean;
  language: string;
  timezone: string;
  backupCodes?: string[];
}

export interface UserTenant extends BaseEntity {
  userId: string;
  tenantId: string;
  role: UserRole;
  permissions: Permission[];
  joinedAt: Date;
  teams?: UserTeam[];
}

// Tenant types
export interface Tenant extends BaseEntity {
  name: string;
  settings: TenantSettings;
  status: TenantStatus;
  plan?: string;
}

export interface TenantSettings {
  // General
  timezone: string;
  language: string;
  dateFormat: string;
  timeFormat: string;

  // Business hours
  businessHours: {
    enabled: boolean;
    timezone: string;
    schedule: Record<string, { open: string; close: string; closed: boolean }>;
  };

  // Notifications
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
    desktop: boolean;
  };

  // Chat
  chat: {
    autoAssign: boolean;
    maxConcurrentChats: number;
    messageRetentionDays: number;
    allowedFileTypes: string[];
    maxFileSize: number;
  };

  // Tickets
  tickets: {
    autoCloseDays: number;
    slaHours: number;
    priorities: string[];
    categories: string[];
  };

  // WhatsApp
  whatsapp: {
    defaultInstanceId?: string;
    webhookUrl?: string;
    mediaRetentionDays: number;
  };

  // Integrations
  integrations: Record<string, any>;
}

// Team types
export interface Team extends BaseEntity {
  tenantId: string;
  name: string;
  description?: string;
  color: string;
}

export interface UserTeam extends BaseEntity {
  userId: string;
  teamId: string;
  team?: Team;
}

// WhatsApp types
export interface WhatsAppInstance extends BaseEntity {
  tenantId: string;
  name: string;
  phoneNumber?: string;
  webhookUrl?: string;
  webhookSecret: string;
  apiKey?: string;
  encryptionKey: string;
  settings: WhatsAppInstanceSettings;
  status: WhatsAppInstanceStatus;
  lastConnectedAt?: Date;
  lastQrCodeAt?: Date;
  qrCode?: string;
}

export interface WhatsAppInstanceSettings {
  qrCodeRefreshInterval: number;
  autoReconnect: boolean;
  messageAckTimeout: number;
  mediaAutoDownload: boolean;
  presenceSubscription: 'available' | 'unavailable' | 'both';
}

export interface Contact extends BaseEntity {
  tenantId: string;
  instanceId: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  profilePicUrl?: string;
  tags: string[];
  metadata: Record<string, any>;
  lastSeenAt?: Date;
  isBlocked: boolean;
}

export interface Conversation extends BaseEntity {
  tenantId: string;
  contactId: string;
  instanceId: string;
  assignedTo?: string;
  teamId?: string;
  status: ConversationStatus;
  priority: ConversationPriority;
  tags: string[];
  metadata: Record<string, any>;
  unreadCount: number;
  lastMessage?: string;
  lastMessageAt?: Date;
  lastReadAt?: Date;
  snoozedUntil?: Date;
  closedAt?: Date;
  closedBy?: string;
}

export interface Message extends BaseEntity {
  tenantId: string;
  conversationId: string;
  instanceId: string;
  contactId: string;
  senderId?: string;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  mediaCaption?: string;
  mediaMimeType?: string;
  mediaSize?: number;
  templateName?: string;
  templateParams?: string[];
  interactiveButtons?: InteractiveButton[];
  interactiveList?: InteractiveList;
  direction: MessageDirection;
  status: MessageStatus;
  externalId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  error?: string;
  replyToId?: string;
}

export interface InteractiveButton {
  id: string;
  title: string;
}

export interface InteractiveList {
  button: string;
  sections: InteractiveSection[];
}

export interface InteractiveSection {
  title: string;
  rows: InteractiveRow[];
}

export interface InteractiveRow {
  id: string;
  title: string;
  description?: string;
}

// Ticket types
export interface Ticket extends BaseEntity {
  tenantId: string;
  ticketNumber: string;
  title: string;
  description: string;
  contactId?: string;
  conversationId?: string;
  categoryId?: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: string;
  teamId?: string;
  tags: string[];
  metadata: Record<string, any>;
  createdBy: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  closedAt?: Date;
  closedBy?: string;
  dueAt?: Date;
}

export interface TicketCategory extends BaseEntity {
  tenantId: string;
  name: string;
  description?: string;
  color: string;
  parentId?: string;
  order: number;
  isActive: boolean;
}

export interface TicketComment extends BaseEntity {
  tenantId: string;
  ticketId: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  editedAt?: Date;
}

export interface TicketAttachment extends BaseEntity {
  tenantId: string;
  ticketId: string;
  commentId?: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

// Flow types
export interface Flow extends BaseEntity {
  tenantId: string;
  name: string;
  description?: string;
  trigger: FlowTrigger;
  nodes: FlowNode[];
  edges: FlowEdge[];
  settings: FlowSettings;
  version: number;
  isActive: boolean;
  tags: string[];
  createdBy: string;
  lastExecutedAt?: Date;
}

export interface FlowTrigger {
  type: FlowTriggerType;
  config: Record<string, any>;
}

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  condition?: string;
}

export interface FlowSettings {
  isActive: boolean;
  allowMultipleExecutions: boolean;
  timeout: number;
  retryAttempts: number;
}

export interface FlowExecution extends BaseEntity {
  tenantId: string;
  flowId: string;
  triggeredBy?: string;
  triggerType: string;
  input: Record<string, any>;
  context: Record<string, any>;
  output?: Record<string, any>;
  status: FlowExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
  currentNodeId?: string;
}

// Automation types
export interface Automation extends BaseEntity {
  tenantId: string;
  name: string;
  description?: string;
  schedule: AutomationSchedule;
  action: AutomationAction;
  target?: AutomationTarget;
  conditions: AutomationCondition[];
  settings: AutomationSettings;
  tags: string[];
  createdBy: string;
  executionCount: number;
  lastRunAt?: Date;
  nextRunAt?: Date;
  isActive: boolean;
}

export interface AutomationSchedule {
  type: AutomationScheduleType;
  value: string;
  timezone: string;
}

export interface AutomationAction {
  type: AutomationActionType;
  config: Record<string, any>;
}

export interface AutomationTarget {
  type: AutomationTargetType;
  config: Record<string, any>;
}

export interface AutomationCondition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'NOT_CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN' | 'NOT_IN';
  value: any;
}

export interface AutomationSettings {
  isActive: boolean;
  maxExecutions?: number;
  retryOnFailure: boolean;
  retryAttempts: number;
  retryDelay: number;
}

export interface AutomationExecution extends BaseEntity {
  tenantId: string;
  automationId: string;
  triggeredBy?: string;
  triggerType: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  status: AutomationExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
}

// Audit types
export interface AuditLog extends BaseEntity {
  tenantId?: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  description: string;
  metadata: Record<string, any>;
}

// Backup types
export interface Backup extends BaseEntity {
  tenantId: string;
  name: string;
  type: BackupType;
  status: BackupStatus;
  size: number;
  filePath?: string;
  description?: string;
  includeFiles: boolean;
  createdBy: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// Session types
export interface Session extends BaseEntity {
  userId: string;
  tenantId?: string;
  refreshToken: string;
  userAgent?: string;
  ip?: string;
  deviceName?: string;
  status: SessionStatus;
  expiresAt: Date;
  lastActiveAt: Date;
  revokedAt?: Date;
}

// System settings
export interface SystemSettings extends BaseEntity {
  key: string;
  value: any;
  tenantId?: string;
  description?: string;
  isPublic: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  pagination?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Pagination params
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Filter params
export interface FilterParams {
  q?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Date range params
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

// File upload types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// Webhook types
export interface WebhookPayload {
  event: string;
  instanceId: string;
  data: any;
  timestamp: string;
}

// Socket events
export interface SocketEvents {
  // Conversation events
  'conversation:created': { conversation: Conversation };
  'conversation:updated': { conversation: Conversation };
  'conversation:closed': { conversationId: string };
  'conversation:assigned': { conversationId: string; userId: string };

  // Message events
  'message:new': { message: Message };
  'message:updated': { message: Message };
  'message:status': { messageId: string; status: MessageStatus };

  // Ticket events
  'ticket:created': { ticket: Ticket };
  'ticket:updated': { ticket: Ticket };
  'ticket:comment': { comment: TicketComment };

  // WhatsApp events
  'whatsapp:connected': { instanceId: string };
  'whatsapp:disconnected': { instanceId: string };
  'whatsapp:qr': { instanceId: string; qrCode: string };

  // Notification events
  'notification:new': { notification: Notification };
}

export interface Notification extends BaseEntity {
  userId: string;
  tenantId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  readAt?: Date;
  actionUrl?: string;
}

// Re-export constants
export type {
  UserRole,
  Permission,
  ConversationStatus,
  ConversationPriority,
  TicketStatus,
  TicketPriority,
  WhatsAppInstanceStatus,
  MessageType,
  MessageDirection,
  MessageStatus,
  FlowNodeType,
  FlowTriggerType,
  FlowExecutionStatus,
  AutomationScheduleType,
  AutomationActionType,
  AutomationTargetType,
  AutomationExecutionStatus,
  TenantStatus,
  SessionStatus,
  BackupType,
  BackupStatus,
  AuditAction,
} from './constants';