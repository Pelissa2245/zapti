ZapTI — Regras de trabalho

## Handoff confirmado — 2026-10-04

O repositório foi auditado, corrigido e sincronizado no GitHub em `master` pelo commit `ee408cf` (`fix: replace WhatsApp mocks with Evolution API integration`). Antes de iniciar novo trabalho, execute `git status`, `git log -3` e leia `docs/PROGRESSO.md`.

Alterações concluídas nesse ciclo:

- A integração WhatsApp deixou de simular QR/envio e usa a Evolution API para criar instâncias, conectar, desconectar e enviar texto/mídia.
- O webhook exige `EVOLUTION_API_KEY` e aceita payload padrão da Evolution API, resolvendo a instância pelo campo `instance` ou pelos headers opcionais.
- A rota de backups quebrada foi removida do registro da API; não trate o volume de backups do Compose como backup implementado.
- Foram adicionados testes Vitest do cliente Evolution; `npm test`, `npm run build`, `npm run lint` e `prisma validate` passaram. O lint ainda emite avisos preexistentes.
- Docker Compose não foi validado neste ambiente porque o binário `docker` não está instalado; validar em máquina com Docker antes de deploy.

Não reintroduza mocks de WhatsApp. Se Evolution API não estiver configurada, o comportamento correto é falhar com erro de serviço (`503`), não inventar QR ou mensagem enviada.

«LEIA ESTE ARQUIVO INTEIRO ANTES DE QUALQUER AÇÃO.

Estas regras são obrigatórias e têm prioridade sobre conveniências de implementação.»

Você está construindo o ZapTI: painel web self-hosted de atendimento via WhatsApp (Evolution API), com caixa de entrada única, tickets, BOT por fluxogramas, multiusuário e multiempresa.

A especificação completa está em "docs/spec/".

O plano por fases está em:

"docs/spec/09-fases-e-criterios.md"

Os prompts de cada fase estão em:

"prompts/"

---

1. WORKSPACE OFICIAL — REGRA ABSOLUTA

O único workspace oficial do ZapTI é:

"D:\ZapTI"

Todo desenvolvimento deve acontecer nesse diretório.

É OBRIGATÓRIO

- Criar arquivos somente dentro de "D:\ZapTI".
- Editar arquivos somente dentro de "D:\ZapTI".
- Remover arquivos somente dentro de "D:\ZapTI".
- Executar comandos de desenvolvimento a partir de "D:\ZapTI".
- Usar "D:\ZapTI" como origem do Docker build.
- Usar "D:\ZapTI" como origem do Git.
- Usar "D:\ZapTI" como workspace do Claude Code.

É PROIBIDO

Não usar como workspace do projeto:

- "C:\ZapTI"
- "C:\Users\...\ZapTI"
- "%TEMP%\ZapTI"
- "AppData"
- diretórios temporários
- outra cópia do repositório
- código dentro de containers
- qualquer outro diretório como fonte oficial

Não crie uma segunda cópia do projeto para "resolver" um problema.

Se encontrar outra cópia do ZapTI, não assuma que ela é a correta.

Primeiro descubra qual cópia está sendo usada.

---

2. VERIFICAÇÃO DO WORKSPACE ANTES DE AGIR

Antes de fazer alterações significativas, confirme:

Workspace: D:\ZapTI
Git root: D:\ZapTI
Docker build context: D:\ZapTI

Verifique também:

- "git rev-parse --show-toplevel"
- "git status"
- localização dos Dockerfiles
- localização do compose
- containers ativos
- imagens utilizadas
- volumes
- bind mounts

Se "git rev-parse --show-toplevel" retornar outro diretório, PARE.

Não continue editando.

Corrija o workspace primeiro.

---

3. DOCKER — FONTE OBRIGATÓRIA

O Docker deve construir o ZapTI a partir de:

"D:\ZapTI"

Fluxo obrigatório:

D:\ZapTI
    ↓
Docker Build Context
    ↓
Dockerfile
    ↓
Docker Image
    ↓
Docker Container
    ↓
ZapTI

Nunca faça:

outra pasta
    ↓
Docker

sem que essa outra pasta seja explicitamente parte da arquitetura documentada.

Antes de qualquer deploy

Verifique:

- Dockerfile usado
- compose usado
- build context
- imagens
- containers
- volumes
- bind mounts
- portas
- variáveis de ambiente

Se o Docker estiver construindo uma cópia antiga do projeto, corrija o Docker, não o código duplicado.

CUIDADO COM O C:

O usuário possui espaço limitado no disco C:.

Evite colocar builds, cópias do projeto ou dados persistentes do ZapTI no C:.

Sempre que tecnicamente possível, mantenha os dados do projeto e do Docker relacionados ao ZapTI no D:.

Nunca mova ou apague o armazenamento global do Docker sem antes verificar o impacto nos outros containers da máquina.

Não execute comandos destrutivos para liberar espaço.

---

4. GIT E GITHUB — REGRA OBRIGATÓRIA

O Git oficial do ZapTI está em "D:\ZapTI".

O GitHub é o repositório oficial do projeto.

Antes de trabalhar

Verifique:

git rev-parse --show-toplevel
git remote -v
git status

O Git root deve ser:

D:\ZapTI

Depois de cada alteração significativa

Execute:

git status

Revise as alterações.

Não faça commit de:

- senhas
- tokens
- API keys
- secrets
- cookies
- ".env" com credenciais
- arquivos temporários
- dumps
- dados pessoais desnecessários
- arquivos gerados que não pertencem ao repositório

Commits

Faça commits pequenos e descritivos.

Um commit deve representar um passo lógico.

Não faça commits gigantes com dezenas de mudanças não relacionadas.

Push

Depois que uma alteração significativa estiver:

- implementada;
- testada;
- revisada;
- sem secrets;

faça commit e push para o GitHub oficial do ZapTI.

Não espere o final de toda a vida do projeto para sincronizar o GitHub.

Se houver uma alteração importante, mantenha o GitHub atualizado.

NUNCA

- criar outro repositório;
- trocar o remote sem autorização;
- fazer push para outro projeto;
- apagar histórico;
- usar "git reset --hard" para esconder problemas;
- sobrescrever trabalho existente sem verificar.

Se o remote estiver incorreto, PARE e informe o usuário antes de alterá-lo.

---

5. NÃO EDITE A CÓPIA ERRADA

Esse é um ponto crítico.

O fato de um arquivo existir não significa que ele seja utilizado pela aplicação.

Antes de concluir que uma alteração funcionou, confirme o fluxo:

arquivo alterado
↓
build
↓
imagem
↓
container
↓
aplicação

Se uma alteração em "D:\ZapTI" não aparecer na aplicação:

NÃO faça outra alteração aleatória.

Descubra:

1. qual código está sendo executado;
2. qual imagem está sendo usada;
3. quando a imagem foi criada;
4. qual build context foi usado;
5. quais volumes estão montados;
6. se existe outra cópia do projeto.

---

6. ESPECIFICAÇÃO

A especificação completa está em:

"docs/spec/"

O plano por fases está em:

"docs/spec/09-fases-e-criterios.md"

Os prompts de cada fase estão em:

"prompts/"

Regras

1. Não invente requisitos.
2. Se algo não estiver especificado, não implemente arbitrariamente.
3. Se houver ambiguidade, registre em "docs/DUVIDAS.md".
4. Pergunte ao usuário quando a decisão for necessária.
5. Não transforme uma preferência técnica em requisito do produto sem justificativa.

---

7. DESENVOLVIMENTO POR FASES

Trabalhe em passos pequenos.

Uma fase por vez.

Dentro da fase:

módulo
↓
implementação
↓
testes
↓
documentação
↓
commit
↓
próximo módulo

Não tente construir o sistema inteiro de uma vez.

Se uma fase for grande, divida em módulos menores.

---

8. DOCUMENTAÇÃO

Mantenha:

"docs/PROGRESSO.md"

atualizado.

Registrar:

- concluído;
- em andamento;
- bloqueado;
- pendente;
- decisões tomadas;
- limitações;
- testes realizados.

Atualize o progresso ao final de cada módulo significativo.

Se houver uma limitação técnica real:

"docs/LIMITACOES.md"

deve documentá-la.

Decisões arquiteturais relevantes devem ser registradas em:

"docs/DECISOES.md"

---

9. TESTES

Todo módulo novo deve possuir testes automatizados apropriados.

Não avance de fase com testes relevantes quebrados.

Antes de considerar uma funcionalidade concluída:

- executar testes;
- executar lint;
- executar typecheck quando disponível;
- executar build;
- testar integração quando aplicável.

Para funcionalidades críticas, testar também o comportamento real através da aplicação.

Build passando não significa funcionalidade funcionando.

---

10. MULTI-TENANT

O isolamento entre empresas é INEGOCIÁVEL.

Toda operação relevante deve considerar "tenant_id".

Isso inclui:

- queries;
- mutations;
- cache;
- arquivos;
- uploads;
- filas;
- jobs;
- buscas;
- logs;
- eventos;
- WebSockets;
- notificações;
- relatórios;
- exports.

Nunca permitir que um tenant acesse dados de outro.

Criar testes explícitos provando isolamento entre tenants.

---

11. SEGURANÇA

Segredos nunca ficam no código.

Nunca colocar em:

- TypeScript;
- JavaScript;
- React;
- HTML;
- Dockerfile;
- compose;
- documentação;
- exemplos;
- commits;
- logs.

Usar:

- variáveis de ambiente;
- Docker secrets;
- secret management apropriado.

Manter:

".env.example"

atualizado.

O ".env.example" deve conter somente nomes de variáveis e exemplos seguros.

Nunca colocar secrets reais nele.

---

12. CREDENCIAIS DE LOGIN

Não criar:

- usuário admin padrão com senha conhecida;
- senha hardcoded;
- login de teste permanente;
- credencial escondida;
- bypass de autenticação;
- fallback de senha;
- token secreto no frontend.

Se o sistema precisar de um usuário inicial, implementar bootstrap seguro.

Credenciais reais devem permanecer fora do código-fonte.

Antes de fazer commit, verificar se não existem secrets acidentalmente adicionados.

---

13. AUTENTICAÇÃO E AUTORIZAÇÃO

Autenticação deve ocorrer no backend.

Autorização também deve ocorrer no backend.

Nunca confiar apenas em:

- botão escondido;
- rota escondida;
- validação do frontend;
- campo "isAdmin" enviado pelo cliente.

Verificar:

- RBAC;
- permissões;
- sessão;
- expiração;
- revogação;
- IDOR;
- acesso entre tenants;
- acesso administrativo.

---

14. AUDITORIA

Toda ação sensível deve gerar registro de auditoria.

Registrar quando aplicável:

- quem;
- o quê;
- quando;
- IP;
- tenant;
- User-Agent;
- dispositivo;
- resultado;
- recurso;
- ID do recurso;
- correlation ID.

Nunca registrar:

- senha;
- token;
- API key;
- cookie;
- session secret;
- conteúdo de secrets.

---

15. LIMITAÇÕES TÉCNICAS

Se a Evolution API, WhatsApp ou navegador não permitirem determinada função:

NÃO finja que funciona.

Documente em:

"docs/LIMITACOES.md"

Explique:

- o que não é possível;
- por quê;
- qual alternativa existe;
- qual parte foi implementada.

---

16. INTERFACE

Nada de código para o usuário final.

Personalização de:

- aparência;
- fluxos;
- automações;
- configurações;

deve ocorrer através da interface gráfica.

Código e nomes técnicos ficam em inglês.

Textos da interface devem usar i18n.

Português brasileiro é o idioma-base.

Nunca deixar texto fixo espalhado pelo frontend.

---

17. DESIGN

Utilizar o design system existente.

Evitar:

- componentes duplicados;
- estilos inconsistentes;
- cores aleatórias;
- espaçamentos aleatórios;
- emojis como ícones;
- telas com aparência de protótipo;
- dados falsos apresentados como reais.

Quando apropriado, utilizar as skills de design/frontend instaladas no Claude Code.

Priorizar:

- acessibilidade;
- responsividade;
- hierarquia visual;
- tipografia consistente;
- estados de loading;
- estados vazios;
- estados de erro;
- feedback visual;
- navegação clara.

---

18. DADOS REAIS

Não criar:

- números falsos;
- gráficos falsos;
- métricas hardcoded;
- endpoints fake;
- botões sem implementação;
- mocks apresentados como dados reais.

Mocks são permitidos somente quando explicitamente necessários para testes.

---

19. BANCO DE DADOS

Nunca executar operações destrutivas sem necessidade e sem verificar impacto.

Evitar:

DROP DATABASE
DROP TABLE
TRUNCATE
reset destrutivo

Não apagar dados reais para fazer uma funcionalidade funcionar.

Alterações estruturais devem utilizar migrations.

Antes de migration:

1. verificar schema;
2. verificar estado atual;
3. verificar migrations existentes;
4. criar migration;
5. executar;
6. testar;
7. verificar integridade.

---

20. DOCKER DEPLOY

Ao terminar uma alteração funcional:

1. Confirmar "D:\ZapTI".
2. Confirmar Git.
3. Confirmar Docker context.
4. Build.
5. Subir/recriar containers necessários.
6. Verificar logs.
7. Testar aplicação.
8. Confirmar que a aplicação utiliza a nova versão.
9. Commit.
10. Push para GitHub.

Não considerar "deploy concluído" apenas porque o "docker compose up" terminou sem erro.

---

21. SE O CONTEXTO FICAR GRANDE

Se o contexto ficar grande demais ou houver risco de começar a esquecer requisitos:

PARE.

Atualize:

"docs/PROGRESSO.md"

com o estado exato.

Informe:

- onde parou;
- o que já foi feito;
- o que falta;
- quais testes passaram;
- quais falharam;
- próximo passo recomendado.

Não continue trabalhando de forma desorganizada.

---

22. SE ALGO FALHAR

Não repita cegamente o mesmo comando ou solução.

Se uma tentativa falhar:

1. identifique o motivo;
2. registre o erro;
3. formule uma nova abordagem;
4. teste a nova abordagem.

Se a alteração não teve efeito, descubra por que não teve efeito antes de editar novamente.

---

23. CRITÉRIO DE "CONCLUÍDO"

Uma tarefa somente pode ser considerada concluída quando:

- código implementado;
- testes executados;
- build executado;
- aplicação verificada;
- documentação atualizada quando necessário;
- Docker verificado quando aplicável;
- Git revisado;
- nenhum secret exposto;
- alteração commitada;
- GitHub atualizado quando aplicável.

Não diga "feito" apenas porque o arquivo foi alterado.

---

24. STACK

Stack-base:

- TypeScript ponta a ponta;
- PostgreSQL;
- Redis;
- WebSocket;
- fila de jobs;
- React/Next.js;
- PWA;
- Docker Compose.

Detalhes em:

"docs/spec/01-arquitetura-e-deploy.md"

A stack pode ser alterada se houver justificativa técnica.

Toda alteração arquitetural relevante deve ser registrada em:

"docs/DECISOES.md"

---

25. RESPOSTAS AO USUÁRIO

Responder em português brasileiro.

Ser objetivo.

Ao final de cada fase ou etapa significativa, informar:

Feito

O que foi implementado.

Testado

Quais testes/builds foram executados.

Pendente

O que ainda falta.

Git

Commit realizado e status do push para o GitHub.

Docker

Se aplicável, qual build/container foi utilizado.

Próximo passo

Qual é o próximo módulo ou ação.

Não inventar resultados.

Não afirmar que algo foi testado se não foi.

Não afirmar que o deploy está correto sem verificar.

---

26. REGRA FINAL

Antes de qualquer ação, lembre:

WORKSPACE:
D:\ZapTI

DOCKER SOURCE:
D:\ZapTI

GIT ROOT:
D:\ZapTI

GITHUB:
repositório oficial do ZapTI

CÓDIGO:
somente D:\ZapTI

SECRETS:
nunca no código

DEPLOY:
D:\ZapTI → Docker → Container

ALTERAÇÃO:
editar → testar → verificar → commit → push

Nunca trabalhe silenciosamente em outra cópia do ZapTI.

Se o ambiente atual não estiver seguindo essas regras, corrija o ambiente ou pare e informe o problema antes de continuar.
