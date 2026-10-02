# 01 — Arquitetura, deploy e operação técnica

## Stack
Escolher a melhor combinação e registrar a justificativa em `docs/DECISOES.md`. Sugestão-base:
- TypeScript no backend e no frontend; frontend React/Next.js como **PWA**.
- **PostgreSQL** (dados, com busca de texto completo nas mensagens) + **Redis** (cache, filas, pub/sub).
- **WebSocket** para tempo real.
- Fila de jobs para importação, envios em massa, agendamentos, backups, SLA e webhooks.
- Armazenamento de mídia em disco, em caminho configurável, com camada de abstração para outros backends no futuro.

## Docker (obrigatório)
- Tudo roda em **Docker Compose**: web, api, worker, banco, redis, Evolution API e (opcional) monitoramento.
- Dados persistentes em volumes fora dos containers (`/data/zapti/media`, `/data/zapti/backups`, `/data/zapti/logs`, caminhos configuráveis).
- Pronto para rodar atrás de proxy reverso com **HTTPS e WebSocket**, sem depender de um proxy específico (Nginx Proxy Manager, Caddy, Traefik etc.). Documentar cabeçalhos e exemplos.
- Domínio: `zapti.matheusserver.dpdns.org`; documentação em `/docs`.

## Instalação e primeiro acesso
- [ ] Script `install.sh`: verifica Docker/Compose, gera senhas e chaves aleatórias, cria `.env`, sobe tudo.
- [ ] `.env.example` completo, com cada variável explicada e sem valores reais.
- [ ] **Assistente de primeiro acesso** no navegador: cria o superadmin, cria a primeira empresa e seu admin, configura SMTP, conecta o WhatsApp (QR Code), escolhe idioma e tema.
- [ ] **Modo sandbox**: BOT, automações e envios em massa não enviam nada de verdade, apenas simulam e registram o que enviariam.
- [ ] **Dados de demonstração** opcionais (contatos, conversas e tickets fictícios).
- [ ] Testes automatizados (backend e fluxos principais) rodando no **GitHub Actions**.

## Segredos e configurações sensíveis
- [ ] Nada de senha ou chave no código. Tudo em `.env` / Docker secrets.
- [ ] Chaves configuradas pelo painel (SMTP, integrações, tokens) ficam **criptografadas no banco** e aparecem **mascaradas** na tela (`••••1234`).
- [ ] Nenhum segredo em logs, exportações ou backups sem criptografia. `.gitignore` já configurado.
- [ ] **Rotação de chaves** pelo painel, sem reinstalar.
- [ ] Senhas com hash seguro (argon2 ou bcrypt).

## Atualização pelo painel (fonte: releases do GitHub)
- [ ] Verificar novas releases, mostrar versão atual/disponível e **changelog**.
- [ ] Atualizar com um botão: backup automático antes, progresso e logs em tempo real, **rollback automático** se falhar.
- [ ] Atualização automática opcional.
- [ ] Segurança: NÃO dar ao container principal acesso irrestrito ao Docker socket. Usar um **serviço atualizador separado** (`zapti-updater`) com permissões mínimas, comunicação autenticada e só executando ações permitidas.
- [ ] Reiniciar serviços individualmente, ver logs dos serviços, importar/exportar configurações.

## Monitoramento e saúde
- [ ] Painel **Status/Health** em tempo real: ZapTI, banco, Evolution API, instâncias do WhatsApp, Redis/filas, armazenamento, WebSocket, notificações, CPU/RAM/disco.
- [ ] Health checks automáticos e **alertas** (e-mail via SMTP, notificação no painel e, opcionalmente, WhatsApp para um número de confiança) quando: WhatsApp desconectar, banco/Redis/storage falharem, disco quase cheio, backup falhar, muitos erros seguidos.
- [ ] Endpoint `/health` para ferramentas externas (ex.: Uptime Kuma).
- [ ] Métricas técnicas opcionais (Prometheus/Grafana), **desativadas por padrão**.

## Modo de manutenção
- [ ] Usuários comuns veem tela de manutenção com mensagem personalizada; administradores continuam entrando.
- [ ] Início e fim programáveis.

## Documentação e open-source
- [ ] Repositório público. Escolher e registrar uma licença adequada (perguntar ao usuário).
- [ ] Documentação web oficial em `/docs` (com busca, categorias e exemplos), versionada no repositório em `docs/site/`.
- [ ] Deve cobrir: instalação, Docker, configuração, Evolution API, SMTP, backups, atualizações, desenvolvimento, API, fluxos do BOT, segurança e solução de problemas.
- [ ] README claro para quem chega no GitHub.
