# Plano de Ação Imediato — Próximos Passos

> Baseado no handoff.md seção 6 e vault criado. Execute em ordem.

---

## Fase 1: Git & Commit (AGORA)

```bash
cd D:\zapti

# 1. Verificar status
git status

# 2. Verificar .gitignore
cat .gitignore

# 3. Adicionar tudo (exceto ignorados)
git add -A

# 4. Commit WIP
git commit -m "wip: estado após sessão 2 - vault docs, arquitetura, decisões documentadas

- Added docs/vault/ with Visao-Geral, Arquitetura, API-Routes, Tarefas, Problemas-e-Solucoes
- Added 5 ADRs: Prisma unificado, Docker Compose local, Evolution API, Shared ESM, Multi-tenant JWT
- Ready for Prisma unification and build pipeline"

# 5. Verificar commit
git log --oneline -3
```

---

## Fase 2: Unificar Prisma Schema (PRÓXIMO)

```bash
cd D:\zapti

# 1. Comparar os dois schemas
diff apps/api/prisma/schema.prisma packages/database/prisma/schema.prisma

# 2. Verificar CampaignLog no schema unificado
grep -n "CampaignLog" packages/database/prisma/schema.prisma

# 3. Se apps/api/prisma é duplicado, remover
rm -rf apps/api/prisma

# 4. Validar schema unificado
cd packages/database
npx prisma validate

# 5. Gerar Prisma Client
npx prisma generate

# 6. Commit
cd D:\zapti
git add -A
git commit -m "refactor: unificar Prisma schema em packages/database

- Removed apps/api/prisma (duplicado)
- Validated schema with 'npx prisma validate'
- Generated Prisma Client
- Fixed CampaignLog relation if needed"
```

---

## Fase 3: Build Pipeline (CAMADA POR CAMADA)

### 3.1 Shared Package
```bash
cd D:\zapti/packages/shared
npm install
npm run build
# Verificar: dist/ gerado com .js + .d.ts

cd D:\zapti
git add packages/shared/dist
git commit -m "build: packages/shared compilado com sucesso"
```

### 3.2 Database Package
```bash
cd D:\zapti/packages/database
npm install
npx prisma generate
npm run build

cd D:\zapti
git add packages/database/dist packages/database/prisma
git commit -m "build: packages/database compilado + Prisma Client gerado"
```

### 3.3 API (TypeScript Check)
```bash
cd D:\zapti/apps/api
npm install
npx tsc --noEmit
# Se erros: corrigir apenas os que falham

cd D:\zapti
git add -A
git commit -m "fix: apps/api TypeScript clean (tsc --noEmit passes)"
```

### 3.4 Web (Next.js Build)
```bash
cd D:\zapti/apps/web
npm install
npm run build
# Se erros: corrigir apenas os que falham

cd D:\zapti
git add -A
git commit -m "build: apps/web Next.js build passes"
```

---

## Fase 4: Docker Build & Up

```bash
cd D:\zapti

# 1. Build imagens customizadas
docker compose -f docker-compose.prod.yml build api web 2>&1 | tee build.log

# 2. Subir stack
docker compose -f docker-compose.prod.yml up -d

# 3. Aguardar healthchecks (30-60s)
watch -n 5 'docker compose -f docker-compose.prod.yml ps'

# 4. Ver logs de cada serviço
docker compose -f docker-compose.prod.yml logs --tail=50 postgres
docker compose -f docker-compose.prod.yml logs --tail=50 redis
docker compose -f docker-compose.prod.yml logs --tail=50 evolution
docker compose -f docker-compose.prod.yml logs --tail=50 api
docker compose -f docker-compose.prod.yml logs --tail=50 web
```

### Se algum serviço falhar:
```bash
# Ver logs completos
docker compose -f docker-compose.prod.yml logs --tail=100 <serviço>

# Reiniciar apenas esse serviço
docker compose -f docker-compose.prod.yml restart <serviço>

# Se precisar rebuild
docker compose -f docker-compose.prod.yml build <serviço>
docker compose -f docker-compose.prod.yml up -d <serviço>
```

---

## Fase 5: Validar Evolution API End-to-End

```bash
# 1. Verificar Evolution API responde
curl http://localhost:8080/

# 2. Criar instância
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: zapti-evolution-key-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "zapti", "qrcode": true}'

# 3. Obter QR Code
curl http://localhost:8080/instance/connect/zapti \
  -H "apikey: zapti-evolution-key-change-in-production"

# 4. ESCANEAR QR CODE NO WHATSAPP MOBILE

# 5. Verificar status conexão
curl http://localhost:8080/instance/connectionState/zapti \
  -H "apikey: zapti-evolution-key-change-in-production"
# Esperar: {"instance":{"state":"open"}}

# 6. Enviar mensagem teste (do seu WhatsApp para o número da instância)
# Verificar webhook chega na API:
docker compose -f docker-compose.prod.yml logs -f api | grep -i "webhook\|evolution\|message"

# 7. Verificar Message criada no banco
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d zapti -c "SELECT * FROM \"Message\" ORDER BY \"createdAt\" DESC LIMIT 5;"

# 8. Verificar WebSocket (via browser devtools em http://localhost:3001)
```

---

## Fase 6: GitHub Remote + Push

```bash
cd D:\zapti

# 1. Criar repo no GitHub (se não existe): https://github.com/new
#    Nome: zapti, Private, NÃO inicializar com README

# 2. Adicionar remote
git remote add origin https://github.com/<SEU_USUARIO>/zapti.git

# 3. Push inicial (pode ser grande, use --force-with-lease se necessário)
git push -u origin main

# 4. Verificar no GitHub
#    https://github.com/<SEU_USUARIO>/zapti
```

---

## Fase 7: Commit a Cada Bloco (REGRA DE OURO)

Após CADA fase acima que der certo:
```bash
git add -A
git commit -m "<tipo>: <descrição curta>

- Detalhe 1
- Detalhe 2"
git push
```

**Tipos de commit:**
- `build:` — build pipeline, docker, deps
- `fix:` — correção de bug
- `refactor:` — refatoração sem mudança de behavior
- `feat:` — nova funcionalidade
- `docs:` — documentação (vault, README)
- `chore:` — manutenção, configs

---

## 🚨 Se Travar em Alguma Fase

1. **Leia o erro completo** — não assuma
2. **Consulte `docs/vault/Problemas-e-Solucoes.md`** — pode já ter solução
3. **Logs** — `docker compose logs -f <serviço>` ou `npm run build 2>&1 | tee error.log`
4. **Não pare para perguntar** — tente resolver, documente no vault, continue
5. **Se erro persiste > 30min** — documente no vault, pule para próxima fase independente, volte depois

---

## ✅ Definition of Done (Esta Sessão)

- [ ] Git commit WIP feito
- [ ] Prisma schema unificado + validado + client gerado
- [ ] 4 camadas buildadas: shared → database → api (tsc) → web (next build)
- [ ] Docker build api + web sem erros
- [ ] Stack completa up -d (5 containers healthy)
- [ ] Evolution API: instância criada, QR escaneado, webhook funcionando
- [ ] GitHub remote configurado + push feito
- [ ] Vault atualizado com status final

---

## 📞 Comandos Úteis Rápidos

```bash
# Ver todos containers
docker compose -f docker-compose.prod.yml ps -a

# Restart tudo
docker compose -f docker-compose.prod.yml restart

# Derrotar tudo (CUIDADO: perde dados)
docker compose -f docker-compose.prod.yml down -v

# Logs api em tempo real
docker compose -f docker-compose.prod.yml logs -f api

# Entrar no container api
docker compose -f docker-compose.prod.yml exec api sh

# Prisma studio (se api rodando local)
cd packages/database && npx prisma studio

# Testar API health
curl http://localhost:3000/health
curl http://localhost:3000/ready

# Testar web
curl -I http://localhost:3001
```

---

*Criado em: 2026-10-11*  
*Baseado em: handoff.md + vault analysis*  
*Próxima atualização: após cada fase concluída*