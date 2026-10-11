# Decisão 005 — Autenticação JWT com Resolução de Tenant

**Data:** 2026-10-11  
**Status:** Confirmado

## Contexto

O ZapTI é **multi-tenant**: cada tenant (empresa) tem seus próprios usuários, contatos, conversas, tickets, etc. O isolamento é feito via `tenantId` em todos os models Prisma.

## Fluxo de Autenticação

### 1. Login
```
POST /api/auth/login
Body: { email, password }
→ Verifica credenciais no banco (User + Tenant)
→ Gera Access Token (JWT, 7d) + Refresh Token (opaco, salvo no BD)
→ Retorna: { accessToken, refreshToken, user: { id, email, name, role, tenantId } }
```

### 2. Access Token (JWT)
**Payload:**
```json
{
  "sub": "user-id",
  "tenantId": "tenant-id",
  "role": "ADMIN|AGENT",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Assinatura:** HS256 com `JWT_SECRET` (mín. 32 chars)

### 3. Requisições Autenticadas
```
Authorization: Bearer <access-token>
```

### 4. Plugin de Auth (`apps/api/src/plugins/auth.ts`)

```typescript
// Decorator no FastifyRequest
declare module 'fastify' {
  interface FastifyRequest {
    user: { id: string; tenantId: string; role: UserRole }
    tenant: Tenant
  }
}

// Plugin registra:
fastify.decorateRequest('user', null)
fastify.decorateRequest('tenant', null)

// Hook onRequest:
fastify.addHook('onRequest', async (request) => {
  const token = request.headers.authorization?.replace('Bearer ', '')
  if (!token) return
  
  const payload = verifyToken(token) // @zapti/shared/auth
  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  const tenant = await prisma.tenant.findUnique({ where: { id: payload.tenantId } })
  
  request.user = { id: user.id, tenantId: user.tenantId, role: user.role }
  request.tenant = tenant
})
```

### 5. Uso nas Rotas
```typescript
// Protegida (exige login)
fastify.get('/api/conversations', { preHandler: [fastify.authenticate] }, async (request) => {
  const conversations = await prisma.conversation.findMany({
    where: { tenantId: request.user.tenantId } // Isolamento automático
  })
  return conversations
})

// Pública (health, login, register)
fastify.get('/health', async () => ({ status: 'ok' }))
```

## Refresh Token

- Token opaco (random string) salvo na tabela `RefreshToken`
- Expiração: 30 dias
- Rotação: novo refresh token a cada uso (opcional)
- Revogação: delete no logout ou expiração

## Password Reset

1. `POST /api/auth/forgot-password` → Gera token, salva em `PasswordReset`, envia email
2. `POST /api/auth/reset-password` → Valida token, atualiza senha, invalida token

## Multi-Tenant: Resolução de Tenant

**Ordem de prioridade:**
1. JWT payload (`request.user.tenantId`) — Principal
2. Header `x-tenant-id` — Para testes/admin (se permitido)
3. Subdomínio (futuro) — `tenant1.zapti.local`

**Regra:** Todas as queries Prisma **devem** filtrar por `tenantId`:
```typescript
// ✅ Correto
const tickets = await prisma.ticket.findMany({
  where: { tenantId: request.user.tenantId, status: 'OPEN' }
})

// ❌ Incorreto — vaza dados entre tenants
const tickets = await prisma.ticket.findMany({
  where: { status: 'OPEN' }
})
```

## Variáveis de Ambiente

```bash
JWT_SECRET=sua-chave-super-secreta-com-pelo-menos-32-caracteres
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
```

## Problemas Conhecidos (confirmar)

- Token expiration handling no Web (interceptor axios para 401 → refresh)
- Rate limit no login (brute force protection)
- Audit log no login/logout/falha

## Referências

- `apps/api/src/plugins/auth.ts`
- `apps/api/src/routes/auth.ts`
- `packages/shared/src/auth/index.ts`
- [Arquitetura](../Arquitetura.md) — Seção Auth