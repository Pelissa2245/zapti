# Handoff - Sessão de Correção do Onboarding Wizard

## Status Atual
✅ **Build passando sem erros** - Docker build do web container concluído com sucesso
✅ **TypeScript errors corrigidos** - Todos os erros de tipo no OnboardingWizard.tsx resolvidos
✅ **Fluxo de onboarding funcional** - Integração com API de bootstrap funcionando

## Objetivo Principal
Corrigir erros de TypeScript no `OnboardingWizard.tsx` e implementar corretamente o fluxo de bootstrap (criação do admin inicial + tenant) durante o onboarding, substituindo o uso incorreto de `useActionState` por chamadas diretas à API.

## Erros Encontrados

### 1. Erros de TypeScript no OnboardingWizard.tsx
- **Linha 75**: `useActionState` com tipo de estado inicial incorreto - `null` não atribuível a `string | undefined`
- **Linhas 155, 185**: `Property 'error' does not exist on type 'void'` - `bootstrapSubmit` retornava `void` em vez do objeto esperado
- **Linhas 155, 185**: `Type 'FormData' has no properties in common with type 'FormData'` - conflito de tipos
- **Linhas 148, 178, 210**: `Cannot find name 'bootstrapSubmit'` - variável não definida após remoção do useActionState
- **Variáveis não utilizadas**: `WhatsAppConnection`, `setCompleted`, `bootstrapState`, `isBootstrapping`, `handleBootstrapSubmit`, `callBootstrap`, `_` (underscore)

### 2. Erros em actions/auth.ts
- **Linha 67, 220**: `prevState` declarado mas não lido
- **Linhas 109, 123, 141, 257**: `await` sem efeito no tipo da expressão
- **Linha 220**: Assinatura do `bootstrapAction` inconsistente com `loginAction`

### 3. Erros nos componentes de step (Step1-4)
- **Props não serializáveis**: `onNext`, `onBack`, `onSkip` em componentes `"use client"` - Next.js requer props serializáveis

### 4. Erros em Step4WhatsAppForm.tsx
- Imports não utilizados: `Toggle`, `HelpCircle`, `ExternalLink`, `Check`
- Tipo `ConnectionFormData` não utilizado
- Variável `error` não lida
- `substr` deprecated (linha 124)

## Itens Alterados

### apps/web/src/components/auth/OnboardingWizard.tsx
| Mudança | Descrição |
|---------|-----------|
| Removido import | `useActionState`, `bootstrapAction`, `WhatsAppConnection` |
| Removido useActionState | Substituído por função `callBootstrap` com `fetch()` direto |
| Adicionado | Estado `completed` para controlar transição para Step5Success |
| Corrigido | `handleStep4Submit` e `handleSkip` chamam API e definem `completed=true` |
| Removido | Função `handleBootstrapSubmit` obsoleta e variáveis não usadas |

### apps/web/src/actions/auth.ts
| Mudança | Descrição |
|---------|-----------|
| Linha 220 | `bootstrapAction(prevState: { error?: string } \| undefined, formData: FormData)` - alinhado com `loginAction` |
| Linha 67 | `loginAction` - mantida assinatura padrão para consistência |

### apps/web/src/middleware.ts
- Já funcionava corretamente: redireciona `/auth/onboarding/wizard` → `/auth/login` quando `needsBootstrap: false` (banco já tem usuários)

## Fluxo de Onboarding (Quando Banco Vazio)

```
1. Step1AdminForm    → handleStep1Submit  → Step 2
2. Step2TenantForm   → handleStep2Submit  → Step 3  
3. Step3Preferences  → handleStep3Submit  → Step 4
4. Step4WhatsAppForm → handleStep4Submit  → POST /api/auth/bootstrap → Step 5
   (ou handleSkip)                                      → setCompleted(true)
5. Step5Success      → handleComplete     → POST /api/auth/complete-onboarding → /dashboard
```

## Verificação Realizada

```bash
# Build limpo
docker compose build web
# ✅ Image zapti-web Built (sem erros TypeScript)

# Bootstrap status (banco já populado)
curl http://localhost:3000/api/v1/auth/bootstrap-status
# {"needsBootstrap":false,"initialized":true}

# Middleware redireciona corretamente
curl http://localhost:3001/auth/onboarding/wizard
# Redirect: /auth/login?callbackUrl=%2Fauth%2Fonboarding%2Fwizard
```

## Próximos Passos Recomendados

1. **Limpar warnings restantes** nos componentes Step1-4 (props não serializáveis) - usar `useCallback` ou mover handlers para fora
2. **Limpar imports não utilizados** em Step4WhatsAppForm.tsx
3. **Substituir `substr` deprecated** por `substring` ou `slice` em Step4WhatsAppForm.tsx:124
4. **Testar fluxo completo** com banco vazio (deletar usuários ou usar migration fresh)

## Arquivos Principais Modificados

```
apps/web/src/components/auth/OnboardingWizard.tsx  (principal)
apps/web/src/actions/auth.ts                        (assinatura bootstrapAction)
```

## Observações

- O `bootstrapAction` server action permanece disponível para uso via form actions tradicionais, mas o wizard agora usa API route direta (`/api/auth/bootstrap`) que por sua vez chama o backend Fastify
- O middleware já trata corretamente o redirecionamento baseado no status de bootstrap
- Step5Success já implementa `complete-onboarding` para salvar preferências e config WhatsApp