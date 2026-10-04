# ZapTI

ZapTI é uma aplicação self-hosted de atendimento para WhatsApp, com API Fastify, frontend Next.js, PostgreSQL via Prisma e Redis. O repositório contém o código executável do produto — não é apenas um pacote de prompts.

## Estado atual

- **Frontend:** Next.js 14 com login, bootstrap/onboarding, dashboard, termos, privacidade e gestão de tenants.
- **API:** Fastify com autenticação JWT, isolamento por tenant, permissões, contatos, conversas, tickets, automações, flows, auditoria e rotas WhatsApp.
- **WhatsApp:** integração real com **Evolution API** para criar instâncias, solicitar conexão/QR, desconectar e enviar texto ou mídia.
- **Persistência:** PostgreSQL com Prisma; as migrations devem permanecer versionadas no Git.
- **Infraestrutura local:** Docker Compose para PostgreSQL, Redis, API e frontend.
- **Testes:** Vitest; o teste atual cobre o cliente Evolution e o comportamento fail-closed sem credenciais.

## Pré-requisitos

- Node.js 20+ e npm.
- PostgreSQL 16 e Redis 7, ou Docker Compose.
- Uma instância acessível da Evolution API.

## Configuração rápida

```bash
npm ci
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run build
npm test
```

Para desenvolvimento, use os scripts definidos no `package.json` ou execute a API e o frontend em terminais separados. A API escuta em `PORT` (padrão `3000`) e o frontend em `3001`.

### Evolution API

Configure no `.env`:

```dotenv
EVOLUTION_API_URL=http://evolution-api:8080
EVOLUTION_API_KEY=gere-uma-chave-longa-e-aleatoria
WHATSAPP_WEBHOOK_SECRET=gere-outra-chave-separada
```

A API envia a chave no header `apikey` para a Evolution API. O endpoint interno de webhook também exige a mesma `EVOLUTION_API_KEY` em `apikey` ou `x-api-key`. Ele aceita `x-tenant-id`/`x-instance-id` quando fornecidos, ou resolve a instância pelo campo `instance` dos payloads padrão da Evolution API.

O `EVOLUTION_API_URL` deve apontar para uma Evolution API já executando; o `docker-compose.yml` deste repositório injeta as variáveis no container ZapTI, mas não instala automaticamente uma imagem da Evolution API.

## Docker Compose

```bash
docker compose up -d --build
```

O Compose provisiona:

- `postgres` em `5432`;
- `redis` em `6379`;
- `api` em `3000`;
- `web` em `3001`.

Antes de um ambiente público, substitua todos os segredos padrão, restrinja as portas de banco/Redis e configure TLS e um proxy reverso.

## Comandos úteis

| Comando | Função |
|---|---|
| `npm run build` | Compila todos os workspaces e gera o build Next.js |
| `npm test` | Executa os testes Vitest disponíveis |
| `npm run lint` | Executa ESLint nos workspaces |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:migrate` | Aplica migrations em desenvolvimento |
| `npm run db:studio` | Abre o Prisma Studio |

## Estrutura

```text
apps/api/                 API Fastify e integração Evolution
apps/web/                 Frontend Next.js
packages/database/        Schema Prisma, migrations e cliente de banco
packages/shared/          Tipos, autenticação e utilitários compartilhados
docs/spec/                Especificações funcionais e técnicas
docker-compose.yml        Serviços locais
.env.example              Variáveis de ambiente documentadas
```

## Limitações conhecidas

- A instalação da Evolution API e a configuração do webhook são responsabilidades do ambiente de implantação.
- O ambiente atual não registra uma rota de backup: a antiga referência quebrada foi removida para manter a API compilável; o armazenamento de backups do Compose não representa uma rotina de backup implementada.
- O lint passa sem erros, mas ainda emite avisos preexistentes de `any` e variáveis não utilizadas em vários módulos.
- A validação de `docker compose config` precisa ser executada em uma máquina que tenha o binário Docker instalado.
- Recursos dependentes das capacidades do WhatsApp/Evolution API, como voz, vídeo, status e mensagens de template, precisam de validação adicional contra a versão do servidor Evolution usada em produção.

## Segurança operacional

Nunca faça commit de `.env`, tokens, chaves ou dumps de banco. Use chaves longas e distintas para JWT, Evolution API e webhooks. A integração Evolution é intencionalmente **fail-closed**: sem `EVOLUTION_API_URL` e `EVOLUTION_API_KEY`, operações remotas retornam erro de serviço em vez de simular uma conexão.
