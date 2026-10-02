# 00 — Visão geral

## O que é
**ZapTI** é um painel web self-hosted, aberto no navegador (ou app instalável), que já abre com o WhatsApp conectado, sem escanear QR Code toda vez. Ele reúne todas as conversas numa **caixa de entrada única**, permite transformar qualquer conversa em **ticket**, tem um **BOT** (sem IA generativa) configurado por fluxogramas visuais, atendimento por múltiplos usuários e equipes, e suporte a várias empresas isoladas na mesma instalação.

- Nome: **ZapTI**
- Domínio planejado: `zapti.matheusserver.dpdns.org` (documentação em `/docs` no mesmo domínio)
- Conexão com o WhatsApp: **Evolution API** (não oficial, baseada em Baileys)
- Projeto **open-source, público no GitHub**, com documentação obrigatória
- Uso inicial: só do dono da instalação. Sem cadastro público, planos, cobrança ou onboarding automático de outras empresas. O multi-tenant existe na arquitetura, e as empresas são criadas manualmente.

## Ideia central (nas palavras do dono)
Atender o WhatsApp pessoal e o Business num só lugar, de qualquer PC (basta abrir a URL do servidor), conectado. Poder adicionar um BOT e controlar exatamente quem o BOT responde.

## Fluxo principal de ticket
`Conversa normal → botão "Criar ticket" no menu da conversa → Ticket #N → atendimento → Resolver → conversa volta para a caixa normal`

Ao criar o ticket, o BOT envia automaticamente ao cliente (texto editável, com variável):
> "Estou criando um ticket {{ticket}} para você, aguarde, por gentileza!"

## Decisões gerais
- **Sem IA generativa no BOT.** O BOT é 100% regras e fluxogramas. Não existe bloco "Perguntar para IA".
- Multi-número: várias instâncias da Evolution API por empresa.
- Multiusuário, com permissões granulares e presets.
- Multi-tenant com isolamento total entre empresas.
- Tudo gerenciável dentro do ZapTI. O usuário nunca precisa abrir o painel da Evolution API nem editar arquivos para operação normal.
- "Tudo que a Evolution API/WhatsApp permitir": para mídia, mensagens, grupos, Status, chamadas etc. Implementar o que for tecnicamente possível e documentar o resto em `docs/LIMITACOES.md`.

## Não-objetivos (não implementar agora)
- Cadastro público de empresas, planos, cobrança, onboarding automático.
- IA generativa no BOT.
- Limite de atendimentos simultâneos por atendente (o usuário respondeu **não**).
- Regras automáticas de gravação de chamadas (só botão manual).
- Limites próprios de tipo/tamanho de arquivo (ver conflito resolvido abaixo).

## Pontos ambíguos e como foram resolvidos (confirme com o usuário se discordar)
1. **Superadmin da instalação × empresas independentes.** O usuário disse que cada empresa é independente, mas que ele cria as empresas manualmente. Assumido: existe um **superadmin da instalação**, que só cria, suspende e exclui empresas e gerencia infraestrutura (Evolution, backup, atualização, saúde). Ele **não lê conversas** das empresas por padrão. Cada empresa tem seus próprios administradores.
2. **Limites de arquivo/armazenamento.** O usuário quer o gerenciamento de limites pelo painel, mas também disse "não tenha limites". Assumido: as opções de limite existem no painel, com valor padrão **"sem limite"**. Só valem os limites do WhatsApp, da Evolution, do navegador e do disco.
3. **Chamadas de voz/vídeo e Status.** Entram como recurso "se for tecnicamente possível". Ver `02-whatsapp-evolution.md`. A IA deve pesquisar a viabilidade real antes e reportar.
4. **Edição/exclusão de contatos no WhatsApp a partir do ZapTI.** Sincronização bidirecional desejada, "quando a Evolution API suportar". O que não for suportado fica só no ZapTI, com aviso claro.

## Riscos a documentar para o usuário
- Evolution/Baileys é não oficial: existe risco de banimento do número, principalmente com mensagens em massa. Implementar limites de envio, intervalos aleatórios e avisos.
- O histórico antigo que o WhatsApp entrega na primeira conexão é limitado. Reportar o que veio e o que não veio.
