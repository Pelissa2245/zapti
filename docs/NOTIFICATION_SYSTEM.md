# Sistema de Notificações por E-mail (SMTP)

## Visão Geral

O ZapTI possui um sistema de notificações por e-mail que permite ao agente (Claude) enviar alertas para o usuário quando sua intervenção é necessária. Isso permite que você deixe o agente trabalhando autonomamente sem precisar monitorar o terminal continuamente.

## Configuração

### Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no seu arquivo `.env` ou no ambiente de execução:

```bash
# Obrigatória - Senha do SMTP (nunca commitar!)
ZAPTI_SMTP_PASSWORD="iubc kubs udpg ejdc"

# Opcionais - Sobrescrevem os padrões
SMTP_HOST="smtp.gmail.com"        # Padrão: smtp.gmail.com
SMTP_PORT="465"                   # Padrão: 465
SMTP_USER="matheusserver75@gmail.com"  # Padrão: matheusserver75@gmail.com
SMTP_FROM="matheusserver75@gmail.com"  # Padrão: mesmo que SMTP_USER
NOTIFICATION_EMAIL_TO="matheus.b.pelissari@gmail.com"  # Padrão: matheus.b.pelissari@gmail.com
```

### Configuração do Gmail

Para usar o Gmail como servidor SMTP:

1. Ative a **Verificação em 2 etapas** na sua conta Google
2. Gere uma **Senha de App**:
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "Mail" e "Outro (nome personalizado)"
   - Nome: "ZapTI Notifications"
   - Copie a senha gerada (16 caracteres)
3. Use essa senha como `ZAPTI_SMTP_PASSWORD`

**⚠️ IMPORTANTE**: Nunca grave a senha diretamente no código, arquivos versionados, logs ou mensagens de debug.

## Como Funciona

### Tipos de Notificação

1. **Decisão** (`decision`) - Quando há múltiplas opções válidas e o agente precisa que você escolha
2. **Informação Necessária** (`info_needed`) - Quando o agente precisa de uma credencial, configuração ou caminho
3. **Autorização** (`authorization`) - Antes de ações destrutivas, irreversíveis ou perigosas
4. **Erro** (`error`) - Erro que o agente não consegue resolver sozinho
5. **Bloqueado** (`blocked`) - Agente aguardando sua intervenção para continuar
6. **Conclusão** (`completion`) - Tarefa importante concluída

### Anti-Spam (Cooldown)

- Cooldown padrão: **5 minutos** por chave de deduplicação
- Chave padrão: `${tipo}:${título}`
- Use `deduplicationKey` personalizada para agrupar notificações relacionadas
- Notificações diferentes (tipos/títulos diferentes) têm cooldowns independentes

### Formato do E-mail

**Assunto**: `[ZapTi] Atenção necessária: <título>`

**Corpo** contém:
- O que o agente estava fazendo
- Por que precisa da sua atenção
- O que exatamente você precisa responder/fazer
- Contexto necessário para entender o problema
- Opções disponíveis (quando aplicável)

## Uso no Código

```typescript
import { 
  notifyDecision, 
  notifyInfoNeeded, 
  notifyAuthorization, 
  notifyError, 
  notifyBlocked, 
  notifyCompletion,
  testNotification 
} from '@zapti/shared/notification';

// Decisão necessária
await notifyDecision(
  'Escolha de banco de dados',
  'Preciso decidir onde armazenar as sessões',
  'Estou implementando o sistema de usuários e encontrei duas opções viáveis.',
  ['Redis', 'PostgreSQL'],
  'database-choice' // deduplication key
);

// Informação necessária
await notifyInfoNeeded(
  'Credencial AWS',
  'Preciso da AWS_ACCESS_KEY_ID',
  'O deploy requer acesso à AWS para criar recursos.',
  'AWS_ACCESS_KEY_ID'
);

// Autorização
await notifyAuthorization(
  'Exclusão de dados',
  'Vou deletar 10.000 registros antigos',
  'Limpeza de logs de auditoria anteriores a 2023.',
  'DELETE FROM audit_logs WHERE created_at < 2023-01-01'
);

// Erro
await notifyError(
  'Falha na migração',
  'Migration 20240101 falhou com constraint unique',
  'Tentei executar a migração mas há dados duplicados na coluna email.'
);

// Bloqueado
await notifyBlocked(
  'Aguardando aprovação PR',
  'PR #123 precisa de review',
  'Fiz as alterações solicitadas e abri o PR.',
  'Aprovação do PR #123 no GitHub'
);

// Conclusão
await notifyCompletion(
  'Deploy concluído',
  'Versão 1.2.0 deployada com sucesso',
  'Todas as migrações rodaram, health checks passando.',
  'deploy-v1.2.0'
);
```

## Teste

Para testar o sistema:

```bash
# Com variável de ambiente
ZAPTI_SMTP_PASSWORD="sua_senha_app" npx tsx -e "
import { testNotification } from './packages/shared/src/notification.ts';
testNotification().then(r => console.log('Sucesso:', r));
"

# Ou usando o script de teste
npm run test:notification
```

## Segurança

✅ **O que É enviado:**
- Título e tipo da notificação
- Resumo e contexto descritivos
- Opções de decisão (textos, não valores sensíveis)
- Ação solicitada (descrição, não comando completo com segredos)

❌ **O que NÃO é enviado:**
- Senhas
- Tokens (JWT, API keys, etc.)
- Chaves privadas
- Cookies/session IDs
- Conteúdo de arquivos `.env`
- Credenciais de banco de dados
- Qualquer segredo real

Se precisar que o usuário forneça uma credencial, o e-mail dirá apenas **qual** credencial é necessária (ex: "Forneça: AWS_SECRET_ACCESS_KEY"), nunca o valor.

## Integração com Agente (Claude Code)

O agente usa este sistema automaticamente quando:

1. Precisa de uma decisão sua entre múltiplas abordagens válidas
2. Precisa de informação que não possui (credencial, config, caminho)
3. Precisa de autorização antes de ação destrutiva/irreversível
4. Encontra erro que não consegue resolver após tentativas razoáveis
5. Fica bloqueado aguardando sua intervenção
6. Conclui tarefa importante

**Regra**: O agente SEMPRE tenta resolver autonomamente primeiro. Só notifica quando realmente precisa de você.

## Solução de Problemas

### E-mail não chega
- Verifique se `ZAPTI_SMTP_PASSWORD` está configurado corretamente
- Confirme se a senha de app do Gmail está válida
- Verifique pasta de spam/lixo eletrônico
- Teste com `testNotification()`

### Erro de autenticação
- Gmail: Use senha de app, não a senha principal
- Verifique se a verificação em 2 etapas está ativa
- Confirme host/porta: smtp.gmail.com:465 (SSL)

### Cooldown muito agressivo
- Ajuste `COOLDOWN_MS` em `packages/shared/src/notification.ts`
- Use `deduplicationKey` personalizada para controle fino

## Arquitetura

```
packages/shared/src/notification.ts
├── Cooldown Map (em memória)
├── SMTP Transport (nodemailer)
├── HTML Template
├── sendNotification() - Função principal
├── notifyDecision/Info/Auth/Error/Blocked/Completion - Helpers
└── testNotification() - Teste
```

O sistema é stateless (exceto cooldown em memória) e não persiste estado entre execuções.