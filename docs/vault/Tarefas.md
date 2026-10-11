# Tarefas — ZapTI

> Board de tarefas sincronizado com handoff.md. Atualize status conforme avança.

---

## 🔄 Em Andamento

| # | Tarefa | Responsável | Início | Status |
|---|--------|-------------|--------|--------|
| 1 | Unificar/validar Prisma schema único | — | 2026-10-11 | 🔄 Iniciado |
| 2 | Build TypeScript limpo: shared → database → api → web | — | 2026-10-11 | ⏳ Pendente |
| 3 | Docker build api + web | — | 2026-10-11 | ⏳ Pendente |
| 4 | Subir stack completa (5 containers healthy) | — | 2026-10-11 | ⏳ Pendente |

---

## ⏳ Pendente (Próximas)

| # | Tarefa | Responsável | Início | Status |
|---|--------|-------------|--------|--------|
| 5 | Validar Evolution API: instância, QR code, webhook | — | — | ⏳ Pendente |
| 6 | Testar fluxo completo: msg inbound → webhook → API → WS → web | — | — | ⏳ Pendente |
| 7 | Configurar GitHub remote + push | — | — | ⏳ Pendente |
| 8 | Commit a cada bloco concluído (regra de ouro) | — | — | ⏳ Pendente |

---

## ✅ Concluído

| # | Tarefa | Responsável | Início | Fim | Status |
|---|--------|-------------|--------|-----|--------|
| 1 | Onboarding wizard (web) | — | 2026-10-10 | 2026-10-10 | ✅ Concluído |
| 2 | docker-compose.prod.yml com Evolution API | — | 2026-10-10 | 2026-10-10 | ✅ Concluído |
| 3 | Schema Prisma unificado em packages/database | — | 2026-10-10 | 2026-10-11 | ✅ Concluído |
| 4 | Shared package ESM (@zapti/shared) | — | 2026-10-10 | 2026-10-11 | ✅ Concluído |
| 5 | Único commit local: d9b3d9d | — | 2026-10-10 | 2026-10-10 | ✅ Concluído |

---

## 📋 Backlog / Melhorias Futuras

| # | Tarefa | Prioridade | Notas |
|---|--------|------------|-------|
| B1 | Refresh token rotation + blacklist | Alta | Segurança |
| B2 | Prisma middleware filtro automático tenantId | Média | DX, previne bugs |
| B3 | Rate limit por tenant | Média | Multi-tenancy |
| B4 | Backup/restore automatizado (pg_dump, redis) | Média | Operação |
| B5 | CI/CD GitHub Actions (build, test, deploy) | Baixa | Futuro |
| B6 | Testes automatizados (unit, integration, e2e) | Baixa | Qualidade |
| B7 | Documentação API (Swagger/OpenAPI) completa | Baixa | DX |
| B8 | Internacionalização (i18n) web | Baixa | Produto |

---

## 🔗 Tarefas Vinculadas a ADRs

| ADR | Tarefas Relacionadas |
|-----|---------------------|
| 001 Prisma Unificado | #1, #2 (build database) |
| 002 Docker Compose Local | #3, #4 |
| 003 Evolution API | #5, #6 |
| 004 Shared Package ESM | #2 (build shared primeiro) |
| 005 Multi-tenant JWT | #2 (build api), #6 (teste fluxo) |

---

## 📝 Notas de Atualização

- **2026-10-11**: Board criado baseado no handoff.md atualizado. Tarefa #1 iniciada (unificar Prisma).
- Sincronizar com `handoff.md` seção 6 "Próximos passos" a cada sessão.