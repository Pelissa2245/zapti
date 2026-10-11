# Decisão 003 — Integração com Evolution API

**Data:** 2026-10-11  
**Status:** Em validação (confirmar)

## Contexto

A Evolution API (`evoapicloud/evolution-api:latest`) é um wrapper open-source para WhatsApp Business API. Ela gerencia instâncias WhatsApp, QR codes, webhooks, envio/recebimento de mensagens, mídias, contatos, grupos, etc.

## Configuração no Docker Compose

```yaml
evolution:
  image: evoapicloud/evolution-api:latest
  environment:
    # Database próprio (schema evolution no mesmo Postgres)
    DATABASE_PROVIDER: postgresql
    DATABASE_CONNECTION_URI: postgresql://postgres:postgres@postgres:5432/zapti?schema=evolution
    # Redis próprio (prefixo evolution)
    REDIS_ENABLED: "true"
    REDIS_URI: redis://redis:6379
    REDIS_PREFIX: "evolution"
    # Auth
    AUTHENTICATION_API_KEY: ${EVOLUTION_API_KEY}
    # Webhook para API do ZapTI
    WHATSAPP_WEBHOOK_ENABLED: "true"
    WHATSAPP_WEBHOOK_URL: "http://api:3000/webhooks/evolution"
    WHATSAPP_WEBHOOK_EVENTS: "messages.upsert,messages.update,contacts.upsert,chats.upsert,instance.update,connection.update,qrcode.updated"
```

## Integração no ZapTI

### API (`apps/api`)

**Serviço WhatsApp** — `src/services/whatsapp.ts`
- `sendMessage()` — Envia mensagem via Evolution API
- `createInstance()` — Cria instância WhatsApp
- `getQRCode()` — Obtém QR code para pareamento
- `setWebhook()` — Configura webhook na instância
- Handlers: `processEvolutionWebhook()`, `processWhatsAppWebhook()`

**Rota Webhook** — `src/routes/webhooks.ts`
- `POST /webhooks/evolution` — Recebe eventos da Evolution
- Valida assinatura (header `apikey`)
- Processa eventos: mensagem nova, atualização status, contato, chat, instância, conexão, QR code

### Eventos Suportados

| Evento | Descrição | Handler |
|--------|-----------|---------|
| `messages.upsert` | Nova mensagem recebida | Cria Message, atualiza Conversation/Contact |
| `messages.update` | Status da mensagem (sent/delivered/read/failed) | Atualiza Message.status |
| `contacts.upsert` | Contato novo/atualizado | Cria/atualiza Contact |
| `chats.upsert` | Chat/nova conversa | Cria/atualiza Conversation |
| `instance.update` | Instância atualizada | Log/auditoria |
| `connection.update` | Status conexão (open/close/connecting) | Atualiza status instância |
| `qrcode.updated` | QR code novo | Dispara evento para Web exibir |

## Fluxo de Pareamento (QR Code)

1. Web chama `POST /api/whatsapp/instance` → API cria instância na Evolution
2. API chama `GET /instance/connect/{instanceName}` na Evolution → Retorna QR code (base64 ou URL)
3. Web exibe QR code → Usuário escaneia com WhatsApp
4. Evolution detecta conexão → Webhook `connection.update` + `qrcode.updated`
5. API atualiza status → Web remove QR code, mostra "Conectado"

## Fluxo de Mensagem Entrante

```
WhatsApp User → Evolution API → Webhook POST /webhooks/evolution
  → API valida apikey
  → Processa payload (message.upsert)
  → Salva Message (INBOUND) + atualiza Conversation + Contact
  → Emite WebSocket para Web (real-time)
  → Verifica AutomationTrigger.MESSAGE_RECEIVED → Executa automações se houver
```

## Fluxo de Mensagem Saiente

```
Web (UI) → API POST /api/messages
  → Valida tenant + permissão (user.role)
  → Chama Evolution API POST /message/sendText (ou sendMedia, etc.)
  → Evolution retorna messageId
  → Salva Message (OUTBOUND, SENT, evolutionMessageId)
  → Evolution entrega → Webhook messages.update → Status DELIVERED → READ
```

## Configuração Necessária

### Variáveis de Ambiente
```bash
EVOLUTION_API_URL=http://localhost:8080  # ou http://evolution:8080 no Docker
EVOLUTION_API_KEY=zapti-evolution-key-change-in-production
EVOLUTION_INSTANCE_NAME=zapti
WHATSAPP_WEBHOOK_VERIFY_TOKEN=webhook-verify-token
```

### Endpoints Evolution API Usados

| Método | Endpoint | Uso |
|--------|----------|-----|
| POST | `/instance/create` | Criar instância |
| GET | `/instance/connect/{name}` | Obter QR code |
| POST | `/instance/setWebhook/{name}` | Configurar webhook |
| POST | `/message/sendText` | Enviar texto |
| POST | `/message/sendMedia` | Enviar mídia |
| GET | `/instance/fetchInstances` | Listar instâncias |
| DELETE | `/instance/delete/{name}` | Deletar instância |

## Problemas Conhecidos (confirmar)

1. **Webhook não chega** — Evolution no Docker usa `http://api:3000` (nome do serviço), mas se API não estiver saudável, falha
2. **QR code não aparece** — Evolution pode não gerar QR code se instância já existir ou houver erro de conexão
3. **Mídias** — Evolution salva mídias em `/media` (volume `evolution_media`); API precisa acessar para download/reenvio
4. **Schema evolution separado** — Evolution usa schema `evolution` no mesmo Postgres; não conflita com `public` do ZapTI
5. **Redis prefixo** — Evolution usa prefixo `evolution:` no Redis; ZapTI usa sem prefixo ou outro

## Próximos Passos

- [ ] Subir Evolution: `docker compose up -d evolution`
- [ ] Testar: `curl http://localhost:8080/`
- [ ] Criar instância via API ou direto na Evolution
- [ ] Obter QR code e testar pareamento WhatsApp real
- [ ] Verificar webhook chegando na API (logs)
- [ ] Testar envio/recebimento de mensagem
- [ ] Documentar troubleshooting comum

## Referências

- [Arquitetura](../Arquitetura.md) — Seção Evolution API
- [Visão Geral](../Visao-Geral.md) — URLs de acesso
- Evolution API Docs: https://doc.evolution-api.com/
- `apps/api/src/services/whatsapp.ts`
- `apps/api/src/routes/webhooks.ts`