# Visão Geral — ZapTI

## O que é

**ZapTI** — Plataforma de helpdesk multi-tenant via WhatsApp.
Permite que empresas gerenciem atendimento ao cliente através do WhatsApp Business API, com suporte a múltiplos tenants (clientes) isolados.

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| API | Fastify + TypeScript | Node 20+ |
| Frontend | Next.js 14 (App Router) + React 18 + Tailwind CSS | |
| Banco de Dados | PostgreSQL 16 + Prisma ORM | Prisma 6+ |
| Cache/Queue | Redis 7 | |
| WhatsApp | Evolution API (wrapper WhatsApp Business API) | |
| Deploy Local | Docker Compose | |
| Testes | Vitest (API/Shared), Playwright (Web E2E) | |

## Estrutura do Monorepo

```
zapti/
├── apps/
│   ├── api/          # Fastify API (porta 3000)
│   └── web/          # Next.js Web (porta 3001)
├── packages/
│   ├── shared/       # Código compartilhado (ESM)
│   └── database/     # Prisma schema & migrations
├── docker-compose.prod.yml
├── package.json      # Workspaces npm
└── CLAUDE.md
```

## Como Rodar Localmente

### Pré-requisitos
- Docker Desktop rodando
- Node.js 20+
- pnpm ou npm

### Variáveis de Ambiente Necessárias

Crie um arquivo `.env` na raiz (ou exporte as variáveis):

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zapti?schema=public

# JWT
JWT_SECRET=sua-chave-super-secreta-com-pelo-menos-32-caracteres
JWT_EXPIRES_IN=7d

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=zapti-evolution-key-change-in-production
EVOLUTION_INSTANCE_NAME=zapti

# Redis
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:3001

# Email (opcional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### Comandos Principais

```bash
# Subir stack completo (Postgres, Redis, Evolution, API, Web)
docker compose -f docker-compose.prod.yml up -d

# Ver logs de um serviço
docker compose -f docker-compose.prod.yml logs -f api

# Parar tudo
docker compose -f docker-compose.prod.yml down

# Desenvolvimento (sem Docker)
npm run dev              # API + Web juntos
npm run dev:api          # Só API
npm run dev:web          # Só Web

# Build
npm run build            # Todos workspaces
npm run build:api        # Só API
npm run build:web        # Só Web

# Banco de dados
npm run db:generate      # Gerar Prisma Client
npm run db:push          # Push schema para DB
npm run db:migrate       # Rodar migrations
npm run db:studio        # Abrir Prisma Studio
npm run db:seed          # Seed database
```

### URLs de Acesso (após `docker compose up -d`)

| Serviço | URL |
|---------|-----|
| API | http://localhost:3000 |
| Web | http://localhost:3001 |
| Evolution API | http://localhost:8080 |
| Health Check API | http://localhost:3000/health |

## Portas

- **3000** — API (Fastify)
- **3001** — Web (Next.js)
- **5432** — PostgreSQL
- **6379** — Redis
- **8080** — Evolution API

## Status Atual (confirmar)

- [ ] Docker Compose sobe todos os serviços sem erro
- [ ] API compila e roda (`npm run build:api` → `npm run start`)
- [ ] Web compila e roda (`npm run build:web` → `npm run start`)
- [ ] Evolution API responde em localhost:8080
- [ ] Webhook Evolution → API funcionando
- [ ] Prisma schema unificado e validado
- [ ] GitHub remote configurado