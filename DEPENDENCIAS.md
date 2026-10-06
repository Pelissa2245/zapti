# ZapTI - Dependências do Projeto

> Documentação completa de todas as dependências instaladas no monorepo `d:\zapti`

---

## 📦 Estrutura do Monorepo

```
zapti/
├── package.json (root)
├── packages/
│   ├── shared/       # Utilitários compartilhados
│   └── database/     # Prisma ORM + schemas
└── apps/
    ├── api/          # Backend Fastify
    └── web/          # Frontend Next.js
```

---

## 🔧 Root (`package.json`)

### DevDependencies
| Pacote | Versão | Descrição |
|--------|--------|-----------|
| `concurrently` | `^8.2.2` | Executa múltiplos comandos em paralelo |
| `rimraf` | `^5.0.7` | Remove arquivos/diretórios (cross-platform) |
| `typescript` | `^5.4.5` | TypeScript compiler |

### Configurações
- **Node**: `>=20.0.0`
- **Package Manager**: `npm@10.8.1`
- **Workspaces**: `packages/shared`, `packages/database`, `apps/api`, `apps/web`

---

## 📚 packages/database (`@zapti/database`)

### Dependencies
| Pacote | Versão | Descrição |
|--------|--------|-----------|
| `@prisma/client` | `^5.14.0` | Cliente Prisma ORM |
| `zod` | `^3.23.8` | Validação de schemas |

### DevDependencies
| Pacote | Versão | Descrição |
|--------|--------|-----------|
| `@types/node` | `^20.12.12` | Types do Node.js |
| `@typescript-eslint/eslint-plugin` | `^8.71.0` | ESLint para TypeScript |
| `@typescript-eslint/parser` | `^8.71.0` | Parser TypeScript para ESLint |
| `eslint` | `^8.57.1` | Linter |
| `prisma` | `^5.14.0` | CLI do Prisma |
| `tsx` | `^4.11.0` | Executor TypeScript (node --loader) |
| `typescript` | `^5.4.5` | TypeScript |

### Scripts Principais
- `db:generate` → `prisma generate`
- `db:push` → `prisma db push`
- `db:migrate` → `prisma migrate dev`
- `db:studio` → `prisma studio`
- `db:seed` → `tsx prisma/seed.ts`

---

## 🔄 packages/shared (`@zapti/shared`)

### Dependencies
| Pacote | Versão | Descrição |
|--------|--------|-----------|
| `bcryptjs` | `^2.4.3` | Hash de senhas |
| `crypto-js` | `^4.2.0` | Criptografia JavaScript |
| `jsonwebtoken` | `^9.0.2` | JWT tokens |
| `nodemailer` | `^6.9.14` | Envio de emails |
| `zod` | `^3.23.8` | Validação de schemas |

### DevDependencies
| Pacote | Versão | Descrição |
|--------|--------|-----------|
| `@types/bcryptjs` | `^2.4.6` | Types do bcryptjs |
| `@types/crypto-js` | `^4.2.2` | Types do crypto-js |
| `@types/jsonwebtoken` | `^9.0.5` | Types do jsonwebtoken |
| `@types/node` | `^20.12.12` | Types do Node.js |
| `@types/nodemailer` | `^6.4.15` | Types do nodemailer |
| `@typescript-eslint/eslint-plugin` | `^8.71.0` | ESLint para TypeScript |
| `@typescript-eslint/parser` | `^8.71.0` | Parser TypeScript |
| `eslint` | `^8.57.1` | Linter |
| `tsx` | `^4.11.0` | Executor TypeScript |
| `typescript` | `^5.4.5` | TypeScript |

### Exports Disponíveis
- `.` (main)
- `./auth`
- `./utils`
- `./constants`
- `./email`
- `./config`
- `./types`
- `./validation`
- `./notification`

---

## 🌐 apps/web (`@zapti/web`) - Next.js 14

### Dependencies
| Pacote | Versão | Descrição |
|--------|--------|-----------|
| `@hookform/resolvers` | `^3.3.4` | Resolvers para React Hook Form |
| `@radix-ui/react-alert-dialog` | `^1.0.5` | Dialog de alerta acessível |
| `@radix-ui/react-avatar` | `^1.2.6` | Componente Avatar |
| `@radix-ui/react-checkbox` | `^1.3.11` | Checkbox acessível |
| `@radix-ui/react-collapsible` | `^1.0.3` | Collapsible/Accordion |
| `@radix-ui/react-dialog` | `^1.1.23` | Dialog/Modal acessível |
| `@radix-ui/react-dropdown-menu` | `^2.1.24` | Dropdown menu |
| `@radix-ui/react-hover-card` | `^1.1.23` | Hover card/Tooltip rico |
| `@radix-ui/react-label` | `^2.1.15` | Label acessível |
| `@radix-ui/react-menubar` | `^1.1.24` | Menubar acessível |
| `@radix-ui/react-navigation-menu` | `^1.2.22` | Navegação acessível |
| `@radix-ui/react-popover` | `^1.1.23` | Popover acessível |
| `@radix-ui/react-progress` | `^1.1.16` | Progress bar |
| `@radix-ui/react-radio-group` | `^1.4.7` | Radio group |
| `@radix-ui/react-scroll-area` | `^1.2.18` | Scroll area customizada |
| `@radix-ui/react-select` | `^2.3.7` | Select acessível |
| `@radix-ui/react-separator` | `^1.1.15` | Separator visual |
| `@radix-ui/react-slider` | `^1.1.2` | Slider acessível |
| `@radix-ui/react-slot` | `^1.3.3` | Slot para composição |
| `@radix-ui/react-switch` | `^1.3.7` | Switch/Toggle |
| `@radix-ui/react-tabs` | `^1.1.21` | Tabs acessíveis |
| `@radix-ui/react-toast` | `^1.2.23` | Toast notifications |
| `@radix-ui/react-tooltip` | `^1.2.16` | Tooltip acessível |
| `@tanstack/react-query` | `^5.104.0` | Server state management |
| `@tanstack/react-table` | `^8.17.3` | Tabelas poderosas |
| `@zapti/shared` | `file:../../packages/shared` | Shared package local |
| `axios` | `^1.7.2` | HTTP client |
| `class-variance-authority` | `^0.7.1` | Variantes de classe (CVA) |
| `clsx` | `^2.1.1` | Conditional classNames |
| `date-fns` | `^3.6.0` | Manipulação de datas |
| `lucide-react` | `^0.378.0` | Ícones |
| `next` | `14.2.3` | Framework React |
| `next-themes` | `^0.4.6` | Dark mode / temas |
| `react` | `^18.3.1` | React core |
| `react-dom` | `^18.3.1` | React DOM |
| `react-hook-form` | `^7.51.5` | Forms performáticos |
| `sonner` | `^1.7.4` | Toast notifications |
| `tailwind-merge` | `^2.6.1` | Merge de classes Tailwind |
| `zod` | `^3.23.8` | Validação de schemas |
| `zustand` | `^4.5.2` | State management simples |

### DevDependencies
| Pacote | Versão | Descrição |
|--------|--------|-----------|
| `@playwright/test` | `^1.63.0` | E2E testing |
| `@types/node` | `^20.12.12` | Types do Node.js |
| `@types/react` | `^18.3.3` | Types do React |
| `@types/react-dom` | `^18.3.0` | Types do React DOM |
| `@typescript-eslint/eslint-plugin` | `^8.71.0` | ESLint TypeScript |
| `@typescript-eslint/parser` | `^8.71.0` | Parser TypeScript |
| `autoprefixer` | `^10.4.19` | Prefixos CSS automáticos |
| `eslint` | `^8.57.0` | Linter |
| `eslint-config-next` | `14.2.3` | Config ESLint Next.js |
| `postcss` | `^8.4.38` | PostCSS |
| `tailwindcss` | `^3.4.3` | Tailwind CSS |
| `typescript` | `^5.4.5` | TypeScript |

### Scripts
- `dev` → `next dev -p 3001`
- `build` → `next build`
- `start` → `next start`
- `lint` → `next lint`
- `typecheck` → `tsc --noEmit`

---

## ⚡ apps/api (`@zapti/api`) - Fastify

### Dependencies
| Pacote | Versão | Descrição |
|--------|--------|-----------|
| `@fastify/cookie` | `^9.3.1` | Cookie parsing |
| `@fastify/cors` | `^9.0.1` | CORS support |
| `@fastify/helmet` | `^11.1.1` | Security headers |
| `@fastify/jwt` | `^8.0.0` | JWT authentication |
| `@fastify/multipart` | `^8.2.0` | Multipart/form-data |
| `@fastify/rate-limit` | `^9.1.0` | Rate limiting |
| `@fastify/swagger` | `^8.14.0` | OpenAPI/Swagger |
| `@fastify/swagger-ui` | `^3.0.0` | Swagger UI |
| `@fastify/websocket` | `^8.3.1` | WebSocket support |
| `@prisma/client` | `^5.12.0` | Prisma client |
| `@zapti/database` | `file:../../packages/database` | Database package local |
| `@zapti/shared` | `file:../../packages/shared` | Shared package local |
| `bcryptjs` | `^2.4.3` | Hash de senhas |
| `crypto` | `^1.0.1` | Crypto nativo (polyfill) |
| `dotenv` | `^18.0.4` | Variáveis de ambiente |
| `fastify` | `^4.26.2` | Framework web rápido |
| `fastify-healthcheck` | `^4.4.0` | Health check endpoint |
| `fastify-metrics` | `^10.0.4` | Métricas Prometheus |
| `ioredis` | `^5.3.2` | Redis client |
| `otplib` | `^12.0.1` | TOTP/2FA |
| `pino-pretty` | `^11.0.0` | Pretty logging |
| `socket.io` | `^4.7.5` | WebSocket real-time |
| `zod` | `^3.22.4` | Validação de schemas |
| `zod-to-json-schema` | `^3.25.2` | Zod → JSON Schema |

### DevDependencies
| Pacote | Versão | Descrição |
|--------|--------|-----------|
| `@types/bcryptjs` | `^2.4.6` | Types do bcryptjs |
| `@types/node` | `^20.12.0` | Types do Node.js |
| `@typescript-eslint/eslint-plugin` | `^8.71.0` | ESLint TypeScript |
| `@typescript-eslint/parser` | `^8.71.0` | Parser TypeScript |
| `eslint` | `^8.57.1` | Linter |
| `prisma` | `^5.12.0` | Prisma CLI |
| `tsx` | `^4.7.1` | Executor TypeScript |
| `typescript` | `^5.4.3` | TypeScript |
| `vitest` | `^1.4.0` | Test framework |

### Scripts
- `dev` → `tsx watch src/index.ts`
- `build` → `tsc`
- `start` → `node dist/index.js`
- `lint` → `eslint src --ext .ts`
- `test` → `vitest run`
- `test:watch` → `vitest`
- `db:generate` → `prisma generate`
- `db:push` → `prisma db push`
- `db:migrate` → `prisma migrate dev`
- `db:studio` → `prisma studio`
- `db:seed` → `tsx prisma/seed.ts`

---

## 📋 Resumo por Categoria

### Bancos de Dados / ORM
- `@prisma/client` ^5.14.0
- `prisma` ^5.14.0

### Autenticação / Segurança
- `bcryptjs` ^2.4.3
- `jsonwebtoken` ^9.0.2
- `otplib` ^12.0.1 (2FA/TOTP)
- `@fastify/jwt` ^8.0.0
- `@fastify/helmet` ^11.1.1
- `@fastify/rate-limit` ^9.1.0
- `@fastify/cookie` ^9.3.1

### Validação
- `zod` ^3.23.8 (em todos os pacotes)
- `zod-to-json-schema` ^3.25.2

### UI / Frontend (Radix UI - 20+ componentes)
- `@radix-ui/react-*` (alert-dialog, avatar, checkbox, collapsible, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, slot, switch, tabs, toast, tooltip)
- `@tanstack/react-query` ^5.104.0
- `@tanstack/react-table` ^8.17.3
- `lucide-react` ^0.378.0
- `sonner` ^1.7.4
- `next-themes` ^0.4.6
- `class-variance-authority` ^0.7.1
- `clsx` ^2.1.1
- `tailwind-merge` ^2.6.1

### Backend / API
- `fastify` ^4.26.2
- `@fastify/cors` ^9.0.1
- `@fastify/multipart` ^8.2.0
- `@fastify/swagger` ^8.14.0
- `@fastify/swagger-ui` ^3.0.0
- `@fastify/websocket` ^8.3.1
- `fastify-healthcheck` ^4.4.0
- `fastify-metrics` ^10.0.4
- `socket.io` ^4.7.5
- `ioredis` ^5.3.2

### Utilitários
- `axios` ^1.7.2
- `crypto-js` ^4.2.0
- `date-fns` ^3.6.0
- `nodemailer` ^6.9.14
- `dotenv` ^18.0.4
- `pino-pretty` ^11.0.0

### Ferramentas de Desenvolvimento
- `typescript` ^5.4.5
- `tsx` ^4.11.0
- `eslint` ^8.57.x
- `@typescript-eslint/*` ^8.71.0
- `vitest` ^1.4.0
- `@playwright/test` ^1.63.0
- `tailwindcss` ^3.4.3
- `postcss` ^8.4.38
- `autoprefixer` ^10.4.19
- `concurrently` ^8.2.2
- `rimraf` ^5.0.7

---

## 🚀 Como Instalar Tudo

```bash
# Na raiz do projeto
cd d:\zapti
npm install

# Isso instala tudo via workspaces
# Inclui: root + packages/shared + packages/database + apps/api + apps/web
```

---

## 📝 Notas Importantes

1. **Node.js**: Requer versão **>= 20.0.0**
2. **Package Manager**: **npm@10.8.1** (definido no `packageManager`)
3. **Prisma**: Versão **5.14.0** no database, **5.12.0** na api (pode causar mismatch - alinhar se necessário)
4. **Zod**: Versão **3.23.8** na maioria, **3.22.4** na api (pequena diferença)
5. **TypeScript**: **5.4.5** no root/web/shared/database, **5.4.3** na api

---

*Gerado automaticamente em 2026-10-04*