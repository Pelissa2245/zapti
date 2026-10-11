# Decisão 004 — Pacote Shared como ESM com Exports Nomeados

**Data:** 2026-10-11  
**Status:** Confirmado

## Contexto

O pacote `packages/shared` é um módulo ESM (ECMAScript Modules) que exporta funcionalidades compartilhadas entre API e Web via **named exports** organizados por domínio.

## Estrutura de Exports

```typescript
// packages/shared/src/index.ts — Barrel file principal
export * from './config'
export * from './auth'
export * from './email'
export * from './notification'
export * from './utils'
export * from './constants'
export * from './validation'
export * from './types'
```

### Domínios Disponíveis

| Import Path | Conteúdo Principal |
|-------------|-------------------|
| `@zapti/shared/config` | Zod-validated env config (cached singleton) |
| `@zapti/shared/auth` | JWT verify/sign, password hash/verify |
| `@zapti/shared/email` | Nodemailer wrapper (sendEmail) |
| `@zapti/shared/notification` | NotificationService (email, push, in-app) |
| `@zapti/shared/utils` | Common utilities (slugify, formatDate, etc.) |
| `@zapti/shared/constants` | HTTP_STATUS, ERROR_CODES, enums compartilhados |
| `@zapti/shared/validation` | Zod schemas para validação (user, tenant, etc.) |
| `@zapti/shared/types` | TypeScript types compartilhados (User, Tenant, etc.) |

## Configuração TypeScript

```json
// packages/shared/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Package.json

```json
{
  "name": "@zapti/shared",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./config": "./dist/config/index.js",
    "./auth": "./dist/auth/index.js",
    "./email": "./dist/email/index.js",
    "./notification": "./dist/notification/index.js",
    "./utils": "./dist/utils/index.js",
    "./constants": "./dist/constants/index.js",
    "./validation": "./dist/validation/index.js",
    "./types": "./dist/types/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "lint": "eslint src --ext .ts"
  }
}
```

## Uso na API e Web

### API (Fastify)
```typescript
// apps/api/src/plugins/auth.ts
import { verifyToken, hashPassword } from '@zapti/shared/auth'
import { config } from '@zapti/shared/config'
```

### Web (Next.js)
```typescript
// apps/web/src/lib/api.ts
import { config } from '@zapti/shared/config'
// Path alias configurado no tsconfig.json da web:
// "@zapti/shared/*": "../../packages/shared/src/*"
```

## Build Order

**Obrigatório:** Build do `shared` **antes** de `api` e `web`
```bash
npm run build --workspace=packages/shared
npm run build --workspace=packages/database
npm run build --workspace=apps/api
npm run build --workspace=apps/web
```

Ou simplesmente: `npm run build` na raiz (workspaces na ordem correta via dependencies).

## Problema Conhecido (confirmar)

- **Função `sendErrorNotification` removida** de `notification/index.ts` — verificar se há imports quebrados na API ou Web
- TypeScript errors em alguns arquivos do shared — rodar `npm run typecheck --workspace=packages/shared`

## Próximos Passos

- [ ] Verificar build limpo do shared (`npm run build --workspace=packages/shared`)
- [ ] Confirmar que `sendErrorNotification` não é importada em nenhum lugar
- [ ] Rodar testes do shared (`npm run test --workspace=packages/shared`)

## Referências

- `packages/shared/src/index.ts`
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- [Arquitetura](../Arquitetura.md) — Seção Shared Package