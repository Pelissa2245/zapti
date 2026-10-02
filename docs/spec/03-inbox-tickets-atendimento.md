# 03 — Caixa de entrada, tickets e atendimento

## Layout
Mistura de **WhatsApp Web** (familiaridade) com **Help Desk/CRM** (informação). Três colunas: lista de conversas | chat | painel do contato (nome, telefone, tags, tickets, dados, notas, histórico). Menu lateral com: Conversas, Tickets, Contatos, Grupos, Status, Chat interno, Automação/BOT, Mensagens em massa, Agenda, Relatórios, Mídia, Configurações, Administração.

## Caixa de entrada única
- [ ] Todas as conversas (todos os números, pessoais e business) no mesmo lugar.
- [ ] Filtros: todas, não lidas, favoritas, fixadas, arquivadas, com ticket, BOT ativo, em atendimento humano, por tag, por número conectado, por atendente, status, data e cliente.
- [ ] Busca global (ver `05-contatos-crm-busca.md`).
- [ ] Alternar **"Minhas conversas" / "Todas as conversas"** conforme permissão.
- [ ] **Admin responde qualquer conversa sem "tomar posse"**, mesmo atribuída a outro atendente.
- [ ] Mostrar quem está atendendo cada conversa.

## Tickets
- [ ] Botão no menu da conversa: **Criar ticket**. A conversa vira ticket (estado especial da mesma conversa, sem duplicar histórico).
- [ ] BOT envia a mensagem de abertura (texto editável, com `{{ticket}}`).
- [ ] Campos: número automático, título/assunto, cliente, histórico de mensagens, status (Aberto / Em andamento / Resolvido, extensível), prioridade, categoria, responsável, observações internas, anexos, histórico de alterações, SLA, tags, CSAT.
- [ ] **Resolver** encerra o ticket e a conversa volta para a caixa normal.
- [ ] Categorias e prioridades **personalizáveis** pelo admin (criar, editar, excluir, reordenar). Padrões: Suporte, Financeiro, Vendas, Administrativo; Baixa, Normal, Alta, Urgente.
- [ ] Atribuição: **manual, automática (distribuição) ou sem responsável**. O BOT também pode rotear.
- [ ] **O BOT pode perguntar ao cliente com quem ele quer falar**: lista de usuários do sistema (e/ou equipes), **mostrando todos independente do status**. A escolha atribui o ticket.
- [ ] Ticket em conversa de grupo permitido.

## Transferência
- [ ] Transferir conversa/ticket para: um usuário, uma equipe/setor (o sistema escolhe o atendente) e com **observação** opcional.
- [ ] Registrada no histórico e na auditoria. Mantém histórico, tags, ticket e contexto. Também por BOT/automação.

## Equipes e filas
- [ ] Equipes/setores personalizados. Usuário em uma ou várias equipes.
- [ ] Fila por equipe: conversas aguardando até serem atribuídas.
- [ ] Estratégias de distribuição (configuráveis por equipe/empresa): rodízio, menor número de conversas, primeiro disponível, por habilidade/categoria, manual, pelo BOT.
- [ ] **Sem limite de atendimentos simultâneos** por usuário.

## Status de presença dos usuários
- [ ] Disponível, Ausente, Ocupado, Offline. Visível para admin/supervisor.

## SLA
- [ ] SLA por categoria/prioridade: prazo de primeira resposta e de resolução.
- [ ] Contadores, alerta perto de vencer, marcação de atrasado, **automação ao vencer**. Respeita horário de funcionamento e fuso.

## Pesquisa de satisfação (CSAT)
- [ ] Enviada após encerrar ticket. Modelos configuráveis: nota 1–5, emojis, pergunta aberta, múltiplas perguntas, e modelos diferentes por equipe/categoria. Resultados nos relatórios.

## Notas internas
- [ ] Notas dentro de conversa/ticket, **nunca enviadas pelo WhatsApp**, com menção `@usuário` que gera notificação.

## Chat interno entre usuários
- [ ] Conversas individuais e em grupo, arquivos, menções `@usuário`, notificações, histórico.

## Agendamento de atendimentos
- [ ] Agendar atendimento/reunião com um contato: data, hora, duração, observação, participantes. Cria evento no calendário (Google Calendar via integração) e envia confirmação automática pelo WhatsApp (opcional).

## Relatórios
- [ ] Conversas, mensagens enviadas/recebidas, tickets criados/resolvidos, tempo médio de primeira resposta e de resolução, tickets por atendente/categoria/prioridade, SLA cumprido/estourado, desempenho do BOT, contatos novos, conversas por período, dados por número, CSAT.
- [ ] Filtros por período e demais campos. Exportar **CSV, Excel e PDF**.
