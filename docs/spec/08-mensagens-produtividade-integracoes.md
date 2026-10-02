# 08 — Produtividade, envios, backup, integrações e API

## Respostas rápidas
- [ ] Biblioteca de mensagens prontas acionadas por atalho (`/ola`, `/pix`) ou botão no campo de mensagem, com **variáveis** (`{{nome}}`, `{{ticket}}`...). Usáveis por atendentes e pelo BOT.

## Templates de mensagem
- [ ] Nome e categoria, texto, variáveis, anexos, idioma, **permissão de quais usuários podem usar**, uso manual/BOT/automações/envio em massa, **estatísticas de uso**.

## Mensagens agendadas e recorrentes
- [ ] Agendar mensagem (contato, data, hora) e recorrência. Pode ser feita manualmente, pelo BOT ou por automação. Respeita fuso.

## Mensagens em massa
- [ ] Enviar para vários contatos com filtros: tags, equipe, lista de contatos, com/sem ticket, número do WhatsApp, importação de lista.
- [ ] Agendar o disparo.
- [ ] **Proteção anti-banimento**: ritmo configurável, intervalos aleatórios, limite diário por número, pausa automática em caso de erros, avisos claros ao usuário, modo sandbox/simulação.
- [ ] Relatório do envio (enviadas, falhas, respondidas).

## Backup
- [ ] **Modular e separado**, em arquivos compactados **salvos no próprio servidor**: banco, conversas, mídia, contatos, usuários, tickets, fluxos do BOT, aparência, configurações e dados da Evolution.
- [ ] Cada categoria com agendamento, retenção e restauração próprios. Backup automático agendado e manual.
- [ ] Preparado para destinos externos no futuro.

## Restauração
- [ ] **Seletiva** (escolher categorias) ou **completa**.
- [ ] Mostrar exatamente o que será alterado antes; não sobrescrever sem confirmação (Danger Zone); registrar na auditoria.

## Integrações
- [ ] Área de **Integrações** no painel, preparada para novos conectores: Google Calendar, Google Drive, Discord, Telegram, APIs REST genéricas, webhooks. Tudo configurável pelo painel, sem editar `.env`.

## API própria e webhooks
- [ ] API REST documentada (OpenAPI): criar/editar contatos, consultar conversas, enviar mensagens, criar/atualizar/consultar tickets, adicionar tags, acionar fluxos do BOT.
- [ ] Autenticação por **API Key/token** (criadas e revogadas no painel, escopo por empresa e por permissão, guardadas com hash).
- [ ] **Webhooks de saída**: eventos configuráveis, assinatura HMAC, tentativas com retry e log de entregas.
- [ ] A API é um recurso: o ZapTI funciona normalmente sem usá-la.
