# Prompt — Fase 4: Tickets, filas e atendentes

Leia primeiro `CLAUDE.md` e depois **somente** estes arquivos: `docs/spec/03-inbox-tickets-atendimento.md`, `06-usuarios-seguranca.md`, além da Fase 4 em `docs/spec/09-fases-e-criterios.md`.

Objetivo: o ciclo de tickets completo, equipes, filas, distribuição, transferência, SLA, notas internas, chat interno e CSAT. A mensagem automática de abertura do ticket deve ser configurável e usar a variável do número do ticket.

## Como trabalhar
1. Antes de programar, escreva um plano curto (módulos e ordem) e me mostre. Não peça permissão para cada detalhe, só para dúvidas reais.
2. Implemente um módulo por vez, com testes e documentação em `docs/site/`.
3. Marque no `docs/PROGRESSO.md` cada item entregue (use os checklists da especificação).
4. Não implemente nada de outras fases. Se precisar de algo delas, crie só a interface mínima e anote.
5. Ao terminar: rode os testes, suba com `docker compose up`, confira **cada critério de aceite** da fase e me entregue um relatório com: feito, testado, pendente, limitações encontradas.
6. Termine dizendo qual é o próximo prompt (`prompts/fase-5.md`) e aguarde minha confirmação.
