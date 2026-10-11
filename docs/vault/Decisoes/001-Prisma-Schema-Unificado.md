# Decisão 001 — Unificação do Schema Prisma

**Data:** 2026-10-11  
**Status:** Pendente (confirmar)

## Contexto

Existem **dois arquivos de schema Prisma** no projeto:
1. `packages/database/prisma/schema.prisma` — Definido como "single source of truth" no CLAUDE.md
2. `apps/api/prisma/schema.prisma` — Schema duplicado na pasta da API

Ambos têm diferenças (o da API tem 14517 bytes, o do database tem 13034 bytes).

## Problema

- Divergência causa erros de tipo TypeScript
- `npx prisma generate` pode gerar clients diferentes dependendo de onde é executado
- Migrations podem ficar inconsistentes
- O CLAUDE.md diz que `packages/database/prisma/schema.prisma` é a fonte única, mas a API pode estar usando o seu próprio

## Decisão Proposta

**Manter apenas `packages/database/prisma/schema.prisma` como fonte única.**

Ações:
1. Comparar os dois schemas e mesclar diferenças
2. Apontar `apps/api` para usar o schema do `packages/database` (via `prisma.schemaPath` no package.json ou variável de ambiente)
3. Remover `apps/api/prisma/schema.prisma` ou transformar em symlink
4. Executar `npx prisma validate` e `npx prisma generate` a partir da raiz ou do package `database`
5. Atualizar `docker-compose.prod.yml` e Dockerfiles se necessário

## Riscos

- Quebra de build se a API depender de modelos/campos que só existem no schema dela
- Migrações existentes podem precisar de ajuste

## Próximos Passos

- [ ] Comparar schemas com `diff`
- [ ] Mesclar diferenças no `packages/database/prisma/schema.prisma`
- [ ] Configurar API para usar schema unificado
- [ ] Validar e gerar client
- [ ] Testar build da API

## Referências

- [Arquitetura](../Arquitetura.md) — Seção Database
- [Tarefas](../Tarefas.md) — Item "Unificar Prisma schema"