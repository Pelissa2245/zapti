---
type: community
cohesion: 0.10
members: 22
---

# Build Order & Architecture Docs

**Cohesion:** 0.10 - loosely connected
**Members:** 22 nodes

## Members
- [[ADR ↔ Tarefas Mapping Table]] - concept - docs/vault/Tarefas.md
- [[Build Order (shared → database → api → web)]] - concept - docs/vault/Decisoes/004-Shared-Package-ESM.md
- [[Deploy Architecture (Local Only via docker-compose.prod.yml, 5 services)]] - concept - docs/vault/Visao-Geral.md
- [[Independent SemVer Versioning]] - concept - docs/vault/Decisoes/004-Shared-Package-ESM.md
- [[JWT Payload (sub, email, role, tenantId)]] - concept - docs/vault/Decisoes/005-Multi-Tenant-JWT.md
- [[Middleware Chain (JWT verify → Tenant resolution)]] - concept - docs/vault/Decisoes/005-Multi-Tenant-JWT.md
- [[Module Structure (config, auth, types, validation, constants, email, notification, utils)]] - concept - docs/vault/Decisoes/004-Shared-Package-ESM.md
- [[Monorepo Structure (appsapi, appsweb, packagesshared, packagesdatabase)]] - concept - docs/vault/Visao-Geral.md
- [[Multi-tenancy (tenantId on all models, middleware injection, JWT tenantId+role, RLS-style queries)]] - concept - docs/vault/Visao-Geral.md
- [[Named Exports Map]] - concept - docs/vault/Decisoes/004-Shared-Package-ESM.md
- [[Next Steps Order (git commit → prisma unify → build layers → docker → evolution → github)]] - concept - docs/vault/Visao-Geral.md
- [[Next.js transpilePackages for @zaptishared]] - concept - docs/vault/Decisoes/004-Shared-Package-ESM.md
- [[Prisma Middleware for Automatic tenantId Filter (Future)]] - concept - docs/vault/Decisoes/005-Multi-Tenant-JWT.md
- [[Refresh Token Rotation (Not Implemented)]] - concept - docs/vault/Decisoes/005-Multi-Tenant-JWT.md
- [[SUPER_ADMIN Impersonation via x-tenant-id header]] - concept - docs/vault/Decisoes/005-Multi-Tenant-JWT.md
- [[Shared Package ESM (@zaptishared)]] - concept - docs/vault/Decisoes/004-Shared-Package-ESM.md
- [[Tech Stack (Fastify, Next.js, Prisma, PostgreSQL, Redis, Evolution API)]] - concept - docs/vault/Visao-Geral.md
- [[Token Strategy (15min access, 7day refresh, HS256)]] - concept - docs/vault/Decisoes/005-Multi-Tenant-JWT.md
- [[Tree-shaking via ESM imports]] - concept - docs/vault/Decisoes/004-Shared-Package-ESM.md
- [[TypeScript Config (ES2022, NodeNext, strict)]] - concept - docs/vault/Decisoes/004-Shared-Package-ESM.md
- [[ZapTI — Multi-tenant WhatsApp Helpdesk Platform]] - concept - docs/vault/Visao-Geral.md
- [[tenant.isActive Validation on Every Request]] - concept - docs/vault/Decisoes/005-Multi-Tenant-JWT.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Build_Order__Architecture_Docs
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Task Board & Project Plan]]

## Top bridge nodes
- [[Shared Package ESM (@zaptishared)]] - degree 9, connects to 1 community
- [[ZapTI — Multi-tenant WhatsApp Helpdesk Platform]] - degree 6, connects to 1 community