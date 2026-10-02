# ZapTI Architecture Documentation

## Overview

ZapTI is a multi-tenant WhatsApp business management platform built as a monorepo with a Fastify API backend and Next.js frontend. It provides ticket management, conversation handling, contact management, WhatsApp instance management, automation/flows, and team collaboration features.

## Monorepo Structure

```
zapti/
├── apps/
│   ├── api/                 # Fastify API server (TypeScript)
│   └── web/                 # Next.js 14+ web application (App Router)
├── packages/
│   ├── database/            # Prisma ORM + PostgreSQL schema + seed
│   └── shared/              # Shared utilities, types, auth helpers
├── docker-compose.yml       # Local development stack
├── package.json             # Root workspace configuration
├── turbo.json               # Turborepo build pipeline
└── tsconfig.base.json       # Base TypeScript config
```

---

## 1. Database Layer (`packages/database`)

### Prisma Schema Highlights

**Core Models:**
- **Tenant** - Multi-tenant isolation, plans (FREE/STARTER/PRO/ENTERPRISE), custom domains
- **User** - Global users with authentication, 2FA, superadmin flag
- **UserTenant** - Join table: user↔tenant with role (OWNER/ADMIN/SUPERVISOR/AGENT)
- **Team** - Groups of users within a tenant
- **UserTeam** - User↔Team membership

**WhatsApp Integration:**
- **WhatsAppInstance** - WhatsApp Business API instances per tenant (status: DISCONNECTED/CONNECTING/QR_CODE/CONNECTED/ERROR)
- **Message** - Inbound/outbound messages with media, templates, reactions
- **Contact** - WhatsApp contacts with tags, custom fields, profile data
- **Conversation** - Threaded conversations with status (OPEN/PENDING/CLOSED/SNOOZED), assignment

**Ticketing System:**
- **Ticket** - Support tickets with priority, SLA, category, assignee, team
- **TicketCategory** - Categories with SLA hours, colors, auto-assignment rules
- **TicketComment** - Internal/external comments on tickets
- **TicketAttachment** - File attachments on tickets

**Automation:**
- **Flow** - Visual flow builder (nodes/edges JSON), versioning, publishing
- **FlowExecution** - Runtime execution tracking
- **Automation** - Trigger-based automations (message received, ticket created, etc.)

**System:**
- **Session** - JWT sessions with refresh token rotation, device tracking
- **AuditLog** - Comprehensive audit trail
- **Backup** - Scheduled backups with encryption
- **Webhook** - Outgoing webhook subscriptions
- **SystemSetting** - Global and per-tenant settings

### Key Design Decisions
- **Tenant isolation**: All models include `tenantId` for strict data isolation
- **Soft deletes**: Most models use `deletedAt` timestamp
- **JSON fields**: Flexible metadata stored as JSON (settings, flow definitions, custom fields)
- **Indexes**: Composite indexes on frequently queried combinations (tenantId + status, tenantId + createdAt)

---

## 2. Shared Package (`packages/shared`)

### Authentication (`src/auth/`)
- **JWT utilities**: `signAccessToken`, `signRefreshToken`, `verifyAccessToken`, `verifyRefreshToken`
- **Password hashing**: bcrypt with configurable rounds
- **Token generation**: Cryptographically secure random tokens with SHA-256 hashing for storage
- **Cookie helpers**: Secure cookie options for access/refresh tokens
- **Backup codes**: 2FA backup code generation

### Validation (`src/validation/`)
- **Zod schemas**: Reusable validation schemas for all domain entities
- **Fastify integration**: `toJsonSchema()` converts Zod to JSON Schema for Fastify validation

### Utilities (`src/utils/`)
- **ID generation**: `generateId()` for consistent ID format
- **Date helpers**: Formatting, relative time
- **String utilities**: Slugification, truncation, masking

---

## 3. API Server (`apps/api`)

### Technology Stack
- **Runtime**: Node.js 20+ with Fastify 4.x
- **Language**: TypeScript (ES modules)
- **Database**: Prisma Client with PostgreSQL
- **Validation**: Zod → JSON Schema → Fastify schema validation
- **Auth**: JWT (access + refresh tokens) with httpOnly cookies
- **Rate limiting**: Fastify rate limit plugin
- **Logging**: Pino structured logging

### Route Organization (`src/routes/`)

| Route Module | Prefix | Permissions | Key Endpoints |
|-------------|--------|-------------|---------------|
| `auth` | `/auth` | Public | `POST /login`, `POST /register`, `POST /refresh`, `POST /logout`, `GET /me`, `POST /2fa/*` |
| `tenants` | `/tenants` | `tenants:*` | CRUD, `GET /stats`, `PATCH /:id/settings`, `POST /:id/domain` |
| `users` | `/users` | `users:*` | CRUD, `GET /stats`, `PATCH /:id/role`, `POST /:id/teams` |
| `teams` | `/teams` | `teams:*` | CRUD, member management |
| `tickets` | `/tickets` | `tickets:*` | CRUD, `GET /stats`, `PATCH /:id/assign`, `POST /:id/comments` |
| `conversations` | `/conversations` | `conversations:*` | CRUD, `GET /stats`, `PATCH /:id/assign`, `POST /:id/close` |
| `contacts` | `/contacts` | `contacts:*` | CRUD, `GET /stats`, `POST /import`, `POST /:id/tags` |
| `whatsapp` | `/whatsapp` | `whatsapp:*` | Instance CRUD, `GET /instances/stats`, `POST /:id/connect`, `POST /:id/send`, `POST /webhook` |
| `flows` | `/flows` | `flows:*` | CRUD, `POST /:id/publish`, `GET /:id/executions` |
| `automations` | `/automations` | `automations:*` | CRUD, trigger/action management |
| `audit` | `/audit` | `audit:read` | `GET /logs` with filters |
| `backups` | `/backups` | `backups:*` | `POST /create`, `GET /list`, `POST /:id/restore` |

### Middleware Chain (`src/middleware/`)
1. **Tenant resolution** - Extracts tenant from subdomain/header/JWT
2. **Authentication** - Verifies access token, loads user + session + userTenant
3. **Permission check** - Role-based + permission-based authorization
4. **Rate limiting** - Per-route configurable limits
5. **Request validation** - Zod schema validation via Fastify

### WebSocket Support
- Real-time updates for tickets, conversations, messages
- Connection authentication via token query param
- Room-based subscriptions (tenant, user, conversation)

### Key Services
- **WhatsApp Service** (`src/services/whatsapp.ts`) - Baileys integration, QR generation, message handling
- **Flow Engine** (`src/services/flow-engine.ts`) - Executes published flows
- **Automation Engine** (`src/services/automation-engine.ts`) - Evaluates triggers, executes actions
- **SLA Monitor** (`src/services/sla-monitor.ts`) - Background job for SLA breaches
- **Backup Service** (`src/services/backup.ts`) - Encrypted backup creation/restore

---

## 4. Web Application (`apps/web`)

### Technology Stack
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: Zustand (global) + React Query (server state)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Real-time**: WebSocket client with auto-reconnect

### Route Structure (App Router)

```
src/app/
├── (auth)/
│   ├── login/page.tsx          # Login page with 2FA support
│   └── register/page.tsx       # Multi-step registration (user + tenant)
├── (app)/                      # Authenticated app shell
│   ├── layout.tsx              # Sidebar, header, WebSocket provider
│   ├── dashboard/page.tsx      # Main dashboard with stats widgets
│   ├── tickets/                # Ticket list, detail, create
│   ├── conversations/          # Conversation list, chat view
│   ├── contacts/               # Contact list, detail, import
│   ├── whatsapp/               # Instance management, QR pairing
│   ├── flows/                  # Visual flow builder (React Flow)
│   ├── automations/            # Automation rule builder
│   ├── team/                   # Users, teams, roles
│   ├── settings/               # Tenant settings, integrations
│   └── profile/                # User profile, 2FA, sessions
└── (superadmin)/               # Superadmin-only routes
    ├── tenants/page.tsx        # Tenant management
    └── system/page.tsx         # System settings, audit logs
```

### Key Components

**State Management (`src/store/`)**
- `auth.ts` - User session, tokens, tenant context, login/logout actions
- `ui.ts` - Sidebar, modals, toasts, theme
- `realtime.ts` - WebSocket connection, message handlers

**API Client (`src/lib/api.ts`)**
- Auto-refreshing access tokens
- Request/response interceptors
- Error handling with user-friendly messages
- React Query integration hooks

**Authentication Flow**
1. User submits credentials → `/api/auth/login` (Next.js route)
2. Server action calls API `/auth/login` → returns httpOnly cookies
3. Middleware validates cookies on each request
4. Token refresh via `/api/auth/refresh` when access token expires
5. Logout revokes session server-side then clears cookies

### Dashboard Widgets
- **Stats Cards**: Tickets, conversations, contacts, messages (from `/api/dashboard/stats`)
- **Charts**: Ticket trends, conversation volume, response times
- **Recent Activity**: Latest tickets, conversations, audit logs
- **Quick Actions**: Create ticket, new conversation, start flow

---

## 5. Authentication & Authorization

### JWT Token Structure

**Access Token** (15 min expiry):
```json
{
  "sub": "userId",
  "tid": "tenantId",
  "utid": "userTenantId",
  "role": "ADMIN",
  "permissions": ["tickets:read", "tickets:write", ...],
  "type": "access",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Refresh Token** (7 days expiry):
```json
{
  "sub": "userId",
  "sid": "sessionId",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Permission System
- **Roles**: OWNER > ADMIN > SUPERVISOR > AGENT (hierarchical)
- **Permissions**: Granular resource:action (e.g., `tickets:read`, `whatsapp:connect`)
- **Role→Permission mapping** in `packages/shared/src/auth/permissions.ts`
- **Superadmin**: Bypasses all tenant checks, full system access

### Session Management
- Sessions stored in database with device fingerprint, IP, user agent
- Refresh token rotation on each use (old token invalidated)
- Concurrent session limits per user (configurable)
- Automatic cleanup of expired sessions

---

## 6. WhatsApp Integration

### Architecture
```
WhatsApp Business API (Meta)
        │
        ▼
Webhook endpoint (/whatsapp/webhook)
        │
        ▼
processWebhook() → Prisma (Message, Conversation, Contact)
        │
        ▼
WebSocket broadcast → Real-time UI updates
```

### Instance Lifecycle
1. **Create** - `POST /whatsapp/instances` → status: `DISCONNECTED`
2. **Connect** - `POST /whatsapp/instances/:id/connect` → generates QR code
3. **QR Scan** - User scans → Baileys connects → status: `CONNECTED`
4. **Sync** - Historical messages/contacts synced in background
5. **Disconnect** - `POST /whatsapp/instances/:id/disconnect` or session expiry

### Message Processing
- Inbound: Webhook → normalize → upsert contact → upsert conversation → create message → broadcast
- Outbound: API → Baileys send → webhook echo → update message status
- Media: Downloaded to S3-compatible storage, URL stored in message

---

## 7. Flow & Automation Engine

### Flow Definition (JSON)
```json
{
  "nodes": [
    { "id": "1", "type": "trigger", "data": { "event": "message_received" }},
    { "id": "2", "type": "condition", "data": { "field": "message.body", "operator": "contains", "value": "help" }},
    { "id": "3", "type": "action", "data": { "type": "send_message", "template": "auto_reply" }}
  ],
  "edges": [{ "source": "1", "target": "2" }, { "source": "2", "target": "3", "sourceHandle": "true" }]
}
```

### Execution Model
- **Trigger**: Event starts flow (webhook, schedule, API)
- **Context**: Immutable data passed between nodes
- **Nodes**: Trigger → Condition → Action → Delay → Webhook → Sub-flow
- **Persistence**: Each execution logged with status, timing, output

### Automation Rules
- **Triggers**: `message_received`, `ticket_created`, `conversation_opened`, `contact_created`, `schedule`
- **Conditions**: Field comparisons, regex, custom JS expressions (sandboxed)
- **Actions**: `send_message`, `create_ticket`, `assign_conversation`, `add_tag`, `call_webhook`, `run_flow`

---

## 8. Real-time Architecture

### WebSocket Protocol
```
Client → Server: { "type": "auth", "token": "access_token" }
Server → Client: { "type": "authenticated", "user": {...} }

Client → Server: { "type": "subscribe", "rooms": ["tenant:123", "conversation:456"] }
Server → Client: { "type": "subscribed", "rooms": [...] }

Server → Client: { "type": "event", "event": "ticket.created", "data": {...}, "room": "tenant:123" }
```

### Event Types
- `ticket.created`, `ticket.updated`, `ticket.assigned`, `ticket.comment_added`
- `conversation.created`, `conversation.updated`, `conversation.assigned`, `conversation.closed`
- `message.created`, `message.status_updated`
- `contact.created`, `contact.updated`
- `whatsapp.instance.status_changed`
- `flow.execution.started`, `flow.execution.completed`

---

## 9. Docker & Deployment

### Development (`docker-compose.yml`)
```yaml
services:
  postgres:     # PostgreSQL 16
  redis:        # Redis 7 (sessions, cache, queues)
  api:          # Fastify API (hot reload via tsx watch)
  web:          # Next.js (hot reload via next dev)
```

### Production Considerations
- **API**: Multiple replicas behind load balancer, sticky sessions for WebSocket
- **Web**: Next.js standalone output, static export where possible
- **Database**: Managed PostgreSQL (RDS, Cloud SQL), read replicas for analytics
- **Redis**: Cluster mode for session scaling
- **Storage**: S3-compatible for media/backups
- **Queue**: BullMQ on Redis for background jobs (SLA, backups, flow execution)

### Environment Variables
```env
# API
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
ENCRYPTION_KEY=...  # 32-byte for AES-256-GCM
API_URL=http://api:3000
WEB_URL=http://web:3001

# Web
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

---

## 10. Security Considerations

### Data Protection
- **Encryption at rest**: AES-256-GCM for sensitive fields (WhatsApp tokens, webhook secrets)
- **Encryption in transit**: TLS 1.3 everywhere
- **Secrets**: Never in code, injected via environment at runtime

### API Security
- **Rate limiting**: Per-IP and per-tenant limits
- **CORS**: Restricted to configured web origin
- **Helmet**: Security headers (CSP, HSTS, etc.)
- **Input validation**: Zod schemas on all inputs
- **SQL injection**: Prisma parameterized queries

### Authentication Security
- **Password**: bcrypt (cost 12)
- **2FA**: TOTP (RFC 6238) with backup codes
- **Session**: HttpOnly, Secure, SameSite=Lax cookies
- **Token rotation**: Refresh token rotation with reuse detection
- **Brute force**: Account lockout after failed attempts

### Multi-tenant Isolation
- **Row-level**: All queries scoped by `tenantId`
- **Middleware**: Validates tenant access on every request
- **Superadmin**: Explicit bypass with audit logging

---

## 11. Observability

### Logging
- **Structured**: Pino JSON logs with correlation IDs
- **Levels**: error, warn, info, debug
- **Audit**: Separate audit log for security events

### Metrics (Prometheus)
- HTTP request duration, rate, errors
- WebSocket connections
- Queue depth, job duration
- Database query latency
- WhatsApp instance status

### Tracing
- OpenTelemetry instrumentation
- Distributed traces across API → Database → External APIs

---

## 12. Development Workflow

### Commands
```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter @zapti/database db:generate

# Run migrations
pnpm --filter @zapti/database db:migrate

# Seed database
pnpm --filter @zapti/database db:seed

# Start all services (dev)
pnpm dev

# Build all packages
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint
```

### Git Hooks (Husky)
- `pre-commit`: lint-staged (ESLint, Prettier)
- `commit-msg`: Conventional commits validation

---

## 13. Future Extensibility Points

1. **Plugin System** - Dynamic flow nodes/actions via npm packages
2. **Marketplace** - Tenant-installable integrations (CRM, helpdesk, etc.)
3. **AI Features** - Conversation summarization, suggested replies, sentiment analysis
4. **Advanced Analytics** - Custom dashboards, export, scheduled reports
5. **Mobile App** - React Native with shared business logic
6. **API Gateway** - Rate limiting, quota, developer portal for webhooks

---

*Document generated from codebase analysis. Last updated: 2026-10-01*