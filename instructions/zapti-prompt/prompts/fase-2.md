# Prompt — Fase 2: Evolution API e importação

Leia primeiro `CLAUDE.md` e depois **somente** estes arquivos: `docs/spec/00-visao-geral.md`, `01-arquitetura-e-deploy.md`, `02-whatsapp-evolution.md`, além da Fase 2 em `docs/spec/09-fases-e-criterios.md`.

Objetivo: conectar números reais pela Evolution API, tudo pelo ZapTI, e importar contatos e histórico. **Primeiro** pesquise e reporte o que a Evolution API realmente suporta (histórico antigo, edição de contatos, chamadas, Status) e grave em `docs/LIMITACOES.md`. Só depois implemente.

## Como trabalhar
1. Antes de programar, escreva um plano curto (módulos e ordem) e me mostre. Não peça permissão para cada detalhe, só para dúvidas reais.
2. Implemente um módulo por vez, com testes e documentação em `docs/site/`.
3. Marque no `docs/PROGRESSO.md` cada item entregue (use os checklists da especificação).
4. Não implemente nada de outras fases. Se precisar de algo delas, crie só a interface mínima e anote.
5. Ao terminar: rode os testes, suba com `docker compose up`, confira **cada critério de aceite** da fase e me entregue um relatório com: feito, testado, pendente, limitações encontradas.
6. Termine dizendo qual é o próximo prompt (`prompts/fase-3.md`) e aguarde minha confirmação.
