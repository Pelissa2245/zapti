// ZapTI Shared — Constants

export const USER_ROLES = ['ADMIN', 'SUPERVISOR', 'AGENT', 'READONLY'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_PERMISSIONS = {
  // Users
  'users:read': 'Visualizar usuários',
  'users:create': 'Criar usuários',
  'users:update': 'Atualizar usuários',
  'users:delete': 'Excluir usuários',
  'users:invite': 'Convidar usuários',

  // Teams
  'teams:read': 'Visualizar equipes',
  'teams:create': 'Criar equipes',
  'teams:update': 'Atualizar equipes',
  'teams:delete': 'Excluir equipes',

  // Sessions
  'sessions:read': 'Visualizar sessões',
  'sessions:revoke': 'Revogar sessões',

  // WhatsApp
  'whatsapp:read': 'Visualizar WhatsApp',
  'whatsapp:create': 'Criar instâncias WhatsApp',
  'whatsapp:update': 'Atualizar instâncias WhatsApp',
  'whatsapp:delete': 'Excluir instâncias WhatsApp',
  'whatsapp:send': 'Enviar mensagens',
  'whatsapp:connect': 'Conectar instâncias WhatsApp',

  // Contacts
  'contacts:read': 'Visualizar contatos',
  'contacts:create': 'Criar contatos',
  'contacts:update': 'Atualizar contatos',
  'contacts:delete': 'Excluir contatos',
  'contacts:import': 'Importar contatos',
  'contacts:export': 'Exportar contatos',

  // Conversations
  'conversations:read': 'Visualizar conversas',
  'conversations:create': 'Criar conversas',
  'conversations:update': 'Atualizar conversas',
  'conversations:send': 'Enviar mensagens em conversas',
  'conversations:delete': 'Fechar conversas',

  // Tickets
  'tickets:read': 'Visualizar tickets',
  'tickets:create': 'Criar tickets',
  'tickets:update': 'Atualizar tickets',
  'tickets:comment': 'Comentar em tickets',
  'tickets:delete': 'Fechar tickets',
  'tickets:admin': 'Administrar tickets',
  'tickets:assign': 'Atribuir tickets',

  // Flows
  'flows:read': 'Visualizar fluxos',
  'flows:create': 'Criar fluxos',
  'flows:update': 'Atualizar fluxos',
  'flows:execute': 'Executar fluxos',
  'flows:delete': 'Excluir fluxos',

  // Automations
  'automations:read': 'Visualizar automações',
  'automations:create': 'Criar automações',
  'automations:update': 'Atualizar automações',
  'automations:execute': 'Executar automações',
  'automations:delete': 'Excluir automações',

  // Audit
  'audit:read': 'Visualizar logs de auditoria',
  'audit:export': 'Exportar logs de auditoria',

  // Backups
  'backups:read': 'Visualizar backups',
  'backups:create': 'Criar backups',
  'backups:download': 'Baixar backups',
  'backups:delete': 'Excluir backups',
} as const;

export type Permission = keyof typeof USER_PERMISSIONS;

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'users:read', 'users:create', 'users:update', 'users:delete', 'users:invite',
    'teams:read', 'teams:create', 'teams:update', 'teams:delete',
    'sessions:read', 'sessions:revoke',
    'whatsapp:read', 'whatsapp:create', 'whatsapp:update', 'whatsapp:delete', 'whatsapp:send', 'whatsapp:connect',
    'contacts:read', 'contacts:create', 'contacts:update', 'contacts:delete', 'contacts:import', 'contacts:export',
    'conversations:read', 'conversations:create', 'conversations:update', 'conversations:send', 'conversations:delete',
    'tickets:read', 'tickets:create', 'tickets:update', 'tickets:comment', 'tickets:delete', 'tickets:admin', 'tickets:assign',
    'flows:read', 'flows:create', 'flows:update', 'flows:execute', 'flows:delete',
    'automations:read', 'automations:create', 'automations:update', 'automations:execute', 'automations:delete',
    'audit:read', 'audit:export',
    'backups:read', 'backups:create', 'backups:download', 'backups:delete',
  ],
  SUPERVISOR: [
    'users:read', 'users:create', 'users:update', 'users:invite',
    'teams:read', 'teams:create', 'teams:update', 'teams:delete',
    'sessions:read', 'sessions:revoke',
    'whatsapp:read', 'whatsapp:send', 'whatsapp:connect',
    'contacts:read', 'contacts:create', 'contacts:update', 'contacts:import', 'contacts:export',
    'conversations:read', 'conversations:create', 'conversations:update', 'conversations:send', 'conversations:delete',
    'tickets:read', 'tickets:create', 'tickets:update', 'tickets:comment', 'tickets:admin', 'tickets:assign',
    'flows:read', 'flows:create', 'flows:update', 'flows:execute',
    'automations:read', 'automations:create', 'automations:update', 'automations:execute',
    'audit:read',
    'backups:read',
  ],
  AGENT: [
    'users:read',
    'teams:read',
    'whatsapp:read', 'whatsapp:send', 'whatsapp:connect',
    'contacts:read', 'contacts:create', 'contacts:update',
    'conversations:read', 'conversations:create', 'conversations:update', 'conversations:send',
    'tickets:read', 'tickets:create', 'tickets:update', 'tickets:comment',
    'flows:read',
    'automations:read',
  ],
  READONLY: [
    'users:read',
    'teams:read',
    'whatsapp:read',
    'contacts:read',
    'conversations:read',
    'tickets:read',
    'flows:read',
    'automations:read',
    'audit:read',
  ],
};

export const CONVERSATION_STATUSES = ['OPEN', 'PENDING', 'CLOSED', 'SNOOZED'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const CONVERSATION_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export type ConversationPriority = (typeof CONVERSATION_PRIORITIES)[number];

export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_AGENT', 'RESOLVED', 'CLOSED'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const WHATSAPP_INSTANCE_STATUSES = ['DISCONNECTED', 'CONNECTING', 'CONNECTED', 'QR_CODE', 'ERROR'] as const;
export type WhatsAppInstanceStatus = (typeof WHATSAPP_INSTANCE_STATUSES)[number];

export const MESSAGE_TYPES = ['TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO', 'LOCATION', 'CONTACT', 'TEMPLATE', 'INTERACTIVE', 'SYSTEM'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const MESSAGE_DIRECTIONS = ['INBOUND', 'OUTBOUND'] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const MESSAGE_STATUSES = ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const FLOW_NODE_TYPES = ['TRIGGER', 'CONDITION', 'ACTION', 'DELAY', 'WEBHOOK', 'SUBFLOW'] as const;
export type FlowNodeType = (typeof FLOW_NODE_TYPES)[number];

export const FLOW_TRIGGER_TYPES = ['MESSAGE_RECEIVED', 'KEYWORD', 'CONVERSATION_STARTED', 'TICKET_CREATED', 'SCHEDULED', 'WEBHOOK', 'API'] as const;
export type FlowTriggerType = (typeof FLOW_TRIGGER_TYPES)[number];

export const FLOW_EXECUTION_STATUSES = ['RUNNING', 'COMPLETED', 'FAILED', 'TIMEOUT'] as const;
export type FlowExecutionStatus = (typeof FLOW_EXECUTION_STATUSES)[number];

export const AUTOMATION_SCHEDULE_TYPES = ['CRON', 'INTERVAL', 'ONCE'] as const;
export type AutomationScheduleType = (typeof AUTOMATION_SCHEDULE_TYPES)[number];

export const AUTOMATION_ACTION_TYPES = ['SEND_MESSAGE', 'CREATE_TICKET', 'RUN_FLOW', 'WEBHOOK', 'UPDATE_CONVERSATION', 'ASSIGN_AGENT', 'SEND_EMAIL'] as const;
export type AutomationActionType = (typeof AUTOMATION_ACTION_TYPES)[number];

export const AUTOMATION_TARGET_TYPES = ['ALL_CONTACTS', 'SEGMENT', 'CONVERSATION', 'TICKET', 'SPECIFIC'] as const;
export type AutomationTargetType = (typeof AUTOMATION_TARGET_TYPES)[number];

export const AUTOMATION_EXECUTION_STATUSES = ['RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED'] as const;
export type AutomationExecutionStatus = (typeof AUTOMATION_EXECUTION_STATUSES)[number];

export const TENANT_STATUSES = ['ACTIVE', 'SUSPENDED', 'DELETED'] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

export const SESSION_STATUSES = ['ACTIVE', 'EXPIRED', 'REVOKED', 'ALL_REVOKED'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const BACKUP_TYPES = ['FULL', 'TENANT_DATA', 'CONFIG_ONLY'] as const;
export type BackupType = (typeof BACKUP_TYPES)[number];

export const BACKUP_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'FAILED'] as const;
export type BackupStatus = (typeof BACKUP_STATUSES)[number];

export const AUDIT_ACTIONS = {
  // Auth
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  TWO_FACTOR_ENABLED: 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED: 'TWO_FACTOR_DISABLED',

  // Users
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_PASSWORD_RESET: 'USER_PASSWORD_RESET',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',

  // Teams
  TEAM_CREATED: 'TEAM_CREATED',
  TEAM_UPDATED: 'TEAM_UPDATED',
  TEAM_DELETED: 'TEAM_DELETED',
  TEAM_MEMBER_ADDED: 'TEAM_MEMBER_ADDED',
  TEAM_MEMBER_REMOVED: 'TEAM_MEMBER_REMOVED',

  // WhatsApp
  WHATSAPP_INSTANCE_CREATED: 'WHATSAPP_INSTANCE_CREATED',
  WHATSAPP_INSTANCE_UPDATED: 'WHATSAPP_INSTANCE_UPDATED',
  WHATSAPP_INSTANCE_DELETED: 'WHATSAPP_INSTANCE_DELETED',
  WHATSAPP_INSTANCE_CONNECTED: 'WHATSAPP_INSTANCE_CONNECTED',
  WHATSAPP_INSTANCE_DISCONNECTED: 'WHATSAPP_INSTANCE_DISCONNECTED',

  // Conversations
  CONVERSATION_CREATED: 'CONVERSATION_CREATED',
  CONVERSATION_UPDATED: 'CONVERSATION_UPDATED',
  CONVERSATION_CLOSED: 'CONVERSATION_CLOSED',
  CONVERSATION_ASSIGNED: 'CONVERSATION_ASSIGNED',
  CONVERSATION_TRANSFERRED: 'CONVERSATION_TRANSFERRED',
  MESSAGE_SENT: 'MESSAGE_SENT',
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',

  // Tickets
  TICKET_CREATED: 'TICKET_CREATED',
  TICKET_UPDATED: 'TICKET_UPDATED',
  TICKET_RESOLVED: 'TICKET_RESOLVED',
  TICKET_REOPENED: 'TICKET_REOPENED',
  TICKET_CLOSED: 'TICKET_CLOSED',
  TICKET_COMMENT_ADDED: 'TICKET_COMMENT_ADDED',
  TICKET_ASSIGNED: 'TICKET_ASSIGNED',

  // Flows
  FLOW_CREATED: 'FLOW_CREATED',
  FLOW_UPDATED: 'FLOW_UPDATED',
  FLOW_DELETED: 'FLOW_DELETED',
  FLOW_EXECUTED: 'FLOW_EXECUTED',
  FLOW_TOGGLED: 'FLOW_TOGGLED',

  // Automations
  AUTOMATION_CREATED: 'AUTOMATION_CREATED',
  AUTOMATION_UPDATED: 'AUTOMATION_UPDATED',
  AUTOMATION_DELETED: 'AUTOMATION_DELETED',
  AUTOMATION_EXECUTED: 'AUTOMATION_EXECUTED',
  AUTOMATION_TOGGLED: 'AUTOMATION_TOGGLED',

  // Backups
  BACKUP_CREATED: 'BACKUP_CREATED',
  BACKUP_DOWNLOADED: 'BACKUP_DOWNLOADED',
  BACKUP_DELETED: 'BACKUP_DELETED',

  // Tenants (superadmin)
  TENANT_CREATED: 'TENANT_CREATED',
  TENANT_UPDATED: 'TENANT_UPDATED',
  TENANT_SUSPENDED: 'TENANT_SUSPENDED',
  TENANT_UNSUSPENDED: 'TENANT_UNSUSPENDED',
  TENANT_DELETED: 'TENANT_DELETED',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// Rate limits
export const DEFAULT_RATE_LIMIT_MAX = 100;
export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60000;
export const AUTH_RATE_LIMIT_MAX = 5;
export const AUTH_RATE_LIMIT_WINDOW_MS = 60000;

// File upload
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

// Webhook
export const WEBHOOK_SECRET_LENGTH = 32;
export const WEBHOOK_RETRY_ATTEMPTS = 3;
export const WEBHOOK_RETRY_DELAY = 60000; // 1 minute

// Cache
export const CACHE_TTL_SHORT = 60; // 1 minute
export const CACHE_TTL_MEDIUM = 300; // 5 minutes
export const CACHE_TTL_LONG = 3600; // 1 hour

// Pagination
export const CURSOR_PAGE_SIZE = 50;