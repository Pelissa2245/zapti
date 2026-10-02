# 07 — Interface, personalização, idiomas, notificações e app

## Personalização visual (100% pela interface gráfica, sem código)
- [ ] O admin personaliza: cores, fontes, tamanhos, espaçamentos, ícones, logo, favicon, nome exibido, layout, sidebar, cabeçalho, bolhas de mensagem (cores de enviadas/recebidas), bordas e arredondamentos, animações, densidade, tema claro/escuro.
- [ ] **Presets de tema** completos (ex.: Padrão, Dark, WhatsApp-like, Empresa A): aplicar com um clique ou editar elemento por elemento; salvar novos.
- [ ] Cada **empresa** tem sua própria aparência (multi-marca).
- [ ] Cada **usuário** tem preferências próprias: claro/escuro, tamanho da interface, densidade das conversas, posição/visibilidade de painéis, sons, notificações. Isso não afeta os outros usuários.
- [ ] Sem CSS/código exigido do admin.

## Idiomas (i18n)
- [ ] Multi-idioma desde o início: português (base), inglês, espanhol, francês, alemão, italiano, chinês, japonês. Arquitetura pronta para novos idiomas.
- [ ] **Idioma por usuário**; o da empresa é o padrão para novos usuários.
- [ ] Troca **em tempo real**, sem recarregar. Traduções em arquivos, atualizáveis sem mexer no código principal.

## Fuso horário
- [ ] Por empresa e por usuário. Afeta horários, automações, SLA, logs, agendamentos e relatórios.

## Notificações
- [ ] **Push** (Web Push) e som no navegador, configuráveis por usuário: nova mensagem, novo ticket, ticket atribuído, nova mensagem em ticket que atende, menção, WhatsApp desconectado, backup concluído/falhou, erro do sistema, atualização disponível, e e-mail.
- [ ] **Central de notificações** dentro do ZapTI: marcar como lida, filtrar, abrir o item relacionado.

## Celular e app
- [ ] Interface **responsiva** e **PWA** (instalável, push, responder, gerenciar tickets, configurações — praticamente tudo do PC).
- [ ] **APK Android** gerado a partir do mesmo código web, sem manter uma segunda implementação (ex.: Capacitor ou TWA). Push e funcionalidades devem funcionar no app. App para outras plataformas só se for viável.

## Qualidade de UI
- [ ] Acessibilidade básica (teclado, contraste, leitores de tela).
- [ ] Nenhum texto fixo: tudo passa pelo i18n.
