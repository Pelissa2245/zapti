# API Routes — Contrato ZapTI

> Referência rápida de todos endpoints da API. Baseado em `apps/api/src/routes/`.

---

## Autenticação (`/auth`)

| Método | Rota | Descrição | Auth | Body/Query |
|--------|------|-----------|------|------------|
| POST | `/auth/login` | Login email/password | ❌ | `{ email, password, tenantSlug? }` |
| POST | `/auth/refresh` | Refresh access token | ❌ | `{ refreshToken }` ou cookie |
| POST | `/auth/logout` | Logout (revoga refresh) | ✅ | — |
| GET | `/auth/me` | User atual + tenant | ✅ | — |
| POST | `/auth/2fa/enable` | Ativar 2FA (TOTP) | ✅ | — |
| POST | `/auth/2fa/verify` | Verificar código 2FA | ✅ | `{ code }` |
| POST | `/auth/2fa/disable` | Desativar 2FA | ✅ | `{ password }` |

**Resposta Login:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id", "email", "name", "role", "tenantId" },
  "tenant": { "id", "name", "slug", "plan" }
}
```

---

## Tenants (`/tenants`) — SUPER_ADMIN only

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| GET | `/tenants` | Listar todos (paginado) | query: page, limit, search |
| GET | `/tenants/:id` | Detalhes tenant | — |
| POST | `/tenants` | Criar tenant | `{ name, slug, plan, settings? }` |
| PATCH | `/tenants/:id` | Atualizar tenant | Partial tenant |
| DELETE | `/tenants/:id` | Deletar tenant | — |
| GET | `/tenants/:id/stats` | Estatísticas tenant | — |

---

## Usuários (`/users`) — ADMIN+

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| GET | `/users` | Listar usuários do tenant | query: page, limit, role, search |
| GET | `/users/:id` | Detalhes usuário | — |
| POST | `/users` | Convidar usuário | `{ email, role, name? }` |
| PATCH | `/users/:id` | Atualizar usuário | `{ name?, role?, isActive? }` |
| DELETE | `/users/:id` | Remover usuário | — |
| POST | `/users/:id/resend-invite` | Reenviar convite | — |
| POST | `/users/:id/reset-password` | Reset senha (admin) | `{ newPassword }` |

---

## Contatos (`/contacts`)

| Método | Rota | Descrição | Body/Query |
|--------|------|-----------|------------|
| GET | `/contacts` | Listar contatos | query: page, limit, search, tags, groupId |
| GET | `/contacts/:id` | Detalhes contato | — |
| POST | `/contacts` | Criar contato | `{ name, phone, email?, tags?, groupIds? }` |
| PATCH | `/contacts/:id` | Atualizar contato | Partial contact |
| DELETE | `/contacts/:id` | Deletar contato | — |
| POST | `/contacts/import` | Importar CSV/Excel | multipart/form-data |
| GET | `/contacts/:id/conversations` | Conversas do contato | — |
| POST | `/contacts/:id/tags` | Adicionar tag | `{ tag }` |
| DELETE | `/contacts/:id/tags/:tag` | Remover tag | — |

---

## Conversas (`/conversations`)

| Método | Rota | Descrição | Body/Query |
|--------|------|-----------|------------|
| GET | `/conversations` | Listar conversas | query: page, limit, status, priority, assignedToId, search |
| GET | `/conversations/:id` | Detalhes + mensagens | query: messageLimit, beforeId |
| PATCH | `/conversations/:id` | Atualizar conversa | `{ status?, priority?, assignedToId?, tags? }` |
| POST | `/conversations/:id/assign` | Atribuir agente | `{ userId }` |
| POST | `/conversations/:id/status` | Mudar status | `{ status }` |
| POST | `/conversations/:id/close` | Fechar conversa | — |
| POST | `/conversations/:id/reopen` | Reabrir conversa | — |
| GET | `/conversations/:id/messages` | Mensagens paginadas | query: limit, beforeId, afterId |
| POST | `/conversations/:id/messages` | Enviar mensagem (outbound) | `{ content, type?, mediaUrl?, mediaType? }` |
| POST | `/conversations/:id/read` | Marcar como lida | `{ messageId? }` |

---

## Mensagens (`/messages`)

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| GET | `/messages` | Listar mensagens (global) | query: conversationId, contactId, type, direction, dateFrom, dateTo |
| GET | `/messages/:id` | Detalhes mensagem | — |
| POST | `/messages` | Enviar mensagem | `{ conversationId, content, type?, mediaUrl?, mediaType? }` |
| GET | `/messages/:id/status` | Status entrega/leitura | — |

---

## Tickets (`/tickets`)

| Método | Rota | Descrição | Body/Query |
|--------|------|-----------|------------|
| GET | `/tickets` | Listar tickets | query: page, limit, status, priority, assignedToId, search |
| GET | `/tickets/:id` | Detalhes + comentários | — |
| POST | `/tickets` | Criar ticket | `{ title, description, contactId, conversationId?, priority?, assignedToId?, groupId?, tags? }` |
| PATCH | `/tickets/:id` | Atualizar ticket | Partial ticket |
| POST | `/tickets/:id/assign` | Atribuir agente | `{ userId }` |
| POST | `/tickets/:id/status` | Mudar status | `{ status }` |
| POST | `/tickets/:id/comments` | Adicionar comentário | `{ content, isInternal? }` |
| GET | `/tickets/:id/comments` | Listar comentários | — |
| DELETE | `/tickets/:id` | Deletar ticket | — |

---

## Grupos (`/groups`)

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| GET | `/groups` | Listar grupos | query: page, limit |
| GET | `/groups/:id` | Detalhes + membros | — |
| POST | `/groups` | Criar grupo | `{ name, description?, memberIds? }` |
| PATCH | `/groups/:id` | Atualizar grupo | Partial group |
| POST | `/groups/:id/members` | Adicionar membros | `{ userIds: string[] }` |
| DELETE | `/groups/:id/members/:userId` | Remover membro | — |
| DELETE | `/groups/:id` | Deletar grupo | — |

---

## Campanhas (`/campaigns`)

| Método | Rota | Descrição | Body/Query |
|--------|------|-----------|------------|
| GET | `/campaigns` | Listar campanhas | query: page, limit, status |
| GET | `/campaigns/:id` | Detalhes + logs | — |
| POST | `/campaigns` | Criar campanha | `{ name, message, contactIds, scheduleAt?, templateId? }` |
| PATCH | `/campaigns/:id` | Atualizar campanha | Partial campaign |
| POST | `/campaigns/:id/send` | Disparar campanha | — |
| POST | `/campaigns/:id/cancel` | Cancelar campanha | — |
| GET | `/campaigns/:id/logs` | Logs de envio | query: page, limit, status |

---

## Automações (`/automations`)

| Método | Rota | Descrição | Body/Query |
|--------|------|-----------|------------|
| GET | `/automations` | Listar automações | query: page, limit, isActive, trigger |
| GET | `/automations/:id` | Detalhes automação | — |
| POST | `/automations` | Criar automação | `{ name, description?, trigger, conditions?, actions?, isActive? }` |
| PATCH | `/automations/:id` | Atualizar automação | Partial automation |
| POST | `/automations/:id/toggle` | Ativar/Desativar | — |
| GET | `/automations/:id/executions` | Histórico execuções | query: page, limit, status |
| DELETE | `/automations/:id` | Deletar automação | — |

---

## Webhooks (`/webhooks`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/webhooks/evolution` | Receber eventos Evolution | apikey header |
| GET | `/webhooks/evolution/health` | Healthcheck webhook | ❌ |

**Evolution Webhook Payload:**
```typescript
interface EvolutionWebhookPayload {
  event: 'MESSAGES_UPSERT' | 'CONNECTION_UPDATE' | 'QRCODE_UPDATED';
  instance: string;
  data: any;
  timestamp: number;
}
```

---

## Integrações (`/integrations`)

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| GET | `/integrations` | Listar integrações | query: type, isActive |
| GET | `/integrations/:id` | Detalhes integração | — |
| POST | `/integrations` | Criar integração | `{ type, name, config, isActive? }` |
| PATCH | `/integrations/:id` | Atualizar integração | Partial integration |
| POST | `/integrations/:id/test` | Testar conexão | — |
| DELETE | `/integrations/:id` | Deletar integração | — |

---

## Configurações (`/settings`)

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| GET | `/settings` | Listar settings do tenant | — |
| GET | `/settings/:key` | Obter setting | — |
| PUT | `/settings/:key` | Definir setting | `{ value: any }` |
| DELETE | `/settings/:key` | Deletar setting | — |

---

## Templates WhatsApp (`/templates`)

| Método | Rota | Descrição | Body |
|--------|------|-----------|------|
| GET | `/templates` | Listar templates | query: page, limit, status |
| GET | `/templates/:id` | Detalhes template | — |
| POST | `/templates` | Criar template | `{ name, category, language, components, ... }` |
| PATCH | `/templates/:id` | Atualizar template | Partial template |
| POST | `/templates/:id/submit` | Submeter para aprovação Meta | — |
| DELETE | `/templates/:id` | Deletar template | — |

---

## Auditoria (`/audit`) — ADMIN+

| Método | Rota | Descrição | Query |
|--------|------|-----------|-------|
| GET | `/audit` | Logs de auditoria | page, limit, action, entityType, entityId, userId, dateFrom, dateTo |

---

## Health Checks (`/health`, `/ready`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/health` | Liveness (processo vivo) | ❌ |
| GET | `/ready` | Readiness (DB, Redis, Evolution ok) | ❌ |

**Resposta `/ready`:**
```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "evolution": "ok"
  },
  "timestamp": "2026-10-11T..."
}
```

---

## WebSocket Events

**Conexão:** `ws://localhost:3000/ws?token=<accessToken>`

| Evento (Server → Client) | Payload | Descrição |
|--------------------------|---------|-----------|
| `new:message` | `{ message, conversationId }` | Nova mensagem recebida/enviada |
| `update:conversation` | `{ conversationId, changes }` | Status, prioridade, assignee, tags |
| `new:ticket` | `{ ticket }` | Ticket criado |
| `update:ticket` | `{ ticketId, changes }` | Ticket atualizado |
| `notification` | `{ type, title, message, data? }` | Notificação geral |

| Evento (Client → Server) | Payload | Descrição |
|--------------------------|---------|-----------|
| `subscribe:conversation` | `{ conversationId }` | Entrar na sala da conversa |
| `unsubscribe:conversation` | `{ conversationId }` | Sair da sala |
| `subscribe:tickets` | — | Receber updates de tickets |
| `ping` | — | Keep-alive |

---

## Códigos de Erro Padrão

| Código | HTTP | Descrição |
|--------|------|-----------|
| `UNAUTHORIZED` | 401 | Token inválido/ausente/expirado |
| `FORBIDDEN` | 403 | Role insuficiente / tenant mismatch |
| `NOT_FOUND` | 404 | Recurso não encontrado |
| `VALIDATION_ERROR` | 400 | Body/query inválido (Zod) |
| `CONFLICT` | 409 | Recurso já existe (unique constraint) |
| `RATE_LIMITED` | 429 | Muitas requisições |
| `INTERNAL_ERROR` | 500 | Erro interno não tratado |
| `SERVICE_UNAVAILABLE` | 503 | Dependency down (DB, Redis, Evolution) |

---

## Paginação Padrão

**Query params:** `page=1&limit=20` (max 100)

**Resposta:**
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Filtros Comuns

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `search` | string | Busca textual (nome, email, phone, content) |
| `status` | enum | Filtrar por status (conversation, ticket, campaign) |
| `tags` | string[] | Filtrar por tags (CSV: `tag1,tag2`) |
| `dateFrom` | ISO8601 | Data inicial |
| `dateTo` | ISO8601 | Data final |
| `assignedToId` | string | Filtrar por assignee |
| `groupId` | string | Filtrar por grupo |

---

## Versionamento

- API versionada via header: `Accept: application/vnd.zapti.v1+json`
- Atual: `v1` (implícito se header omitido)
- Breaking changes → nova versão `v2`