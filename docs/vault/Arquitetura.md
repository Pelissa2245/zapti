# Arquitetura — ZapTI

## Visão Geral dos Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                        │
│                      Next.js Web (3001)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/WS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                              │
│                     Fastify API (3000)                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Auth    │ │ Tenant  │ │ Rate    │ │ CORS    │ │ Helmet  │  │
│  │ Plugin  │ │ Plugin  │ │ Limit   │ │ Plugin  │ │ Plugin  │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   POSTGRES      │ │     REDIS       │ │  EVOLUTION API  │
│  (Port 5432)    │ │  (Port 6379)    │ │   (Port 8080)   │
│                 │ │                 │ │                 │
│ Schema: public  │ │ Cache, Sessions,│ │ WhatsApp        │
│ Schema: evolution│ │ Queues        │ │ Business API    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## API (Fastify) — `apps/api`

### Entry Point
- `src/index.ts` — Bootstrap, registra plugins, rotas, WebSocket, error handling

### Plugins (`src/plugins/`)
| Plugin | Responsabilidade |
|--------|------------------|
| `auth.ts` | JWT verification, decorator `authenticate` no request, resolução de tenant |
| `cors.ts` | CORS configuration |
| `helmet.ts` | Security headers |
| `rate-limit.ts` | Rate limiting |
| `jwt.ts` | JWT sign/verify configuration |
| `swagger.ts` | OpenAPI/Swagger documentation |
| `multipart.ts` | File upload handling |
| `tenant.ts` | Tenant resolution from JWT/header |

### Rotas (`src/routes/`) — Todas sob prefixo `/api`
| Rota | Responsabilidade |
|------|------------------|
| `health.ts` | Health check |
| `auth.ts` | Login, register, refresh token, password reset |
| `tenants.ts` | CRUD tenants |
| `users.ts` | CRUD usuários do tenant |
| `contacts.ts` | CRUD contatos WhatsApp |
| `conversations.ts` | Conversas/Chats |
| `messages.ts` | Mensagens (envio/recebimento) |
| `tickets.ts` | Helpdesk tickets |
| `groups.ts` | Grupos WhatsApp |
| `campaigns.ts` | Campanhas de disparo |
| `automations.ts` | Automações (fluxos) |
| `webhooks.ts` | Webhooks Evolution API |
| `integrations.ts` | Integrações externas |
| `settings.ts` | Configurações do tenant |
| `audit.ts` | Logs de auditoria |

### Serviços (`src/services/`)
| Serviço | Responsabilidade |
|---------|------------------|
| `prisma.ts` | Prisma Client singleton |
| `websocket.ts` | WebSocket server para real-time |
| `whatsapp.ts` | Integração Evolution API (send/receive) |
| `automation.ts` | Motor de automações |
| `campaign.ts` | Processamento de campanhas |
| `integrations.ts` | Integrações terceiras |

## Database (Prisma) — `packages/database`

### Schema Principal
`prisma/schema.prisma` — **Single source of truth**

### Models Principais
| Model | Descrição |
|-------|-----------|
| `Tenant` | Empresa/cliente (isolamento multi-tenant) |
| `User` | Usuários do tenant (admin, agent) |
| `Contact` | Contatos WhatsApp |
| `Conversation` | Conversas/chats |
| `Message` | Mensagens individuais |
| `Ticket` | Tickets de helpdesk |
| `Group` | Grupos WhatsApp |
| `Campaign` | Campanhas de mensagem em massa |
| `Automation` | Fluxos de automação |
| `Webhook` | Webhooks configurados |
| `Integration` | Integrações externas |
| `Setting` | Configurações por tenant |
| `AuditLog` | Logs de auditoria |
| `Template` | Templates de mensagem |
| `RefreshToken` | Tokens de refresh JWT |
| `PasswordReset` | Tokens de reset de senha |
| `CampaignLog` | Logs de execução de campanha |
| `AutomationExecution` | Execuções de automação |

### Enums
- `UserRole`: ADMIN, AGENT
- `ConversationStatus`: OPEN, CLOSED, PENDING
- `Priority`: LOW, MEDIUM, HIGH, URGENT
- `MessageType`: TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT, LOCATION, CONTACT, STICKER
- `MessageDirection`: INBOUND, OUTBOUND
- `MessageStatus`: SENT, DELIVERED, READ, FAILED
- `TicketStatus`: OPEN, IN_PROGRESS, WAITING_CUSTOMER, RESOLVED, CLOSED
- `GroupRole`: ADMIN, MEMBER
- `CampaignStatus`: DRAFT, SCHEDULED, SENDING, SENT, FAILED, CANCELLED
- `AutomationTrigger`: MESSAGE_RECEIVED, KEYWORD, TIME_SCHEDULE, WEBHOOK
- `IntegrationType`: WEBHOOK, API, ZAPIER
- `TemplateStatus`: DRAFT, SUBMITTED, APPROVED, REJECTED

### Isolamento Multi-Tenant
**Todos os models têm `tenantId`** — queries sempre filtram por `tenantId` resolvido do JWT ou header.

## Shared Package — `packages/shared`

### Exports (ESM named exports)
```typescript
// Configuração validada com Zod (cached)
import { config } from '@zapti/shared/config'

// Auth: JWT verify/sign, password hash
import { verifyToken, signToken, hashPassword, verifyPassword } from '@zapti/shared/auth'

// Email: Nodemailer wrapper
import { sendEmail } from '@zapti/shared/email'

// Notification service
import { notificationService } from '@zapti/shared/notification'

// Utilities
import { slugify, formatDate, ... } from '@zapti/shared/utils'

// Constants
import { HTTP_STATUS, ERROR_CODES, ... } from '@zapti/shared/constants'

// Validation: Zod schemas
import { userSchema, tenantSchema, ... } from '@zapti/shared/validation'

// Types
import { User, Tenant, ... } from '@zapti/shared/types'
```

## Web (Next.js 14) — `apps/web`

### Estrutura (App Router)
```
src/
├── app/                    # Páginas (route segments)
│   ├── (auth)/            # Login, register, password reset
│   ├── (dashboard)/       # Dashboard protegido
│   │   ├── tenants/
│   │   ├── conversations/
│   │   ├── tickets/
│   │   ├── campaigns/
│   │   ├── automations/
│   │   ├── settings/
│   │   └── ...
│   └── api/               # API routes (proxy para Fastify)
├── components/            # Componentes React
│   ├── ui/               # Primitivas Radix + Tailwind
│   ├── forms/
│   ├── tables/
│   └── ...
├── hooks/                # Custom hooks (TanStack Query, etc.)
├── lib/                  # Utilitários cliente
├── styles/               # globals.css, tailwind
└── types/                # Types locais
```

### Stack UI
- **Radix UI** — Primitivas acessíveis
- **Tailwind CSS** — Estilização
- **class-variance-authority** — Variantes de componentes
- **React Hook Form + Zod** — Formulários + validação

### State Management
- **TanStack Query** — Server state (cache, sync, mutations)
- **Zustand** — Client state (UI, auth token, etc.)

### Path Aliases
```json
{
  "@/*": "./src/*",
  "@zapti/shared/*": "../../packages/shared/src/*"
}
```

## Docker Compose (Produção Local)

### Serviços
| Serviço | Imagem | Porta | Healthcheck |
|---------|--------|-------|-------------|
| postgres | postgres:16-alpine | 5432 | pg_isready |
| redis | redis:7-alpine | 6379 | redis-cli ping |
| evolution | evoapicloud/evolution-api:latest | 8080 | wget / |
| api | Build local (apps/api/Dockerfile) | 3000 | wget /health |
| web | Build local (apps/web/Dockerfile) | 3001 | (depends on api) |

### Volumes Persistentes
- `postgres_data` — Dados PostgreSQL
- `redis_data` — Dados Redis
- `evolution_media` — Mídias WhatsApp
- `evolution_instances` — Instâncias Evolution

### Network
- `zapti-network` — Bridge network interna

### Webhook Evolution → API
```
Evolution API (8080) 
  ── webhook events ──► 
API (3000) /webhooks/evolution
```
Eventos: `messages.upsert`, `messages.update`, `contacts.upsert`, `chats.upsert`, `instance.update`, `connection.update`, `qrcode.updated`

## Fluxo de Dados Principais

### 1. Recebimento de Mensagem WhatsApp
```
WhatsApp → Evolution API → Webhook POST /webhooks/evolution
  → API valida assinatura → Processa mensagem
  → Salva Message + atualiza Conversation + Contact
  → Dispara WebSocket para Web (real-time)
  → Verifica automações (AutomationTrigger.MESSAGE_RECEIVED)
```

### 2. Envio de Mensagem
```
Web (UI) → API POST /api/messages
  → Valida tenant + permissão
  → Chama Evolution API sendMessage
  → Salva Message (OUTBOUND, SENT)
  → Evolution entrega → Webhook messages.update → Status DELIVERED/READ
```

### 3. Autenticação
```
Login (email/password) → API POST /api/auth/login
  → Verifica credenciais → Gera JWT (access + refresh)
  → JWT contém: userId, tenantId, role
  → Próximas requests: Authorization: Bearer <token>
  → Plugin auth.ts valida → request.user + request.tenant
```

## Pontos de Atenção (confirmar)

1. **Dois schemas Prisma** — `apps/api/prisma/schema.prisma` e `packages/database/prisma/schema.prisma` divergem
2. **CampaignLog** — Referenciado em `Campaign.logs` mas pode ter sido removido do schema da API
3. **sendErrorNotification** — Removida de `packages/shared/src/notification/index.ts`, verificar imports
4. **TypeScript errors** — Múltiplos arquivos com diagnósticos
5. **Evolution API** — Não verificado end-to-end (instância, QR code, webhook)