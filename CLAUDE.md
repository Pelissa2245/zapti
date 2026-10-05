# ZapTI — Regras de trabalho

> LEIA ESTE ARQUIVO INTEIRO ANTES DE QUALQUER AÇÃO.
> Estas regras são obrigatórias e têm prioridade sobre conveniências de implementação.

Você está construindo o ZapTI: painel web self-hosted de atendimento via WhatsApp (Evolution API), com caixa de entrada única, tickets, BOT por fluxogramas, multiusuário e multiempresa.

- Especificação completa: `docs/spec/`
- Plano por fases: `docs/spec/09-fases-e-criterios.md`
- Prompts de cada fase: `prompts/`

---

## 0. RESUMO DAS REGRAS MAIS IMPORTANTES

1. O código vive **somente** em `D:\ZapTI`. O servidor recebe uma cópia via SSH; nunca se edita código no servidor.
2. Ao terminar qualquer alteração: **commit → push → deploy no servidor via SSH → avisar o usuário para testar**.
3. **Você NÃO cria usuários, NÃO faz login de teste e NÃO testa a aplicação rodando.** Quem testa é o usuário.
4. **Você NÃO mexe no banco de dados** por conta própria. Só executa operação no banco se o usuário pedir explicitamente, e faz apenas o que foi pedido.
5. O reverse proxy / acesso remoto é configurado **pelo usuário**, não por você.
6. Nunca commitar segredos. Nunca trabalhar em outra cópia do projeto.

---

## 1. SERVIDOR DE DEPLOY (SSH)

O ZapTI roda em um servidor próprio na rede local:

| Item | Valor |
|---|---|
| IP do servidor | `192.168.1.193` |
| Usuário SSH | `<PREENCHER: usuário do servidor>` |
| Pasta do projeto no servidor | `<PREENCHER: ex. /opt/zapti>` |
| Autenticação | Chave SSH. **Não pede senha.** |

Se o usuário SSH ou a pasta do servidor ainda estiverem como `<PREENCHER>`, **pergunte ao usuário uma vez**, e peça para ele atualizar esta tabela. Não invente valores.

### Regras de acesso

- Conecte com `ssh <usuario>@192.168.1.193`. Não precisa de senha; se pedir senha, **PARE** e avise o usuário (a chave SSH não está configurada). Não tente adivinhar senha nem criar chaves sem autorização.
- Use o servidor somente para: copiar o projeto, rebuild/recriar containers do ZapTI, ver logs e verificar status.
- Nunca editar código diretamente no servidor. A fonte da verdade é `D:\ZapTI`. Se algo estiver diferente no servidor, o servidor é que está errado.
- Não mexer em outros containers, serviços ou pastas do servidor que não sejam do ZapTI.
- Não configurar nginx/Caddy/Traefik/Cloudflare Tunnel nem nenhum reverse proxy. Isso é responsabilidade do usuário.

### O que copiar

Copie o projeto inteiro de `D:\ZapTI` para a pasta do projeto no servidor, **exceto**:

- `.git/`
- `node_modules/`
- `.next/`, `dist/`, `build/` e outros artefatos de build locais
- `.env` e qualquer arquivo com credenciais (o `.env` do servidor é mantido lá e **nunca é sobrescrito**)
- dumps, logs e arquivos temporários

Use `scp`, `tar` por cima de `ssh` ou `rsync` (se disponível). Não use opções que apaguem dados no destino sem verificar (ex.: `rsync --delete` em pastas de dados/volumes).

### Proteção de dados no servidor

- **Nunca** rodar `docker compose down -v`, `docker volume rm`, `docker system prune` ou qualquer comando que apague volumes (banco, Redis, mídia, sessões WhatsApp).
- Para atualizar use: `docker compose up -d --build` (recria só o necessário, preservando volumes).
- Se `.env.example` ganhou variáveis novas, **avise o usuário** para adicionar no `.env` do servidor. Não escreva segredos por conta própria.

---

## 2. FLUXO OBRIGATÓRIO AO TERMINAR UMA ALTERAÇÃO

Toda vez que você terminar de implementar, corrigir ou alterar algo:

1. **Verificar workspace** (`git rev-parse --show-toplevel` deve ser `D:\ZapTI`).
2. **Verificações automatizadas locais**: testes, lint, typecheck e build (as que o projeto tiver). Testes automatizados **não podem tocar no banco real** (ver seção 3).
3. **Revisar `git status` e `git diff`**: sem segredos, sem arquivos indevidos.
4. **Commit** com mensagem descritiva (ver seção 4).
5. **Push** para o GitHub oficial.
6. **Deploy via SSH** no servidor `192.168.1.193`: copiar o projeto, rebuild/recriar containers do ZapTI.
7. **Verificar o deploy** sem criar dados: `docker compose ps`, logs dos containers sem erros de inicialização, e (se existir) endpoint de health check via `curl`.
8. **Avisar o usuário** que está no ar e **o que ele precisa testar**, em passos claros.

Não diga "deploy concluído" só porque o comando terminou sem erro. Confirme containers `Up` e logs sem falhas.
Se o deploy falhar, informe o erro real e o que tentou; não repita o mesmo comando cegamente.

---

## 3. TESTES E BANCO DE DADOS — REGRA ABSOLUTA

### Quem testa o quê

- **O usuário testa a aplicação rodando no servidor.** Você **não** cria usuário de teste, **não** faz cadastro/login para testar, **não** cria tickets/empresas/dados de teste na aplicação real.
- Quando precisar validar algo na aplicação, diga ao usuário, por exemplo:
  > "Já fiz o deploy. Você precisa testar: 1) abrir X, 2) fazer Y, 3) confirmar se Z acontece."
- Depois do teste, o usuário diz se funcionou ou não. Você corrige a partir do relato dele.

### Banco de dados

- **Você NÃO toca no banco de dados** por iniciativa própria: nada de INSERT, UPDATE, DELETE, seed, reset, TRUNCATE, DROP, nem consultas "só pra ver", no banco do servidor.
- **Exceção única**: se o usuário pedir explicitamente (ex.: "apaga o usuário fulano"), execute **somente aquela operação**, nada além disso. Não aproveite para limpar outras coisas, não "arrume" dados e não mexa em outras tabelas.
- Se durante o trabalho **algum teste seu criar um usuário** ou dado de teste por acidente, remova **somente aquele registro** e avise o usuário. Não mexa em mais nada no banco.
- Testes automatizados (Vitest etc.) devem usar mocks, banco em memória ou banco isolado descartável. **Nunca** apontar testes para o banco do servidor ou para dados reais.
- Alterações estruturais usam **migrations** versionadas no repositório. Ao rodar o deploy, aplicar a migration só quando ela fizer parte da alteração e **avisar o usuário** que ela existe. Nunca usar `prisma migrate reset`, `db push --force-reset` ou equivalentes.
- Evitar sempre: `DROP DATABASE`, `DROP TABLE`, `TRUNCATE`, reset destrutivo.

---

## 4. GIT E GITHUB — COMMIT EM TODA ALTERAÇÃO

O Git oficial está em `D:\ZapTI`. O GitHub é o repositório oficial.

### Antes de trabalhar

```
git rev-parse --show-toplevel
git remote -v
git status
git log -3
```

O Git root deve ser `D:\ZapTI`. Se não for, PARE. Se o remote estiver incorreto, PARE e informe o usuário antes de alterar.

### Em TODA alteração

**Toda vez que houver mudança nos arquivos, faça commit e push**, sem esperar acumular. Cada commit é um passo lógico, pequeno e descritivo.

Formato da mensagem (Conventional Commits, em inglês):

```
tipo: resumo curto no imperativo

- o que mudou
- por que mudou
```

Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`.
Exemplo: `fix: return 503 when Evolution API is not configured`

Fluxo: `git status` → revisar → `git add` (arquivos específicos) → `git commit` → `git push`.

### Nunca commitar

senhas, tokens, API keys, secrets, cookies, `.env` com credenciais, dumps, arquivos temporários, dados pessoais desnecessários, arquivos gerados que não pertencem ao repositório.

### NUNCA

criar outro repositório; trocar o remote sem autorização; fazer push para outro projeto; apagar histórico; usar `git reset --hard` ou `push --force` para esconder problemas; sobrescrever trabalho existente sem verificar.

---

## 5. WORKSPACE OFICIAL

O único workspace oficial do ZapTI é `D:\ZapTI`.

**Obrigatório:** criar, editar e remover arquivos somente dentro de `D:\ZapTI`; executar comandos de desenvolvimento a partir dele; usá-lo como origem do Git e do deploy.

**Proibido como workspace:** `C:\ZapTI`, `C:\Users\...\ZapTI`, `%TEMP%\ZapTI`, `AppData`, diretórios temporários, outra cópia do repositório, código dentro de containers, **e a cópia que está no servidor**.

Não crie uma segunda cópia do projeto para "resolver" um problema. Se encontrar outra cópia, não assuma que é a correta; descubra qual está em uso.

O disco C: do usuário tem pouco espaço. Mantenha builds e dados do ZapTI no D: sempre que possível. Não execute comandos destrutivos para liberar espaço e não mova/apague o armazenamento global do Docker sem verificar o impacto.

---

## 6. VERIFICAÇÃO ANTES DE AGIR

Antes de alterações significativas, confirme:

- `git rev-parse --show-toplevel` → `D:\ZapTI`
- `git status` e remote corretos
- localização dos Dockerfiles e do compose
- variáveis de ambiente necessárias (`.env.example` atualizado)

Se uma alteração não aparecer na aplicação, **não faça outra alteração aleatória**. Descubra: qual código está rodando, qual imagem, quando foi criada, qual contexto de build, quais volumes, se o servidor recebeu a cópia mais recente.

Fluxo que precisa estar sempre verdadeiro:

```
D:\ZapTI → commit/push (GitHub) → cópia via SSH → servidor 192.168.1.193 → Docker build → container → aplicação
```

---

## 7. ESPECIFICAÇÃO E FASES

1. Não invente requisitos.
2. Se algo não estiver especificado, não implemente arbitrariamente.
3. Ambiguidades vão para `docs/DUVIDAS.md`, e pergunte ao usuário quando a decisão for necessária.
4. Não transforme preferência técnica em requisito do produto.

Trabalhe uma fase por vez, em passos pequenos: módulo → implementação → testes → documentação → commit/push → deploy → próximo módulo.

---

## 8. DOCUMENTAÇÃO

Mantenha atualizados:

- `docs/PROGRESSO.md`: concluído, em andamento, bloqueado, pendente, decisões, limitações, testes realizados (atualize ao fim de cada módulo significativo).
- `docs/LIMITACOES.md`: limitações técnicas reais (o que não é possível, por quê, alternativa, o que foi implementado).
- `docs/DECISOES.md`: decisões arquiteturais relevantes.
- `docs/DUVIDAS.md`: ambiguidades de requisito.

---

## 9. TESTES AUTOMATIZADOS

Todo módulo novo precisa de testes automatizados apropriados. Não avance de fase com testes relevantes quebrados.

Antes de considerar algo concluído: executar testes, lint, typecheck (quando disponível) e build.

Build passando não significa funcionalidade funcionando. Para funcionalidades críticas, o teste de comportamento real é feito **pelo usuário** na aplicação do servidor (seção 3). Peça isso de forma explícita.

---

## 10. MULTI-TENANT (INEGOCIÁVEL)

Toda operação relevante considera `tenant_id`: queries, mutations, cache, arquivos, uploads, filas, jobs, buscas, logs, eventos, WebSockets, notificações, relatórios, exports.

Nunca permitir que um tenant acesse dados de outro. Criar testes explícitos (automatizados, sem banco real) provando o isolamento.

---

## 11. SEGURANÇA, CREDENCIAIS E AUTORIZAÇÃO

- Segredos nunca ficam no código (TypeScript, JavaScript, React, HTML, Dockerfile, compose, documentação, exemplos, commits, logs). Usar variáveis de ambiente, Docker secrets ou gerenciador apropriado.
- Manter `.env.example` atualizado, somente com nomes de variáveis e exemplos seguros.
- Não criar: admin padrão com senha conhecida, senha hardcoded, login de teste permanente, credencial escondida, bypass de autenticação, fallback de senha, token secreto no frontend. Se precisar de usuário inicial, implementar bootstrap seguro.
- Autenticação e autorização ocorrem **no backend**. Nunca confiar só em botão/rota escondida, validação do frontend ou `isAdmin` vindo do cliente.
- Verificar RBAC, permissões, sessão, expiração, revogação, IDOR, acesso entre tenants e acesso administrativo.
- Antes de cada commit, verificar que nenhum secret foi adicionado.

---

## 12. AUDITORIA

Toda ação sensível gera registro de auditoria: quem, o quê, quando, IP, tenant, User-Agent, dispositivo, resultado, recurso, ID do recurso, correlation ID.

Nunca registrar senha, token, API key, cookie, session secret ou conteúdo de secrets.

---

## 13. WHATSAPP / EVOLUTION API

- A integração usa a Evolution API de verdade (instâncias, conexão, envio de texto/mídia).
- **Não reintroduza mocks de WhatsApp.** Se a Evolution API não estiver configurada, falhe com erro de serviço (`503`); não invente QR code nem mensagem enviada.
- O webhook exige `EVOLUTION_API_KEY`.
- Se Evolution API, WhatsApp ou navegador não permitirem uma função, **não finja que funciona**: documente em `docs/LIMITACOES.md`.
- A rota de backups foi removida; não trate o volume de backups do Compose como backup implementado.

---

## 14. INTERFACE E DESIGN

- Nada de código para o usuário final: aparência, fluxos, automações e configurações são feitos pela interface gráfica.
- Código e nomes técnicos em inglês. Textos da interface com i18n; português brasileiro é o idioma-base. Nenhum texto fixo espalhado pelo frontend.
- Usar o design system existente. Evitar componentes duplicados, estilos/cores/espaçamentos aleatórios, emojis como ícones, telas com cara de protótipo.
- Priorizar acessibilidade, responsividade, hierarquia visual, tipografia consistente, estados de loading/vazio/erro, feedback visual e navegação clara.
- Quando apropriado, usar as skills de design/frontend instaladas no Claude Code.

---

## 15. DADOS REAIS

Não criar números falsos, gráficos falsos, métricas hardcoded, endpoints fake, botões sem implementação ou mocks apresentados como dados reais. Mocks só em testes automatizados, quando explicitamente necessários.

---

## 16. STACK

TypeScript ponta a ponta; PostgreSQL; Redis; WebSocket; fila de jobs; React/Next.js; PWA; Docker Compose. Detalhes em `docs/spec/01-arquitetura-e-deploy.md`.

A stack pode mudar com justificativa técnica, registrada em `docs/DECISOES.md`.

---

## 17. QUANDO O CONTEXTO FICAR GRANDE

PARE. Atualize `docs/PROGRESSO.md` com o estado exato e informe: onde parou, o que foi feito, o que falta, testes que passaram/falharam e próximo passo recomendado. Faça commit e push desse estado.

---

## 18. SE ALGO FALHAR

Não repita cegamente o mesmo comando. Identifique o motivo, registre o erro, formule nova abordagem e teste. Se a alteração não teve efeito, descubra por quê antes de editar de novo.

---

## 19. CRITÉRIO DE "CONCLUÍDO"

Uma tarefa só está concluída quando:

- código implementado;
- testes automatizados, lint, typecheck e build executados;
- documentação atualizada quando necessário;
- nenhum secret exposto;
- commit feito e push no GitHub;
- deploy feito no servidor via SSH e verificado (containers `Up`, logs sem erro);
- usuário avisado do que precisa testar.

Não diga "feito" apenas porque o arquivo foi alterado. Não diga que "está funcionando" sem o teste do usuário: diga que "está no ar, aguardando seu teste".

---

## 20. RESPOSTAS AO USUÁRIO

Responder em português brasileiro, de forma objetiva. Ao final de cada etapa significativa, informar:

- **Feito**: o que foi implementado.
- **Testado**: quais testes/builds automatizados rodaram (e o que ficou sem teste).
- **Git**: commit realizado (hash e mensagem) e status do push.
- **Deploy**: se foi copiado para `192.168.1.193`, containers e status verificado.
- **Para você testar**: passos objetivos do que o usuário precisa conferir.
- **Pendente / Próximo passo**.

Não inventar resultados. Não afirmar que algo foi testado se não foi. Não afirmar que o deploy está correto sem verificar.

---

## 21. LEMBRETE FINAL

```
WORKSPACE:      D:\ZapTI (único lugar onde se edita código)
GIT:            D:\ZapTI → GitHub oficial (commit + push a cada alteração)
SERVIDOR:       192.168.1.193 via SSH (sem senha) — só recebe cópia e rebuild
BANCO:          não tocar, exceto o que o usuário pedir explicitamente
TESTES NA APP:  feitos pelo usuário; Claude NÃO cria usuário nem dados de teste
REVERSE PROXY:  configurado pelo usuário
SECRETS:        nunca no código nem no commit
FLUXO:          editar → testes automatizados → commit → push → deploy SSH → verificar logs → avisar usuário para testar
```

Nunca trabalhe silenciosamente em outra cópia do ZapTI. Se o ambiente não estiver seguindo estas regras, corrija o ambiente ou pare e informe o problema antes de continuar.
