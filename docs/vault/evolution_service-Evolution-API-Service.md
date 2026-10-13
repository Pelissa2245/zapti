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
  - "Evolution API Service"
source_location: ""
graphify_node_id: "evolution_service"
---

# Evolution API Service

**Arquivo:** `docker-compose.prod.yml`
**Comunidade:** [[_COMMUNITY_Architecture-ADRs-&-Module-Map]]

## Depende de
- [[postgres_service-PostgreSQL-Service]] — shares_data_with [INFERRED]
- [[redis_service-Redis-Service]] — shares_data_with [INFERRED]
- [[api_service-API-Service-(Docker)]] — calls [INFERRED]

## Usado por
- [[docker_compose_prod_yml-docker-compose.prod.yml]] — implements
- [[adr_002_docker_compose-ADR-002-Docker-Compose-Local]] — references
- [[adr_003_evolution_api-ADR-003-Evolution-API-Integration]] — implements
- [[api_service-API-Service-(Docker)]] — calls [INFERRED]
