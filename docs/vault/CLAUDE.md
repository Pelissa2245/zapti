# CLAUDE.md — ZapTI Obsidian Vault

> **Purpose**: This file guides Claude Code when working in the `docs/vault/` directory of the ZapTI project. It documents vault conventions, workflows, and how Claude should assist as your "second brain" for technical knowledge management.

---

## 🎯 Vault Overview

**Project**: ZapTI — Multi-tenant WhatsApp Helpdesk Platform  
**Vault Location**: `D:\zapti\docs\vault\`  
**Primary Role**: Software developer/engineer — technical docs, architecture, decisions, task tracking  
**AI Style**: Explanatory, teaching-oriented — explain concepts and patterns before showing code/templates  
**Maintenance**: **Active** — update Índice, Tarefas, Decisões automatically when working

---

## 📁 Vault Structure & Conventions

### Core Organization (PARA-inspired)

```
docs/vault/
├── Índice.md                    # Master index — ALWAYS keep current
├── Visao-Geral.md               # Project overview, stack, quick-start
├── Arquitetura.md               # System architecture, component diagram
├── Tarefas.md                   # Task board (Em Andamento / Pendente / Concluído)
├── Problemas-e-Solucoes.md      # Problem/solution log (debugging memory)
├── Decisoes/                    # Architecture Decision Records (ADRs)
│   ├── 001-Prisma-Schema-Unificado.md
│   ├── 002-Docker-Compose-Local.md
│   ├── 003-Evolution-API-Integration.md
│   ├── 004-Shared-Package-ESM.md
│   └── 005-Multi-Tenant-JWT.md
└── .obsidian/                   # Obsidian config (core plugins + terminal)
```

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Index/Overview | `PascalCase.md` | `Visao-Geral.md`, `Arquitetura.md` |
| ADRs | `NNN-kebab-case.md` | `001-Prisma-Schema-Unificado.md` |
| Tracking | `PascalCase.md` | `Tarefas.md`, `Problemas-e-Solucoes.md` |
| Concept notes | `kebab-case.md` | `webhook-handling.md` |
| Daily/periodic | `YYYY-MM-DD.md` | (if using daily notes) |

### Linking Convention

- **Always use Wikilinks**: `[[Visao-Geral]]`, `[[Decisoes/001-Prisma-Schema-Unificado]]`
- **Relative paths from vault root**: `[[Decisoes/001-...]]` not `[[../Decisoes/...]]`
- **Section links**: `[[Arquitetura#API-(Fastify)]]`

### Frontmatter (Optional but Recommended)

```yaml
---
title: "Título da Nota"
tags: [tag1, tag2]           # For Dataview queries
aliases: [apelido1, apelido2] # Alternative names
created: 2026-10-11
updated: 2026-10-11
status: active | deprecated | archived
---
```

---

## 🧠 How Claude Should Work in This Vault

### Core Behaviors

1. **Read first, write second** — Always read relevant notes before making changes
2. **Maintain the Index** — After any significant addition/change, update `Índice.md`
3. **Track decisions** — New architectural choices → new ADR in `Decisoes/`
4. **Log problems** — Debugging sessions → entries in `Problemas-e-Solucoes.md`
5. **Update tasks** — Move items between Em Andamento / Pendente / Concluído in `Tarefas.md`
6. **Explain before doing** — Teaching-oriented: explain the "why" and patterns, then show implementation

### When You Ask Me To...

| Request | My Response |
|---------|-------------|
| "Create a note about X" | Read related notes first, then create with proper linking and frontmatter |
| "Update the index" | Refresh `Índice.md` with current structure |
| "Document this decision" | Create ADR in `Decisoes/` with next number, link from relevant notes |
| "Log this problem/solution" | Append to `Problemas-e-Solucoes.md` with date, context, resolution |
| "Add a task" | Update `Tarefas.md` table with proper status |
| "Refactor notes" | Preserve links, update backlinks, maintain index |
| "Explain a concept" | Teach using vault content as examples, reference existing notes |

### Output Preferences

- **Code/queries first**, then explanation
- **Wikilinks** to existing vault notes when referencing concepts
- **Minimal duplication** — link to existing content rather than repeat
- **Actionable next steps** at the end of responses

---

## 📝 Note Templates

### ADR Template (Decisoes/NNN-title.md)

```markdown
# Decisão NNN — Título Curto

**Data:** YYYY-MM-DD  
**Status:** Proposto | Confirmado | Rejeitado | Obsoleto

## Contexto

O que motivou esta decisão? Qual o problema?

## Decisão

O que foi decidido. Seja específico.

## Alternativas Consideradas

| Opção | Prós | Contras |
|-------|------|---------|
| A | ... | ... |
| B | ... | ... |

## Consequências

- Positivas:
- Negativas/Riscos:
- Neutras:

## Próximos Passos

- [ ] Ação 1
- [ ] Ação 2

## Referências

- [[Nota-Relacionada]]
- Link externo se aplicável
```

### Problem/Solution Entry (Problemas-e-Solucoes.md)

```markdown
## N. Título Curto do Problema

**Problema:** Descrição clara do sintoma/erro.

**Sintomas:**
- Sintoma 1
- Sintoma 2

**Status:** 🔄 Em investigação | ✅ Resolvido | ❓ Não confirmado

**Causa Raiz:** (quando conhecida)

**Solução:**
```bash
# Comandos ou código da solução
```

**Próximos passos:**
- [ ] Verificação
- [ ] Prevenção futura

---
```

### Task Entry (Tarefas.md)

```markdown
| # | Tarefa | Responsável | Início | Status |
|---|--------|-------------|--------|--------|
| N | Descrição clara | — | YYYY-MM-DD | 🔄 Iniciado / ⏳ Pendente / ✅ Concluído |
```

---

## 🔧 Common Workflows

### Starting a New Work Session

```bash
# 1. Check git status
git status

# 2. Read current state
cat docs/vault/Tarefas.md
cat docs/vault/Problemas-e-Solucoes.md

# 3. Review index
cat docs/vault/Indice.md
```

### Adding a New Architectural Decision

1. Read `Decisoes/` to get next number
2. Create `Decisoes/NNN-nome-kebab.md` using template
3. Update `Índice.md` with new entry
4. Link from relevant notes (`Arquitetura.md`, `Visao-Geral.md`, etc.)

### Logging a Problem & Solution

1. Append to `Problemas-e-Solucoes.md` with next number
2. Include: problem, symptoms, status, root cause, solution, next steps
3. Link from related ADR or task if applicable
4. Update `Tarefas.md` if it creates new action items

### Updating Task Status

1. Edit `Tarefas.md` — move between sections, update status emoji
2. If completing: move to "Concluído" with date
3. If blocking: note dependency in description
4. Update `Índice.md` if task structure changes

---

## 🔌 Obsidian Plugins & Configuration

### Core Plugins (Enabled)

| Plugin | Purpose | Used For |
|--------|---------|----------|
| `file-explorer` | File navigation | Vault browsing |
| `global-search` | Full-text search | Finding notes |
| `graph` | Link visualization | Knowledge map |
| `backlink` | Reverse links | Seeing connections |
| `canvas` | Visual thinking | Architecture diagrams |
| `outgoing-link` | Forward links | Navigation |
| `tag-pane` | Tag management | Categorization |
| `properties` | Frontmatter UI | Metadata editing |
| `page-preview` | Hover preview | Quick reading |
| `daily-notes` | Periodic notes | Daily logging |
| `templates` | Note templates | Consistent structure |
| `command-palette` | Command access | Quick actions |
| `bookmarks` | Saved locations | Frequent notes |
| `sync` | Cloud sync | Backup/sharing |
| `bases` | Structured views | Dataview-like queries |

### Community Plugins

| Plugin | Purpose |
|--------|---------|
| `terminal` | Integrated terminal for running commands |

### Recommended Additions (Consider Installing)

| Plugin | Why |
|--------|-----|
| `dataview` | Query notes as data — dashboards for tasks, decisions, problems |
| `templater` | Advanced templates with JS — dynamic ADR/task templates |
| `periodic-notes` | Enhanced daily/weekly/monthly notes |
| `tasks` | Task management across notes with queries |
| `quickadd` | Fast capture macros |
| `git` | Version control integration |
| `excalidraw` | Hand-drawn architecture diagrams |

---

## 🔗 Integration with ZapTI Codebase

### Key Files to Reference

| Vault Note | Codebase Location | Purpose |
|------------|-------------------|---------|
| `Visao-Geral.md` | `CLAUDE.md` (root), `docker-compose.prod.yml` | Project overview, stack, commands |
| `Arquitetura.md` | `apps/api/src/index.ts`, `packages/database/prisma/schema.prisma` | Component diagram, data flow |
| `Decisoes/001-...` | `packages/database/prisma/schema.prisma` vs `apps/api/prisma/schema.prisma` | Schema unification |
| `Decisoes/003-...` | `apps/api/src/services/whatsapp.ts`, `src/routes/webhooks.ts` | Evolution API integration |
| `Tarefas.md` | `handoff.md` (root) | Task tracking sync |

### Sync Protocol

When working on ZapTI code:
1. **Update vault** when making architectural decisions
2. **Log problems** when debugging
3. **Track tasks** in `Tarefas.md` parallel to `handoff.md`
4. **Reference vault notes** in code comments when helpful
5. **Keep `Índice.md` as single source of truth** for vault navigation

---

## 🤖 AI Assistance Patterns

### For Note Creation

```
User: "Create a note about webhook security"
Claude:
1. Read Arquitetura.md, Decisoes/003-... for context
2. Create webhook-security.md with frontmatter
3. Link from Arquitetura.md#Webhooks and Decisoes/003-...
4. Update Índice.md
5. Explain the pattern used
```

### For Decision Documentation

```
User: "We decided to use Redis for session storage"
Claude:
1. Check if ADR exists (search Decisoes/)
2. Create new ADR with context, decision, alternatives
3. Link from Arquitetura.md#Redis and relevant code notes
4. Update Índice.md
5. Explain trade-offs considered
```

### For Problem Solving

```
User: "Prisma validate fails with relation error"
Claude:
1. Read Problemas-e-Solucoes.md for similar issues
2. Investigate (run commands, check schemas)
3. Document problem + solution in Problemas-e-Solucoes.md
4. Update Tarefas.md with follow-up items
5. Explain root cause and prevention
```

### For Learning/Exploration

```
User: "How does the multi-tenant JWT work?"
Claude:
1. Read Decisoes/005-Multi-Tenant-JWT.md
2. Show relevant code in apps/api/src/plugins/auth.ts
3. Explain pattern with diagram from Arquitetura.md
4. Create concept note if useful for future reference
```

---

## 📋 Maintenance Checklist

### After Each Significant Session

- [ ] `Índice.md` reflects current vault structure
- [ ] `Tarefas.md` status matches reality
- [ ] New decisions have ADRs in `Decisoes/`
- [ ] Solved problems logged in `Problemas-e-Solucoes.md`
- [ ] All new notes have proper Wikilinks
- [ ] No broken links (check graph view)

### Monthly Review

- [ ] Archive completed tasks (move to bottom of Concluído)
- [ ] Review open problems — any resolved?
- [ ] Consolidate duplicate/overlapping notes
- [ ] Update `Visao-Geral.md` if stack/commands changed
- [ ] Check ADR statuses (proposto → confirmado/rejeitado)

---

## 🚫 Anti-Patterns to Avoid

| Anti-Pattern | Correct Approach |
|--------------|------------------|
| Creating notes without linking | Always link from index and related notes |
| Duplicating content across notes | Link to canonical source, summarize briefly |
| Skipping ADR for "small" decisions | If it affects architecture, document it |
| Letting `Tarefas.md` drift from reality | Update status in same session as work |
| Using folders instead of links | Prefer Wikilinks + tags; folders for broad categories only |
| Not updating `Índice.md` | It's the map — keep it current |

---

## 🎓 Learning Resources (Vault-Specific)

### Patterns to Study in This Vault

1. **ADR format** — See `Decisoes/001-...` through `005-...`
2. **Problem/solution logging** — See `Problemas-e-Solucoes.md`
3. **Task board format** — See `Tarefas.md` tables with emojis
4. **Architecture documentation** — See `Arquitetura.md` ASCII diagrams
5. **Cross-referencing** — Note how `Índice.md` links everything

### Queries to Build (When Dataview Installed)

```dataview
# Open tasks by status
TASK FROM "docs/vault" WHERE !completed GROUP BY status

# Recent decisions
LIST FROM "docs/vault/Decisoes" SORT file.ctime DESC LIMIT 10

# Problems by status
TABLE status, file.link as "Problema" FROM "docs/vault/Problemas-e-Solucoes" WHERE status
```

---

## 📌 Quick Reference Commands

```bash
# Open vault in Obsidian
obsidian D:\zapti\docs\vault

# Search vault content
grep -r "termo" D:\zapti\docs\vault --include="*.md"

# Count notes
find D:\zapti\docs\vault -name "*.md" -not -path "*/.obsidian/*" | wc -l

# Check for broken links (requires tool)
# See: https://github.com/obsidian-community/obsidian-link-checker
```

---

## 📝 Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-10-11 | Initial CLAUDE.md created | Claude Code |

---

*This CLAUDE.md lives in `docs/vault/CLAUDE.md` and should be updated as vault conventions evolve. It is the contract for how Claude operates in this knowledge base.*