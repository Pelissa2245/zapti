# 04 — BOT e automações

**O BOT NÃO usa IA generativa.** É 100% regras e fluxogramas. Não existe bloco "Perguntar para IA".

## Regras de quando o BOT responde
- [ ] Ligar/desligar **por contato**.
- [ ] Regras amplas: responde a todos / só contatos selecionados / só contatos com determinada tag.
- [ ] **Regras específicas para contatos novos** (fluxo próprio para quem nunca falou antes).
- [ ] O BOT **nunca responde em tickets** (configurável).
- [ ] O BOT **para de responder quando um humano assume** a conversa.
- [ ] Contatos bloqueados/quarentena: comportamento configurável.
- [ ] Respeita horário de funcionamento, feriados e exceções.

## BOT em grupos (configuração separada)
- [ ] Regras, fluxos e permissões **independentes** das conversas individuais.
- [ ] Por padrão **não responde** mensagens normais de grupo.
- [ ] Só é acionado quando alguém **menciona com `@` o número/contato do usuário conectado**.
- [ ] **`@all` / `@todos` NÃO aciona o BOT.**

## Editor visual de fluxogramas (arrastar e conectar)
Blocos:
- [ ] 💬 Enviar mensagem (texto, com variáveis)
- [ ] ❓ Perguntar / menu de opções (aguarda resposta, com timeout e opção inválida)
- [ ] 🔀 Condição (contato novo, tag, horário, texto da resposta, campo do contato, dia da semana, etc.)
- [ ] 🏷️ Adicionar/remover tag
- [ ] 🎫 Criar ticket (com categoria, prioridade, responsável)
- [ ] 👤 Transferir para humano (usuário ou equipe) / escolher atendente
- [ ] ⏱️ Esperar X minutos
- [ ] 📎 Enviar arquivo/imagem/áudio
- [ ] 🔗 Chamar API externa (REST) e usar a resposta
- [ ] 📅 Agendar mensagem
- [ ] 🧾 Usar template / resposta rápida
- [ ] 🔚 Encerrar fluxo
Requisitos do editor:
- [ ] Zoom, arrastar, desfazer/refazer, copiar/colar blocos, validação (fluxo sem saída, loop infinito), pré-visualização/simulação sem enviar nada, versionamento e ativar/desativar fluxo.
- [ ] Editor **sem código** para o usuário final.

## Automações gerais (mesmo editor)
Gatilhos e ações por evento:
- [ ] Mensagem recebida; mensagem de contato novo; ticket criado/atribuído/resolvido; ticket sem resposta há X min; SLA prestes a vencer/vencido; tag adicionada/removida; horário programado; WhatsApp desconectou; usuário ficou offline (redistribuir tickets); spam detectado.
- [ ] Ações: enviar mensagem/template, adicionar tag, criar/atualizar ticket, transferir, notificar, chamar webhook/API, agendar, bloquear/quarentena.

## Horário de funcionamento
- [ ] Horários por dia da semana, **feriados e exceções**, por empresa/equipe. Usável em fluxos e automações (ex.: fora do horário, responder mensagem automática e aguardar).

## Modo sandbox
- [ ] Em modo sandbox, nada é enviado de verdade. Registrar o que seria enviado.
