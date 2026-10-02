# ZapTI — Pacote de prompts para o Claude Code

Este pacote transforma as 96 respostas da entrevista em uma especificação dividida em partes pequenas, para o Claude Code (com Nemotron) construir o ZapTI **uma fase por vez**, sem se perder e sem inventar requisitos.

## Conteúdo
- `CLAUDE.md`: regras de trabalho. O Claude Code lê automaticamente da raiz do projeto.
- `docs/spec/`: a especificação, em arquivos numerados (00 a 09).
- `prompts/fase-1.md` … `fase-7.md`: um prompt por fase.

## Como usar
1. Crie a pasta do projeto (ex.: `zapti/`) e copie **todo** este conteúdo para a raiz dela (`CLAUDE.md`, `docs/`, `prompts/`).
2. Abra o Claude Code nessa pasta.
3. Cole o conteúdo de `prompts/fase-1.md` e deixe trabalhar.
4. Ao fim da fase, confira os critérios de aceite em `docs/spec/09-fases-e-criterios.md` e o relatório que ele entregar.
5. Só então cole o `prompts/fase-2.md`, e assim por diante.

## Dicas para rodar com o Nemotron
- Se a sessão ficar longa e o modelo começar a se repetir ou esquecer regras, encerre e abra outra. Peça: "Leia `CLAUDE.md` e `docs/PROGRESSO.md` e continue de onde parou."
- Se ele inventar algo que não está na especificação, aponte o arquivo e o item e peça para corrigir.
- Fases grandes (3, 5 e 7) podem ser divididas: peça "faça só os módulos X e Y agora".

## Pontos que você pode querer ajustar (estão em `docs/spec/00-visao-geral.md`)
1. Superadmin da instalação × empresas independentes.
2. Limites de arquivo e armazenamento: as opções existem, mas o padrão é "sem limite".
3. Chamadas de voz/vídeo e Status: dependem do que a Evolution API/WhatsApp permitem de verdade.
4. Risco de banimento do número por usar API não oficial, principalmente em mensagens em massa.
