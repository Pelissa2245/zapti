# Decisões de Arquitetura — ZapTI

## Atualização — 2026-10-04

### Integração WhatsApp

O provedor de integração do produto é a **Evolution API**, não a Meta Graph API nem um mock local. O cliente está em `apps/api/src/services/evolution.ts` e usa `EVOLUTION_API_URL` + `EVOLUTION_API_KEY`. Operações sem essas variáveis devem falhar de forma explícita, sem gerar QR ou confirmar envio fictício.

O webhook aceita o header `apikey`/`x-api-key` e payloads padrão da Evolution API. A instância é resolvida pelo campo `instance` do payload ou pelos headers opcionais `x-tenant-id` e `x-instance-id`.

### Backups

A rota de backups não está registrada na API porque a referência anterior não existia e impedia a compilação. O volume de backups no Compose é apenas armazenamento disponível; uma rotina de criação/restauração precisa ser implementada e testada antes de ser documentada como funcionalidade.

### Continuidade

O estado auditado foi sincronizado no branch `master` do GitHub no commit `ee408cf`. O próximo agente deve começar por `git status`, `git log -3`, `CLAUDE.md` e `docs/PROGRESSO.md`.

---

## Contrato de API — Bootstrap Inicial (Onboarding)

### Decisão: 2026-10-04

**Problema:** Existiam dois fluxos de onboarding conflitantes:
1. `/auth/onboarding/wizard` — wizard de 5 passos (admin + tenant + preferências + WhatsApp)
2. `/auth/bootstrap` — formulário único simples (admin + tenant)

**Solução:** Unificar no fluxo `/auth/onboarding/wizard` (5 passos) como fluxo oficial de bootstrap. O endpoint `/auth/bootstrap` será mantido como API atômica para o wizard chamar no passo final. A página `/auth/bootstrap` será removida.

### Endpoints Públicos

#### `GET /api/v1/auth/bootstrap-status`
- **Descrição:** Verifica se bootstrap é necessário (banco vazio)
- **Autenticação:** Nenhuma (público)
- **Cache:** `no-store` (header `Cache-Control: no-store`)
- **Rate limit:** 10 req/min
- **Resposta 200:**
```json
{
  "needsBootstrap": true,
  "initialized": false
}
```
- **Campos:**
  - `needsBootstrap`: `true` se `User.count() === 0`
  - `initialized`: inverso de `needsBootstrap`

#### `POST /api/v1/auth/bootstrap`
- **Descrição:** Cria primeiro admin + tenant + UserTenant(OWNER) + sessão em transação atômica
- **Autenticação:** Nenhuma (público, mas só funciona com 0 usuários)
- **Rate limit:** 3 req/min
- **Proteção anti-race:** `pg_advisory_xact_lock('zapti_bootstrap')` dentro da transação
- **Proteção BOOTSTRAP_TOKEN:** Se variável `BOOTSTRAP_TOKEN` estiver definida, exige header `X-Bootstrap-Token` ou campo `bootstrapToken` no body
- **Body:**
```json
{
  "name": "string (2-100)",
  "email": "string (email válido, normalizado para lowercase)",
  "password": "string (8-128)",
  "confirmPassword": "string",
  "tenantName": "string (2-100)",
  "tenantFantasyName": "string (opcional, max 100)",
  "tenantSlug": "string (2-50, regex ^[a-z0-9-]+$, auto-gerado se omitido)",
  "tenantTimezone": "string (default: America/Sao_Paulo)",
  "tenantCountry": "string (default: BR)",
  "tenantCurrency": "string (default: BRL)",
  "tenantLogoUrl": "string (URL válida, opcional)",
  "bootstrapToken": "string (opcional, obrigatório se BOOTSTRAP_TOKEN definido)"
}
```
- **Validações server-side:**
  - Email único (case-insensitive)
  - Senha = confirmPassword
  - Slug único (com sufixo numérico se colidir)
  - Política de senha: min 8 chars
- **Resposta 201:**
```json
{
  "user": { "id", "name", "email", "avatarUrl", "isSuperadmin", "onboardingCompleted" },
  "tenant": { "id", "name", "slug", "plan" },
  "session": { "id", "expiresAt" },
  "accessToken": "string",
  "refreshToken": "string",
  "requiresTwoFactor": false
}
```
- **Cookies:** `accessToken` (httpOnly, secure em prod, sameSite=lax, 30d) + `refreshToken` (mesmo, 30d)
- **Erros:**
  - `400` — Validação falhou
  - `409` — `BOOTSTRAP_NOT_ALLOWED` (já existem usuários)
  - `429` — Rate limit excedido
  - `403` — `BOOTSTRAP_TOKEN_INVALID` (token inválido/ausente quando exigido)
  - `500` — Erro interno

#### `GET /api/v1/auth/onboarding-status`
- **Descrição:** Verifica se usuário logado completou onboarding de preferências
- **Autenticação:** Obrigatória (sessão válida)
- **Resposta 200:** `{ "onboardingCompleted": boolean }`

#### `POST /api/v1/auth/complete-onboarding`
- **Descrição:** Completa preferências do usuário (idioma, tema, notificações, WhatsApp)
- **Autenticação:** Obrigatória (sessão válida)
- **Body:**
```json
{
  "language": "string (pt-BR/en-US/es-ES)",
  "timezone": "string (IANA timezone)",
  "theme": "light|dark|system",
  "notificationPreferences": { "email": boolean, "push": boolean, "whatsapp": boolean },
  "whatsappConfig": { "evolutionApiUrl": string, "evolutionApiKey": string, "instanceName": string }
}
```
- **Resposta 200:** `{ "onboardingCompleted": true }`

### Frontend Routes

| Rota | Descrição | Acesso |
|------|-----------|--------|
| `/` | Root — redireciona para onboarding ou login/dashboard | Público |
| `/auth/onboarding/wizard` | Wizard 5 passos (bootstrap) | Público (só se `needsBootstrap=true`) |
| `/auth/login` | Login | Público (só se `needsBootstrap=false`) |
| `/auth/onboarding` | Preferências pós-login (setup) | Autenticado |
| `/setup` | Alias para `/auth/onboarding` (opcional) | Autenticado |

### Middleware Behavior (Next.js)

1. **Root `/`**: Consulta `bootstrap-status` com `cache: 'no-store'` e timeout 3s
   - `needsBootstrap=true` → redirect `/auth/onboarding/wizard`
   - `needsBootstrap=false` → redirect `/auth/login` (ou dashboard se sessão válida)

2. **`/auth/onboarding/wizard`**: 
   - `needsBootstrap=true` → allow
   - `needsBootstrap=false` → redirect `/auth/login`

3. **`/auth/login`**:
   - `needsBootstrap=true` → redirect `/auth/onboarding/wizard`
   - `needsBootstrap=false` → allow

4. **Falha na API `bootstrap-status`**: NÃO assume valor padrão. Mostra tela de erro "Não foi possível verificar status do sistema. Tentar novamente."

5. **Exceções públicas explícitas**:
   - `/auth/onboarding/wizard`
   - `/auth/login`
   - `/api/v1/auth/bootstrap-status`
   - `/api/v1/auth/bootstrap` (só enquanto não inicializado)

### Concorrência

- Estratégia: `pg_advisory_xact_lock('zapti_bootstrap')` adquirido no início da transação
- Garante serialização: apenas 1 transação por vez pode executar o bootstrap
- Segunda requisição concorrente aguarda o lock, re-verifica contagem, falha com 409

### Segurança

- **BOOTSTRAP_TOKEN**: Variável de ambiente opcional. Se definida, bootstrap exige token via header `X-Bootstrap-Token` ou campo `bootstrapToken`. Documentado em `.env.example`.
- **Rate limit**: 3 req/min no bootstrap, 10 req/min no status
- **Senha**: Argon2id via bcrypt (cost 12). Nunca retornada em respostas. Nunca logada.
- **Tokens**: Access (15m/30d) + Refresh (7d/30d) com rotação. Refresh token armazenado como hash (SHA-256).
- **Cookies**: httpOnly, secure (produção), sameSite=lax, path=/

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
