---
tipo: "code"
caminho: "docker-compose.prod.yml"
comunidade: "Architecture ADRs & Module Map"
community_id: 1
tags:
  - "graphify/code"
  - "graphify/code"
  - "community/Architecture_ADRs___Module_Map"
aliases:
  - "docker-compose.prod.yml"
source_location: ""
graphify_node_id: "docker_compose_prod_yml"
---

# docker-compose.prod.yml

**Arquivo:** `docker-compose.prod.yml`
**Comunidade:** [[_COMMUNITY_Architecture-ADRs-&-Module-Map]]

## Depende de
- [[postgres_service-PostgreSQL-Service]] — implements
- [[redis_service-Redis-Service]] — implements
- [[evolution_service-Evolution-API-Service]] — implements
- [[api_service-API-Service-(Docker)]] — implements
- [[web_service-Web-Service-(Docker)]] — implements

## Usado por
- [[claude_md-CLAUDE.md-(Root)]] — references
- [[adr_002_docker_compose-ADR-002-Docker-Compose-Local]] — implements
