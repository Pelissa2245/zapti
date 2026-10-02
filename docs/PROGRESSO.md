# Progresso do ZapTI

## Fase 1 — Base do projeto, Docker, login e usuários
**Status:** 🟡 Em andamento  
**Iniciado em:** 2026-09-28

### Checklist da Fase 1 (baseado em `docs/spec/09-fases-e-criterios.md`)

#### Estrutura do repositório e Docker
- [ ] Monorepo configurado (apps/api, apps/web, apps/worker, packages/*)
- [ ] Docker Compose com: web, api, worker, postgres, redis
- [ ] Dockerfiles multi-stage para cada serviço
- [ ] Volumes persistentes: `/data/zapti/media`, `/data/zapti/backups`, `/data/zapti/logs`
- [ ] `.env.example` completo com todas as variáveis documentadas
- [ ] `install.sh` funcional (verifica Docker/Compose, gera secrets, cria .env, sobe tudo)
- [ ] Health checks nos containers
- [ ] Proxy reverso agnóstico documentado

#### Multi-tenant e Isolamento
- [ ] Modelo `Tenant` (empresa) no Prisma
- [ ] Middleware Prisma para injeção automática de `tenant_id`
- [ ] RLS (Row Level Security) no PostgreSQL
- [ ] Testes automatizados provando isolamento entre tenants
- [ ] Superadmin da instalação (cria/suspende/exclui empresas)

#### Usuários, Permissões e Equipes
- [ ] Modelo `User` global (pertence a um ou mais tenants via `UserTenant`)
- [ ] Permissões granulares + presets (Admin, Supervisor, Atendente, ReadOnly)
- [ ] Modelo `Team` e `UserTeam`
- [ ] CRUD de usuários (admin da empresa)
- [ ] Políticas de permissão aplicadas no backend

#### Autenticação Completa
- [ ] Login usuário/senha com Argon2id
- [ ] JWT Access Token (15min) + Refresh Token (7d, rotação)
- [ ] "Lembrar de mim" (refresh token de 30d)
- [ ] 2FA TOTP + códigos de recuperação
- [ ] Esqueci minha senha (e-mail via SMTP com token seguro)
- [ ] Admin força reset de senha / encerra sessões
- [ ] Rate limiting / proteção força bruta (IP + conta)
- [ ] Sessões/dispositivos: listar, revogar, encerrar todas outras
- [ ] Limite de dispositivos simultâneos por usuário

#### Auditoria e Danger Zone
- [ ] Log de auditoria (quem, o quê, quando, IP, tenant, entidade)
- [ ] Busca/filtro de auditoria
- [ ] Retenção configurável
- [ ] Danger Zone: ações destrutivas com confirmação por digitação

#### i18n e Temas Básicos
- [ ] Estrutura i18n (pt-BR base, arquivos JSON)
- [ ] Troca de idioma em tempo real
- [ ] Sistema de temas (cores, presets) — base para Fase 7

#### Testes e Validação
- [ ] Testes unitários (Vitest): auth, multi-tenant, permissões
- [ ] Testes de integração: login, 2FA, reset senha, isolamento
- [ ] Testes E2E (Playwright): fluxo primeiro acesso, login, 2FA
- [ ] CI no GitHub Actions (lint, typecheck, testes)

#### Critérios de Aceite da Fase 1
- [ ] `docker compose up` sobe tudo sem erros
- [ ] Assistente de primeiro acesso cria superadmin/empresa/admin
- [ ] Dois tenants criados provam isolamento em testes
- [ ] Login com 2FA funciona
- [ ] Reset de senha por e-mail funciona
- [ ] Sessões podem ser revogadas

---

## Fase 2 — Conexão com a Evolution API e importação
**Status:** ⏳ Pendente

## Fase 3 — Caixa de entrada, chat e mídias
**Status:** ⏳ Pendente

## Fase 4 — Tickets, filas e atendentes
**Status:** ⏳ Pendente

## Fase 5 — BOT, fluxos e automações
**Status:** ⏳ Pendente

## Fase 6 — Mensagens em massa, templates, relatórios, integrações e API
**Status:** ⏳ Pendente

## Fase 7 — Manutenção, atualização, monitoramento, personalização final e documentação
**Status:** ⏳ Pendente