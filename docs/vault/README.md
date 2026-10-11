# ZapTI Vault — Documentação do Projeto

> Fonte única de verdade para arquitetura, decisões, tarefas e problemas do projeto ZapTI.

---

## 📁 Índice do Vault

| Arquivo | Descrição | Última Atualização |
|---------|-----------|-------------------|
| [Visao-Geral.md](Visao-Geral.md) | Visão geral do projeto, stack, estrutura, estado atual | 2026-10-11 |
| [Arquitetura.md](Arquitetura.md) | Arquitetura detalhada: componentes, fluxos, models, auth, WS, Evolution | 2026-10-11 |
| [API-Routes.md](API-Routes.md) | Contrato completo da API: todos endpoints, WebSocket, erros, paginação | 2026-10-11 |
| [Tarefas.md](Tarefas.md) | Board de tarefas sincronizado com handoff.md | 2026-10-11 |
| [Problemas-e-Solucoes.md](Problemas-e-Solucoes.md) | Log de debugging: erros, causa raiz, soluções | 2026-10-11 |

### Decisões Arquiteturais (ADRs)

| ADR | Título | Status |
|-----|--------|--------|
| [Decisoes/001-Prisma-Schema-Unificado.md](Decisoes/001-Prisma-Schema-Unificado.md) | Prisma Schema Unificado em packages/database | Confirmado |
| [Decisoes/002-Docker-Compose-Local.md](Decisoes/002-Docker-Compose-Local.md) | Deploy Apenas Local via Docker Compose | Confirmado |
| [Decisoes/003-Evolution-API-Integration.md](Decisoes/003-Evolution-API-Integration.md) | Integração com Evolution API Self-hosted | Confirmado |
| [Decisoes/004-Shared-Package-ESM.md](Decisoes/004-Shared-Package-ESM.md) | Shared Package como ESM com Exports Nomeados | Confirmado |
| [Decisoes/005-Multi-Tenant-JWT.md](Decisoes/005-Multi-Tenant-JWT.md) | Autenticação JWT Multi-tenant com Resolução de Tenant | Confirmado |

---

## 🚀 Quick Start (Desenvolvimento)

### Pré-requisitos
- Docker Desktop / Docker Engine + Compose plugin
- Node.js 20+ (para desenvolvimento local fora do Docker)
- Git

### Subir Stack Completa
```bash
cd D:\zapti

# Build imagens customizadas
docker compose -f docker-compose.prod.yml build api web

# Subir todos os serviços
docker compose -f docker-compose.prod.yml up -d

# Ver logs
docker compose -f docker-compose.prod.yml logs -f

# Ver status
docker compose -f docker-compose.prod.yml ps
```

### URLs de Acesso
| Serviço | URL | Credenciais |
|---------|-----|-------------|
| Web (Frontend) | http://localhost:3001 | — |
| API (Backend) | http://localhost:3000 | — |
| API Docs (Swagger) | http://localhost:3000/docs | — |
| API Health | http://localhost:3000/health | — |
| API Ready | http://localhost:3000/ready | — |
| Evolution API | http://localhost:8080 | apikey: `EVOLUTION_API_KEY` |
| PostgreSQL | localhost:5432 | postgres/postgres |
| Redis | localhost:6379 | — |

### Desenvolvimento Local (sem Docker)
```bash
# 1. Subir apenas infra
docker compose -f docker-compose.prod.yml up -d postgres redis evolution

# 2. Install deps
cd packages/shared && npm install
cd packages/database && npm install
cd apps/api && npm install
cd apps/web && npm install

# 3. Build shared + database
cd packages/shared && npm run build
cd packages/database && npx prisma generate && npm run build

# 4. Dev servers
cd apps/api && npm run dev      # :3000
cd apps/web && npm run dev      # :3001
```

---

## 🔑 Variáveis de Ambiente Críticas

Criar `.env` na raiz ou exportar no shell:

```bash
# JWT (obrigatório - min 32 chars)
JWT_SECRET="sua-chave-super-secreta-com-pelo-menos-32-caracteres"

# Evolution API
EVOLUTION_API_KEY="zapti-evolution-key-change-in-production"
EVOLUTION_INSTANCE_NAME="zapti"

# WhatsApp Webhook (opcional)
WHATSAPP_WEBHOOK_VERIFY_TOKEN="webhook-verify-token"

# Email (opcional)
SMTP_HOST="smtp.exemplo.com"
SMTP_PORT="587"
SMTP_USER="usuario"
SMTP_PASS="senha"
SMTP_FROM="ZapTI <noreply@zapti.com>"
```

---

## 📋 Checklist de Validação (Deploy Local)

### Infraestrutura
- [ ] `postgres` healthy (pg_isready)
- [ ] `redis` healthy (redis-cli ping)
- [ ] `evolution` healthy (HTTP 200 em :8080)
- [ ] `api` healthy (HTTP 200 em /health + /ready ok)
- [ ] `web` healthy (HTTP 200 em :3001)

### Evolution API
- [ ] `POST /instance/create` → instância criada
- [ ] `GET /instance/connect/zapti` → QR code retornado
- [ ] QR code escaneado no WhatsApp mobile
- [ ] `GET /instance/connectionState/zapti` → `open`
- [ ] Enviar msg teste → webhook `MESSAGES_UPSERT` chega em `/webhooks/evolution`
- [ ] Message criada no Prisma (schema public)
- [ ] WebSocket emite `new:message` → frontend recebe

### API Funcional
- [ ] `POST /auth/login` → accessToken + refreshToken
- [ ] `GET /auth/me` → user + tenant
- [ ] CRUD Contacts, Conversations, Tickets funcionando
- [ ] Multi-tenancy: tenant A não vê dados do tenant B

### Web Funcional
- [ ] Onboarding wizard carrega em `/auth/onboarding/wizard`
- [ ] Login redireciona para dashboard
- [ ] Tempo real: nova mensagem aparece sem refresh

---

## 🐛 Problemas Conhecidos (Resumo)

| # | Problema | Status |
|---|----------|--------|
| 1 | Request too large (32MB) no docker build | ✅ Resolvido (.dockerignore) |
| 2 | Dois schemas Prisma divergentes | 🔄 Investigando |
| 3 | CampaignLog removido mas referenciado | ❓ Não confirmado |
| 4 | sendErrorNotification removida | ❓ Não confirmado |
| 5 | Edições falharam (wizard, package.json) | ❓ Não confirmado |
| 6 | Código reconstruído - gaps API/Web | 🔄 Investigando |
| 7 | TypeScript não limpo confirmado | 🔄 Investigando |
| 8 | Evolution API não testado end-to-end | ⏳ Pendente |
| 9 | GitHub remote não configurado | ⏳ Pendente |

---

## 📚 Referências Externas

- [Evolution API Docs](https://doc.evolution-api.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Fastify Docs](https://fastify.dev/docs/)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 📝 Como Atualizar o Vault

1. **Nova decisão arquitetural** → Criar ADR em `Decisoes/XXX-Titulo.md`
2. **Nova tarefa** → Atualizar `Tarefas.md`
3. **Novo problema/solução** → Adicionar em `Problemas-e-Solucoes.md`
4. **Mudança na API** → Atualizar `API-Routes.md`
5. **Mudança na arquitetura** → Atualizar `Arquitetura.md`
6. **Mudança geral no projeto** → Atualizar `Visao-Geral.md`

> Regra: **Atualize o vault ANTES de commit/push**. O vault é a memória persistente do projeto.

---

## 🔗 Links Rápidos do Projeto

- **Monorepo root**: `D:\zapti`
- **Handoff atual**: `C:\Users\Matheus Pelissari\Documents\handoff.md`
- **Docker Compose**: `D:\zapti\docker-compose.prod.yml`
- **Prisma Schema**: `D:\zapti\packages\database\prisma\schema.prisma`
- **API Source**: `D:\zapti\apps\api\src\`
- **Web Source**: `D:\zapti\apps\web\src\`
- **Shared Package**: `D:\zapti\packages\shared\src\`

---

*Última atualização: 2026-10-11*  
*Mantido por: ZapTI Team*