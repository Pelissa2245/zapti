# Graph Report - zapti  (2026-10-12)

## Corpus Check
- Corpus is ~48,986 words - fits in a single context window. You may not need a graph.

## Summary
- 944 nodes · 1456 edges · 45 communities (34 shown, 11 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 77 edges (avg confidence: 0.85)
- Token cost: 85,051 input · 356 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 39
- Community 40
- Community 42
- Community 43
- Community 44

## God Nodes (most connected - your core abstractions)
1. `fastify` - 31 edges
2. `buildApp()` - 27 edges
3. `Task Board (Em Andamento / Pendente / Concluído / Backlog)` - 21 edges
4. `buildApp()` - 18 edges
5. `compilerOptions` - 18 edges
6. `compilerOptions` - 17 edges
7. `compilerOptions` - 17 edges
8. `compilerOptions` - 16 edges
9. `scripts` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `ADR 002 - Docker Compose Local` --references--> `Web Service (Docker)`  [EXTRACTED]
  docs/vault/Decisoes/002-Docker-Compose-Local.md → docker-compose.prod.yml
- `Shared Package ESM (@zapti/shared)` --semantically_similar_to--> `Completed: Shared Package ESM (@zapti/shared)`  [INFERRED] [semantically similar]
  docs/vault/Decisoes/004-Shared-Package-ESM.md → docs/vault/Tarefas.md
- `Current State (2026-10-11) — Completed vs In Progress vs Risks` --semantically_similar_to--> `Completed: Onboarding Wizard (web)`  [INFERRED] [semantically similar]
  docs/vault/Visao-Geral.md → docs/vault/Tarefas.md
- `Current State (2026-10-11) — Completed vs In Progress vs Risks` --semantically_similar_to--> `Completed: docker-compose.prod.yml com Evolution API`  [INFERRED] [semantically similar]
  docs/vault/Visao-Geral.md → docs/vault/Tarefas.md
- `Current State (2026-10-11) — Completed vs In Progress vs Risks` --semantically_similar_to--> `Completed: Schema Prisma Unificado em packages/database`  [INFERRED] [semantically similar]
  docs/vault/Visao-Geral.md → docs/vault/Tarefas.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Inbound WhatsApp Data Flow** — evolution_service, webhooks_module, contacts_module, conversations_module, messages_module, automation_engine, websocket_events [EXTRACTED 0.90]
- **Complete API Surface** — auth_module, tenants_module, users_module, contacts_module, conversations_module, messages_module, tickets_module, groups_module, campaigns_module, automations_module, webhooks_module, integrations_module, settings_module, templates_module, audit_module, health_module [EXTRACTED 1.00]
- **Docker Compose Stack** — postgres_service, redis_service, evolution_service, api_service, web_service [EXTRACTED 1.00]
- **Execution Plan Phases** — docs_vault_plano_acao_fase_1_git_commit, docs_vault_plano_acao_fase_2_prisma_unification, docs_vault_plano_acao_fase_3_build_pipeline, docs_vault_plano_acao_fase_4_docker_build, docs_vault_plano_acao_fase_5_evolution_validation, docs_vault_plano_acao_fase_6_github_remote, docs_vault_plano_acao_fase_7_commit_rule, docs_vault_plano_acao_definition_of_done, docs_vault_plano_acao_troubleshooting [EXTRACTED 1.00]
- **Multi-tenant JWT Auth Flow** — docs_vault_decisoes_005_multi_tenant_jwt_jwt_payload, docs_vault_decisoes_005_multi_tenant_jwt_token_strategy, docs_vault_decisoes_005_multi_tenant_jwt_middleware_chain, docs_vault_decisoes_005_multi_tenant_jwt_super_admin_impersonation, docs_vault_decisoes_005_multi_tenant_jwt_prisma_middleware_future, docs_vault_decisoes_005_multi_tenant_jwt_refresh_token_rotation, docs_vault_decisoes_005_multi_tenant_jwt_tenant_is_active_validation, docs_vault_visao_geral_multi_tenancy [INFERRED 0.85]
- **Shared Package Build Pipeline** — docs_vault_decisoes_004_shared_package_esm_shared_package_esm, docs_vault_decisoes_004_shared_package_esm_exports_map, docs_vault_decisoes_004_shared_package_esm_module_structure, docs_vault_decisoes_004_shared_package_esm_build_order, docs_vault_decisoes_004_shared_package_esm_typescript_config, docs_vault_decisoes_004_shared_package_esm_nextjs_transpile_packages, docs_vault_decisoes_004_shared_package_esm_tree_shaking, docs_vault_decisoes_004_shared_package_esm_versioning, docs_vault_tarefas_completed_shared_package_esm, docs_vault_tarefas_task_2_ts_clean_build [INFERRED 0.85]

## Communities (45 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (47): buildApp(), start(), buildApp(), start(), errorHandler(), registerMiddleware(), TenantWithMeta, authPlugin() (+39 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (57): ADR 001 - Prisma Schema Unificado, ADR 002 - Docker Compose Local, ADR 003 - Evolution API Integration, API Service (Docker), apps/api (Fastify API), apps/web (Next.js Web), Audit Module (/audit), Auth Module (/auth) (+49 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (40): AutomationContext, evaluateConditions(), evaluateOperator(), executeAction(), executeAddTag(), executeAssignConversation(), executeAutomation(), executeCondition() (+32 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (53): axios, @types/node, typescript, @zapti/shared, zod, name, private, version (+45 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (52): Definition of Done (Esta Sessão), Fase 1: Git & Commit WIP, Fase 2: Unificar Prisma Schema, Fase 3: Build Pipeline (shared → database → api → web), Fase 4: Docker Build & Up, Fase 5: Validar Evolution API End-to-End, Fase 6: GitHub Remote + Push, Fase 7: Commit a Cada Bloco (Regra de Ouro) (+44 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (41): devDependencies, tsx, @types/bcryptjs, @types/node, typescript, vitest, bcryptjs, @prisma/client (+33 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (41): dependencies, axios, class-variance-authority, clsx, date-fns, @hookform/resolvers, lucide-react, next (+33 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (5): formatDate(), formatPhoneNumber(), formatRelativeTime(), maskPhoneNumber(), PaginationResult

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (33): devDependencies, concurrently, prisma, @prisma/client, rimraf, typescript, engines, node (+25 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (33): AddGroupMemberSchema, ChangePasswordSchema, ContactIdParamSchema, ConversationIdParamSchema, CreateAutomationSchema, CreateCampaignSchema, CreateContactSchema, CreateConversationSchema (+25 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (25): AUTOMATION_TRIGGERS, CAMPAIGN_STATUS, CONVERSATION_PRIORITY, CONVERSATION_STATUS, ERROR_CODES, FILE_UPLOAD, INTEGRATION_TYPES, MESSAGE_DIRECTION (+17 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (31): ApiResponse, AuditLog, Automation, AutomationTrigger, Campaign, CampaignStatus, Contact, Conversation (+23 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (25): dependencies, @prisma/client, devDependencies, prisma, tsx, typescript, exports, ./prisma (+17 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (25): import, types, import, types, import, types, import, types (+17 more)

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (21): compilerOptions, baseUrl, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib, module (+13 more)

### Community 15 - "Community 15"
Cohesion: 0.10
Nodes (22): Build Order (shared → database → api → web), Named Exports Map, Module Structure (config, auth, types, validation, constants, email, notification, utils), Next.js transpilePackages for @zapti/shared, Shared Package ESM (@zapti/shared), Tree-shaking via ESM imports, TypeScript Config (ES2022, NodeNext, strict), Independent SemVer Versioning (+14 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (21): compilerOptions, baseUrl, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib, module (+13 more)

### Community 17 - "Community 17"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 18 - "Community 18"
Cohesion: 0.10
Nodes (19): compilerOptions, baseUrl, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib, module (+11 more)

### Community 19 - "Community 19"
Cohesion: 0.11
Nodes (19): dependencies, bcryptjs, fastify, @fastify/cookie, @fastify/cors, @fastify/helmet, @fastify/jwt, @fastify/multipart (+11 more)

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (18): compilerOptions, baseUrl, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib, module (+10 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (16): axios, bcryptjs, socket.io, @types/bcryptjs, @types/node, typescript, vitest, zod (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (8): AuthenticatedHandler, AuthenticatedRequest, authRoutes(), generateInvitationToken(), generateTokens(), hashToken(), verifyTokenHash(), sendWebhookWithRetry()

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (11): prisma, syncCRM(), syncIntegration(), testCRM(), testEmail(), testEvolutionAPI(), testIntegration(), testPayment() (+3 more)

### Community 24 - "Community 24"
Cohesion: 0.15
Nodes (13): devDependencies, autoprefixer, eslint, eslint-config-next, @playwright/test, postcss, tailwindcss, @types/node (+5 more)

### Community 25 - "Community 25"
Cohesion: 0.21
Nodes (6): generateAccessToken(), generateRefreshToken(), JWTPayload, verifyToken(), config(), jsonwebtoken

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (8): Critical Environment Variables (JWT_SECRET, EVOLUTION_API_KEY, etc.), External References (Evolution, Prisma, Fastify, Next.js, Tailwind), Known Problems Summary Table, Quick Start Docker (build + up -d), Quick Start Local Dev (infra only + npm install + dev servers), Validation Checklist (Infra, Evolution, API, Web), ZapTI Vault Overview Document, Vault Update Rules (ADR, Task, Problem, API, Arch, General)

### Community 27 - "Community 27"
Cohesion: 0.29
Nodes (7): ADR Links (001-005), [[Arquitetura]] Link, [[CLAUDE]] Link, [[Problemas-e-Solucoes]] Link, [[Tarefas]] Link, Vault Index (Índice.md), [[Visao-Geral]] Link

### Community 28 - "Community 28"
Cohesion: 0.29
Nodes (7): dependencies, axios, bcryptjs, jsonwebtoken, nodemailer, socket.io, zod

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (7): devDependencies, @types/bcryptjs, @types/jsonwebtoken, @types/node, @types/nodemailer, typescript, vitest

### Community 30 - "Community 30"
Cohesion: 0.38
Nodes (6): EmailOptions, emailTemplates, getTransporter(), sendEmail(), verifyEmailConfig(), nodemailer

### Community 31 - "Community 31"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, start, typecheck

### Community 32 - "Community 32"
Cohesion: 0.33
Nodes (3): metadata, viewport, next

### Community 34 - "Community 34"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, test

## Knowledge Gaps
- **163 isolated node(s):** `@prisma/client`, `@zapti/database`, `@zapti/shared`, `bcryptjs`, `ioredis` (+158 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 631 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fastify` connect `Community 0` to `Community 5`, `Community 22`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `buildApp()` (e.g. with `errorHandler()` and `authPlugin()`) actually correct?**
  _`buildApp()` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@prisma/client`, `@zapti/database`, `@zapti/shared` to the rest of the system?**
  _163 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06456582633053222 - nodes in this community are weakly interconnected._
- **Why does `jsonwebtoken` connect `Community 25` to `Community 21`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05028248587570622 - nodes in this community are weakly interconnected._
- **Why does `nodemailer` connect `Community 30` to `Community 21`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._