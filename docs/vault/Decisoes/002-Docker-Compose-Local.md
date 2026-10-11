# Decisão 002 — Deploy Apenas Local via Docker Compose

**Data:** 2026-10-11  
**Status:** Confirmado

## Contexto

O projeto não tem infraestrutura de cloud (AWS, GCP, Azure, Vercel, Railway, etc.). O deploy deve funcionar **apenas localmente** na máquina do desenvolvedor via `docker-compose.prod.yml`.

## Decisão

**Usar `docker-compose.prod.yml` como única forma de deploy/produção local.**

- 5 serviços orquestrados: `postgres`, `redis`, `evolution`, `api`, `web`
- Imagens buildadas localmente: `zapti-new-api`, `zapti-new-web`
- Volumes persistentes para dados (postgres_data, redis_data, evolution_media, evolution_instances)
- Rede bridge isolada `zapti-network`
- Healthchecks em todos os serviços com dependências condicionais

## Composição dos Serviços

| Serviço | Imagem | Porta | Healthcheck | Depende de |
|---------|--------|-------|-------------|------------|
| postgres | postgres:16-alpine | 5432 | pg_isready | - |
| redis | redis:7-alpine | 6379 | redis-cli ping | - |
| evolution | evoapicloud/evolution-api:latest | 8080 | wget / | postgres, redis |
| api | build: apps/api/Dockerfile | 3000 | wget /health | postgres, redis, evolution |
| web | build: apps/web/Dockerfile | 3001 | (Next.js) | api |

## Variáveis de Ambiente (docker-compose)

```yaml
# API
JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key-change-in-production}
EVOLUTION_API_URL: http://evolution:8080
EVOLUTION_API_KEY: ${EVOLUTION_API_KEY:-zapti-evolution-key-change-in-production}
EVOLUTION_INSTANCE_NAME: ${EVOLUTION_INSTANCE_NAME:-zapti}
DATABASE_URL: postgresql://postgres:postgres@postgres:5432/zapti?schema=public
REDIS_URL: redis://redis:6379

# Evolution API
DATABASE_CONNECTION_URI: postgresql://postgres:postgres@postgres:5432/zapti?schema=evolution
REDIS_URI: redis://redis:6379
REDIS_PREFIX: evolution
WEBHOOK_URL: http://api:3000/webhooks/evolution
```

## Alternativas Consideradas

| Opção | Prós | Contras |
|-------|------|---------|
| Kubernetes local (kind, k3d) | Produção-like | Overkill, complexidade |
| Docker Swarm | Nativo Docker | Depreciado, pouca adoção |
| **docker-compose** (escolhida) | Simples, nativo, versão única | Não é orquestração produção real |
| Bare metal (systemd, pm2) | Sem containers | Inconsistência de ambiente |

## Consequências

**Positivas:**
- Ambiente idêntico para todos desenvolvedores
- Fácil `up`/`down`/`logs`/`restart`
- Volumes persistem dados entre restarts
- Evolution API roda localmente (sem custo cloud)

**Negativas/Riscos:**
- Não escala horizontalmente
- Single point of failure (máquina única)
- Backups manuais (pg_dump, redis-dump)
- Evolution API consome recursos significativos (RAM/CPU)

**Neutras:**
- Requer Docker Desktop / Docker Engine + Compose plugin
- Porta 8080, 3000, 3001, 5432, 6379 devem estar livres

## Próximos Passos

- [ ] Validar `docker compose -f docker-compose.prod.yml build api web`
- [ ] Subir stack: `docker compose -f docker-compose.prod.yml up -d`
- [ ] Confirmar healthchecks passam para todos os 5 serviços
- [ ] Testar Evolution API: criar instância, QR code, receber webhook
- [ ] Documentar procedimento de backup/restore

## Referências

- `docker-compose.prod.yml` (161 linhas)
- Handoff.md meta #1 e #2
- `apps/api/Dockerfile`, `apps/web/Dockerfile`