# ZapTI — Auditoria Completa e Plano de Execução

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