# Decisão 004 — Shared Package como ESM com Exports Nomeados

**Data:** 2026-10-11  
**Status:** Confirmado

## Contexto

Código compartilhado entre `apps/api` (Fastify/Node) e `apps/web` (Next.js/React) precisa ser:
- Type-safe
- Tree-shakeable
- Funcionar em ambos ambientes (Node + Edge/Next.js)
- Versionado independentemente

## Decisão

**Criar `@zapti/shared` como package ESM puro com `exports` nomeado no `package.json`.**

```json
// packages/shared/package.json
{
  "name": "@zapti/shared",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./config": "./dist/config/index.js",
    "./auth": "./dist/auth/index.js",
    "./types": "./dist/types/index.js",
    "./validation": "./dist/validation/index.js",
    "./constants": "./dist/constants/index.js",
    "./email": "./dist/email/index.js",
    "./notification": "./dist/notification/index.js",
    "./utils": "./dist/utils/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  }
}
```

## Estrutura de Módulos

```
packages/shared/src/
├── index.ts              # Barrel export (re-exporta tudo)
├── config/index.ts       # Zod env schema + config()
├── auth/index.ts         # JWT, bcrypt helpers
├── types/index.ts        # Types TypeScript compartilhados
├── validation/index.ts   # Zod schemas para API
├── constants/index.ts    # Enums, constants
├── email/index.ts        # Nodemailer wrapper
├── notification/index.ts # Error notifications (ex: sendErrorNotification)
└── utils/index.ts        # Helpers gerais
```

## Consumo nos Apps

```typescript
// apps/api/src/index.ts
import { config } from '@zapti/shared/config';
import { authPlugin } from './plugins/auth'; // usa @zapti/shared/auth internamente

// apps/web/src/lib/api.ts
import { validateMessage } from '@zapti/shared/validation';
import { MessageType } from '@zapti/shared/constants';
```

## Build Order

```
1. packages/shared    → tsc (gera dist/)
2. packages/database  → prisma generate + tsc
3. apps/api           → tsc (depende de @zapti/shared + @zapti/database)
4. apps/web           → next build (depende de @zapti/shared)
```

## TypeScript Config (shared)

```json
// packages/shared/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Alternativas Consideradas

| Opção | Prós | Contras |
|-------|------|---------|
| CommonJS (`module: commonjs`) | Compatibilidade ampla | Não tree-shakeable, não funciona bem no Next.js 13+ |
| **ESM puro com exports** (escolhida) | Moderno, tree-shakeable, Next.js compatible | Requer `type: module`, Node 18+ |
| Monorepo tools (Turborepo, Nx) | Cache, task orchestration | Overhead, config extra |
| Git submodules | Isolamento total | DX ruim, sync manual |
| Copiar arquivos | Zero config | Duplicação, drift |

## Consequências

**Positivas:**
- Single source of truth para config, auth, types, validation
- Tree-shaking: apps importam só o que usam
- TypeScript types compartilhados (zero drift)
- Versionamento semver independente
- Funciona em Node (API) e Edge/Next.js (Web)

**Negativas/Riscos:**
- Build order obrigatório (shared → database → api → web)
- `packages/shared/dist` deve ser committado ou gerado em CI
- Next.js precisa de `transpilePackages: ['@zapti/shared']` no `next.config.js`
- Mudanças breaking no shared exigem bump de versão + update nos apps

**Neutras:**
- `packages/shared` não tem `prisma` — apenas types/utils
- `packages/database` é package separado (gera Prisma Client)

## Próximos Passos

- [ ] Confirmar `next.config.js` tem `transpilePackages: ['@zapti/shared']`
- [ ] Verificar `apps/api/tsconfig.json` resolve `@zapti/shared/*` via paths
- [ ] Build order no Dockerfile da API: copiar shared, buildar, depois api
- [ ] Adicionar script `build:all` no root package.json
- [ ] Documentar versionamento (semver) do @zapti/shared

## Referências

- `packages/shared/src/index.ts` (barrel export)
- `packages/shared/package.json` (exports map)
- `apps/api/src/index.ts` (imports @zapti/shared/config)
- Handoff.md risco #3 (sendErrorNotification removida)