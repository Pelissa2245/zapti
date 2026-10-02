# 05 — Contatos, tags, busca, spam e dados

## Contatos
- [ ] Sincronizados com o WhatsApp (ver `02-whatsapp-evolution.md`) e também criados/editados/excluídos no ZapTI.
- [ ] Campos: nome, telefone, foto, e-mail, empresa, tags, observações, **campos personalizados** (criados pelo admin), histórico, tickets.
- [ ] **Detecção e mesclagem de duplicados**: admin escolhe "Mesclar", preservando mensagens, tickets, tags, notas e histórico.
- [ ] **Bloquear/desbloquear**.
- [ ] Mascaramento de telefone/e-mail para usuários sem permissão.

## Tags
- [ ] Criar, editar, excluir; nome e cor; várias por contato/conversa/ticket.
- [ ] Filtrar por tag; usadas em regras do BOT e em automações; adicionar/remover automaticamente por fluxos.

## Busca global
- [ ] Busca em: mensagens (conteúdo), contatos, tickets, usuários, tags, números/instâncias, logs.
- [ ] Ao achar uma mensagem, **abrir direto na conversa/ticket, na posição da mensagem**.
- [ ] Respeita permissões e o isolamento por empresa.

## Detecção de spam
- [ ] Regras configuráveis: muitas mensagens em pouco tempo, número desconhecido com volume alto.
- [ ] Ações: bloqueio automático, quarentena, adicionar tag, mandar para uma fila específica.

## Importação e exportação
- [ ] Importar/exportar, de forma **completa ou seletiva**: contatos (CSV/Excel), tickets, tags, usuários, configurações, fluxos do BOT, dados de uma empresa inteira.

## Privacidade e LGPD
- [ ] Criptografia de dados sensíveis; tokens/API keys criptografados.
- [ ] Exportar todos os dados de um contato.
- [ ] Excluir completamente os dados de um contato.
- [ ] Política de retenção de dados configurável.
- [ ] Ferramentas para atender solicitações de titulares.

## Exclusão
- [ ] Usuários excluem mensagens, arquivos e conversas conforme permissão.
- [ ] Admin tem **exclusão permanente/forçada**. Tudo vai para a auditoria.

## Mídia e armazenamento
- [ ] **Gerenciador central de mídia**: imagens, vídeos, áudios, documentos e arquivos; pesquisar por contato, conversa, ticket, tipo e data; baixar e excluir.
- [ ] Configurável no painel: caminho de armazenamento, limite total, limite por arquivo, limite por empresa, o que fazer ao atingir o limite, retenção automática de mídias antigas. **Todos com padrão "sem limite"** (ver `00-visao-geral.md`).
