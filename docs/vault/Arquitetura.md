# Arquitetura do ZapTI

## Diagrama de Componentes

```mermaid
graph TB
    subgraph "Client"
        Browser[Browser :3001]
    end

    subgraph "Docker Network (zapti-network)"
        Web[web :3001<br/>Next.js]
        API[api :3000<br/>Fastify]
        Evolution[evolution :8080<br/>Evolution API]
        Postgres[(postgres :5432<br/>PostgreSQL 16)]
        Redis[(redis :6379<br/>Redis 7)]
    end

    Browser -->|HTTPS| Web
    Web -->|REST/WS| API
    API -->|Prisma| Postgres
    API -->|Cache/Queue| Redis
    API -->|WhatsApp| Evolution
    Evolution -->|Webhook| API
    Evolution -->|DB| Postgres
    Evolution -->|Cache| Redis
```

## Fluxo de Dados Principal

### 1. Inbound Message (WhatsApp → ZapTI)
```
WhatsApp User
    │
    ▼
Evolution API (porta 8080)
    │  Processa mensagem
    │  Salva no schema evolution
    ▼
Webhook POST /webhooks/evolution
    │
    ▼
Fastify API (porta 3000)
    │  processEvolutionWebhook()
    │  Identifica tenant via instance
    │  Cria/atualiza Contact
    │  Cria/atualiza Conversation
    │  Cria Message (INBOUND)
    │  Dispara AutomationTrigger.NEW_MESSAGE
    ▼
WebSocket → Frontend (tempo real)
```

### 2. Outbound Message (Agent → WhatsApp)
```
Agent (Web UI)
    │
    ▼
POST /api/messages (OUTBOUND)
    │
    ▼
Fastify API
    │  Valida tenant, conversation
    │  Cria Message (OUTBOUND, status=SENT)
    │  Chama Evolution API /message/sendText
    ▼
Evolution API
    │  Envia para WhatsApp
    ▼
Webhook (status update) → API → Message.status = DELIVERED/READ
```

## Modelos de Dados Principais (Prisma)

### Core Entities
```
Tenant (1) ──────< User
Tenant (1) ──────< Contact
Tenant (1) ──────< Conversation
Conversation (1) ─< Message
Conversation (1) ─< Ticket
Tenant (1) ──────< Ticket
Tenant (1) ──────< Group
Tenant (1) ──────< Campaign
Tenant (1) ──────< Automation
Tenant (1) ──────< Integration
Tenant (1) ──────< Webhook
Tenant (1) ──────< Setting
Tenant (1) ──────< AuditLog
Tenant (1) ──────< Template
```

### Enums-Chave
- `UserRole`: ADMIN, SUPER_ADMIN, AGENT, VIEWER
- `ConversationStatus`: OPEN, PENDING, RESOLVED, CLOSED, SPAM
- `MessageType`: TEXT, IMAGE, AUDIO, VIDEO, DOCUMENT, LOCATION, CONTACT, STICKER, REACTION, TEMPLATE
- `MessageDirection`: INBOUND, OUTBOUND
- `TicketStatus`: OPEN, IN_PROGRESS, PENDING, RESOLVED, CLOSED
- `AutomationTrigger`: NEW_MESSAGE, NEW_CONVERSATION, KEYWORD_MATCH, TIME_BASED, CONTACT_TAG_ADDED, TICKET_CREATED, TICKET_STATUS_CHANGED

## Autenticação & Autorização

### JWT Strategy
```
Access Token  (15min)  → header Authorization: Bearer <token>
Refresh Token (7d)     → httpOnly cookie / body
```

**Payload:**
```typescript
interface JWTPayload {
  sub: string;        // userId
  email: string;
  role: UserRole;
  tenantId: string;   // CRITICAL para multi-tenancy
  iat?: number;
  exp?: number;
}
```

### Middleware Chain (Fastify)
```
Request
  │
  ▼
helmet (security headers)
  │
  ▼
cors (CORS_ORIGIN)
  │
  ▼
rateLimit (100 req/60s)
  │
  ▼
jwt.verify() → decode → attach user
  │
  ▼
tenantPlugin → resolve tenantId → attach tenant
  │
  ▼
Route Handler (com user + tenant no request)
```

## WebSocket (Tempo Real)

```
Client (Web)                    Server (API)
    │                               │
    ├── WS connect (token) ────────►│
    │                               │ authPlugin.ws()
    │                               │ verify token
    │                               │ join tenant room
    │◄──────────────────────────────┤
    │                               │
    ├── subscribe:conversation ────►│
    │                               │ join conversation room
    │                               │
    │◄──── new:message ─────────────│  (quando Message criada)
    │◄──── update:conversation ─────│  (status, priority)
    │◄──── new:ticket ─────────────│
    │                               │
```

**Eventos emitidos:**
- `new:message` — nova mensagem na conversa
- `update:conversation` — mudança de status/prioridade/atribução
- `new:ticket` — ticket criado
- `update:ticket` — ticket atualizado
- `notification` — notificações gerais

## Evolution API Integration

### Configuração (docker-compose)
```yaml
evolution:
  image: evoapicloud/evolution-api:latest
  environment:
    DATABASE_CONNECTION_URI: "postgresql://postgres:postgres@postgres:5432/zapti?schema=evolution"
    REDIS_URI: "redis://redis:6379"
    REDIS_PREFIX: "evolution"
    WEBHOOK_URL: "http://api:3000/webhooks/evolution"
    WEBHOOK_EVENTS: "MESSAGES_UPSERT,CONNECTION_UPDATE,QRCODE_UPDATED"
```

### Webhook Endpoint
```
POST /webhooks/evolution
Headers:
  - apikey: <EVOLUTION_API_KEY>
  - content-type: application/json

Body: EvolutionWebhookPayload
  - event: MESSAGES_UPSERT | CONNECTION_UPDATE | QRCODE_UPDATED
  - instance: string
  - data: any
```

### Processamento (services/integrations.ts)
```typescript
async function processEvolutionWebhook(payload: EvolutionWebhookPayload) {
  switch (payload.event) {
    case 'MESSAGES_UPSERT':
      await handleInboundMessages(payload.data.messages);
      break;
    case 'CONNECTION_UPDATE':
      await handleConnectionUpdate(payload.data);
      break;
    case 'QRCODE_UPDATED':
      await handleQRCode(payload.data);
      break;
  }
}
```

## Automações (Automation Engine)

### Trigger → Conditions → Actions
```
Automation
  ├── trigger: AutomationTrigger (enum)
  ├── conditions: Json (filtros: contact.tags, message.content, etc.)
  └── actions: Json [
        { type: "SEND_MESSAGE", templateId, delayMs },
        { type: "ASSIGN_AGENT", userId },
        { type: "CREATE_TICKET", priority },
        { type: "ADD_TAG", tag },
        { type: "WEBHOOK", url, payload }
      ]
```

### Execução
```
Trigger event (ex: NEW_MESSAGE)
    │
    ▼
Find active automations for tenant with matching trigger
    │
    ▼
Evaluate conditions (JSON path / JMESPath)
    │
    ▼
For each passing automation:
    Create AutomationExecution (status=RUNNING)
    Execute actions sequentially
    Update execution status (COMPLETED/FAILED)
    Emit WebSocket events
```

## Rotas da API (Resumo)

| Módulo | Rotas | Descrição |
|--------|-------|-----------|
| `auth` | POST /login, /refresh, /logout, /me | Autenticação JWT |
| `tenants` | CRUD /tenants | Gestão de tenants |
| `users` | CRUD /users | Usuários do tenant |
| `contacts` | CRUD /contacts, /import | Contatos WhatsApp |
| `conversations` | CRUD /conversations, /assign, /status | Conversas |
| `messages` | CRUD /messages, /send | Mensagens in/out |
| `tickets` | CRUD /tickets, /comments, /assign | Tickets helpdesk |
| `groups` | CRUD /groups, /members | Grupos WhatsApp |
| `campaigns` | CRUD /campaigns, /send, /logs | Campanhas disparo |
| `automations` | CRUD /automations, /executions | Automações |
| `webhooks` | POST /webhooks/evolution | Receber Evolution |
| `integrations` | CRUD /integrations | Integrações externas |
| `settings` | CRUD /settings | Configurações tenant |
| `templates` | CRUD /templates | Templates WhatsApp |
| `audit` | GET /audit | Logs de auditoria |
| `health` | GET /health, /ready | Health checks |

## Variáveis de Ambiente Críticas

| Variável | Onde | Descrição |
|----------|------|-----------|
| `DATABASE_URL` | api, evolution | PostgreSQL connection string |
| `REDIS_URL` | api, evolution | Redis connection |
| `JWT_SECRET` | api | Chave assinatura tokens (min 32 chars) |
| `EVOLUTION_API_URL` | api | http://evolution:8080 (interno) |
| `EVOLUTION_API_KEY` | api, evolution | Chave compartilhada auth webhook |
| `EVOLUTION_INSTANCE_NAME` | api | Nome instância WhatsApp (default: zapti) |
| `CORS_ORIGIN` | api | http://localhost:3000 (dev) |
| `NEXT_PUBLIC_API_URL` | web | http://localhost:3000 |
| `NEXT_PUBLIC_WS_URL` | web | ws://localhost:3000 |

## Health Checks

| Serviço | Endpoint | Critério |
|---------|----------|----------|
| postgres | `pg_isready -U postgres` | TCP + auth |
| redis | `redis-cli ping` | PONG |
| evolution | `wget http://localhost:8080/` | HTTP 200 |
| api | `wget http://localhost:3000/health` | HTTP 200 + DB/Redis ok |
| web | (Next.js built-in) | HTTP 200 |

## Índices de Performance (Prisma)

Principais índices compostos recomendados:
```prisma
// Conversation - queries por tenant + status + lastMessageAt
@@index([tenantId, status, lastMessageAt])

// Message - queries por conversation + createdAt
@@index([conversationId, createdAt])

// Ticket - queries por tenant + status + assignee
@@index([tenantId, status, assignedToId])

// AuditLog - queries por tenant + createdAt
@@index([tenantId, createdAt])
```

## Segurança

- **Helmet**: CSP desabilitado (Swagger UI), headers padrão
- **CORS**: Origin restrito, credentials true
- **Rate Limit**: 100 req/60s por IP
- **JWT**: RS256 ou HS256 (config), access 15min, refresh 7d
- **Passwords**: bcrypt cost 12
- **2FA**: TOTP (speakeasy), backup codes
- **Audit Log**: Todas mutações sensíveis
- **Tenant Isolation**: Middleware injeta tenantId, Prisma filtra automaticamente

## Observabilidade

- **Logs**: Pino (pretty em dev, JSON em prod)
- **Health**: `/health` (liveness), `/ready` (readiness + deps)
- **Swagger**: `/docs` (OpenAPI 3.0)
- **Audit**: Tabela `AuditLog` com oldData/newData JSON