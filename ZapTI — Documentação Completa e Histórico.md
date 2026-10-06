# ZapTI — Documentação Completa e Histórico

> Documento consolidado em 2026-10-04. Cada seção abaixo preserva o conteúdo de um arquivo original do repositório.


---

# Arquivo original: `CLAUDE.md`

ZapTI — Regras de trabalho

## Handoff confirmado — 2026-10-04

O repositório foi auditado, corrigido e sincronizado no GitHub em `master` pelo commit `ee408cf` (`fix: replace WhatsApp mocks with Evolution API integration`). Antes de iniciar novo trabalho, execute `git status`, `git log -3` e leia `docs/PROGRESSO.md`.

Alterações concluídas nesse ciclo:

- A integração WhatsApp deixou de simular QR/envio e usa a Evolution API para criar instâncias, conectar, desconectar e enviar texto/mídia.
- O webhook exige `EVOLUTION_API_KEY` e aceita payload padrão da Evolution API, resolvendo a instância pelo campo `instance` ou pelos headers opcionais.
- A rota de backups quebrada foi removida do registro da API; não trate o volume de backups do Compose como backup implementado.
- Foram adicionados testes Vitest do cliente Evolution; `npm test`, `npm run build`, `npm run lint` e `prisma validate` passaram. O lint ainda emite avisos preexistentes.
- Docker Compose não foi validado neste ambiente porque o binário `docker` não está instalado; validar em máquina com Docker antes de deploy.

Não reintroduza mocks de WhatsApp. Se Evolution API não estiver configurada, o comportamento correto é falhar com erro de serviço (`503`), não inventar QR ou mensagem enviada.

«LEIA ESTE ARQUIVO INTEIRO ANTES DE QUALQUER AÇÃO.

Estas regras são obrigatórias e têm prioridade sobre conveniências de implementação.»

Você está construindo o ZapTI: painel web self-hosted de atendimento via WhatsApp (Evolution API), com caixa de entrada única, tickets, BOT por fluxogramas, multiusuário e multiempresa.

A especificação completa está em "docs/spec/".

O plano por fases está em:

"docs/spec/09-fases-e-criterios.md"

Os prompts de cada fase estão em:

"prompts/"

---

1. WORKSPACE OFICIAL — REGRA ABSOLUTA

O único workspace oficial do ZapTI é:

"D:\ZapTI"

Todo desenvolvimento deve acontecer nesse diretório.

É OBRIGATÓRIO

- Criar arquivos somente dentro de "D:\ZapTI".
- Editar arquivos somente dentro de "D:\ZapTI".
- Remover arquivos somente dentro de "D:\ZapTI".
- Executar comandos de desenvolvimento a partir de "D:\ZapTI".
- Usar "D:\ZapTI" como origem do Docker build.
- Usar "D:\ZapTI" como origem do Git.
- Usar "D:\ZapTI" como workspace do Claude Code.

É PROIBIDO

Não usar como workspace do projeto:

- "C:\ZapTI"
- "C:\Users\...\ZapTI"
- "%TEMP%\ZapTI"
- "AppData"
- diretórios temporários
- outra cópia do repositório
- código dentro de containers
- qualquer outro diretório como fonte oficial

Não crie uma segunda cópia do projeto para "resolver" um problema.

Se encontrar outra cópia do ZapTI, não assuma que ela é a correta.

Primeiro descubra qual cópia está sendo usada.

---

2. VERIFICAÇÃO DO WORKSPACE ANTES DE AGIR

Antes de fazer alterações significativas, confirme:

Workspace: D:\ZapTI
Git root: D:\ZapTI
Docker build context: D:\ZapTI

Verifique também:

- "git rev-parse --show-toplevel"
- "git status"
- localização dos Dockerfiles
- localização do compose
- containers ativos
- imagens utilizadas
- volumes
- bind mounts

Se "git rev-parse --show-toplevel" retornar outro diretório, PARE.

Não continue editando.

Corrija o workspace primeiro.

---

3. DOCKER — FONTE OBRIGATÓRIA

O Docker deve construir o ZapTI a partir de:

"D:\ZapTI"

Fluxo obrigatório:

D:\ZapTI
    ↓
Docker Build Context
    ↓
Dockerfile
    ↓
Docker Image
    ↓
Docker Container
    ↓
ZapTI

Nunca faça:

outra pasta
    ↓
Docker

sem que essa outra pasta seja explicitamente parte da arquitetura documentada.

Antes de qualquer deploy

Verifique:

- Dockerfile usado
- compose usado
- build context
- imagens
- containers
- volumes
- bind mounts
- portas
- variáveis de ambiente

Se o Docker estiver construindo uma cópia antiga do projeto, corrija o Docker, não o código duplicado.

CUIDADO COM O C:

O usuário possui espaço limitado no disco C:.

Evite colocar builds, cópias do projeto ou dados persistentes do ZapTI no C:.

Sempre que tecnicamente possível, mantenha os dados do projeto e do Docker relacionados ao ZapTI no D:.

Nunca mova ou apague o armazenamento global do Docker sem antes verificar o impacto nos outros containers da máquina.

Não execute comandos destrutivos para liberar espaço.

---

4. GIT E GITHUB — REGRA OBRIGATÓRIA

O Git oficial do ZapTI está em "D:\ZapTI".

O GitHub é o repositório oficial do projeto.

Antes de trabalhar

Verifique:

git rev-parse --show-toplevel
git remote -v
git status

O Git root deve ser:

D:\ZapTI

Depois de cada alteração significativa

Execute:

git status

Revise as alterações.

Não faça commit de:

- senhas
- tokens
- API keys
- secrets
- cookies
- ".env" com credenciais
- arquivos temporários
- dumps
- dados pessoais desnecessários
- arquivos gerados que não pertencem ao repositório

Commits

Faça commits pequenos e descritivos.

Um commit deve representar um passo lógico.

Não faça commits gigantes com dezenas de mudanças não relacionadas.

Push

Depois que uma alteração significativa estiver:

- implementada;
- testada;
- revisada;
- sem secrets;

faça commit e push para o GitHub oficial do ZapTI.

Não espere o final de toda a vida do projeto para sincronizar o GitHub.

Se houver uma alteração importante, mantenha o GitHub atualizado.

NUNCA

- criar outro repositório;
- trocar o remote sem autorização;
- fazer push para outro projeto;
- apagar histórico;
- usar "git reset --hard" para esconder problemas;
- sobrescrever trabalho existente sem verificar.

Se o remote estiver incorreto, PARE e informe o usuário antes de alterá-lo.

---

5. NÃO EDITE A CÓPIA ERRADA

Esse é um ponto crítico.

O fato de um arquivo existir não significa que ele seja utilizado pela aplicação.

Antes de concluir que uma alteração funcionou, confirme o fluxo:

arquivo alterado
↓
build
↓
imagem
↓
container
↓
aplicação

Se uma alteração em "D:\ZapTI" não aparecer na aplicação:

NÃO faça outra alteração aleatória.

Descubra:

1. qual código está sendo executado;
2. qual imagem está sendo usada;
3. quando a imagem foi criada;
4. qual build context foi usado;
5. quais volumes estão montados;
6. se existe outra cópia do projeto.

---

6. ESPECIFICAÇÃO

A especificação completa está em:

"docs/spec/"

O plano por fases está em:

"docs/spec/09-fases-e-criterios.md"

Os prompts de cada fase estão em:

"prompts/"

Regras

1. Não invente requisitos.
2. Se algo não estiver especificado, não implemente arbitrariamente.
3. Se houver ambiguidade, registre em "docs/DUVIDAS.md".
4. Pergunte ao usuário quando a decisão for necessária.
5. Não transforme uma preferência técnica em requisito do produto sem justificativa.

---

7. DESENVOLVIMENTO POR FASES

Trabalhe em passos pequenos.

Uma fase por vez.

Dentro da fase:

módulo
↓
implementação
↓
testes
↓
documentação
↓
commit
↓
próximo módulo

Não tente construir o sistema inteiro de uma vez.

Se uma fase for grande, divida em módulos menores.

---

8. DOCUMENTAÇÃO

Mantenha:

"docs/PROGRESSO.md"

atualizado.

Registrar:

- concluído;
- em andamento;
- bloqueado;
- pendente;
- decisões tomadas;
- limitações;
- testes realizados.

Atualize o progresso ao final de cada módulo significativo.

Se houver uma limitação técnica real:

"docs/LIMITACOES.md"

deve documentá-la.

Decisões arquiteturais relevantes devem ser registradas em:

"docs/DECISOES.md"

---

9. TESTES

Todo módulo novo deve possuir testes automatizados apropriados.

Não avance de fase com testes relevantes quebrados.

Antes de considerar uma funcionalidade concluída:

- executar testes;
- executar lint;
- executar typecheck quando disponível;
- executar build;
- testar integração quando aplicável.

Para funcionalidades críticas, testar também o comportamento real através da aplicação.

Build passando não significa funcionalidade funcionando.

---

10. MULTI-TENANT

O isolamento entre empresas é INEGOCIÁVEL.

Toda operação relevante deve considerar "tenant_id".

Isso inclui:

- queries;
- mutations;
- cache;
- arquivos;
- uploads;
- filas;
- jobs;
- buscas;
- logs;
- eventos;
- WebSockets;
- notificações;
- relatórios;
- exports.

Nunca permitir que um tenant acesse dados de outro.

Criar testes explícitos provando isolamento entre tenants.

---

11. SEGURANÇA

Segredos nunca ficam no código.

Nunca colocar em:

- TypeScript;
- JavaScript;
- React;
- HTML;
- Dockerfile;
- compose;
- documentação;
- exemplos;
- commits;
- logs.

Usar:

- variáveis de ambiente;
- Docker secrets;
- secret management apropriado.

Manter:

".env.example"

atualizado.

O ".env.example" deve conter somente nomes de variáveis e exemplos seguros.

Nunca colocar secrets reais nele.

---

12. CREDENCIAIS DE LOGIN

Não criar:

- usuário admin padrão com senha conhecida;
- senha hardcoded;
- login de teste permanente;
- credencial escondida;
- bypass de autenticação;
- fallback de senha;
- token secreto no frontend.

Se o sistema precisar de um usuário inicial, implementar bootstrap seguro.

Credenciais reais devem permanecer fora do código-fonte.

Antes de fazer commit, verificar se não existem secrets acidentalmente adicionados.

---

13. AUTENTICAÇÃO E AUTORIZAÇÃO

Autenticação deve ocorrer no backend.

Autorização também deve ocorrer no backend.

Nunca confiar apenas em:

- botão escondido;
- rota escondida;
- validação do frontend;
- campo "isAdmin" enviado pelo cliente.

Verificar:

- RBAC;
- permissões;
- sessão;
- expiração;
- revogação;
- IDOR;
- acesso entre tenants;
- acesso administrativo.

---

14. AUDITORIA

Toda ação sensível deve gerar registro de auditoria.

Registrar quando aplicável:

- quem;
- o quê;
- quando;
- IP;
- tenant;
- User-Agent;
- dispositivo;
- resultado;
- recurso;
- ID do recurso;
- correlation ID.

Nunca registrar:

- senha;
- token;
- API key;
- cookie;
- session secret;
- conteúdo de secrets.

---

15. LIMITAÇÕES TÉCNICAS

Se a Evolution API, WhatsApp ou navegador não permitirem determinada função:

NÃO finja que funciona.

Documente em:

"docs/LIMITACOES.md"

Explique:

- o que não é possível;
- por quê;
- qual alternativa existe;
- qual parte foi implementada.

---

16. INTERFACE

Nada de código para o usuário final.

Personalização de:

- aparência;
- fluxos;
- automações;
- configurações;

deve ocorrer através da interface gráfica.

Código e nomes técnicos ficam em inglês.

Textos da interface devem usar i18n.

Português brasileiro é o idioma-base.

Nunca deixar texto fixo espalhado pelo frontend.

---

17. DESIGN

Utilizar o design system existente.

Evitar:

- componentes duplicados;
- estilos inconsistentes;
- cores aleatórias;
- espaçamentos aleatórios;
- emojis como ícones;
- telas com aparência de protótipo;
- dados falsos apresentados como reais.

Quando apropriado, utilizar as skills de design/frontend instaladas no Claude Code.

Priorizar:

- acessibilidade;
- responsividade;
- hierarquia visual;
- tipografia consistente;
- estados de loading;
- estados vazios;
- estados de erro;
- feedback visual;
- navegação clara.

---

18. DADOS REAIS

Não criar:

- números falsos;
- gráficos falsos;
- métricas hardcoded;
- endpoints fake;
- botões sem implementação;
- mocks apresentados como dados reais.

Mocks são permitidos somente quando explicitamente necessários para testes.

---

19. BANCO DE DADOS

Nunca executar operações destrutivas sem necessidade e sem verificar impacto.

Evitar:

DROP DATABASE
DROP TABLE
TRUNCATE
reset destrutivo

Não apagar dados reais para fazer uma funcionalidade funcionar.

Alterações estruturais devem utilizar migrations.

Antes de migration:

1. verificar schema;
2. verificar estado atual;
3. verificar migrations existentes;
4. criar migration;
5. executar;
6. testar;
7. verificar integridade.

---

20. DOCKER DEPLOY

Ao terminar uma alteração funcional:

1. Confirmar "D:\ZapTI".
2. Confirmar Git.
3. Confirmar Docker context.
4. Build.
5. Subir/recriar containers necessários.
6. Verificar logs.
7. Testar aplicação.
8. Confirmar que a aplicação utiliza a nova versão.
9. Commit.
10. Push para GitHub.

Não considerar "deploy concluído" apenas porque o "docker compose up" terminou sem erro.

---

21. SE O CONTEXTO FICAR GRANDE

Se o contexto ficar grande demais ou houver risco de começar a esquecer requisitos:

PARE.

Atualize:

"docs/PROGRESSO.md"

com o estado exato.

Informe:

- onde parou;
- o que já foi feito;
- o que falta;
- quais testes passaram;
- quais falharam;
- próximo passo recomendado.

Não continue trabalhando de forma desorganizada.

---

22. SE ALGO FALHAR

Não repita cegamente o mesmo comando ou solução.

Se uma tentativa falhar:

1. identifique o motivo;
2. registre o erro;
3. formule uma nova abordagem;
4. teste a nova abordagem.

Se a alteração não teve efeito, descubra por que não teve efeito antes de editar novamente.

---

23. CRITÉRIO DE "CONCLUÍDO"

Uma tarefa somente pode ser considerada concluída quando:

- código implementado;
- testes executados;
- build executado;
- aplicação verificada;
- documentação atualizada quando necessário;
- Docker verificado quando aplicável;
- Git revisado;
- nenhum secret exposto;
- alteração commitada;
- GitHub atualizado quando aplicável.

Não diga "feito" apenas porque o arquivo foi alterado.

---

24. STACK

Stack-base:

- TypeScript ponta a ponta;
- PostgreSQL;
- Redis;
- WebSocket;
- fila de jobs;
- React/Next.js;
- PWA;
- Docker Compose.

Detalhes em:

"docs/spec/01-arquitetura-e-deploy.md"

A stack pode ser alterada se houver justificativa técnica.

Toda alteração arquitetural relevante deve ser registrada em:

"docs/DECISOES.md"

---

25. RESPOSTAS AO USUÁRIO

Responder em português brasileiro.

Ser objetivo.

Ao final de cada fase ou etapa significativa, informar:

Feito

O que foi implementado.

Testado

Quais testes/builds foram executados.

Pendente

O que ainda falta.

Git

Commit realizado e status do push para o GitHub.

Docker

Se aplicável, qual build/container foi utilizado.

Próximo passo

Qual é o próximo módulo ou ação.

Não inventar resultados.

Não afirmar que algo foi testado se não foi.

Não afirmar que o deploy está correto sem verificar.

---

26. REGRA FINAL

Antes de qualquer ação, lembre:

WORKSPACE:
D:\ZapTI

DOCKER SOURCE:
D:\ZapTI

GIT ROOT:
D:\ZapTI

GITHUB:
repositório oficial do ZapTI

CÓDIGO:
somente D:\ZapTI

SECRETS:
nunca no código

DEPLOY:
D:\ZapTI → Docker → Container

ALTERAÇÃO:
editar → testar → verificar → commit → push

Nunca trabalhe silenciosamente em outra cópia do ZapTI.

Se o ambiente atual não estiver seguindo essas regras, corrija o ambiente ou pare e informe o problema antes de continuar.


---

# Arquivo original: `README.md`

# ZapTI

ZapTI é uma aplicação self-hosted de atendimento para WhatsApp, com API Fastify, frontend Next.js, PostgreSQL via Prisma e Redis. O repositório contém o código executável do produto — não é apenas um pacote de prompts.

## Estado atual

- **Frontend:** Next.js 14 com login, bootstrap/onboarding, dashboard, termos, privacidade e gestão de tenants.
- **API:** Fastify com autenticação JWT, isolamento por tenant, permissões, contatos, conversas, tickets, automações, flows, auditoria e rotas WhatsApp.
- **WhatsApp:** integração real com **Evolution API** para criar instâncias, solicitar conexão/QR, desconectar e enviar texto ou mídia.
- **Persistência:** PostgreSQL com Prisma; as migrations devem permanecer versionadas no Git.
- **Infraestrutura local:** Docker Compose para PostgreSQL, Redis, API e frontend.
- **Testes:** Vitest; o teste atual cobre o cliente Evolution e o comportamento fail-closed sem credenciais.

## Pré-requisitos

- Node.js 20+ e npm.
- PostgreSQL 16 e Redis 7, ou Docker Compose.
- Uma instância acessível da Evolution API.

## Configuração rápida

```bash
npm ci
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run build
npm test
```

Para desenvolvimento, use os scripts definidos no `package.json` ou execute a API e o frontend em terminais separados. A API escuta em `PORT` (padrão `3000`) e o frontend em `3001`.

### Evolution API

Configure no `.env`:

```dotenv
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=gere-uma-chave-longa-e-aleatoria
WHATSAPP_WEBHOOK_SECRET=gere-outra-chave-separada
```

A API envia a chave no header `apikey` para a Evolution API. O endpoint interno de webhook também exige a mesma `EVOLUTION_API_KEY` em `apikey` ou `x-api-key`. Ele aceita `x-tenant-id`/`x-instance-id` quando fornecidos, ou resolve a instância pelo campo `instance` dos payloads padrão da Evolution API.

O `EVOLUTION_API_URL` deve apontar para uma Evolution API já executando; o `docker-compose.yml` deste repositório injeta as variáveis no container ZapTI, mas não instala automaticamente uma imagem da Evolution API.

## Docker Compose

```bash
docker compose up -d --build
```

O Compose provisiona:

- `postgres` em `5432`;
- `redis` em `6379`;
- `api` em `3000`;
- `web` em `3001`.

Antes de um ambiente público, substitua todos os segredos padrão, restrinja as portas de banco/Redis e configure TLS e um proxy reverso.

## Comandos úteis

| Comando | Função |
|---|---|
| `npm run build` | Compila todos os workspaces e gera o build Next.js |
| `npm test` | Executa os testes Vitest disponíveis |
| `npm run lint` | Executa ESLint nos workspaces |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:migrate` | Aplica migrations em desenvolvimento |
| `npm run db:studio` | Abre o Prisma Studio |

## Estrutura

```text
apps/api/                 API Fastify e integração Evolution
apps/web/                 Frontend Next.js
packages/database/        Schema Prisma, migrations e cliente de banco
packages/shared/          Tipos, autenticação e utilitários compartilhados
docs/spec/                Especificações funcionais e técnicas
docker-compose.yml        Serviços locais
.env.example              Variáveis de ambiente documentadas
```

## Limitações conhecidas

- A instalação da Evolution API e a configuração do webhook são responsabilidades do ambiente de implantação.
- O ambiente atual não registra uma rota de backup: a antiga referência quebrada foi removida para manter a API compilável; o armazenamento de backups do Compose não representa uma rotina de backup implementada.
- O lint passa sem erros, mas ainda emite avisos preexistentes de `any` e variáveis não utilizadas em vários módulos.
- A validação de `docker compose config` precisa ser executada em uma máquina que tenha o binário Docker instalado.
- Recursos dependentes das capacidades do WhatsApp/Evolution API, como voz, vídeo, status e mensagens de template, precisam de validação adicional contra a versão do servidor Evolution usada em produção.

## Segurança operacional

Nunca faça commit de `.env`, tokens, chaves ou dumps de banco. Use chaves longas e distintas para JWT, Evolution API e webhooks. A integração Evolution é intencionalmente **fail-closed**: sem `EVOLUTION_API_URL` e `EVOLUTION_API_KEY`, operações remotas retornam erro de serviço em vez de simular uma conexão.


---

# Arquivo original: `ARCHITECTURE.md`

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

The `backups` route is **not registered** in the current API because the previous import pointed to a missing module. Do not document it as an available endpoint until a tested implementation exists.

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
- **Evolution API Client** (`src/services/evolution.ts`) - instance lifecycle, QR response, message sending, and response parsing
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

> **Current implementation (2026-10-04):** ZapTI uses the Evolution API. The older Meta/Baileys descriptions below are historical and must not be used as implementation guidance.

### Current Evolution API flow

1. `POST /whatsapp/instances` creates the remote Evolution instance and the local tenant-scoped record.
2. `POST /whatsapp/instances/:id/connect` requests the connection/QR response from Evolution API.
3. `POST /whatsapp/instances/:id/send` sends text through `sendText` or media through `sendMedia` and persists the returned external message ID.
4. `POST /whatsapp/instances/:id/disconnect` calls Evolution logout before updating local state.
5. `POST /whatsapp/webhook` authenticates the Evolution API key, resolves the instance, normalizes inbound messages, and broadcasts them.

Required environment variables: `EVOLUTION_API_URL` and `EVOLUTION_API_KEY`.

### Historical design reference

### Architecture
```
Evolution API
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
3. **QR Scan** - User scans → Evolution API connects → status: `CONNECTED`
4. **Sync** - Historical messages/contacts synced in background
5. **Disconnect** - `POST /whatsapp/instances/:id/disconnect` or session expiry

### Message Processing
- Inbound: Evolution webhook → normalize → upsert contact → upsert conversation → create message → broadcast
- Outbound: API → Evolution `sendText`/`sendMedia` → persist external ID → broadcast
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


---

# Arquivo original: `AUDIT_SUMMARY.md`

# ZapTI - Auditoria Completa

> **Nota de continuidade — 2026-10-04:** este documento registra uma auditoria histórica e contém afirmações antigas sobre Git, cadastro, páginas e Meta/Baileys. Para o estado atual, prevalecem `CLAUDE.md`, `README.md`, `docs/PROGRESSO.md`, `docs/DECISOES.md` e `ARCHITECTURE.md`. O commit atual é `ee408cf` no branch `master`; a integração WhatsApp usa Evolution API e a rota de backups não está registrada.

## 1. Estrutura do Projeto Confirmada
- **Diretório**: D:\ZapTI ✅
- **Apps**: web (Next.js 14) + api (Fastify)
- **Packages**: shared, database
- **Git**: Não há repositório git

## 2. Autenticação - Google/Microsoft REMOVIDOS
**Status**: ✅ JÁ REMOVIDOS (não existiam)
- Apenas email/senha + 2FA
- Nenhum OAuth, Google, Microsoft, Azure, Entra ID
- Referências legítimas apenas:
  - `next/font/google` - fontes Inter/JetBrains Mono
  - `google-site-verification` - SEO

## 3. Páginas Encontradas
| Rota | Status | Observações |
|------|--------|-------------|
| `/auth/login` | ✅ Funcional | Email/senha + 2FA + lembrar-me |
| `/auth/register` | ✅ Funcional | Nome/email/senha/tenant |
| `/auth/onboarding` | ✅ Funcional | Idioma/fuso/notificações |
| `/dashboard` | ✅ Funcional | Stats cards + estados loading/erro |
| `/superadmin/tenants` | ✅ Funcional | Lista tenants |
| `/conversations` | ❌ Vazio | Dir existe, sem page.tsx |
| `/tickets` | ❌ Vazio | Dir existe, sem page.tsx |
| `/flows` | ❌ Vazio | Dir existe, sem page.tsx |
| `/users` | ❌ Vazio | Dir existe, sem page.tsx |
| `/teams` | ❌ Vazio | Dir existe, sem page.tsx |
| `/sessions` | ❌ Vazio | Dir existe, sem page.tsx |
| `/settings` | ❌ Vazio | Dir existe, sem page.tsx |
| `/automations` | ❌ Vazio | Dir existe, sem page.tsx |

## 4. Problemas Identificados e Corrigidos

### Código Morto / Unused ✅ CORRIGIDO
- `src/app/auth/login/page.tsx`: SettingsProvider, useSettings, ThemeProvider, useTheme → LoginThemeProvider, useLoginTheme
- `src/app/auth/register/page.tsx`: theme (não usado), passwordValue (não usado) → removidos
- `src/app/auth/onboarding/page.tsx`: Input, CardFooter importados mas não usados → removidos
- `src/actions/auth.ts`: LoginInput, RegisterInput, ApiResponse não usados → removidos
- `src/app/api/auth/refresh/route.ts`: request, result não usados → removidos
- `src/app/superadmin/tenants/page.tsx`: CardHeader, CardTitle, cn, Edit, Ticket, AlertTriangle não usados → removidos
- `src/components/layout/Header.tsx`: cn, pathname não usados → removidos; img → next/image
- `src/components/layout/Sidebar.tsx`: BarChart3 não usado → removido
- `src/components/ui/Checkbox.tsx`: Check não usado → removido
- `src/lib/api.ts`: user não usado em login/register → removido
- `src/app/error.tsx`: error não usado → prefixado com _
- `src/app/global-error.tsx`: error não usado → prefixado com _

### Tipografia
- Fontes: Inter + JetBrains Mono via next/font/google
- Sistema de design tailwind com variáveis CSS
- Precisa revisão de hierarquia, line-height, pesos

### Tema Claro/Escuro
- Implementado via `next-themes` (attribute="class")
- Funciona no Header (toggle Sun/Moon)
- Login/Register pages têm seus próprios providers para SSR
- Precisa verificar consistência em todas as páginas

### Responsividade
- Sidebar colapsável (w-16 / w-64)
- Header fixo com menu mobile
- Grid dashboard responsivo (sm:grid-cols-2 lg:grid-cols-4)

### Componentes UI
- Radix UI + Tailwind consistentes
- Variants: default, destructive, outline, secondary, ghost, link
- Sizes: default, sm, lg, icon
- Dark mode via classes CSS

## 5. Builds ✅
- `@zapti/web`: ✅ Build successful (TypeScript + Next.js)
- `@zapti/api`: ✅ Build successful (TypeScript)
- `@zapti/shared`: ✅ Build successful (TypeScript)
- `@zapti/database`: ✅ Build successful (TypeScript)
- Lint: ✅ No warnings/errors

## 6. Próximos Passos
1. Criar páginas placeholder para rotas vazias (conversations, tickets, flows, users, teams, sessions, settings, automations)
2. Validar tipografia - hierarquia consistente em todas as páginas
3. Verificar/corrigir tema em todas as páginas
4. Adicionar testes se necessário


---

# Arquivo original: `docs/PROGRESSO.md`

# Progresso do ZapTI

## Atualização de continuidade — 2026-10-04

**Commit:** `ee408cf fix: replace WhatsApp mocks with Evolution API integration`

### Concluído neste ciclo

- API compilando novamente: referência quebrada de `backups` removida do registro de rotas.
- Integração real com Evolution API implementada em `apps/api/src/services/evolution.ts`.
- Ciclo de instância implementado: criar, conectar/obter QR, desconectar e enviar texto/mídia.
- Webhook autenticado por `EVOLUTION_API_KEY`, compatível com payload padrão da Evolution API e com resolução por nome da instância.
- Testes unitários adicionados em `apps/api/src/services/evolution.test.ts`.
- README, `.env.example`, configuração de runtime e Docker Compose atualizados.
- Migrations Prisma e testes deixaram de ser ignorados pelo Git.

### Verificações executadas

- `npm test`: aprovado (2 testes).
- `npm run build`: aprovado em todos os workspaces.
- `npm run lint`: aprovado sem erros; avisos preexistentes permanecem.
- `prisma validate`: aprovado.
- `git diff --check`: aprovado.
- `docker compose config`: não executado com sucesso porque Docker não está instalado no ambiente de auditoria.

### Pendências importantes

- Validar a integração contra uma instância Evolution API real e confirmar a configuração de webhook no ambiente de deploy.
- Executar `docker compose config` e `docker compose up --build` em uma máquina com Docker.
- Criar/validar testes de integração com PostgreSQL para isolamento multi-tenant.
- Não considerar o volume `backups` como rotina de backup implementada; a rota de backup não está registrada.

## Fase 1 — Base do projeto, Docker, login e usuários
**Status:** 🟡 Em andamento  
**Iniciado em:** 2026-09-28

### Checklist da Fase 1 (baseado em `docs/spec/09-fases-e-criterios.md`)

#### Estrutura do repositório e Docker
- [x] Monorepo configurado (apps/api, apps/web, apps/worker, packages/*)
- [x] Docker Compose com: web, api, worker, postgres, redis
- [x] Dockerfiles multi-stage para cada serviço
- [x] Volumes persistentes: `/data/zapti/media`, `/data/zapti/backups`, `/data/zapti/logs`
- [x] `.env.example` completo com todas as variáveis documentadas
- [x] `install.sh` funcional (verifica Docker/Compose, gera secrets, cria .env, sobe tudo)
- [x] Health checks nos containers
- [x] Proxy reverso agnóstico documentado

#### Multi-tenant e Isolamento
- [x] Modelo `Tenant` (empresa) no Prisma
- [x] Middleware Prisma para injeção automática de `tenant_id`
- [x] RLS (Row Level Security) no PostgreSQL
- [ ] Testes automatizados provando isolamento entre tenants
- [ ] Superadmin da instalação (cria/suspende/exclui empresas)

#### Usuários, Permissões e Equipes
- [x] Modelo `User` global (pertence a um ou mais tenants via `UserTenant`)
- [x] Permissões granulares + presets (Admin, Supervisor, Atendente, ReadOnly)
- [x] Modelo `Team` e `UserTeam`
- [x] CRUD de usuários (admin da empresa)
- [x] Políticas de permissão aplicadas no backend

#### Autenticação Completa
- [x] Login usuário/senha com Argon2id
- [x] JWT Access Token (15min) + Refresh Token (7d, rotação)
- [x] "Lembrar de mim" (refresh token de 30d)
- [x] 2FA TOTP + códigos de recuperação (INCOMPLETO - inconsistências)
- [ ] Esqueci minha senha (e-mail via SMTP com token seguro)
- [ ] Admin força reset de senha / encerra sessões
- [ ] Rate limiting / proteção força bruta (IP + conta)
- [ ] Sessões/dispositivos: listar, revogar, encerrar todas outras
- [ ] Limite de dispositivos simultâneos por usuário

#### Remoção de Cadastro Público (Etapa 2)
- [x] Endpoint `POST /auth/register` removido da API
- [x] Página `/auth/register` removida do frontend
- [x] Action `registerAction` removida
- [x] Links "Criar conta" / "Não tenho uma conta" removidos do login
- [x] Middleware web não tem mais rota pública para registro

#### Onboarding/Bootstrap (Especificação do usuário)
- [x] Endpoint `GET /auth/bootstrap-status` existente
- [x] Endpoint `POST /auth/bootstrap` existente (só funciona com 0 usuários)
- [x] Página `/auth/bootstrap` existente
- [x] `OnboardingGuard` existente
- [ ] Schema de resposta do bootstrap corrigido
- [ ] Fluxo completo validado: Docker iniciado → banco sem usuários → onboarding → criar admin → login → dashboard
- [ ] `initialized: false` com 0 usuários e `initialized: true` depois
- [ ] Segunda tentativa de criar primeiro admin recusada
- [ ] `/onboarding` redireciona quando já existe usuário

---

## Estado Atual (2026-10-02) — Resumo da Recuperação

### Problemas Identificados e Status

| Problema | Arquivo(s) | Status |
|----------|------------|--------|
| **Build do Web falha** - JSX syntax error (form sem fechamento) | `apps/web/src/app/auth/login/page.tsx` | ✅ **Corrigido** |
| **Lint falha** - Unused vars + parsing error | `apps/web/src/app/auth/login/page.tsx`, `OnboardingGuard.tsx`, `auth.ts` store | ✅ **Corrigido** (warnings restantes são não-bloqueantes) |
| **TypeScript warnings** - Unused imports, await sem efeito | `apps/api/src/routes/auth/index.ts`, `middleware/auth.ts` | 🟡 Warnings apenas (não-bloqueantes) |
| **2FA inconsistente** - `requiresTwoFactor` vs `requires2FA`, `twoFactorToken` vs `twoFactorCode` | API, Web store, actions, login page | ✅ **Corrigido** - unificado em `requiresTwoFactor` e `twoFactorToken` |
| **`verify2FA` no store** - Stub incompleto | `apps/web/src/store/auth.ts` | ✅ **Removido** (não usado, 2FA via login endpoint) |
| **LoginCard onLogin type** - Não corresponde à implementação real | `apps/web/src/app/auth/login/page.tsx` | ✅ **Corrigido** - tipo agora corresponde |
| **Testes** - Nenhum teste existe em nenhum pacote | apps/api, apps/web, packages/* | 🔴 Ausentes |

### Build e Lint Status Atual
- ✅ **Web Build**: Sucesso (Next.js 14.2.3)
- ✅ **Web Lint**: Apenas 1 warning (unused `_errors2FA` - prefixado com `_`)
- ✅ **API Build**: Sucesso (tsc)
- ⚠️ **API Lint**: Apenas warnings (no-floating-promises, no-explicit-any, no-unused-vars) - não bloqueantes
- ✅ **Containers Docker**: Todos rodando e saudáveis (healthy)

### Próximos Passos (Fase 1 - Finalizar Login e 2FA)

1. **Escrever testes** para:
   - Login com sucesso
   - Senha incorreta
   - Campos vazios
   - 2FA obrigatório
   - Bootstrap (primeiro admin)
   - Isolamento multi-tenant

2. **Completar funcionalidades de autenticação pendentes**:
   - Esqueci minha senha (e-mail via SMTP)
   - Admin força reset de senha / encerra sessões
   - Rate limiting / proteção força bruta
   - Sessões/dispositivos: listar, revogar, encerrar todas outras
   - Limite de dispositivos simultâneos por usuário

3. **Validar fluxo completo de bootstrap/onboarding** com banco limpo

### Observações Importantes

- Containers estão **rodando e saudáveis** (docker compose ps mostra todos Up/healthy)
- Docker build context está correto: `D:\ZapTI`
- Git root está correto: `D:\ZapTI`
- Nenhum secret exposto no código
- Banco de dados existente com dados - não pode ser destruído para testes
- Nomenclatura 2FA unificada: `requiresTwoFactor` (boolean) e `twoFactorToken` (string) em todo o códigobase


---

# Arquivo original: `docs/DECISOES.md`

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


---

# Arquivo original: `docs/AUDIT_AND_PLAN.md`

# ZapTI — Auditoria Completa e Plano de Execução

> **Nota de continuidade — 2026-10-04:** este plano é histórico. Para o estado implementado, use `CLAUDE.md`, `README.md`, `docs/PROGRESSO.md`, `docs/DECISOES.md` e `ARCHITECTURE.md`. O commit `ee408cf` foi sincronizado em `master`; a integração WhatsApp atual usa Evolution API, e a rota de backups não está registrada.

**Data**: 2026-10-02  
**Diretório de trabalho**: D:\ZapTI (confirmado)  
**Fase atual**: Fase 1 — Base, Docker, Login e Usuários (em andamento)

---

## 1. Resumo da Arquitetura Encontrada

### Stack
| Camada | Tecnologia | Status |
|--------|------------|--------|
| **Linguagem** | TypeScript (ponta a ponta) | ✅ |
| **Backend** | Node.js + Fastify | ✅ |
| **Frontend** | React + Next.js 14 (App Router) + PWA | ✅ |
| **Banco de Dados** | PostgreSQL 16 + Prisma ORM | ✅ |
| **Cache/Filas** | Redis 7 | ✅ |
| **Autenticação** | JWT (access 15m + refresh 7d) + bcrypt | ✅ |
| **2FA** | TOTP (RFC 6238) + códigos de recuperação | ✅ |
| **Validação** | Zod | ✅ |
| **Containerização** | Docker Compose + Dockerfile multi-stage | ✅ |
| **UI Components** | Radix UI + Tailwind CSS + Lucide React | ✅ |
| **State Management** | Zustand + TanStack Query | ✅ |

### Estrutura do Monorepo
```
D:\ZapTI\
├── apps/
│   ├── api/           # Fastify backend
│   └── web/           # Next.js 14 frontend
├── packages/
│   ├── shared/        # Utilitários compartilhados (auth, email, config, types)
│   └── database/      # Prisma schema + client
├── docs/
│   ├── spec/          # Especificações (00-visao-geral.md a 09-fases-e-criterios.md)
│   ├── PROGRESSO.md   # Checklist de progresso
│   └── DECISOES.md    # Decisões de arquitetura
├── docker-compose.yml # Orquestração completa
├── install.sh         # Script de instalação
└── package.json       # Workspaces npm
```

### Rotas API Implementadas (`/api/v1/`)
- `/auth` - Login, register, refresh, logout, 2FA, forgot/reset password
- `/users` - Perfil, preferências, convite, listagem, roles
- `/tenants` - CRUD (superadmin only)
- `/whatsapp` - Instâncias, webhook, QR code
- `/contacts` - CRUD contatos
- `/conversations` - CRUD conversas
- `/tickets` - CRUD tickets + stats
- `/flows` - Fluxos do bot
- `/automations` - Automações agendadas
- `/audit` - Logs de auditoria + export
- `/backups` - Backups
- `/sessions` - Gerenciamento de sessões

### Rotas Frontend Implementadas
- `/` → redirect to `/dashboard`
- `/auth/login` - Login profissional com tema animado
- `/auth/register` - Registro de tenant + usuário
- `/auth/onboarding` - Configuração inicial (idioma, fuso, notificações)
- `/dashboard` - Dashboard com stats reais (loading/error/empty states)
- `/superadmin/tenants` - Lista de tenants (superadmin)
- **FALTANDO**: `/conversations`, `/tickets`, `/flows`, `/users`, `/teams`, `/sessions`, `/settings`, `/automations`

### Banco de Dados (Prisma Schema)
Principais models: `User`, `Tenant`, `UserTenant`, `Session`, `PasswordResetToken`, `Contact`, `Conversation`, `Message`, `Ticket`, `TicketComment`, `TicketCategory`, `Flow`, `FlowExecution`, `Automation`, `AutomationExecution`, `WhatsAppInstance`, `AuditLog`, `Backup`, `Team`, `UserTeam`.

**Multi-tenant**: Isolamento por `tenant_id` em todas as tabelas + middleware Prisma + RLS preparado.

---

## 2. Análise de Gaps vs. Requisitos (Parte C)

### ✅ Já Implementado / Parcialmente
| Requisito | Status | Observações |
|-----------|--------|-------------|
| Login com email/senha | ✅ | JWT + refresh token rotation |
| 2FA TOTP | ✅ | Backend + frontend |
| "Lembrar de mim" | ✅ | 30d refresh token |
| Esqueci minha senha | ✅ | Token seguro via email |
| Rate limiting auth | ✅ | IP + conta |
| Sessões/dispositivos | ✅ | Listar, revogar, encerrar todas |
| Logs de auditoria | ✅ | Model + rotas + export JSON/CSV |
| Middleware tenant | ✅ | Isolamento automático |
| Dashboard stats | ✅ | Cards com dados reais |
| Tema dark/light | ✅ | next-themes + CSS variables |
| Docker Compose | ✅ | postgres, redis, api, web |
| install.sh | ✅ | Gera secrets, cria .env, sobe containers |

### ❌ Faltando / Incompleto (Crítico para Fase 1)
| Requisito | Prioridade | Esforço |
|-----------|------------|---------|
| **Remover cadastro público** (register route + page) | ALTA | Baixo |
| **Onboarding assistido** (primeiro acesso: superadmin + primeira empresa) | ALTA | Médio |
| **Páginas de erro** (400, 401, 403, 404, 405, 408, 429, 500, 502, 503) | ALTA | Baixo |
| **Páginas faltando**: conversations, tickets, flows, users, teams, sessions, settings, automations | ALTA | Alto |
| **Testes automatizados** (backend + fluxos principais) | ALTA | Alto |
| **Configuração SMTP admin** (UI + backend) | MÉDIA | Médio |
| **Favicon + manifest PWA** | MÉDIA | Baixo |
| **Logo ZapTI própria** | MÉDIA | Baixo |
| **Background animado login** (funcionar no light mode) | MÉDIA | Baixo |
| **Tipografia consistente** (Inter já configurada, verificar uso) | BAIXA | Baixo |
| **Ícones SVG apenas** (verificar se não há emojis) | BAIXA | Baixo |
| **Acessibilidade** (labels, contraste, aria, teclado) | MÉDIA | Médio |
| **Responsividade** (mobile: sidebar, modais, tabelas) | MÉDIA | Médio |
| **Retenção de logs** (política configurável) | BAIXA | Baixo |
| **Política de Privacidade / Termos** (com TODOs) | BAIXA | Baixo |

### 🔒 Segurança - Verificações Necessárias
| Item | Status | Ação |
|------|--------|------|
| IDOR em endpoints com ID | Parcial | Auditar todas as rotas |
| Autorização só no backend | ✅ | Middleware `requirePermission` |
| Secrets em logs/código | Verificar | Audit trail |
| Senha SMTP protegida | Parcial | Backend ok, frontend precisa não expor |
| Geolocalização IP | Não implementado | Preparar arquitetura |
| Risk score login | Não implementado | Preparar arquitetura |

---

## 3. Plano de Execução — Etapas Ordenadas

### Etapa 1: Infraestrutura e Deploy (CRÍTICO - Base para tudo)
**Objetivo**: Confirmar que `D:\ZapTI` é a fonte real do deploy e que alterações chegam ao container.
**Arquivos**: `docker-compose.yml`, `apps/api/Dockerfile`, `apps/web/Dockerfile`, `install.sh`, `.env.example`
**Dependências**: Nenhuma
**Critério de Aceite**: 
- `docker compose build` usa `D:\ZapTI` como build context
- Alteração em arquivo fonte → rebuild → container reflete alteração
- Health checks passam
**Teste**: Modificar `apps/api/src/index.ts` (log), rebuild, confirmar no container.

---

### Etapa 2: Segurança e Autenticação - Remoção de Cadastro Público
**Objetivo**: Remover registro público; provisionamento só administrativo.
**Arquivos**: 
- `apps/api/src/routes/auth/index.ts` (remover endpoint POST /register ou proteger)
- `apps/web/src/app/auth/register/page.tsx` (remover ou proteger)
- `apps/web/src/middleware.ts` (remover `/auth/register` de `publicPaths`)
- `apps/web/src/actions/auth.ts` (remover `registerAction`)
**Dependências**: Etapa 1
**Critério de Aceite**: 
- Acesso a `/auth/register` retorna 404 ou 403
- Não existe endpoint público de criação de usuário
- Superadmin cria usuários via `/superadmin/tenants` ou API protegida
**Teste**: Tentar acessar `/auth/register` e POST `/api/v1/auth/register` → 403/404.

---

### Etapa 3: Banco de Dados - Migrations e Índices
**Objetivo**: Garantir schema atualizado, índices para performance, RLS ativo.
**Arquivos**: 
- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/` (novas migrations)
**Dependências**: Etapa 1
**Critério de Aceite**:
- `prisma migrate deploy` roda sem erro
- Índices criados para consultas frequentes (userId, tenantId, createdAt, status, ip, action)
- RLS habilitado no PostgreSQL para tabelas multi-tenant
**Teste**: Rodar migrations em banco limpo, verificar índices, testar isolamento tenant.

---

### Etapa 4: Páginas de Erro
**Objetivo**: Criar páginas de erro profissionais (identidade ZapTI, dark/light).
**Arquivos**: 
- `apps/web/src/app/error.tsx` (já existe - verificar)
- `apps/web/src/app/global-error.tsx` (já existe - verificar)
- `apps/web/src/app/not-found.tsx` (já existe - verificar)
- Novos: `400.tsx`, `401.tsx`, `403.tsx`, `405.tsx`, `408.tsx`, `429.tsx`, `500.tsx`, `502.tsx`, `503.tsx` (ou usar error.tsx dinâmico)
**Dependências**: Etapa 1
**Critério de Aceite**: 
- Cada código retorna página com identidade ZapTI, mensagem clara, botão de retorno
- Funcionam em dark/light
- Não expõem stack trace ou info interna
**Teste**: Acessar rotas inexistentes, forçar erros 500, 401, 403, 429.

---

### Etapa 5: Onboarding Assistido (Primeiro Acesso)
**Objetivo**: Wizard para criar superadmin + primeira empresa + SMTP + WhatsApp.
**Arquivos**:
- Nova rota: `/onboarding` (multi-step)
- `apps/api/src/routes/onboarding/index.ts` (novo)
- `apps/web/src/app/onboarding/` (novas pages)
- `apps/web/src/components/onboarding/` (componentes)
**Dependências**: Etapa 2, 3
**Critério de Aceite**:
- Primeira visita redireciona para onboarding
- Cria superadmin (email, senha, nome)
- Cria primeira empresa (nome, slug)
- Configura SMTP (host, porta, user, pass, from, test email)
- Conecta WhatsApp (QR Code Evolution API)
- Escolhe idioma/tema
- Marca `onboardingCompleted` no user
**Teste**: Subir containers limpos, acessar URL, completar wizard, verificar login.

---

### Etapa 6: Configuração SMTP Admin
**Objetivo**: UI + backend para configurar SMTP com credenciais protegidas.
**Arquivos**:
- `apps/api/src/routes/settings/smtp.ts` (novo)
- `apps/web/src/app/(app)/settings/email/page.tsx` (novo)
- `apps/web/src/components/settings/SMTPForm.tsx` (novo)
**Dependências**: Etapa 3
**Critério de Aceite**:
- Formulário: host, porta, usuário, senha, TLS/SSL, from, fromName, timeout
- Senha nunca volta ao frontend (mascarada)
- Botão "Enviar e-mail de teste" com resultado claro
- Credenciais criptografadas em repouso (ENCRYPTION_KEY)
- Auditoria: `SMTP_CONFIG_CHANGED`, `SMTP_TEST_SENT`
**Teste**: Configurar SMTP real, enviar teste, verificar logs auditoria.

---

### Etapa 7: Páginas Principais Faltando (Prioridade: Conversations → Tickets → Users → Settings)
**Objetivo**: Implementar páginas com lista + detalhe, estados loading/vazio/erro, filtros reais.

#### 7.1 Conversations (`/conversations`)
- Lista com abas (Inbox, Pausados, Resolvidos, Busca) + sub-abas (Atendimento, Aguardando, No Bot, Grupos)
- Painel direito: chat vazio → seleciona conversa → carrega mensagens
- Filtros reais (modal: setores, usuários, tags, conexões, datas, não respondidas, ordenação)
- Integração WhatsApp real (receber/enviar mensagens)

#### 7.2 Tickets (`/tickets`)
- Lista com status (Abertos, Pendentes, Resolvidos, Encerrados)
- Métricas: avaliação média, distribuição, evolução
- CRUD completo + comentários

#### 7.3 Users (`/users`) - Admin da empresa
- Lista usuários do tenant
- Convite, edição, roles, permissões, 2FA, sessões
- Revogar sessões, forçar reset senha

#### 7.4 Settings (`/settings`) - Admin da empresa
- Abas: Sistema, Segurança, Email, WhatsApp, Catálogo, Notificações
- Cada aba só mostra o que tem implementação real

**Dependências**: Etapa 3, 5
**Critério de Aceite**: Cada página funcional, responsiva, acessível, dark/light, filtros backend.
**Teste**: Navegação completa, CRUD, filtros, paginação, responsividade mobile.

---

### Etapa 8: Catálogo de Produtos
**Objetivo**: CRUD produtos (nome, descrição, preço, promo, imagem, SKU, estoque, categoria, ativo, ordem, info extra).
**Arquivos**:
- Model: `Product`, `ProductCategory` (já existe `TicketCategory` - decidir se reutiliza ou cria novo)
- API: `/products`, `/products/categories`
- Frontend: `/catalog` ou `/settings/catalog`
**Dependências**: Etapa 3
**Critério de Aceite**: CRUD completo, upload imagem, categorias, ativo/inativo, ordenação.
**Teste**: Criar, editar, listar, desativar, upload imagem.

---

### Etapa 9: UI/UX - Identidade Visual e Polimento
**Objetivo**: Logo própria, favicon, background animado light mode, tipografia, ícones.
**Arquivos**:
- `apps/web/public/logo.svg`, `logo-dark.svg`, `favicon.ico`, `apple-touch-icon.png`, `manifest.json`
- `apps/web/src/app/globals.css` (variáveis de cor, animações)
- `apps/web/tailwind.config.ts` (cores, fontes)
- `apps/web/src/app/auth/login/page.tsx` (background animado light mode)
- Componentes UI: verificar consistência (Card, Button, Input, Badge, Table, Modal)
**Dependências**: Etapa 1
**Critério de Aceite**:
- Logo funciona dark/light, favicon completo, manifest PWA
- Background animado login funciona nos dois temas
- Zero emojis como ícones (só Lucide React)
- Tipografia Inter consistente
- Design system tokens aplicados em todos componentes
**Teste**: Visual inspection dark/light, mobile, login page, dashboard, modais.

---

### Etapa 10: Logs Operacionais e Auditoria Avançada
**Objetivo**: Área admin de logs + Security Audit Log separado + export.
**Arquivos**:
- `apps/api/src/routes/logs/operational.ts` (novo)
- `apps/api/src/routes/audit/security.ts` (expandir audit existente)
- `apps/web/src/app/(app)/logs/page.tsx`, `/audit/page.tsx`, `/sessions/page.tsx`
- Geolocalização IP (serviço configurável, sem API key no frontend)
- Risk score login (arquitetura preparada)
**Dependências**: Etapa 3, 5
**Critério de Aceite**:
- Logs operacionais: filtro período, nível, serviço, usuário, evento, status
- Security Audit: eventos listados na seção 22 do prompt
- Export CSV/JSON com filtros + auditoria da exportação
- IP real atrás de proxy (X-Forwarded-For trusted)
- Localização aproximada (país, região, cidade, ASN)
- Sessões ativas: listar, revogar, revogar todas (com auditoria)
- Login history com risk score
**Teste**: Gerar logs, filtrar, exportar, verificar auditoria, testar sessões.

---

### Etapa 11: Testes Automatizados
**Objetivo**: Cobertura backend + fluxos principais E2E.
**Arquivos**:
- `apps/api/test/` (vitest)
- `apps/web/test/` (playwright)
- `.github/workflows/ci.yml`
**Dependências**: Todas anteriores
**Critério de Aceite**:
- Testes unitários auth, tenant isolation, permissions
- Testes integração API (login, CRUDs, multi-tenant)
- Testes E2E: login → dashboard → conversations → tickets
- CI roda no GitHub Actions
- Zero testes falhando
**Teste**: `npm run test` + `npm run test:e2e` passam.

---

### Etapa 12: Documentação e Verificação Final
**Objetivo**: Atualizar `docs/site/`, `PROGRESSO.md`, `DECISOES.md`, `LIMITACOES.md`.
**Arquivos**: Documentação em `docs/site/`
**Dependências**: Todas anteriores
**Critério de Aceite**:
- Cada funcionalidade documentada
- PROGRESSO.md 100% Fase 1
- LIMITACOES.md honesto (ex: WhatsApp calls não suportado)
- Deploy verificado end-to-end
**Teste**: `docker compose up` → acessar → onboarding → login → usar funcionalidades.

---

## 4. Itens Fora de Escopo / Dependem de Decisão (TODO)

| Item | Decisão Necessária |
|------|-------------------|
| Serviço de geolocalização IP | Qual provedor? (ipapi.co, ipinfo.io, maxmind, self-hosted?) |
| Provedor de armazenamento mídia | Local (padrão) vs S3 vs GCS - já configurado no shared/config |
| Limite de dispositivos simultâneos | Valor padrão? Configurável por tenant? |
| Políticas de senha | Comprimento, complexidade, expiração, histórico? |
| MFA obrigatório | Por tenant? Por usuário? |
| Retenção de logs | Dias por nível? Arquivamento para onde? |
| Dados jurídicos (Política/Termos) | Empresa, CNPJ, endereço, DPO, responsável legal |
| Evolution API - múltiplas instâncias | Já suportado no schema? Verificar integração real |
| Sandbox mode | Como simular envios sem enviar? |
| Dados de demonstração | Incluir seed opcional? |

---

## 5. Estratégia de Rollback por Etapa

| Etapa | Rollback |
|-------|----------|
| 1 - Infra | `docker compose down`, restaurar docker-compose.yml anterior |
| 2 - Auth | Reverter commits (git), `docker compose restart api web` |
| 3 - DB | `prisma migrate reset` (destrutivo) ou migration down manual; **backup antes** |
| 4 - Error pages | Reverter arquivos novos |
| 5 - Onboarding | Feature flag `FEATURE_ONBOARDING=false` ou reverter rotas |
| 6 - SMTP | Reverter rota + UI; config volta para `.env` |
| 7 - Pages | Reverter páginas individuais (feature flags por rota) |
| 8 - Catalog | Reverter model + rotas + UI; migration down se necessário |
| 9 - UI/UX | Reverter arquivos de assets/CSS |
| 10 - Logs/Audit | Reverter rotas; dados de auditoria são append-only |
| 11 - Tests | Não afeta produção |
| 12 - Docs | Não afeta produção |

**Backup obrigatório antes da Etapa 3**: `docker exec zapti-postgres pg_dump -U postgres zapti > backups/pre-migration-$(date +%F).sql`

---

## 6. Registro de Riscos

| # | Risco | Prob. | Impacto | Mitigação | Como Verificar |
|---|-------|-------|---------|-----------|----------------|
| 1 | Build context Docker aponta para pasta errada | Média | Crítico | Verificar `context: .` em compose; testar alteração real | Etapa 1 teste |
| 2 | Volume sobrescreve código no container | Baixa | Alto | Volumes só para data (postgres, redis, uploads), não código | `docker inspect` volumes |
| 3 | Migration destrutiva / trava tabela grande | Baixa | Crítico | Backup antes; migrations pequenas; `pg_dump` prévio | Backup existe |
| 4 | Lockout geral usuários (auth quebrado) | Média | Crítico | Manter sessão admin ativa; testar em staging; feature flag | Login admin funciona |
| 5 | Remover register quebra fluxo interno | Baixa | Médio | Verificar se algum fluxo usa register (onboarding wizard usa API admin) | Grep por register |
| 6 | Secrets vazam em logs/respostas | Baixa | Crítico | Auditoria de código; nunca logar passwordHash, tokens, SMTP_PASS | Grep por secrets |
| 7 | IDOR em endpoints | Média | Alto | Middleware `requirePermission` + tenant context em todas rotas | Testes automatizados |
| 8 | Geolocalização IP bloqueia usuário legítimo | Baixa | Médio | Nunca bloquear só por geo; risk score multi-sinal; admin override | Revisão de código |
| 9 | SMTP credentials expostas no frontend | Baixa | Crítico | Backend nunca devolve senha; frontend só mostra `****` | Inspecionar network tab |
| 10 | Queries dashboard/logs sem índice | Média | Médio | Criar índices no schema; `EXPLAIN ANALYZE` | `pg_stat_statements` |
| 11 | Regressão tema dark/light | Média | Médio | Testes visuais; componentes usam tokens CSS | Checklist visual |
| 12 | Arquivos fora de D:\ZapTI | Baixa | Crítico | **Regra absoluta**: confirmar path antes de toda escrita | Checklist E.3 |

---

## 7. Próximos Passos

**Aguardando aprovação deste plano.** Após aprovação:

1. Iniciar **Etapa 1** - Verificação de Deploy (confirmação de que `D:\ZapTI` → container)
2. Executar checklist de verificação prévia (Parte E.3) antes de cada etapa
3. Após cada etapa: build, lint, testes, verificação funcional
4. Code review por agentes revisores (Parte E.5) para mudanças de segurança/auth/db/deploy
5. Relatório final com todos os itens da seção 49 do prompt

---

**Nota**: Este plano segue estritamente a **Parte A** (apenas `D:\ZapTI`), **Parte C** (requisitos), e **Parte E** (processo obrigatório). Nenhuma edição será feita antes da aprovação.

