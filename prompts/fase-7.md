# Prompt — Fase 7: Operação, atualização e documentação

Leia primeiro `CLAUDE.md` e depois **somente** estes arquivos: `docs/spec/01-arquitetura-e-deploy.md`, `07-interface-e-experiencia.md`, `08-mensagens-produtividade-integracoes.md`, `06-usuarios-seguranca.md`, além da Fase 7 em `docs/spec/09-fases-e-criterios.md`.

Objetivo: backup e restauração modulares, retenção, gerenciamento de armazenamento e mídia, monitoramento e alertas, modo de manutenção, atualização pelo GitHub com rollback (com serviço atualizador separado, sem dar acesso irrestrito ao Docker socket ao container principal), personalização visual final, APK Android, GitHub Actions e a documentação completa em `/docs`.

## Como trabalhar
1. Antes de programar, escreva um plano curto (módulos e ordem) e me mostre. Não peça permissão para cada detalhe, só para dúvidas reais.
2. Implemente um módulo por vez, com testes e documentação em `docs/site/`.
3. Marque no `docs/PROGRESSO.md` cada item entregue (use os checklists da especificação).
4. Não implemente nada de outras fases. Se precisar de algo delas, crie só a interface mínima e anote.
5. Ao terminar: rode os testes, suba com `docker compose up`, confira **cada critério de aceite** da fase e me entregue um relatório com: feito, testado, pendente, limitações encontradas.
6. Termine com um resumo final do projeto e uma lista do que ficou pendente ou limitado.
