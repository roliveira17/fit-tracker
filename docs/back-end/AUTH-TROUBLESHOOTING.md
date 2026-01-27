# Troubleshooting: Google Login não funciona

> Última atualização: 2026-01-27 23:30
> Status: **EM INVESTIGAÇÃO**

---

## Problema

Ao clicar em "Continuar com Google" no app em produção (Vercel), aparece:
```
"Google Sign-In será implementado em breve!"
```

Porém, o código commitado **não contém** essa mensagem (já foi removida no commit `0f47030`).

---

## Configurações Verificadas ✅

### Google Cloud Console
- [x] OAuth 2.0 Client ID criado
- [x] Origens JS autorizadas: `http://localhost:3000`, `https://fit-tracker-murex.vercel.app`
- [x] URI de redirecionamento: `https://bsutppgtcihgzdblxfqc.supabase.co/auth/v1/callback`

### Supabase Dashboard
- [x] Google Provider habilitado
- [x] Client ID configurado
- [x] Client Secret configurado
- [x] Site URL: `https://fit-tracker-murex.vercel.app`
- [x] Redirect URLs: `https://fit-tracker-murex.vercel.app/**`, `http://localhost:3000/**`

### Código (GitHub)
- [x] `SupabaseAuthProvider.tsx` commitado
- [x] `app/auth/callback/route.ts` commitado
- [x] `app/onboarding/page.tsx` atualizado (sem alert)
- [x] `app/layout.tsx` usa `SupabaseAuthProvider`

---

## Hipóteses a Investigar

### H1: Deploy não atualizou (Cache da Vercel)
**Sintoma:** Código antigo ainda sendo servido
**Verificação:**
```bash
# Ver último deploy na Vercel
# Dashboard: https://vercel.com/roliveira17s-projects/fit-tracker
```
**Solução:** Forçar redeploy na Vercel

### H2: Build falhou silenciosamente
**Sintoma:** Deploy mostra sucesso mas com código antigo
**Verificação:** Ver logs de build na Vercel
**Solução:** Verificar erros de build

### H3: Arquivo não foi commitado corretamente
**Sintoma:** Git mostra commit mas arquivo difere
**Verificação:**
```bash
git show HEAD:app/onboarding/page.tsx | grep "alert"
# Não deve retornar nada
```
**Solução:** Re-commitar arquivo

### H4: Branch errada
**Sintoma:** Vercel puxa de branch diferente
**Verificação:** Conferir branch de deploy na Vercel
**Solução:** Configurar branch correta

### H5: Usuário acessando URL antiga/cache do browser
**Sintoma:** Código novo existe mas browser mostra antigo
**Verificação:** Abrir em aba anônima / limpar cache
**Solução:** Hard refresh (Ctrl+Shift+R) ou limpar cache

---

## Plano de Debug (Passo a Passo)

### Fase 1: Verificar Deploy (5 min)

1. Acessar Vercel Dashboard: https://vercel.com/roliveira17s-projects/fit-tracker
2. Verificar se último deploy é do commit `0f47030`
3. Verificar status: "Ready" ou "Error"
4. Se erro, ler logs de build

### Fase 2: Verificar Cache do Browser (2 min)

1. Abrir https://fit-tracker-murex.vercel.app em aba anônima
2. Ou fazer hard refresh: Ctrl+Shift+R
3. Ou limpar cache do navegador

### Fase 3: Verificar Código Servido (5 min)

1. No DevTools (F12), ir para aba "Network"
2. Recarregar página
3. Buscar por "onboarding" nos requests
4. Ver se o JS contém "será implementado" ou "signInWithGoogle"

### Fase 4: Forçar Redeploy (3 min)

```bash
# Fazer commit vazio para forçar redeploy
git commit --allow-empty -m "chore: force redeploy" && git push
```

Ou na Vercel Dashboard: botão "Redeploy"

### Fase 5: Debug do OAuth Flow (10 min)

Se o código estiver correto mas login não funciona:

1. Abrir DevTools > Console
2. Clicar em "Continuar com Google"
3. Observar erros no console
4. Verificar se redireciona para Google
5. Após autorizar, verificar URL de callback
6. Verificar erros no callback

---

## Logs para Coletar

Quando testar, coletar:

1. **Console do browser** (erros JavaScript)
2. **Network tab** (requests falhando)
3. **URL após clicar** (para onde redireciona)
4. **Vercel build logs** (se houver erro)

---

## Arquivos Relevantes

| Arquivo | Função |
|---------|--------|
| `app/onboarding/page.tsx` | Tela inicial com botões de login |
| `app/login/page.tsx` | Tela de login alternativa |
| `components/providers/SupabaseAuthProvider.tsx` | Provider de autenticação |
| `lib/supabase.ts` | Cliente Supabase |
| `app/auth/callback/route.ts` | Handler do callback OAuth |

---

## Commits Relevantes

| Commit | Descrição |
|--------|-----------|
| `0f47030` | Migra autenticação para Supabase (remove alerts) |
| `104ef8e` | Adiciona lib/supabase.ts |
| `f0e4f5c` | Arquitetura híbrida de APIs |

---

## Próxima Sessão

1. Executar Fase 1-5 do plano de debug
2. Coletar logs de erro
3. Identificar causa raiz
4. Implementar correção

---

## Resolução

_Preencher quando resolvido_

| Campo | Valor |
|-------|-------|
| Causa raiz | |
| Solução aplicada | |
| Data resolução | |
