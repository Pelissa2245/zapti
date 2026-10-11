# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ZapTI** — Multi-tenant WhatsApp helpdesk platform

**Monorepo structure** (D:\zapti):
- `apps/api` — Fastify + Prisma + TypeScript (port 3000)
- `apps/web` — Next.js 14 + React 18 + Tailwind (port 3001)
- `packages/shared` — Shared code (auth, email, notification, utils, constants, validation, config)
- `packages/database` — Prisma schema & migrations

**Deploy**: Local only via `docker-compose.prod.yml` (Postgres, Redis, Evolution API, API, Web)

## Common Development Commands

### Root (monorepo)
```bash
npm run dev              # Run both API and Web in dev mode
npm run dev:api          # API only
npm run dev:web          # Web only
npm run build            # Build all workspaces
npm run build:api        # Build API
npm run build:web        # Build Web
npm run lint             # Lint all workspaces
npm run typecheck        # Type-check all workspaces
npm run test             # Test all workspaces
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to DB
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database
npm run clean            # Clean all node_modules and dist folders
```

### API (apps/api)
```bash
npm run dev              # tsx watch src/index.ts
npm run build            # tsc
npm run start            # node dist/index.js
npm run prisma:generate  # prisma generate
npm run prisma:migrate   # prisma migrate dev
npm run prisma:push      # prisma db push
npm run prisma:studio    # prisma studio
npm run test             # vitest run
npm run lint             # eslint src --ext .ts
```

### Web (apps/web)
```bash
npm run dev              # next dev -p 3001
npm run build            # next build
npm run start            # next start
npm run lint             # next lint
npm run typecheck        # tsc --noEmit
```

### Shared (packages/shared)
```bash
npm run build            # tsc
npm run dev              # tsc --watch
npm run test             # vitest run
npm run lint             # eslint src --ext .ts
```

### Database (packages/database)
```bash
npm run build            # tsc
npm run dev              # tsc --watch
npm run db:generate      # prisma generate
npm run db:push          # prisma db push
npm run db:migrate       # prisma migrate dev
npm run db:studio        # prisma studio
npm run db:seed          # tsx prisma/seed.ts
```

## Architecture Highlights

### API (Fastify)
- **Entry point**: `apps/api/src/index.ts` → builds app, registers plugins, routes, WebSocket
- **Plugins** (in `src/plugins/`): auth, cors, helmet, rate-limit, jwt, swagger, multipart, tenant
- **Routes** (in `src/routes/`): RESTful endpoints under `/api` prefix (health, tenants, users, contacts, conversations, messages, tickets, groups, campaigns, automations, webhooks, integrations, settings, audit)
- **Services** (in `src/services/`): prisma client, websocket, whatsapp (Evolution API), automation, campaign, integrations
- **Auth**: JWT-based with `@fastify/jwt`, custom `authenticate` decorator on request
- **Multi-tenant**: All models scoped by `tenantId`, tenant resolved from JWT or header

### Database (Prisma)
- **Schema**: `packages/database/prisma/schema.prisma` (single source of truth)
- **Models**: Tenant, User, Contact, Conversation, Message, Ticket, Group, Campaign, Automation, Webhook, Integration, AuditLog, Setting, Template, RefreshToken, PasswordReset, CampaignLog, AutomationExecution
- **Enums**: UserRole, ConversationStatus, Priority, MessageType, MessageDirection, MessageStatus, TicketStatus, GroupRole, CampaignStatus, AutomationTrigger, IntegrationType, TemplateStatus
- **Relations**: All models cascade/delete appropriately with tenant isolation

### Shared Package
- **ESM module** with named exports for each domain:
  - `@zapti/shared/config` — Zod-validated env config (cached)
  - `@zapti/shared/auth` — JWT verify/sign, password hash
  - `@zapti/shared/email` — Nodemailer wrapper
  - `@zapti/shared/notification` — Notification service
  - `@zapti/shared/utils` — Common utilities
  - `@zapti/shared/constants` — Shared constants
  - `@zapti/shared/validation` — Zod schemas
  - `@zapti/shared/types` — Shared TypeScript types

### Web (Next.js 14 App Router)
- **Structure**: `apps/web/src/app/` (pages), `components/`, `hooks/`, `lib/`, `styles/`
- **UI**: Radix UI primitives + Tailwind CSS, class-variance-authority for variants
- **State**: TanStack Query (server), Zustand (client), React Hook Form + Zod
- **Path aliases**: `@/*` → `./src/*`, `@zapti/shared/*` → `../../packages/shared/src/*`

### Docker Compose (Production)
```yaml
services:
  postgres:   # port 5432, DB: zapti, schema: public (api) / evolution (evolution)
  redis:      # port 6379
  evolution:  # port 8080, WhatsApp Business API wrapper, webhook → api:3000/webhooks/evolution
  api:        # port 3000, builds from apps/api/Dockerfile
  web:        # port 3001, builds from apps/web/Dockerfile
```
- Images: `zapti-new-api`, `zapti-new-web`
- Evolution API webhook events: `messages.upsert,messages.update,contacts.upsert,chats.upsert,instance.update,connection.update,qrcode.updated`

## Key Files to Understand

| File | Purpose |
|------|---------|
| `apps/api/src/index.ts` | API bootstrap, plugin/route registration, error handling |
| `apps/api/src/plugins/auth.ts` | JWT authentication decorator, tenant resolution |
| `packages/database/prisma/schema.prisma` | **Single source of truth** for data model |
| `packages/shared/src/config/index.ts` | Environment validation with Zod (cached) |
| `apps/api/src/services/whatsapp.ts` | Evolution API integration (send/receive messages) |
| `apps/api/src/routes/webhooks.ts` | Evolution webhook handlers |
| `docker-compose.prod.yml` | Local production stack |

## Known Issues / Risks (from handoff.md)

1. **Two Prisma schemas**: `apps/api/prisma/schema.prisma` AND `packages/database/prisma/schema.prisma` — must unify
2. **CampaignLog relation**: `Campaign` model has `logs CampaignLog[]` but `CampaignLog` may have been removed from API schema
3. **Missing `sendErrorNotification`**: Was removed from `packages/shared/src/notification/index.ts` — verify no imports break
4. **TypeScript errors**: Multiple files have diagnostics; run `tsc --noEmit` per workspace
5. **Docker build**: API image builds but compose `up` may fail; check logs per service
6. **Evolution API**: Not verified working end-to-end (instance creation, QR code, webhook delivery)
7. **No GitHub remote**: Need `gh repo create zapti --private --source=. --push`

## Recommended Workflow (from handoff)

1. `git status` → commit WIP if changes exist
2. Unify Prisma schema → `npx prisma validate` → `npx prisma generate`
3. Compile in order: `packages/shared` → `packages/database` → `apps/api` → `apps/web`
4. Commit each layer that compiles cleanly
5. `docker compose -f docker-compose.prod.yml build api web` → `up -d`
6. For failed services: `docker compose logs --tail=80 <service>`
7. Test Evolution: `curl http://localhost:8080`, create instance, verify webhook
8. Push to GitHub

## Environment Variables (required)

See `packages/shared/src/config/index.ts` for full schema. Key vars:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Min 32 chars
- `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME`
- `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`
- `CORS_ORIGIN` — Frontend URL
- `SMTP_*` — Email config (optional)

## Testing Notes

- API tests: `vitest` in `apps/api` (run `npm run test`)
- Shared tests: `vitest` in `packages/shared`
- Web E2E: Playwright in `apps/web` (`@playwright/test`)

## Critical Reminders

- **Never** print full logs — use `tail -40`, `head`, `grep`
- **Run `/compact`** before context gets heavy
- **Don't read binaries/images** (causes 32MB request errors)
- **Don't pause to ask** — pick simplest option, document decision, continue
- **One task at a time**, commit after each completed block
- **Before editing**: re-read the file (stale edits fail)
- **Avoid long thinking** — if stuck >10 min, decide and move on

## Handoff obrigatório
Ao terminar CADA pedido do usuário (antes de dar a resposta final), atualize o handoff.md na raiz:
1. Sobrescreva a seção "Estado atual" com o que foi feito e o que foi realmente verificado
   (rodou? compilou? testou?). Separe "confirmado" de "não confirmado".
2. Liste arquivos alterados, problemas abertos e riscos novos.
3. Atualize "Próximos passos" em ordem de prioridade.
4. Mantenha o arquivo curto (máx. ~150 linhas): resuma o histórico antigo em vez de acumular.
5. Faça commit do handoff.md junto com o trabalho (ou em commit separado "docs: handoff").
Não pergunte se deve atualizar; apenas faça. Se o pedido foi só uma pergunta e nada mudou, não precisa atualizar.