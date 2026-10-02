# ZapTI — Regras de trabalho (leia SEMPRE antes de agir)

Você está construindo o **ZapTI**: painel web self-hosted de atendimento via WhatsApp (Evolution API), com caixa de entrada única, tickets, BOT por fluxogramas, multiusuário e multi-empresa.

A especificação completa está em `docs/spec/`. O plano por fases está em `docs/spec/09-fases-e-criterios.md`. Os prompts de cada fase estão em `prompts/`.

## Regras obrigatórias

1. **Não invente requisitos.** Se algo não está na especificação, pergunte ao usuário antes de implementar. Se a especificação for ambígua, anote a dúvida em `docs/DUVIDAS.md` e pergunte.
2. **Trabalhe em passos pequenos.** Uma fase por vez, e dentro dela um módulo por vez. Nunca tente construir o sistema inteiro de uma vez.
3. **Leia só o que precisa.** Cada prompt de fase lista os arquivos de `docs/spec/` relevantes. Leia apenas esses, mais este arquivo.
4. **Mantenha `docs/PROGRESSO.md` atualizado**: o que está pronto, o que está em andamento, o que ficou de fora e por quê. Atualize ao fim de cada módulo.
5. **Seja honesto sobre limites técnicos.** Se a Evolution API, o WhatsApp ou o navegador não permitirem algo (chamadas, Status, edição de contatos, histórico antigo etc.), NÃO finja que funciona. Implemente o que for possível, marque o resto como "não suportado" em `docs/LIMITACOES.md` e siga em frente.
6. **Testes junto com o código.** Todo módulo novo entra com testes automatizados. Não avance de fase com testes falhando.
7. **Documentação junto com o código.** Cada funcionalidade entregue atualiza a documentação em `docs/site/` (será publicada em `/docs`).
8. **Segredos nunca no código.** Use variáveis de ambiente / Docker secrets. Nunca coloque chaves, senhas ou tokens em código, logs, exemplos ou commits. Mantenha `.env.example` atualizado.
9. **Isolamento entre empresas (multi-tenant) é inegociável.** Toda consulta, cache, arquivo, fila, busca, log e evento de WebSocket deve ser filtrado por `tenant_id`. Escreva testes que provem que uma empresa não enxerga dados de outra.
10. **Toda ação sensível gera registro de auditoria** (quem, o quê, quando, IP, empresa).
11. **Nada de código para o usuário final.** Personalização de aparência, fluxos e automações é 100% pela interface gráfica.
12. **Commits pequenos e descritivos**, um por passo lógico. Ao fim de cada fase: rodar testes, subir com `docker compose up`, conferir os critérios de aceite e listar o resultado.
13. **Código e nomes técnicos em inglês; textos de interface via i18n** (português como idioma-base). Nunca deixe texto fixo na interface.
14. **Se travar ou se o contexto ficar grande demais**, pare, atualize `docs/PROGRESSO.md` com o estado exato e diga ao usuário como retomar.

## Stack

O usuário pediu "a melhor" arquitetura. Sugestão-base (pode justificar e mudar, registrando em `docs/DECISOES.md`): TypeScript ponta a ponta, PostgreSQL + Redis, WebSocket, fila de jobs, frontend React/Next.js (PWA), Docker Compose. Detalhes em `docs/spec/01-arquitetura-e-deploy.md`.

## Como responder ao usuário

Português do Brasil. Ao fim de cada fase: resumo curto do que foi feito, o que foi testado, o que ficou pendente e qual é o próximo prompt.
