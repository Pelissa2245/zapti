# Decisão 003 — Integração com Evolution API

**Data:** 2026-10-11  
**Status:** Confirmado

## Contexto

O ZapTI precisa enviar/receber mensagens WhatsApp. Opções:
- WhatsApp Business API oficial (Meta) — custo, aprovação, limites
- Evolution API (open source, self-hosted) — gratuito, controle total, comunidade ativa

## Decisão

**Integrar com Evolution API (evoapicloud/evolution-api:latest) self-hosted no docker-compose.**

- Evolution API roda como serviço no mesmo docker-compose
- Comunicação via HTTP interno: `http://evolution:8080`
- Webhook da Evolution aponta para `http://api:3000/webhooks/evolution`
- Autenticação compartilhada via `EVOLUTION_API_KEY`
- Instância única por tenant (ou instância compartilhada com multi-tenant no ZapTI)

## Arquitetura da Integração

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Network                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────────┐  │
│  │ Evolution│───►│   API    │───►│     PostgreSQL         │  │
│  │  :8080   │    │  :3000   │    │  schema=public         │  │
│  └──────────┘    └──────────┘    └──────────────────────┘  │
│       │                │                   │                 │
│       │ Webhook        │ Prisma            │ schema=evolution│
│       ▼                ▼                   ▼                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Redis (shared)                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Eventos Processados

| Evento Evolution | Handler | Ação no ZapTI |
|------------------|---------|---------------|
| `MESSAGES_UPSERT` | `handleInboundMessages()` | Criar Contact, Conversation, Message (INBOUND) |
| `CONNECTION_UPDATE` | `handleConnectionUpdate()` | Atualizar status integração (CONNECTED/DISCONNECTED) |
| `QRCODE_UPDATED` | `handleQRCode()` | Salvar QR code para exibição no frontend |

## Endpoints da API (Evolution → ZapTI)

```
POST /webhooks/evolution
Headers:
  apikey: <EVOLUTION_API_KEY>
  content-type: application/json

Body (MESSAGES_UPSERT):
{
  "event": "MESSAGES_UPSERT",
  "instance": "zapti",
  "data": {
    "messages": [
      {
        "key": { "remoteJid": "5511999999999@s.whatsapp.net", "id": "msg_id" },
        "message": { "conversation": "Olá" },
        "messageTimestamp": 1699999999,
        "pushName": "João"
      }
    ]
  }
}
```

## Endpoints da API (ZapTI → Evolution)

```
# Enviar mensagem de texto
POST http://evolution:8080/message/sendText/{instance}
Headers: apikey: <EVOLUTION_API_KEY>
Body: { number: "5511999999999", text: "Resposta do agente" }

# Obter QR Code
GET http://evolution:8080/instance/connect/{instance}
Headers: apikey: <EVOLUTION_API_KEY>

# Status conexão
GET http://evolution:8080/instance/connectionState/{instance}
```

## Configuração Evolution (docker-compose.yml)

```yaml
evolution:
  environment:
    SERVER_TYPE: http
    SERVER_PORT: 8080
    DATABASE_PROVIDER: postgresql
    DATABASE_CONNECTION_URI: "postgresql://postgres:postgres@postgres:5432/zapti?schema=evolution"
    REDIS_ENABLED: "true"
    REDIS_URI: "redis://redis:6379"
    REDIS_PREFIX: "evolution"
    WEBHOOK_URL: "http://api:3000/webhooks/evolution"
    WEBHOOK_EVENTS: "MESSAGES_UPSERT,CONNECTION_UPDATE,QRCODE_UPDATED"
    AUTHENTICATION_API_KEY: "${EVOLUTION_API_KEY}"
    INSTANCE_NAME: "${EVOLUTION_INSTANCE_NAME:-zapti}"
```

## Multi-tenancy na Evolution

**Opção A: Uma instância Evolution por tenant**
- Prós: Isolamento total, QR codes separados
- Contras: Mais recursos, complexidade de gerenciar N instâncias

**Opção B: Instância única compartilhada (atual)**
- Prós: Simples, menos recursos
- Contras: Todos tenants no mesmo número WhatsApp
- **Escolhida para MVP** — tenant isolado no ZapTI via `tenantId`

## Alternativas Consideradas

| Opção | Prós | Contras |
|-------|------|---------|
| WhatsApp Business API (Meta) | Oficial, estável | Custo/conversa, aprovação, limites |
| **Evolution API self-hosted** (escolhida) | Gratuito, controle total, open source | Manutenção própria, menos suporte oficial |
| WhatsApp Web (puppeteer/baileys direto) | Sem dependência | Instável, bloqueios frequentes |
| Z-API / outros gateways | Gerenciado | Custo mensal, vendor lock-in |

## Consequências

**Positivas:**
- Zero custo mensal WhatsApp
- Controle total sobre instância e dados
- Webhooks em tempo real
- Suporte a múltiplos formatos (texto, mídia, localização, etc.)

**Negativas/Riscos:**
- Evolution API pode ter bugs/breaking changes
- Self-hosted = responsável por uptime, updates, segurança
- WhatsApp pode banir número se detectar automação abusiva
- Precisa gerenciar QR code, reconexão, sessão

**Neutras:**
- Schema `evolution` separado no mesmo Postgres
- Redis prefix `evolution` para isolamento de cache

## Próximos Passos

- [ ] Subir Evolution API: `docker compose up -d evolution`
- [ ] Verificar logs: `docker compose logs -f evolution`
- [ ] Acessar `http://localhost:8080` — verificar se sobe
- [ ] Criar instância via API: `POST /instance/create`
- [ ] Obter QR code: `GET /instance/connect/zapti`
- [ ] Escanear QR no WhatsApp mobile
- [ ] Verificar `CONNECTION_UPDATE` → `open`
- [ ] Enviar mensagem teste → webhook chega em `/webhooks/evolution`
- [ ] Processar `MESSAGES_UPSERT` → Message criada no Prisma
- [ ] WebSocket emite `new:message` → frontend recebe

## Referências

- `apps/api/src/routes/webhooks.ts` — endpoint `/webhooks/evolution`
- `apps/api/src/services/integrations.ts` — `processEvolutionWebhook()`
- `docker-compose.prod.yml` — serviço `evolution`
- Evolution API docs: https://doc.evolution-api.com/
- Handoff.md metas #1, #2