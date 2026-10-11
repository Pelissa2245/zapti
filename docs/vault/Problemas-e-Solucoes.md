# Problemas e Soluções — ZapTI

> Log de debugging: erros encontrados, causa raiz, solução aplicada. Atualize a cada sessão.

---

## 1. Request too large (max 32MB) — Docker Build

**Problema:** `docker compose build api` falha com "Request too large (max 32MB)".

**Sintomas:**
- Build da imagem `zapti-new-api` falha
- Erro ocorre durante `COPY` ou etapa de build

**Status:** ✅ Resolvido

**Causa Raiz:** Docker daemon limit default de 32MB para request size. O contexto de build (monorepo inteiro) excede.

**Solução:**
```bash
# Opção 1: .dockerignore agressivo
echo "node_modules
dist
.next
.git
*.log
.env*" > apps/api/.dockerignore

# Opção 2: Aumentar limit no Docker daemon (daemon.json)
{
  "max-concurrent-uploads": 10,
  "max-request-size": "100m"
}

# Opção 3: Build context apenas apps/api (não root)
docker build -f apps/api/Dockerfile apps/api
```

**Próximos passos:**
- [ ] Verificar .dockerignore em apps/api e apps/web
- [ ] Testar build isolado: `docker build -f apps/api/Dockerfile apps/api`

---

## 2. Dois Schemas Prisma Divergentes

**Problema:** Existem `apps/api/prisma/schema.prisma` E `packages/database/prisma/schema.prisma` com possíveis divergências.

**Sintomas:**
- `npx prisma validate` pode passar em um e falhar no outro
- Tipos TypeScript inconsistentes
- Migrations geradas em locais diferentes

**Status:** 🔄 Em investigação

**Causa Raiz:** Projeto reconstruído a partir de handoff antigo; schema da API não foi removido quando centralizado em `packages/database`.

**Solução (planejada):**
1. Comparar ambos schemas linha a linha
2. Confirmar `packages/database/prisma/schema.prisma` é completo e correto
3. Remover `apps/api/prisma/`
4. Ajustar imports da API para usar `@zapti/database` ou gerar client local apontando para schema shared
5. `npx prisma validate` + `npx prisma generate` em `packages/database`

**Próximos passos:**
- [ ] `diff apps/api/prisma/schema.prisma packages/database/prisma/schema.prisma`
- [ ] Verificar se `CampaignLog` existe em packages/database (handoff risco #2)
- [ ] Remover apps/api/prisma se confirmado duplicado

---

## 3. CampaignLog Removido mas Referenciado

**Problema:** No schema de `apps/api`, `model CampaignLog` foi removido, mas `Campaign` ainda tem `logs CampaignLog[]`.

**Sintomas:**
- `npx prisma validate` falha com "Model CampaignLog not found"
- Relation quebrada

**Status:** ❓ Não confirmado

**Causa Raiz:** Edição incompleta no schema da API (antes da unificação).

**Solução (planejada):**
- Se `CampaignLog` não é necessário: remover `logs CampaignLog[]` do model `Campaign`
- Se é necessário: restaurar model `CampaignLog` no schema unificado

**Próximos passos:**
- [ ] Verificar `packages/database/prisma/schema.prisma` model `Campaign`
- [ ] Verificar se `CampaignLog` existe no schema unificado
- [ ] Corrigir relation ou remover campo

---

## 4. sendErrorNotification Removida de notification/index.ts

**Problema:** Função `sendErrorNotification` foi removida de `packages/shared/src/notification/index.ts`.

**Sintomas:**
- Possíveis imports quebrados em arquivos que usavam a função
- TypeScript errors: "Module has no exported member 'sendErrorNotification'"

**Status:** ❓ Não confirmado

**Causa Raiz:** Refatoração/limpeza que pode ter removido função ainda em uso.

**Solução (planejada):**
1. `grep -r "sendErrorNotification" apps/ packages/` — encontrar usos
2. Se nenhum uso: OK, era código morto
3. Se há usos: restaurar função ou migrar para alternativa

**Próximos passos:**
- [ ] Buscar referências: `grep -r "sendErrorNotification" D:\zapti --include="*.ts" --include="*.tsx"`
- [ ] Corrigir imports ou restaurar função

---

## 5. Edições Falharam — "Error editing file"

**Problema:** Algumas edições falharam com erro "Error editing file" (wizard page.tsx e package.json da API).

**Sintomas:**
- Arquivos não atualizados corretamente
- Possível estado inconsistente

**Status:** ❓ Não confirmado

**Causa Raiz:** Conflito de edição concorrente ou arquivo modificado externamente.

**Solução (planejada):**
1. Re-ler arquivos afetados
2. Re-aplicar edições necessárias
3. Verificar sintaxe TypeScript

**Arquivos afetados:**
- `apps/web/src/app/auth/onboarding/wizard/page.tsx`
- `apps/api/package.json`

**Próximos passos:**
- [ ] Ler `apps/web/src/app/auth/onboarding/wizard/page.tsx` — verificar estado atual
- [ ] Ler `apps/api/package.json` — verificar dependências e scripts
- [ ] Re-aplicar correções pendentes

---

## 6. Código Reconstruído — Comparar com Handoff Antigo

**Problema:** Projeto reconstruído a partir de handoff.md antigo e arquivos de memória; partes podem estar faltando.

**Sintomas:**
- Rotas que a web chama podem não existir na API
- Funcionalidades descritas no handoff antigo não implementadas
- Gap entre expectativa (web) e realidade (api)

**Status:** 🔄 Em investigação

**Causa Raiz:** Reconstrução parcial sem validação completa de contrato API ↔ Web.

**Solução (planejada):**
1. Ler handoff antigo (se disponível)
2. Mapear chamadas da web → endpoints da API
3. Implementar rotas faltando
4. Validar tipos compartilhados (@zapti/shared/types)

**Próximos passos:**
- [ ] Listar todas rotas da API: `grep -r "app\.(get|post|put|patch|delete)" apps/api/src/routes/`
- [ ] Listar chamadas da web: `grep -r "fetch\|axios\|api\." apps/web/src/`
- [ ] Comparar e identificar gaps
- [ ] Implementar endpoints faltando

---

## 7. TypeScript Diagnostics — Não há tsc limpo confirmado

**Problema:** Dezenas de diagnósticos TS em vários arquivos; último relato: 3-4 por arquivo. `tsc --noEmit` limpo não confirmado.

**Sintomas:**
- Erros de tipo em build
- Possível runtime errors

**Status:** 🔄 Em investigação

**Causa Raiz:** Reconstrução rápida, tipos não alinhados entre packages.

**Solução (planejada):**
Build por camada, corrigindo só o que falhar:
```bash
# 1. shared
cd packages/shared && npx tsc --noEmit

# 2. database
cd packages/database && npx tsc --noEmit

# 3. api
cd apps/api && npx tsc --noEmit

# 4. web
cd apps/web && npx next build
```

**Próximos passos:**
- [ ] Executar build order acima
- [ ] Fix errors camada por camada
- [ ] Commit a cada camada limpa

---

## 8. Evolution API — Não Confirmado Funcionando

**Problema:** Serviço está no compose, mas não confirmado que:
- Sobe saudável (healthcheck passa)
- Responde em `http://localhost:8080`
- Cria instância / gera QR code
- Webhook chega na API (`http://api:3000/webhooks/evolution`)

**Sintomas:** Desconhecido — ainda não testado end-to-end.

**Status:** ⏳ Pendente

**Causa Raiz:** Stack não subida completamente ainda.

**Solução (planejada):**
1. `docker compose -f docker-compose.prod.yml up -d evolution`
2. `docker compose logs -f evolution` — aguardar healthy
3. `curl http://localhost:8080/` — healthcheck manual
4. `POST /instance/create` — criar instância
5. `GET /instance/connect/zapti` — obter QR
6. Escanear QR no WhatsApp
7. Enviar msg teste → verificar webhook na API

**Próximos passos:**
- [ ] Subir evolution isolado
- [ ] Validar cada passo acima
- [ ] Documentar procedimento no vault

---

## 9. GitHub Remote — Não Configurado

**Problema:** Repositório local apenas (commit `d9b3d9d`). Sem remote, sem push.

**Sintomas:** `git remote -v` vazio.

**Status:** ⏳ Pendente

**Causa Raiz:** Foco em código, não em versionamento remoto.

**Solução:**
```bash
git remote add origin https://github.com/<user>/zapti.git
git push -u origin main
```

**Próximos passos:**
- [ ] Criar repo no GitHub (se não existe)
- [ ] Adicionar remote
- [ ] Push inicial
- [ ] Configurar branch protection se necessário

---

## 10. Porta Conflito — 3000/3001/8080/5432/6379

**Problema:** Portas necessárias podem estar em uso por outros processos.

**Sintomas:** `docker compose up` falha com "port already allocated".

**Status:** ⏳ Pendente (preventivo)

**Solução:**
```bash
# Verificar portas em uso
netstat -ano | findstr "3000\|3001\|8080\|5432\|6379"

# Matar processos se necessário
taskkill /PID <pid> /F
```

**Próximos passos:**
- [ ] Verificar portas antes de `docker compose up`
- [ ] Documentar portas necessárias no README

---

## 📊 Resumo por Status

| Status | Count |
|--------|-------|
| ✅ Resolvido | 1 |
| 🔄 Em investigação | 3 |
| ❓ Não confirmado | 3 |
| ⏳ Pendente | 3 |

---

## 🔗 Problemas Vinculados a Tarefas/ADRs

| Problema | Tarefa Relacionada | ADR Relacionado |
|----------|-------------------|-----------------|
| #1 Request too large | #3 Docker build | 002 Docker Compose |
| #2 Dois schemas Prisma | #1 Unificar schema | 001 Prisma Unificado |
| #3 CampaignLog | #1 Unificar schema | 001 Prisma Unificado |
| #4 sendErrorNotification | #2 Build shared | 004 Shared Package |
| #5 Edições falharam | #2 Build api/web | — |
| #6 Código reconstruído | #2 Build all | — |
| #7 TS diagnostics | #2 Build all | — |
| #8 Evolution API | #5 Validar Evolution | 003 Evolution API |
| #9 GitHub remote | #7 GitHub remote | — |
| #10 Porta conflito | #4 Stack up | 002 Docker Compose |

---

## 📝 Notas de Atualização

- **2026-10-11**: Log criado baseado no handoff.md seção 5 "Riscos conhecidos". Problemas #1-7 do handoff mapeados.
- Atualizar status conforme investigação avança.
- Adicionar novos problemas descobertos durante builds/testes.