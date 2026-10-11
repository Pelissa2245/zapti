# HANDOFF — ZapTI (atualizado em 2026-10-11)

> Leia este arquivo inteiro antes de qualquer coisa. Ele substitui o handoff anterior.
> Regra de ouro: **contexto curto**. A janela do modelo é de 128k tokens e já estourou 2 vezes.

## 1. Objetivo do projeto

ZapTI: plataforma de helpdesk multi-tenant via WhatsApp.
Monorepo em `D:\zapti` (Windows):

- `apps/api` — Fastify + Prisma, porta 3000
- `apps/web` — Next.js, porta 3001
- `packages/shared` — código compartilhado (auth, email, notification, utils, constants)
- `packages/database` — Prisma
- Deploy **apenas local**: `docker-compose.prod.yml` (Postgres, Redis, Evolution API, api, web). Imagens: `zapti-new-api`, `zapti-new-web`.

## 2. Metas ativas (em ordem)

1. Evolution API funcionando localmente e integrada ao ZapTI.
2. Deploy local inteiro saudável (postgres, redis, evolution, api, web).
3. Remote do GitHub configurado e push feito.
4. Daqui em diante: commit + push a cada bloco concluído.

Instrução do dono: não parar para perguntar, se der erro continuar tentando.

## 3. Histórico resumido

### Sessão 1 (10/10)
- Fonte não estava nas imagens Docker de produção (só artefatos de build). O projeto foi **reconstruído** a partir do handoff.md antigo e de arquivos de memória. Pode haver partes faltando.
- Fontes do sistema trocadas para a stack `system-ui, Segoe UI, Roboto, Helvetica Neue, Arial` (`globals.css`, `tailwind.config.js`); Inter removida do `layout.tsx`. **Feito.**
- Onboarding wizard criado na web. **Feito.**
- `docker-compose.prod.yml` criado, com serviço `evolution` (imagem `evoapicloud/evolution-api:latest`, porta 8080, Postgres `schema=evolution`, Redis prefixo `evolution`, webhook para `http://api:3000/webhooks/evolution`).
- Único commit local: `d9b3d9d`. Sem remote.
- Terminou com erro "Request too large (max 32MB)".

### Sessão 2 (11/10)
- Descobriu que `processEvolutionWebhook` e `processWhatsAppWebhook` não existiam. Foram adicionados handlers de Evolution em `apps/api/src/services/whatsapp.ts` (message update, connection update) e `apps/api/src/routes/webhooks.ts` foi reescrito.
- Criado `.dockerignore` na raiz; ajustes em `package.json` (raiz) e `apps/api/package.json`.
- Muitos ajustes de tipagem/compilação em: `apps/api/src/{app.ts,index.ts,middleware,plugins/*,routes/users.ts,routes/audit.ts,routes/auth.ts,services/*,types/fastify.d.ts}` e `packages/shared/src/{index.ts,auth,email,notification,utils,constants}` + `tsconfig.json`/`package.json` do shared e da api.
- Muitas edições nos schemas Prisma (relações como Campaign→Template, etc.).
- Em um ponto o agente parou e perguntou "What would you like me to work on?" — não deve fazer isso.
- Terminou com: modelo da sessão não restaurado e `/session-report` estourando o contexto (128.493 > 128.000 tokens). Goal ficou em retry automático.

## 4. Estado atual — o que NÃO está confirmado

Nada abaixo foi verificado como funcionando. Verifique antes de assumir.

- **Nenhum commit novo aparece no log da sessão 2.** Pode haver muito trabalho sem commit. **Primeira ação: `git status` e commit WIP.**
- Build da API: uma build de imagem terminou com exit 0 no início, mas `docker compose` subindo api/web falhou com exit 1. Estado final desconhecido.
- TypeScript: dezenas de diagnósticos em vários arquivos, sendo corrigidos aos poucos. A última leitura mostrava poucos (3–4 por arquivo), mas não há `tsc` limpo confirmado.
- Evolution: serviço está no compose, mas não foi confirmado que sobe, que responde em `http://localhost:8080`, que cria instância/QR code, nem que o webhook chega na API.
- GitHub: sem remote, sem push.

## 5. Riscos conhecidos (conferir primeiro)

1. **Dois schemas Prisma**: `apps/api/prisma/schema.prisma` e `packages/database/prisma/schema.prisma`. Decidir uma fonte única e apontar o outro para ela (ou removê-lo). Divergência entre eles causa erros de tipo.
2. No schema de `apps/api`, um bloco `model CampaignLog` foi removido numa edição, mas `Campaign` ainda tem `logs CampaignLog[]`. Confirmar se era duplicata ou se quebrou a relação (`npx prisma validate`).
3. Em `packages/shared/src/notification/index.ts` foi removida a função `sendErrorNotification`. Confirmar que era duplicada e que nada importa uma função inexistente.
4. Edições que falharam com "Error editing file" (por exemplo no wizard `apps/web/src/app/auth/onboarding/wizard/page.tsx` e em package.json da api): reler o arquivo e reaplicar se necessário.
5. Código reconstruído: comparar com o handoff antigo e com o que a web chama na API (rotas faltando).

## 6. Próximos passos (ordem)

1. `git status`; se houver mudanças, `git add -A` e commit `wip: estado após sessão 2` (conferir `.gitignore`: nada de `.env`, `node_modules`, `dist`, `.next`).
2. Unificar o Prisma schema; `npx prisma validate` e `npx prisma generate`.
3. Compilar por camada, nesta ordem, corrigindo só o que falhar em cada uma: `packages/shared` → `packages/database` → `apps/api` (`tsc --noEmit`) → `apps/web` (`next build`).
4. Commit a cada camada que compilar.
5. `docker compose -f docker-compose.prod.yml build api web` (saída em arquivo) e `up -d`. Para cada serviço que falhar: `docker compose logs --tail=80 <serviço>`. Não rebuildar sem ter lido o erro.
6. Evolution: `curl http://localhost:8080`, criar instância, obter QR code, apontar webhook para `http://api:3000/webhooks/evolution`, testar que a API recebe o evento.
7. GitHub: `git remote -v`; se vazio, `gh auth status`; se autenticado, `gh repo create zapti --private --source=. --push`; senão deixar pronto `git remote add origin <URL>` + `git push -u origin main` e seguir.
8. Atualizar este handoff.md com o que foi confirmado de verdade.

## 7. Regras de execução (aprendidas na dor)

- **Contexto:** janela de 128k. Nunca imprimir logs inteiros: use `| tail -40`, `| head`, `grep`. Rode `/compact` antes de ficar pesado.
- **Builds Docker:** sempre em background com `> build.log 2>&1` e consultar só `tail -40 build.log`. **Não usar Monitor em loop** (repetiu a mesma linha centenas de vezes e inflou o contexto).
- **Não ler imagens/screenshots/binários** (causou o erro de 32MB).
- **Não parar para perguntar.** Se estiver em dúvida, escolha a opção mais simples, registre a decisão aqui e continue.
- **Um assunto por vez**, commit a cada bloco concluído.
- Antes de editar com `str_replace`, reler o arquivo (várias edições falharam por texto desatualizado).
- Evitar "thinking" de dezenas de minutos: se travar mais de 10 minutos numa decisão, escolha e siga.
