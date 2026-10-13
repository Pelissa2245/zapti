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
  - "API Service (Docker)"
source_location: ""
graphify_node_id: "api_service"
---

# API Service (Docker)

**Arquivo:** `docker-compose.prod.yml`
**Comunidade:** [[_COMMUNITY_Architecture-ADRs-&-Module-Map]]

## Depende de
- [[postgres_service-PostgreSQL-Service]] — shares_data_with [INFERRED]
- [[redis_service-Redis-Service]] — shares_data_with [INFERRED]
- [[evolution_service-Evolution-API-Service]] — calls [INFERRED]

## Usado por
- [[docker_compose_prod_yml-docker-compose.prod.yml]] — implements
- [[adr_002_docker_compose-ADR-002-Docker-Compose-Local]] — references
- [[evolution_service-Evolution-API-Service]] — calls [INFERRED]
