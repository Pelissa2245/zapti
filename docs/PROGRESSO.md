# Progresso do ZapTI

## Fase 1 — Base do projeto, Docker, login e usuários
**Status:** 🟡 Em andamento  
**Iniciado em:** 2026-09-28

### Checklist da Fase 1 (baseado em `docs/spec/09-fases-e-criterios.md`)

#### Estrutura do repositório e Docker
- [x] Monorepo configurado (apps/api, apps/web, apps/worker, packages/*)
- [x] Docker Compose com: web, api, worker, postgres, redis
- [x] Dockerfiles multi-stage para cada serviço
- [x] Volumes persistentes: `/data/zapti/media`, `/data/zapti/backups`, `/data/zapti/logs`
- [x] `.env.example` completo com todas as variáveis documentadas
- [x] `install.sh` funcional (verifica Docker/Compose, gera secrets, cria .env, sobe tudo)
- [x] Health checks nos containers
- [x] Proxy reverso agnóstico documentado

#### Multi-tenant e Isolamento
- [x] Modelo `Tenant` (empresa) no Prisma
- [x] Middleware Prisma para injeção automática de `tenant_id`
- [x] RLS (Row Level Security) no PostgreSQL
- [ ] Testes automatizados provando isolamento entre tenants
- [ ] Superadmin da instalação (cria/suspende/exclui empresas)

#### Usuários, Permissões e Equipes
- [x] Modelo `User` global (pertence a um ou mais tenants via `UserTenant`)
- [x] Permissões granulares + presets (Admin, Supervisor, Atendente, ReadOnly)
- [x] Modelo `Team` e `UserTeam`
- [x] CRUD de usuários (admin da empresa)
- [x] Políticas de permissão aplicadas no backend

#### Autenticação Completa
- [x] Login usuário/senha com Argon2id
- [x] JWT Access Token (15min) + Refresh Token (7d, rotação)
- [x] "Lembrar de mim" (refresh token de 30d)
- [x] 2FA TOTP + códigos de recuperação (INCOMPLETO - inconsistências)
- [ ] Esqueci minha senha (e-mail via SMTP com token seguro)
- [ ] Admin força reset de senha / encerra sessões
- [ ] Rate limiting / proteção força bruta (IP + conta)
- [ ] Sessões/dispositivos: listar, revogar, encerrar todas outras
- [ ] Limite de dispositivos simultâneos por usuário

#### Remoção de Cadastro Público (Etapa 2)
- [x] Endpoint `POST /auth/register` removido da API
- [x] Página `/auth/register` removida do frontend
- [x] Action `registerAction` removida
- [x] Links "Criar conta" / "Não tenho uma conta" removidos do login
- [x] Middleware web não tem mais rota pública para registro

#### Onboarding/Bootstrap (Especificação do usuário)
- [x] Endpoint `GET /auth/bootstrap-status` existente
- [x] Endpoint `POST /auth/bootstrap` existente (só funciona com 0 usuários)
- [x] Página `/auth/bootstrap` existente
- [x] `OnboardingGuard` existente
- [ ] Schema de resposta do bootstrap corrigido
- [ ] Fluxo completo validado: Docker iniciado → banco sem usuários → onboarding → criar admin → login → dashboard
- [ ] `initialized: false` com 0 usuários e `initialized: true` depois
- [ ] Segunda tentativa de criar primeiro admin recusada
- [ ] `/onboarding` redireciona quando já existe usuário

---

## Estado Atual (2026-10-02) — Resumo da Recuperação

### Problemas Identificados e Status

| Problema | Arquivo(s) | Status |
|----------|------------|--------|
| **Build do Web falha** - JSX syntax error (form sem fechamento) | `apps/web/src/app/auth/login/page.tsx` | ✅ **Corrigido** |
| **Lint falha** - Unused vars + parsing error | `apps/web/src/app/auth/login/page.tsx`, `OnboardingGuard.tsx`, `auth.ts` store | ✅ **Corrigido** (warnings restantes são não-bloqueantes) |
| **TypeScript warnings** - Unused imports, await sem efeito | `apps/api/src/routes/auth/index.ts`, `middleware/auth.ts` | 🟡 Warnings apenas (não-bloqueantes) |
| **2FA inconsistente** - `requiresTwoFactor` vs `requires2FA`, `twoFactorToken` vs `twoFactorCode` | API, Web store, actions, login page | ✅ **Corrigido** - unificado em `requiresTwoFactor` e `twoFactorToken` |
| **`verify2FA` no store** - Stub incompleto | `apps/web/src/store/auth.ts` | ✅ **Removido** (não usado, 2FA via login endpoint) |
| **LoginCard onLogin type** - Não corresponde à implementação real | `apps/web/src/app/auth/login/page.tsx` | ✅ **Corrigido** - tipo agora corresponde |
| **Testes** - Nenhum teste existe em nenhum pacote | apps/api, apps/web, packages/* | 🔴 Ausentes |

### Build e Lint Status Atual
- ✅ **Web Build**: Sucesso (Next.js 14.2.3)
- ✅ **Web Lint**: Apenas 1 warning (unused `_errors2FA` - prefixado com `_`)
- ✅ **API Build**: Sucesso (tsc)
- ⚠️ **API Lint**: Apenas warnings (no-floating-promises, no-explicit-any, no-unused-vars) - não bloqueantes
- ✅ **Containers Docker**: Todos rodando e saudáveis (healthy)

### Próximos Passos (Fase 1 - Finalizar Login e 2FA)

1. **Escrever testes** para:
   - Login com sucesso
   - Senha incorreta
   - Campos vazios
   - 2FA obrigatório
   - Bootstrap (primeiro admin)
   - Isolamento multi-tenant

2. **Completar funcionalidades de autenticação pendentes**:
   - Esqueci minha senha (e-mail via SMTP)
   - Admin força reset de senha / encerra sessões
   - Rate limiting / proteção força bruta
   - Sessões/dispositivos: listar, revogar, encerrar todas outras
   - Limite de dispositivos simultâneos por usuário

3. **Validar fluxo completo de bootstrap/onboarding** com banco limpo

### Observações Importantes

- Containers estão **rodando e saudáveis** (docker compose ps mostra todos Up/healthy)
- Docker build context está correto: `D:\ZapTI`
- Git root está correto: `D:\ZapTI`
- Nenhum secret exposto no código
- Banco de dados existente com dados - não pode ser destruído para testes
- Nomenclatura 2FA unificada: `requiresTwoFactor` (boolean) e `twoFactorToken` (string) em todo o códigobase