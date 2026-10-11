// Error codes
export const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',

  // Operations
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  INTEGRATION_ERROR: 'INTEGRATION_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  RATE_LIMITED: 'RATE_LIMITED',

  // File upload
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',

  // WhatsApp
  WHATSAPP_NOT_CONNECTED: 'WHATSAPP_NOT_CONNECTED',
  WHATSAPP_SEND_FAILED: 'WHATSAPP_SEND_FAILED',
  WHATSAPP_TEMPLATE_REJECTED: 'WHATSAPP_TEMPLATE_REJECTED',
} as const;

// User roles
export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  AGENT: 'AGENT',
  VIEWER: 'VIEWER',
} as const;

// Conversation statuses
export const CONVERSATION_STATUS = {
  OPEN: 'OPEN',
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  SPAM: 'SPAM',
} as const;

// Conversation priorities
export const CONVERSATION_PRIORITY = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

// Message types
export const MESSAGE_TYPE = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  AUDIO: 'AUDIO',
  VIDEO: 'VIDEO',
  DOCUMENT: 'DOCUMENT',
  LOCATION: 'LOCATION',
  CONTACT: 'CONTACT',
  STICKER: 'STICKER',
  REACTION: 'REACTION',
  TEMPLATE: 'TEMPLATE',
} as const;

// Message directions
export const MESSAGE_DIRECTION = {
  INBOUND: 'INBOUND',
  OUTBOUND: 'OUTBOUND',
} as const;

// Message statuses
export const MESSAGE_STATUS = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED',
} as const;

// Ticket statuses
export const TICKET_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

// Ticket priorities
export const TICKET_PRIORITY = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

// Campaign statuses
export const CAMPAIGN_STATUS = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  SENDING: 'SENDING',
  SENT: 'SENT',
  PAUSED: 'PAUSED',
  CANCELLED: 'CANCELLED',
} as const;

// Automation triggers
export const AUTOMATION_TRIGGERS = {
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_SENT: 'message_sent',
  CONVERSATION_OPENED: 'conversation_opened',
  CONVERSATION_CLOSED: 'conversation_closed',
  TICKET_CREATED: 'ticket_created',
  TICKET_UPDATED: 'ticket_updated',
  CONTACT_CREATED: 'contact_created',
  CONTACT_UPDATED: 'contact_updated',
  SCHEDULED: 'scheduled',
  WEBHOOK: 'webhook',
} as const;

// Integration types
export const INTEGRATION_TYPES = {
  EVOLUTION_API: 'EVOLUTION_API',
  WHATSAPP_BUSINESS: 'WHATSAPP_BUSINESS',
  SMTP: 'SMTP',
  WEBHOOK: 'WEBHOOK',
} as const;

// Webhook events
export const WEBHOOK_EVENTS = {
  // Evolution API events
  EVOLUTION_MESSAGES_UPSERT: 'messages.upsert',
  EVOLUTION_MESSAGES_UPDATE: 'messages.update',
  EVOLUTION_CONNECTION_UPDATE: 'connection.update',
  EVOLUTION_QRCODE_UPDATED: 'qrcode.updated',
  EVOLUTION_CALL: 'call',
  EVOLUTION_PRESENCE: 'presence',

  // WhatsApp Business API events
  WHATSAPP_MESSAGE: 'message',
  WHATSAPP_MESSAGE_STATUS: 'message_status',
  WHATSAPP_CONTACT: 'contact',

  // Generic webhook events
  INBOUND_MESSAGE: 'inbound_message',
  OUTBOUND_MESSAGE: 'outbound_message',
  MESSAGE_STATUS_UPDATE: 'message_status_update',
  CONVERSATION_UPDATE: 'conversation_update',
} as const;

// WebSocket events
export const WEBSOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  AUTH_ERROR: 'auth_error',

  // Messages
  NEW_MESSAGE: 'new_message',
  MESSAGE_UPDATE: 'message_update',
  MESSAGE_READ: 'message_read',
  MESSAGE_DELETE: 'message_delete',

  // Conversations
  CONVERSATION_CREATE: 'conversation_create',
  CONVERSATION_UPDATE: 'conversation_update',
  CONVERSATION_DELETE: 'conversation_delete',

  // Contacts
  CONTACT_CREATE: 'contact_create',
  CONTACT_UPDATE: 'contact_update',
  CONTACT_DELETE: 'contact_delete',

  // Tickets
  TICKET_CREATE: 'ticket_create',
  TICKET_UPDATE: 'ticket_update',
  TICKET_ASSIGN: 'ticket_assign',
  TICKET_DELETE: 'ticket_delete',

  // Campaigns
  CAMPAIGN_CREATE: 'campaign_create',
  CAMPAIGN_UPDATE: 'campaign_update',
  CAMPAIGN_STATUS_CHANGE: 'campaign_status_change',

  // Notifications
  NOTIFICATION: 'notification',

  // Typing
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',

  // Presence
  PRESENCE_UPDATE: 'presence_update',
} as const;

// Default settings keys
export const SETTING_KEYS = {
  AUTO_ASSIGN_CONVERSATIONS: 'autoAssignConversations',
  WELCOME_MESSAGE: 'welcomeMessage',
  AWAY_MESSAGE: 'awayMessage',
  BUSINESS_HOURS: 'businessHours',
  MAX_CONVERSATIONS_PER_AGENT: 'maxConversationsPerAgent',
  MESSAGE_RETENTION_DAYS: 'messageRetentionDays',
  ENABLE_TYPING_INDICATORS: 'enableTypingIndicators',
  ENABLE_READ_RECEIPTS: 'enableReadReceipts',
  ENABLE_FILE_UPLOAD: 'enableFileUpload',
  ALLOWED_FILE_TYPES: 'allowedFileTypes',
  MAX_FILE_SIZE: 'maxFileSize',
} as const;

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// File upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'video/mp4',
    'video/quicktime',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

// Regex patterns
export const REGEX = {
  PHONE: /^\+?[1-9]\d{1,14}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  SLUG: /^[a-z0-9-]+$/,
  HEX_COLOR: /^#[0-9A-Fa-f]{6}$/,
  CUID: /^c[a-z0-9]{24}$/,
} as const;