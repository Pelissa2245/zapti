---
type: community
cohesion: 0.05
members: 60
---

# Architecture ADRs & Module Map

**Cohesion:** 0.05 - loosely connected
**Members:** 60 nodes

## Members
- [[ADR 001 - Prisma Schema Unificado]] - document - docs/vault/Decisoes/001-Prisma-Schema-Unificado.md
- [[ADR 002 - Docker Compose Local]] - document - docs/vault/Decisoes/002-Docker-Compose-Local.md
- [[ADR 003 - Evolution API Integration]] - document - docs/vault/Decisoes/003-Evolution-API-Integration.md
- [[API Service (Docker)]] - code - docker-compose.prod.yml
- [[API-Routes]] - document - docs/vault/API-Routes.md
- [[Arquitetura]] - document - docs/vault/Arquitetura.md
- [[Audit Module (audit)]] - concept - docs/vault/API-Routes.md
- [[Auth Module (auth)]] - concept - docs/vault/API-Routes.md
- [[Automation Engine]] - concept - docs/vault/Arquitetura.md
- [[AutomationTrigger Enum]] - concept - docs/vault/Arquitetura.md
- [[Automations Module (automations)]] - concept - docs/vault/API-Routes.md
- [[CLAUDE.md (Root)]] - document - CLAUDE.md
- [[CLAUDE.md (Vault)]] - document - docs/vault/CLAUDE.md
- [[Campaigns Module (campaigns)]] - concept - docs/vault/API-Routes.md
- [[Contacts Module (contacts)]] - concept - docs/vault/API-Routes.md
- [[ConversationStatus Enum]] - concept - docs/vault/Arquitetura.md
- [[Conversations Module (conversations)]] - concept - docs/vault/API-Routes.md
- [[Critical Environment Variables]] - concept - docs/vault/Arquitetura.md
- [[Development Commands]] - concept - CLAUDE.md
- [[Evolution API Service]] - code - docker-compose.prod.yml
- [[Evolution Webhook Processing]] - concept - docs/vault/Arquitetura.md
- [[Fastify Middleware Chain]] - concept - docs/vault/Arquitetura.md
- [[Groups Module (groups)]] - concept - docs/vault/API-Routes.md
- [[Handoff Protocol]] - concept - CLAUDE.md
- [[Health Checks]] - concept - docs/vault/Arquitetura.md
- [[Health Module (health, ready)]] - concept - docs/vault/API-Routes.md
- [[Inbound Message Flow]] - concept - docs/vault/Arquitetura.md
- [[Integrations Module (integrations)]] - concept - docs/vault/API-Routes.md
- [[JWT Authentication]] - concept - docs/vault/Arquitetura.md
- [[Known IssuesRisks]] - concept - CLAUDE.md
- [[MessageDirection Enum]] - concept - docs/vault/Arquitetura.md
- [[MessageType Enum]] - concept - docs/vault/Arquitetura.md
- [[Messages Module (messages)]] - concept - docs/vault/API-Routes.md
- [[Monorepo Structure]] - concept - CLAUDE.md
- [[Observability]] - concept - docs/vault/Arquitetura.md
- [[Outbound Message Flow]] - concept - docs/vault/Arquitetura.md
- [[PostgreSQL Service]] - concept - docker-compose.prod.yml
- [[Prisma Performance Indexes]] - concept - docs/vault/Arquitetura.md
- [[Prisma Schema (packagesdatabase)]] - code - docs/vault/Arquitetura.md
- [[Recommended Workflow]] - concept - CLAUDE.md
- [[Redis Service]] - concept - docker-compose.prod.yml
- [[Security Measures]] - concept - docs/vault/Arquitetura.md
- [[Settings Module (settings)]] - concept - docs/vault/API-Routes.md
- [[Templates Module (templates)]] - concept - docs/vault/API-Routes.md
- [[Tenants Module (tenants)]] - concept - docs/vault/API-Routes.md
- [[TicketStatus Enum]] - concept - docs/vault/Arquitetura.md
- [[Tickets Module (tickets)]] - concept - docs/vault/API-Routes.md
- [[UserRole Enum]] - concept - docs/vault/Arquitetura.md
- [[Users Module (users)]] - concept - docs/vault/API-Routes.md
- [[Vault Conventions]] - concept - docs/vault/CLAUDE.md
- [[Vault Structure (PARA)]] - concept - docs/vault/CLAUDE.md
- [[Web Service (Docker)]] - code - docker-compose.prod.yml
- [[WebSocket Events]] - concept - docs/vault/API-Routes.md
- [[Webhooks Module (webhooks)]] - concept - docs/vault/API-Routes.md
- [[ZapTI Project]] - concept - CLAUDE.md
- [[appsapi (Fastify API)]] - code - CLAUDE.md
- [[appsweb (Next.js Web)]] - code - CLAUDE.md
- [[docker-compose.prod.yml]] - code - docker-compose.prod.yml
- [[packagesdatabase]] - code - CLAUDE.md
- [[packagesshared]] - code - CLAUDE.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Architecture_ADRs__Module_Map
SORT file.name ASC
```
