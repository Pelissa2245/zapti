# Visão Geral do Projeto ZapTI

## O que é

**ZapTI** é uma plataforma de helpdesk multi-tenant via WhatsApp, permitindo que múltiplas empresas (tenants) gerenciem atendimentos, conversas, tickets e automações através de uma única instância.

## Stack Tecnológica

| Camada | Tecnologia | Porta |
|--------|------------|-------|
| **API** | Fastify + TypeScript + Prisma | 3000 |
| **Web** | Next.js 14 + React + Tailwind | 3001 |
| **Database** | PostgreSQL 16 (Prisma ORM) | 5432 |
| **Cache/Queue** | Redis 7 | 6379 |
| **WhatsApp** | Evolution API (evoapicloud/evolution-api:latest) | 8080 |
| **Shared** | ESM package (@zapti/shared) | - |

## Arquitetura de Deploy

**Apenas local** via `docker-compose.prod.yml`:
- 5 serviços: `postgres`, `redis`, `evolution`, `api`, `web`
- Imagens buildadas localmente: `zapti-new-api`, `zapti-new-web`
- Rede bridge `zapti-network`
- Volumes persistentes para dados

## Estrutura do Monorepo

```
D:\zapti/
├── apps/
│   ├── api/          # Fastify backend
│   │   ├── src/
│   │   │   ├── plugins/    # auth, cors, rateLimit, swagger, etc.
│   │   │   ├── routes/     # 20+ rotas (auth, tenants, contacts, conversations, messages, tickets, etc.)
│   │   │   ├── services/   # prisma, websocket, integrations
│   │   │   └── middleware/
│   │   └── Dockerfile
│   └── web/          # Next.js frontend
│       └── src/app/  # pages: /, /auth/onboarding/wizard
├── packages/
│   ├── shared/       # ESM package (@zapti/shared)
│   │   └── src/
│   │       ├── config/      # Zod env validation
│   │       ├── auth/        # JWT, bcrypt helpers
│   │       ├── types/       # Shared TypeScript types
│   │       ├── validation/  # Zod schemas
│   │       ├── constants/   # Enums, constants
│   │       ├── email/       # Nodemailer wrapper
│   │       ├── notification/# Error notifications
│   │       └── utils/       # Helpers
│   └── database/     # Prisma schema (única fonte de verdade)
│       └── prisma/
│           └── schema.prisma   # 564 linhas, 30+ models
└── docker-compose.prod.yml
```

## Multi-tenancy

- Cada `Tenant` é isolado via `tenantId` em **todos** os models
- Middleware `tenantPlugin` injeta `tenantId` no request
- JWT contém `tenantId` + `role` (ADMIN, SUPER_ADMIN, AGENT, VIEWER)
- RLS-style: queries sempre filtram por `tenantId`

## Estado Atual (2026-10-11)

### ✅ Concluído
- Onboarding wizard (web)
- docker-compose.prod.yml com Evolution API
- Schema Prisma unificado em `packages/database`
- Shared package ESM com config, auth, types
- Único commit local: `d9b3d9d`

### 🔄 Em Andamento / Pendente
- [ ] Unificar/validar Prisma schema (risco: 2 schemas divergentes)
- [ ] TypeScript clean build (`tsc --noEmit` em api, `next build` em web)
- [ ] Evolution API subindo e respondendo (QR code, webhook)
- [ ] Deploy local saudável (todos os 5 containers healthy)
- [ ] GitHub remote + push
- [ ] Commit a cada bloco concluído

### ⚠️ Riscos Conhecidos
1. **Dois schemas Prisma** — `apps/api/prisma/schema.prisma` pode divergir de `packages/database/prisma/schema.prisma`
2. **CampaignLog** — removido em `apps/api` mas referenciado em `Campaign`
3. **sendErrorNotification** — removida de `packages/shared/src/notification/index.ts`
4. **Edições falharam** — wizard page.tsx e package.json da api precisam re-leitura
5. **Código reconstruído** — comparar com handoff antigo e rotas da web

## Próximos Passos (ordem do handoff)

1. `git status` → commit `wip: estado após sessão 2`
2. Unificar Prisma schema → `npx prisma validate` → `npx prisma generate`
3. Build por camada: `shared` → `database` → `api` (`tsc --noEmit`) → `web` (`next build`)
4. Commit a cada camada
5. `docker compose -f docker-compose.prod.yml build api web` → `up -d`
6. Para cada falha: `docker compose logs --tail=80 <serviço>`
7. Validar Evolution API: QR code, instância, webhook chegando na API
8. Configurar GitHub remote + push