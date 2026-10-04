# Decisões de Arquitetura — ZapTI

## Atualização — 2026-10-04

### Integração WhatsApp

O provedor de integração do produto é a **Evolution API**, não a Meta Graph API nem um mock local. O cliente está em `apps/api/src/services/evolution.ts` e usa `EVOLUTION_API_URL` + `EVOLUTION_API_KEY`. Operações sem essas variáveis devem falhar de forma explícita, sem gerar QR ou confirmar envio fictício.

O webhook aceita o header `apikey`/`x-api-key` e payloads padrão da Evolution API. A instância é resolvida pelo campo `instance` do payload ou pelos headers opcionais `x-tenant-id` e `x-instance-id`.

### Backups

A rota de backups não está registrada na API porque a referência anterior não existia e impedia a compilação. O volume de backups no Compose é apenas armazenamento disponível; uma rotina de criação/restauração precisa ser implementada e testada antes de ser documentada como funcionalidade.

### Continuidade

O estado auditado foi sincronizado no branch `master` do GitHub no commit `ee408cf`. O próximo agente deve começar por `git status`, `git log -3`, `CLAUDE.md` e `docs/PROGRESSO.md`.

## Stack Escolhida (Fase 1)

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| **Linguagem** | TypeScript (ponta a ponta) | Tipagem forte, ecossistema unificado, manutenibilidade |
| **Backend** | Node.js + Fastify | Performance, tipagem nativa, plugins maduros |
| **Frontend** | React + Next.js 14 (App Router) + PWA | SSR/SSG, otimizado, PWA nativo, React Server Components |
| **Banco de Dados** | PostgreSQL 16 | Dados relacionais complexos, multi-tenant, full-text search, JSONB |
| **Cache/Filas/PubSub** | Redis 7 (Redis Stack) | Cache, BullMQ para filas, WebSocket pub/sub |
| **ORM** | Prisma | Type-safe, migrações, multi-tenant via middleware |
| **Autenticação** | JWT (access + refresh) + Argon2id | Stateless, seguro, refresh token rotation |
| **2FA** | TOTP (RFC 6238) + códigos de recuperação | Padrão da indústria, compatível Google Authenticator/Authy |
| **Validação** | Zod | Schema-first, integração TypeScript |
| **Testes** | Vitest (unit/integration) + Playwright (E2E) | Rápido, TypeScript nativo, bom DX |
| **Containerização** | Docker Compose (prod) + Dockerfile multi-stage | Simplicidade, volumes persistentes, health checks |
| **Proxy Reverso** | Agnóstico (documentado para Nginx/Caddy/Traefik) | Flexibilidade do usuário |
| **Monitoramento** | Health checks nativos + endpoint `/health` | Leve, sem dependências externas obrigatórias |
| **Licença** | MIT (padrão open-source permissiva) | Compatível com uso comercial, simples |

## Padrões de Multi-Tenant

- **Isolamento por `tenant_id`** em todas as tabelas (exceto `tenants`, `users` globais)
- **Middleware Prisma** injeta `tenant_id` automaticamente em queries
- **Row Level Security (RLS)** no PostgreSQL como camada extra
- **Contexto de tenant** via header `X-Tenant-ID` ou JWT claim

## Estrutura de Pastas (Monorepo)

```
zapti/
├── apps/
│   ├── api/           # Backend Fastify
│   ├── web/           # Frontend Next.js
│   └── worker/        # Workers BullMQ
├── packages/
│   ├── database/      # Prisma schema + client
│   ├── shared/        # Tipos, utilitários, Zod schemas
│   ├── ui/            # Componentes React compartilhados
│   └── config/        # Configuração centralizada (Zod)
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── Dockerfile.worker
├── docker-compose.yml
├── install.sh
├── .env.example
└── docs/
    ├── DECISOES.md
    ├── PROGRESSO.md
    ├── LIMITACOES.md
    ├── DUVIDAS.md
    └── site/
```

## Variáveis de Ambiente Críticas

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string | Sim |
| `REDIS_URL` | Redis connection string | Sim |
| `JWT_SECRET` | Chave para assinar access tokens (32+ chars) | Sim |
| `JWT_REFRESH_SECRET` | Chave para assinar refresh tokens (32+ chars) | Sim |
| `ENCRYPTION_KEY` | Chave 32 bytes para criptografar segredos no banco | Sim |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Configuração de e-mail | Para reset de senha |
| `EVOLUTION_API_URL` | URL da Evolution API | Fase 2 |
| `EVOLUTION_API_KEY` | Chave da Evolution API | Fase 2 |

## Convenções

- **Código/nomes técnicos**: Inglês
- **Textos de interface**: i18n (pt-BR base)
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`)
- **Branches**: `main` (protegida), `feat/*`, `fix/*`, `chore/*`
- **PRs**: Obrigatórios para `main`, CI passando
