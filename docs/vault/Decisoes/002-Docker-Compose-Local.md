# Decisão 002 — Deploy Apenas Local via Docker Compose

**Data:** 2026-10-11  
**Status:** Confirmado

## Contexto

O projeto foi desenhado para rodar **apenas localmente** via `docker-compose.prod.yml`. Não há configuração para cloud (AWS, GCP, Azure, Vercel, Railway, etc.).

## Decisão

**Manter deploy apenas local via Docker Compose.**

### Serviços no `docker-compose.prod.yml`

| Serviço | Imagem | Porta Exposta | Descrição |
|---------|--------|---------------|-----------|
| postgres | postgres:16-alpine | 5432 | Banco principal (schema `public`) + Evolution (schema `evolution`) |
| redis | redis:7-alpine | 6379 | Cache, sessões, filas |
| evolution | evoapicloud/evolution-api:latest | 8080 | WhatsApp Business API wrapper |
| api | Build local (`apps/api/Dockerfile`) | 3000 | Fastify API |
| web | Build local (`apps/web/Dockerfile`) | 3001 | Next.js Web |

### Volumes Persistentes
- `postgres_data` — Dados PostgreSQL
- `redis_data` — Dados Redis
- `evolution_media` — Mídias WhatsApp (imagens, vídeos, áudios, PDFs)
- `evolution_instances` — Dados de instâncias Evolution (QR codes, credenciais)

### Network
- `zapti-network` — Bridge network interna (serviços se comunicam por nome: `postgres`, `redis`, `evolution`, `api`)

### Healthchecks
Todos os serviços têm healthcheck configurado; `api` e `web` dependem dos healthchecks de `postgres`, `redis` e `evolution`.

## Variáveis de Ambiente Sensíveis

Definidas no `docker-compose.prod.yml` com fallback via `${VAR:-default}`:
- `EVOLUTION_API_KEY` — Chave de autenticação da Evolution API
- `JWT_SECRET` — Segredo para assinar JWTs (mín. 32 chars)
- `WHATSAPP_BUSINESS_API_TOKEN` — Token WhatsApp Business (opcional)
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` — Token verificação webhook

## Por Que Não Cloud?

- Simplicidade: desenvolvimento e teste local sem custos
- Evolution API requer instância WhatsApp real (QR code) — mais fácil local
- Dados sensíveis (conversas WhatsApp) ficam na máquina do desenvolvedor
- Projeto em fase inicial; cloud pode ser avaliado depois

## Próximos Passos

- [ ] Validar que `docker compose -f docker-compose.prod.yml up -d` sobe todos os serviços saudáveis
- [ ] Testar Evolution API: criar instância, obter QR code, conectar WhatsApp
- [ ] Testar webhook Evolution → API
- [ ] Documentar procedimento de backup/restore dos volumes

## Referências

- [Visão Geral](../Visao-Geral.md) — Seção "Como Rodar Localmente"
- [Arquitetura](../Arquitetura.md) — Seção Docker Compose
- `docker-compose.prod.yml` na raiz