# 10 — Fases de desenvolvimento e critérios de aceite

Trabalhe **uma fase por vez**. Só avance quando os critérios de aceite da fase estiverem cumpridos, testes passando e `docs/PROGRESSO.md` atualizado. O usuário confere cada fase antes da próxima.

## Fase 1 — Base do projeto, Docker, login e usuários
Specs: 00, 01 (base), 06, 07 (i18n/tema básico)
- Estrutura do repositório, Docker Compose, banco, Redis, `.env.example`, `install.sh`.
- Multi-tenant (isolamento), superadmin, empresas, usuários, equipes, permissões + presets.
- Login, lembrar de mim, sessões/dispositivos, 2FA TOTP, esqueci a senha (SMTP configurável com teste e preset Gmail), proteção contra força bruta.
- Auditoria básica e Danger Zone. i18n e temas básicos.
**Aceite:** `docker compose up` sobe tudo; assistente de primeiro acesso cria superadmin/empresa/admin; dois tenants criados provam isolamento em testes; login com 2FA e reset de senha por e-mail funcionam; sessões podem ser revogadas.

## Fase 2 — Conexão com a Evolution API e importação
Specs: 02, 01 (sandbox)
- Gerenciar instâncias pelo ZapTI (criar, QR Code, reconectar, excluir, status, webhooks).
- Receber eventos, sincronizar contatos e histórico, importação em segundo plano com progresso, sem duplicar.
- Relatório de viabilidade: o que a Evolution suporta (edição de contatos, histórico, chamadas, Status). Preencher `docs/LIMITACOES.md`.
**Aceite:** conectar um número real por QR, ver contatos e histórico importados com progresso; reiniciar/pausar a importação não duplica; reconexão automática funciona.

## Fase 3 — Caixa de entrada, chat e mídias
Specs: 02, 03 (caixa), 05 (contatos, tags, busca), 07
- Layout de três colunas, conversas, filtros, busca global, envio/recebimento de todos os tipos de mensagem, gravador de áudio, respostas/reações/edição/exclusão, grupos, Status, notificações (push, som, central).
- Contatos (CRUD sincronizado), tags, campos personalizados, bloqueio, duplicados.
**Aceite:** conversar com outro número usando todos os tipos de mídia suportados; buscar uma mensagem antiga e abri-la na posição correta; push funciona com o navegador fechado.

## Fase 4 — Tickets, filas e atendentes
Specs: 03
- Criar ticket pela conversa (mensagem automática do BOT), campos completos, categorias/prioridades, atribuição (manual, automática, pelo BOT), transferência, equipes, filas e estratégias, presença, SLA, notas internas, chat interno, CSAT, "Minhas/Todas as conversas".
**Aceite:** fluxo completo Conversa → Ticket → Atendimento → Resolver → volta à caixa; SLA vence e dispara alerta; transferência para usuário e equipe registra histórico.

## Fase 5 — BOT, fluxos e automações
Specs: 04, 08 (respostas rápidas/templates), 03 (roteamento)
- Regras do BOT (por contato, contatos novos, tags, grupos com `@`), editor visual de fluxogramas e todos os blocos, automações por evento, horários/feriados, simulação, sandbox.
**Aceite:** montar pelo editor um fluxo de contato novo com menu → tag → ticket → transferir; BOT não responde em ticket nem depois que um humano assume; em grupo só responde quando marcado, e `@all` não aciona.

## Fase 6 — Mensagens em massa, templates, relatórios, integrações e API
Specs: 08, 05 (spam, import/export, LGPD), 03 (relatórios, agenda)
- Templates, agendadas/recorrentes, massa com anti-banimento, spam, importação/exportação, relatórios com exportação CSV/Excel/PDF, agendamento de atendimentos, integrações, API com chaves e webhooks.
**Aceite:** disparo em massa em sandbox e real com limites; relatório exportado nos 3 formatos; chamada da API autenticada cria ticket; webhook chega assinado.

## Fase 7 — Manutenção, atualização, monitoramento, personalização final e documentação
Specs: 01, 07, 08 (backup/restauração), 06 (logs)
- Backup modular e restauração seletiva/completa, retenção de logs, gerenciamento de mídia e armazenamento, saúde/monitoramento e alertas, modo de manutenção, atualizações pelo GitHub com rollback (serviço atualizador separado), personalização visual completa e presets, APK Android, testes no GitHub Actions, **documentação completa em `/docs`**.
**Aceite:** backup → apagar categoria → restauração seletiva recupera; atualização simulada com falha faz rollback; modo de manutenção bloqueia usuários comuns; documentação publicada cobre todos os tópicos listados em `01`.
