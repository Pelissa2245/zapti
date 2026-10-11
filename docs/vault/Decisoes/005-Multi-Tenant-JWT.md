# Decisão 005 — Autenticação JWT Multi-tenant com Resolução de Tenant

**Data:** 2026-10-11  
**Status:** Confirmado

## Contexto

O ZapTI é multi-tenant: cada request deve saber **quem é o usuário** E **a qual tenant pertence**. O tenant define o escopo de dados (isolamento total).

## Decisão

**JWT contém `tenantId` + `role`; middleware resolve tenant e injeta no request.**

### JWT Payload
```typescript
interface JWTPayload {
  sub: string;        // userId
  email: string;
  role: UserRole;     // ADMIN | SUPER_ADMIN | AGENT | VIEWER
  tenantId: string;   // CRÍTICO: define escopo de dados
  iat?: number;
  exp?: number;
}
```

### Token Strategy
- **Access Token**: 15 min (curto, para limitar exposição)
- **Refresh Token**: 7 dias (httpOnly cookie ou body)
- **Algoritmo**: HS256 (JWT_SECRET min 32 chars)

### Middleware Chain (Fastify)

```typescript
// 1. JWT verify (plugins/auth.ts)
await app.register(jwt, { secret: cfg.JWT_SECRET });
app.addHook('onRequest', async (request) => {
  try {
    const payload = await request.jwtVerify();
    request.user = payload; // { sub, email, role, tenantId }
  } catch {
    // token inválido/expirado → 401
  }
});

// 2. Tenant resolution (plugins/tenant.ts)
app.addHook('onRequest', async (request) => {
  if (!request.user) return;
  
  // SUPER_ADMIN pode acessar qualquer tenant (via header/query)
  // Demais: tenantId vem do token
  const tenantId = request.user.role === 'SUPER_ADMIN'
    ? (request.headers['x-tenant-id'] as string) || request.user.tenantId
    : request.user.tenantId;
  
  // Validar tenant existe e está ativo
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || !tenant.isActive) {
    throw new Error('Tenant not found or inactive');
  }
  
  request.tenant = tenant;
  request.tenantId = tenantId;
});
```

### Uso nos Handlers

```typescript
// Todo handler tem acesso a request.tenantId
app.get('/contacts', async (request, reply) => {
  const contacts = await prisma.contact.findMany({
    where: { tenantId: request.tenantId } // SEMPRE filtrar por tenantId
  });
  return contacts;
});
```

### Login Flow

```
POST /auth/login
Body: { email, password, tenantSlug? }

1. Buscar user por email
2. Verificar passwordHash (bcrypt)
3. Se SUPER_ADMIN e tenantSlug fornecido → validar tenant
4. Gerar accessToken + refreshToken com tenantId correto
5. Retornar tokens + user + tenant
```

### Super Admin Impersonation

SUPER_ADMIN pode atuar em nome de qualquer tenant:
```
Header: x-tenant-id: <tenantId>
```
Middleware valida se tenant existe e user é SUPER_ADMIN.

## Alternativas Consideradas

| Opção | Prós | Contras |
|-------|------|---------|
| JWT com tenantId (escolhida) | Stateless, escalável, simples | Token maior, tenantId não revogável até expirar |
| Session + Redis | Revogação imediata | Stateful, precisa Redis, mais complexo |
| Header `x-tenant-id` em toda request | Flexível | Inseguro (cliente controla), repetitivo |
| Subdomain por tenant (tenant.app.com) | Isolamento visual | DNS complexo, certificado wildcard |

## Consequências

**Positivas:**
- Stateless — não precisa session store
- `tenantId` no token = zero round-trip para resolver tenant
- SUPER_ADMIN pode trocar tenant via header (admin panel)
- Prisma middleware pode usar `request.tenantId` para filtro automático (futuro)

**Negativas/Riscos:**
- Token expira em 15min — se tenant desativado, usuário ainda acessa até expirar
- Refresh token rotation não implementado (risco se vazado)
- `tenantId` no payload = não pode mudar tenant sem novo login (exceto SUPER_ADMIN)
- Precisa validar `tenant.isActive` em toda request (query extra)

**Neutras:**
- `packages/shared/auth` exporta `generateAccessToken`, `verifyToken`, `extractTokenFromHeader`
- `apps/api/src/plugins/auth.ts` registra JWT no Fastify
- `apps/api/src/plugins/tenant.ts` resolve tenant

## Próximos Passos

- [ ] Implementar refresh token rotation (blacklist old, issue new)
- [ ] Adicionar Prisma middleware para filtro automático `tenantId` (soft delete pattern)
- [ ] Rate limit por tenant (não só por IP)
- [ ] Auditar todos handlers usam `request.tenantId` (grep: `prisma.\w+\.findMany\(.*where:`)
- [ ] Testar SUPER_ADMIN impersonation
- [ ] Documentar fluxo de login no onboarding wizard

## Referências

- `packages/shared/src/auth/index.ts` — JWT helpers
- `apps/api/src/plugins/auth.ts` — Fastify JWT plugin
- `apps/api/src/plugins/tenant.ts` — Tenant resolution middleware
- `apps/api/src/routes/auth.ts` — Login/refresh endpoints
- `packages/database/prisma/schema.prisma` — User.model (tenantId, role)
- Handoff.md