---
type: community
cohesion: 0.25
members: 8
---

# Environment & Operations Handbook

**Cohesion:** 0.25 - loosely connected
**Members:** 8 nodes

## Members
- [[Critical Environment Variables (JWT_SECRET, EVOLUTION_API_KEY, etc.)]] - concept - docs/vault/README.md
- [[External References (Evolution, Prisma, Fastify, Next.js, Tailwind)]] - concept - docs/vault/README.md
- [[Known Problems Summary Table]] - concept - docs/vault/README.md
- [[Quick Start Docker (build + up -d)]] - concept - docs/vault/README.md
- [[Quick Start Local Dev (infra only + npm install + dev servers)]] - concept - docs/vault/README.md
- [[Validation Checklist (Infra, Evolution, API, Web)]] - concept - docs/vault/README.md
- [[Vault Update Rules (ADR, Task, Problem, API, Arch, General)]] - concept - docs/vault/README.md
- [[ZapTI Vault Overview Document]] - document - docs/vault/README.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Environment__Operations_Handbook
SORT file.name ASC
```
