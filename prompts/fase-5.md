# Prompt — Fase 5: BOT, fluxos e automações

Leia primeiro `CLAUDE.md` e depois **somente** estes arquivos: `docs/spec/04-bot-automacoes.md`, `03-inbox-tickets-atendimento.md`, `08-mensagens-produtividade-integracoes.md`, além da Fase 5 em `docs/spec/09-fases-e-criterios.md`.

Objetivo: BOT sem IA generativa, editor visual de fluxogramas sem código, regras por contato/tags/contatos novos/grupos, automações por evento, horários e feriados, simulação e modo sandbox. Lembre: em grupos só aciona com `@` do número conectado, e `@all` não aciona.

## Como trabalhar
1. Antes de programar, escreva um plano curto (módulos e ordem) e me mostre. Não peça permissão para cada detalhe, só para dúvidas reais.
2. Implemente um módulo por vez, com testes e documentação em `docs/site/`.
3. Marque no `docs/PROGRESSO.md` cada item entregue (use os checklists da especificação).
4. Não implemente nada de outras fases. Se precisar de algo delas, crie só a interface mínima e anote.
5. Ao terminar: rode os testes, suba com `docker compose up`, confira **cada critério de aceite** da fase e me entregue um relatório com: feito, testado, pendente, limitações encontradas.
6. Termine dizendo qual é o próximo prompt (`prompts/fase-6.md`) e aguarde minha confirmação.
