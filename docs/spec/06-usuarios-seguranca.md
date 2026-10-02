# 06 — Usuários, permissões, segurança, auditoria

## Multi-tenant
- [ ] Cada empresa é um tenant **completamente isolado**: usuários, números, contatos, conversas, tickets, mídia, configurações, fluxos, aparência, logs, backups, buscas, filas, cache e eventos em tempo real.
- [ ] Superadmin da instalação cria/suspende/exclui empresas manualmente (sem cadastro público, planos ou cobrança). Ver ambiguidade resolvida em `00-visao-geral.md`.
- [ ] Testes automatizados que provem que uma empresa nunca vê dados de outra.

## Usuários e permissões
- [ ] Multiusuário. Permissões **granulares e personalizáveis** + **presets**: Administrador, Supervisor, Atendente, Somente leitura (editáveis; permitir criar funções novas).
- [ ] Permissões de exemplo: ver conversas (minhas/todas), responder, criar ticket, resolver ticket, ver tickets de outros, gerenciar contatos, configurar BOT/fluxos, adicionar números, criar usuários, alterar configurações, ver relatórios, exclusão permanente, ver logs, gerenciar backup, etc.
- [ ] Admin cria/edita/remove usuários e controla sessões, 2FA e políticas.
- [ ] Usuário pertence a uma ou várias equipes.

## Autenticação
- [ ] Usuário + senha; "Lembrar de mim"; sessões persistentes.
- [ ] **Esqueci minha senha**: link seguro de redefinição enviado pelo **SMTP configurado**.
- [ ] Admin pode **forçar redefinição de senha** e **encerrar todas as sessões** de um usuário.
- [ ] **2FA TOTP** (Google Authenticator, Authy etc.) com códigos de recuperação; pode ser obrigatório por empresa ou por usuário.
- [ ] Proteção contra força bruta: rate limiting por IP/conta, bloqueio temporário, registro das tentativas, admin vê e desbloqueia.

## Sessões e dispositivos
- [ ] Tela de dispositivos conectados (navegador, sistema, online/último acesso) com **revogar acesso**.
- [ ] O próprio usuário pode **encerrar todas as outras sessões**.
- [ ] **Limite de dispositivos simultâneos por usuário, definido pelo Supervisor**. Ao atingir, novas sessões são bloqueadas até uma ser encerrada.

## SMTP
- [ ] Totalmente configurável pelo painel: host, porta, usuário, senha, criptografia (TLS/STARTTLS), remetente. **Botão "Testar conexão"**. **Presets** (incluindo Gmail).

## Auditoria e logs
- [ ] Registro de ações importantes (quem, o quê, quando, IP, empresa, entidade): permissões, tickets, mensagens do BOT, transferências, backups, restaurações, exclusões, logins, alterações de configuração.
- [ ] Buscar/filtrar por usuário, ação, data, empresa, ticket, contato.
- [ ] **Retenção configurável por tempo** (7 dias, 30, 90, 1 ano, indefinido, personalizado). Exclusão/arquivamento automático do que passar do período.

## Danger Zone (estilo GitHub)
- [ ] Ações destrutivas ficam separadas numa **Danger Zone**: excluir contato/conversa, empresa, número, usuário, fluxo; restaurar/apagar backup etc.
- [ ] Para confirmar, o usuário **digita o nome/identificador** da ação/entidade. Mostrar o impacto antes. Respeita permissões e audita.
