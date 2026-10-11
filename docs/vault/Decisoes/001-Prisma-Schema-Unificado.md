# Decisão 001 — Prisma Schema Unificado

**Data:** 2026-10-11  
**Status:** Confirmado

## Contexto

O projeto tinha **dois schemas Prisma** divergentes:
1. `apps/api/prisma/schema.prisma` — schema local da API
2. `packages/database/prisma/schema.prisma` — schema no package shared

Isso causava:
- Tipos TypeScript inconsistentes entre packages
- `npx prisma validate` falhando em um ou outro
- Migrations divergentes
- Confusão sobre qual era a "fonte da verdade"

## Decisão

**Unificar em `packages/database/prisma/schema.prisma` como única fonte de verdade.**

- Remover `apps/api/prisma/` completamente
- `apps/api` importa Prisma Client de `@zapti/database` (ou gera localmente apontando para o schema shared)
- `packages/database` publica o Prisma Client como parte do build
- Todos os models, enums, indexes em um único arquivo

## Alternativas Consideradas

| Opção | Prós | Contras |
|-------|------|---------|
| Manter dois schemas sincronizados manualmente | Isolamento de dependências | Drift inevitável, manutenção dupla |
| Schema único em `apps/api`, `database` só re-exporta | API controla schema | `database` package perde propósito |
| **Schema único em `packages/database`** (escolhida) | Single source of truth, compartilhável | API depende de build do `database` |

## Consequências

**Positivas:**
- Um só schema para validar (`npx prisma validate` passa)
- Tipos consistentes em toda a aplicação
- Migrations geradas uma vez
- `packages/database` tem propósito claro

**Negativas/Riscos:**
- `apps/api` precisa buildar `packages/database` primeiro (ordem de build)
- Mudança no schema requer rebuild do `database` package
- Docker build da API deve copiar/compilar `database` antes

**Neutras:**
- `prisma generate` roda no contexto do `packages/database`

## Próximos Passos

- [ ] Confirmar que `apps/api/prisma/` pode ser removido (verificar imports)
- [ ] Ajustar `package.json` da API para depender de `@zapti/database`
- [ ] Atualizar Dockerfile da API para buildar `database` primeiro
- [ ] Rodar `npx prisma validate` e `npx prisma generate` no `packages/database`
- [ ] Verificar se `CampaignLog` foi realmente removido ou precisa ser restaurado

## Referências

- `packages/database/prisma/schema.prisma` (564 linhas, 30+ models)
- Handoff.md risco #1 e #2
- ADR 004 (Shared Package ESM) — define como o package é consumido