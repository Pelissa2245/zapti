# ZapTI - Auditoria Completa

> **Nota de continuidade — 2026-10-04:** este documento registra uma auditoria histórica e contém afirmações antigas sobre Git, cadastro, páginas e Meta/Baileys. Para o estado atual, prevalecem `CLAUDE.md`, `README.md`, `docs/PROGRESSO.md`, `docs/DECISOES.md` e `ARCHITECTURE.md`. O commit atual é `ee408cf` no branch `master`; a integração WhatsApp usa Evolution API e a rota de backups não está registrada.

## 1. Estrutura do Projeto Confirmada
- **Diretório**: D:\ZapTI ✅
- **Apps**: web (Next.js 14) + api (Fastify)
- **Packages**: shared, database
- **Git**: Não há repositório git

## 2. Autenticação - Google/Microsoft REMOVIDOS
**Status**: ✅ JÁ REMOVIDOS (não existiam)
- Apenas email/senha + 2FA
- Nenhum OAuth, Google, Microsoft, Azure, Entra ID
- Referências legítimas apenas:
  - `next/font/google` - fontes Inter/JetBrains Mono
  - `google-site-verification` - SEO

## 3. Páginas Encontradas
| Rota | Status | Observações |
|------|--------|-------------|
| `/auth/login` | ✅ Funcional | Email/senha + 2FA + lembrar-me |
| `/auth/register` | ✅ Funcional | Nome/email/senha/tenant |
| `/auth/onboarding` | ✅ Funcional | Idioma/fuso/notificações |
| `/dashboard` | ✅ Funcional | Stats cards + estados loading/erro |
| `/superadmin/tenants` | ✅ Funcional | Lista tenants |
| `/conversations` | ❌ Vazio | Dir existe, sem page.tsx |
| `/tickets` | ❌ Vazio | Dir existe, sem page.tsx |
| `/flows` | ❌ Vazio | Dir existe, sem page.tsx |
| `/users` | ❌ Vazio | Dir existe, sem page.tsx |
| `/teams` | ❌ Vazio | Dir existe, sem page.tsx |
| `/sessions` | ❌ Vazio | Dir existe, sem page.tsx |
| `/settings` | ❌ Vazio | Dir existe, sem page.tsx |
| `/automations` | ❌ Vazio | Dir existe, sem page.tsx |

## 4. Problemas Identificados e Corrigidos

### Código Morto / Unused ✅ CORRIGIDO
- `src/app/auth/login/page.tsx`: SettingsProvider, useSettings, ThemeProvider, useTheme → LoginThemeProvider, useLoginTheme
- `src/app/auth/register/page.tsx`: theme (não usado), passwordValue (não usado) → removidos
- `src/app/auth/onboarding/page.tsx`: Input, CardFooter importados mas não usados → removidos
- `src/actions/auth.ts`: LoginInput, RegisterInput, ApiResponse não usados → removidos
- `src/app/api/auth/refresh/route.ts`: request, result não usados → removidos
- `src/app/superadmin/tenants/page.tsx`: CardHeader, CardTitle, cn, Edit, Ticket, AlertTriangle não usados → removidos
- `src/components/layout/Header.tsx`: cn, pathname não usados → removidos; img → next/image
- `src/components/layout/Sidebar.tsx`: BarChart3 não usado → removido
- `src/components/ui/Checkbox.tsx`: Check não usado → removido
- `src/lib/api.ts`: user não usado em login/register → removido
- `src/app/error.tsx`: error não usado → prefixado com _
- `src/app/global-error.tsx`: error não usado → prefixado com _

### Tipografia
- Fontes: Inter + JetBrains Mono via next/font/google
- Sistema de design tailwind com variáveis CSS
- Precisa revisão de hierarquia, line-height, pesos

### Tema Claro/Escuro
- Implementado via `next-themes` (attribute="class")
- Funciona no Header (toggle Sun/Moon)
- Login/Register pages têm seus próprios providers para SSR
- Precisa verificar consistência em todas as páginas

### Responsividade
- Sidebar colapsável (w-16 / w-64)
- Header fixo com menu mobile
- Grid dashboard responsivo (sm:grid-cols-2 lg:grid-cols-4)

### Componentes UI
- Radix UI + Tailwind consistentes
- Variants: default, destructive, outline, secondary, ghost, link
- Sizes: default, sm, lg, icon
- Dark mode via classes CSS

## 5. Builds ✅
- `@zapti/web`: ✅ Build successful (TypeScript + Next.js)
- `@zapti/api`: ✅ Build successful (TypeScript)
- `@zapti/shared`: ✅ Build successful (TypeScript)
- `@zapti/database`: ✅ Build successful (TypeScript)
- Lint: ✅ No warnings/errors

## 6. Próximos Passos
1. Criar páginas placeholder para rotas vazias (conversations, tickets, flows, users, teams, sessions, settings, automations)
2. Validar tipografia - hierarquia consistente em todas as páginas
3. Verificar/corrigir tema em todas as páginas
4. Adicionar testes se necessário
