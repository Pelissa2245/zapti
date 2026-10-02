# 02 — WhatsApp / Evolution API

## Instâncias (multi-número)
- [ ] Várias instâncias por empresa. Tela **WhatsApp → Instâncias** com status (conectado, desconectado, conectando), número e nome.
- [ ] Tudo pelo ZapTI, sem abrir o painel da Evolution: criar instância, conectar por QR Code, desconectar, reconectar, excluir, ver status, configurar webhooks.
- [ ] Sessão persistente: abrir a URL de qualquer PC já mostra o WhatsApp conectado.
- [ ] Filtro por número conectado na caixa de entrada.
- [ ] Reconexão automática e alerta quando desconectar.

## Sincronização
- [ ] **Bidirecional** de contatos e mensagens: WhatsApp → ZapTI sempre; ZapTI → WhatsApp (criar/editar/excluir contato) **quando a Evolution suportar**. O que não for suportado fica só no ZapTI, com aviso claro.
- [ ] Sem duplicar contatos ou mensagens em reconexões. Tratar conflitos.
- [ ] Sincronizar o **histórico existente** do WhatsApp: conversas, mensagens, mídias (quando disponíveis), datas, remetente, respostas/citações e status de leitura, e mantê-lo sincronizado depois.

## Importação inicial (primeira conexão)
- [ ] Importação **em segundo plano**: o painel já é usável enquanto carrega.
- [ ] Barra de progresso (contatos, conversas, mensagens, mídias).
- [ ] Prioridade: contatos e conversas recentes → histórico antigo → mídias.
- [ ] Pausar, retomar e reiniciar sem duplicar.
- [ ] Relatório final: o que foi importado e o que não foi possível trazer.

## Mensagens e interação (tudo que for tecnicamente suportado)
- [ ] Texto, imagens, vídeos, áudios, documentos/PDF, qualquer tipo de arquivo, localização, contatos, figurinhas.
- [ ] Visualizar e reproduzir tudo no painel, como no WhatsApp Web.
- [ ] Responder/citar, encaminhar, reagir, editar e apagar mensagens, mensagens temporárias, mensagens fixadas/favoritas quando suportado.
- [ ] Indicador "digitando", status enviado/entregue/lido, arrastar e soltar arquivos.
- [ ] **Gravador de áudio** integrado (gravar, ouvir antes, cancelar, enviar).
- [ ] Sem limites próprios de tipo/tamanho de arquivo (ver `00-visao-geral.md`).

## Grupos
- [ ] Ver, criar, entrar/sair, adicionar/remover participantes, alterar nome/foto/descrição, administrar participantes, enviar e receber.
- [ ] Transformar conversa de grupo em ticket.
- [ ] **BOT em grupos com configuração separada** (ver `04-bot-automacoes.md`).

## Status/Stories
- [ ] Ver, publicar (texto, foto, vídeo), excluir, ver quem visualizou, reagir/responder, sincronizar. **Tudo o que for tecnicamente possível.**

## Chamadas de voz e vídeo (opcional, condicionado à viabilidade)
Antes de implementar, **pesquise e reporte** o que a Evolution API/Baileys realmente permite. É comum que o WhatsApp não Web/Baileys não suporte atender/iniciar chamadas por WebRTC. Se não for possível, implementar o mínimo honesto:
- [ ] Detectar e registrar chamadas recebidas/perdidas na conversa, com notificação.
- [ ] Rejeitar automaticamente com mensagem configurável (opção).
- [ ] Botão que avisa o usuário para retornar pelo celular.
Se for possível de verdade, incluir:
- [ ] Atender/iniciar chamada de voz e vídeo pelo navegador.
- [ ] Silenciar microfone, ligar/desligar câmera, escolher microfone e alto-falante, compartilhar tela, mostrar duração, encerrar.
- [ ] **Gravação manual**: botão Iniciar/Parar gravação. Ao finalizar, o usuário **baixa a gravação no próprio PC** (gravação no navegador). Não criar regras automáticas de gravação.
Registrar o resultado em `docs/LIMITACOES.md`.

## Bloqueio de contatos
- [ ] Bloquear/desbloquear contato pelo ZapTI (e no WhatsApp quando suportado), com comportamento configurável para BOT e automações.
