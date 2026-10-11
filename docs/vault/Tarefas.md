# Tarefas — ZapTI

> Última atualização: 2026-10-11  
> Fonte: handoff.md + análise do código

## Em Andamento 🔄

| # | Tarefa | Responsável | Início | Status |
|---|--------|-------------|--------|--------|
| 1 | Unificar Prisma schema (packages/database ← apps/api) | — | 2026-10-11 | 🔄 Iniciado |
| 2 | Build limpo: shared → database → api → web | — | 2026-10-11 | ⏳ Pendente |
| 3 | Docker Compose up -d (todos serviços saudáveis) | — | 2026-10-11 | ⏳ Pendente |
| 4 | Evolution API: instância + QR code + webhook | — | 2026-10-11 | ⏳ Pendente |

## Pendente 📋

### Infraestrutura & Deploy
- [ ] Commit WIP atual (`git status` → `git add -A` → commit)
- [ ] Validar Prisma schema unificado (`npx prisma validate`)
- [ ] Gerar Prisma Client (`npx prisma generate`)
- [ ] Build shared (`npm run build --workspace=packages/shared`)
- [ ] Build database (`npm run build --workspace=packages/database`)
- [ ] Build API (`npm run build --workspace=apps/api` + `tsc --noEmit`)
- [ ] Build Web (`npm run build --workspace=apps/web` + `next build`)
- [ ] Docker build api + web (`docker compose -f docker-compose.prod.yml build api web`)
- [ ] Docker up -d (todos healthy)
- [ ] Testar health checks de todos os serviços

### Evolution API
- [ ] `curl http://localhost:8080` retorna 200
- [ ] Criar instância WhatsApp via API
- [ ] Obter QR code e exibir no Web
- [ ] Parear WhatsApp real (escanear QR)
- [ ] Verificar webhook `connection.update` chega na API
- [ ] Enviar mensagem de teste (Web → API → Evolution → WhatsApp)
- [ ] Receber mensagem de teste (WhatsApp → Evolution → Webhook → API → WebSocket → Web)
- [ ] Testar mídias (imagem, áudio, documento)

### GitHub & CI/CD
- [ ] `gh auth status` — verificar autenticação
- [ ] `gh repo create zapti --private --source=. --push`
- [ ] Configurar GitHub Actions (opcional, futuro)

### Código & Qualidade
- [ ] Corrigir TypeScript errors restantes (todos workspaces)
- [ ] Remover `sendErrorNotification` imports quebrados (se houver)
- [ ] Verificar relação `Campaign.logs CampaignLog[]` no schema
- [ ] Rodar testes: `npm run test` (shared, api)
- [ ] Rodar E2E Web: Playwright
- [ ] Lint all: `npm run lint`

### Documentação
- [ ] Atualizar CLAUDE.md com seção "Memória do projeto" ✅ (feito abaixo)
- [ ] Atualizar handoff.md com estado confirmado
- [ ] Documentar troubleshooting Evolution API

## Concluído ✅

| # | Tarefa | Data | Commit |
|---|--------|------|--------|
| 1 | Sistema de fontes trocado para system-ui stack | 2026-10-10 | d9b3d9d |
| 2 | Onboarding wizard criado na Web | 2026-10-10 | d9b3d9d |
| 3 | docker-compose.prod.yml criado com Evolution API | 2026-10-10 | d9b3d9d |
| 4 | Handlers Evolution Webhook adicionados (whatsapp.ts, webhooks.ts) | 2026-10-11 | db2c522 |
| 5 | .dockerignore criado na raiz | 2026-10-11 | db2c522 |
| 6 | Ajustes de tipagem/compilação em múltiplos arquivos | 2026-10-11 | db2c522 |
| 7 | Vault Obsidian criado em docs/vault/ | 2026-10-11 | — |

## Notas

- **Ordem de build obrigatória:** shared → database → api → web
- **Nunca** buildar api/web sem antes buildar shared e database
- **Sempre** commit após cada camada que compilar limpo
- **Não** rebuildar Docker sem ler o erro anterior (`docker compose logs --tail=80 <serviço>`)