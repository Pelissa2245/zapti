# Problemas e Soluções — ZapTI

> Registro de erros encontrados e como foram resolvidos. Atualize sempre que resolver um problema novo.

---

## 1. Dois Schemas Prisma Divergentes

**Problema:** Existem `apps/api/prisma/schema.prisma` e `packages/database/prisma/schema.prisma` com conteúdo diferente.

**Sintomas:**
- Erros de tipo TypeScript inconsistentes
- `prisma generate` pode gerar clients diferentes
- Migrations fora de sync

**Status:** 🔄 Em investigação (ver [Decisão 001](../Decisoes/001-Prisma-Schema-Unificado.md))

**Próximos passos:**
- Comparar com `diff`
- Mesclar no `packages/database/prisma/schema.prisma`
- Configurar API para usar schema unificado
- `npx prisma validate && npx prisma generate`

---

## 2. CampaignLog Referenciado Mas Possivelmente Removido

**Problema:** No schema da API, `model Campaign` tem `logs CampaignLog[]` mas `CampaignLog` pode ter sido removido.

**Sintomas:**
- `npx prisma validate` pode falhar
- Erro de relação órfã

**Status:** ❓ Não confirmado

**Próximos passos:**
- Verificar ambos schemas
- Decidir: restaurar CampaignLog ou remover relação de Campaign

---

## 3. Função `sendErrorNotification` Removida

**Problema:** `sendErrorNotification` foi removida de `packages/shared/src/notification/index.ts` mas pode haver imports quebrados.

**Sintomas:**
- Build falha se algum arquivo importar a função
- Runtime error se código dinâmico chamar

**Status:** ❓ Não confirmado

**Solução proposta:**
```bash
# Buscar imports
grep -r "sendErrorNotification" apps/api packages/shared apps/web
```
- Se houver imports: restaurar função ou remover imports
- Se não houver: OK

---

## 4. Erro "Request too large (max 32MB)"

**Problema:** Sessão anterior estourou contexto ao ler arquivos grandes (logs, binários).

**Causa:** Leitura de arquivos de log grandes, screenshots, ou arquivos .tar

**Solução:** 
- Nunca ler binários/images/logs completos
- Usar `tail -40`, `head`, `grep` para logs
- Usar `/compact` antes de contexto ficar pesado
- Evitar `Monitor` em loop para builds Docker

**Status:** ✅ Resolvido (regra documentada no CLAUDE.md e handoff.md)

---

## 5. Build Docker da API Falha no `docker compose up`

**Problema:** Imagem da API faz build com exit 0, mas `docker compose up` falha com exit 1.

**Causa provável:**
- Variáveis de ambiente faltando no container
- Healthcheck falhando (endpoint `/health` não responde)
- Dependência de serviços não saudáveis (postgres, redis, evolution)
- Erro de runtime TypeScript (dist desatualizado)

**Status:** ❓ Não confirmado (precisa rodar `docker compose logs --tail=80 api`)

**Próximos passos:**
- `docker compose -f docker-compose.prod.yml build api` → capturar log
- `docker compose up -d` → `docker compose logs --tail=80 api`
- Verificar se `npm run build` na API gera `dist/` correto
- Verificar se `Dockerfile` copia `package.json` e roda `npm ci` corretamente

---

## 6. Evolution API Não Verificada End-to-End

**Problema:** Evolution está no compose mas não foi testado: instância, QR code, webhook.

**Sintomas:** Desconhecido — não testado

**Status:** ❓ Não testado

**Checklist de validação:**
- [ ] `curl http://localhost:8080` → 200 OK
- [ ] POST `/instance/create` → instancia criada
- [ ] GET `/instance/connect/zapti` → QR code (base64 ou URL)
- [ ] Escanear QR com WhatsApp real → conecta
- [ ] Webhook `connection.update` chega em `http://api:3000/webhooks/evolution`
- [ ] Enviar msg via API → chega no WhatsApp
- [ ] Receber msg no WhatsApp → webhook `messages.upsert` → API → WebSocket → Web

---

## 7. TypeScript Errors Múltiplos

**Problema:** "Dezenas de diagnósticos em vários arquivos" — citado no handoff.md.

**Arquivos citados:**
- `apps/api/src/{app.ts,index.ts,middleware,plugins/*,routes/users.ts,routes/audit.ts,routes/auth.ts,services/*,types/fastify.d.ts}`
- `packages/shared/src/{index.ts,auth,email,notification,utils,constants}`
- `tsconfig.json`/`package.json` do shared e da api

**Status:** 🔄 Em correção progressiva (sessão 2)

**Solução:**
```bash
# Por workspace, em ordem:
npm run typecheck --workspace=packages/shared
npm run typecheck --workspace=packages/database
npm run typecheck --workspace=apps/api
npm run typecheck --workspace=apps/web
```
- Corrigir apenas o que falhar em cada camada
- Commit a cada camada limpa

---

## 8. Edições que Falharam com "Error editing file"

**Problema:** Várias edições falharam porque o arquivo lido estava desatualizado (stale).

**Arquivos citados:**
- `apps/web/src/app/auth/onboarding/wizard/page.tsx`
- `apps/api/package.json`

**Causa:** Ler arquivo → editar → mas arquivo mudou no meio (outra ferramenta ou edição anterior)

**Solução:** 
- **Sempre reler o arquivo antes de editar** (`Read` antes de `Edit`)
- Usar `old_string` exato (incluindo indentação)
- Se falhar: reler, confirmar conteúdo, reaplicar

**Status:** ✅ Regra documentada no CLAUDE.md e handoff.md

---

## 9. Contexto Estourado (128k tokens)

**Problema:** Sessão anterior estourou janela de contexto (128.493 > 128.000 tokens).

**Causas:**
- Monitor em loop para build Docker (repetia mesma linha centenas de vezes)
- Leitura de arquivos grandes (logs, .tar, screenshots)
- Não usar `/compact` periodicamente

**Soluções implementadas:**
- Não usar Monitor para builds Docker → usar `> build.log 2>&1` + `tail -40 build.log`
- Nunca ler binários/images/logs completos
- `/compact` antes de contexto pesado
- Vault Obsidian para memória persistente (evita releitura)

**Status:** ✅ Mitigado (regras no CLAUDE.md)

---

## 10. Agente Parou e Perguntou "What would you like me to work on?"

**Problema:** Agente entrou em modo interativo em vez de continuar autonomamente.

**Causa:** Instrução "não parar para perguntar" não foi seguida

**Solução:** 
- Regra no CLAUDE.md: "Não pausar para perguntar — escolher opção mais simples, registrar decisão, continuar"
- Regra no handoff.md: "Não parar para perguntar. Se estiver em dúvida, escolha a opção mais simples, registre a decisão aqui e continue."

**Status:** ✅ Regra documentada

---

## 11. GitHub Remote Não Configurado

**Problema:** Repositório local sem remote, sem push.

**Status:** ❓ Pendente

**Próximos passos:**
```bash
gh auth status
gh repo create zapti --private --source=. --push
# Ou manualmente:
git remote add origin https://github.com/<user>/zapti.git
git push -u origin main
```

---

## 12. `.dockerignore` Ignora Dockerfiles e Compose

**Problema:** O `.dockerignore` na raiz ignora `Dockerfile*` e `docker-compose*.yml`, o que pode quebrar o build no Docker Hub/CI se copiar o contexto todo.

**Arquivo atual:**
```
# Docker
*.tar
Dockerfile*
docker-compose*.yml
```

**Impacto:** Se fizer `docker build .` na raiz, Dockerfiles não vão para o daemon.

**Solução:** 
- Manter Dockerfiles nos apps (`apps/api/Dockerfile`, `apps/web/Dockerfile`)
- Build usa `context: .` + `dockerfile: apps/api/Dockerfile` — funciona porque caminho é relativo ao contexto
- Mas se mover para CI/CD cloud, pode precisar ajustar

**Status:** ⚠️ Atenção (confirmar se causa problema real)

---

## Template para Novos Problemas

```markdown
## XX. Título Curto

**Problema:** Descrição do que aconteceu.

**Sintomas:** Como se manifesta (erro, log, comportamento).

**Causa Raiz:** Por que aconteceu (se conhecido).

**Solução:** O que foi feito para resolver.

**Status:** ✅ Resolvido / 🔄 Em andamento / ❓ Não confirmado

**Prevenção:** Como evitar no futuro.

**Referências:** Links para arquivos, commits, docs relacionados.
```