# Armadilhas e Solucoes

Bugs dificeis encontrados durante o desenvolvimento e como foram resolvidos.

---

## 1. Google Login nao funciona em producao

**Sintoma:** Botao "Continuar com Google" mostra alerta antigo em vez de redirecionar para OAuth.

**Causa raiz:** Variaveis de ambiente do Supabase nao configuradas na Vercel. O deploy subia sem erro mas sem `NEXT_PUBLIC_SUPABASE_URL` o auth nao inicializava.

**Solucao:**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add OPENAI_API_KEY production
git commit --allow-empty -m "trigger" && git push
```

**Licao:** Sempre verificar env vars no dashboard da Vercel apos primeiro deploy. Build nao falha se vars estao ausentes — simplesmente nao funciona em runtime.

**Checklist de debug:**
1. Aba anonima (cache do browser)
2. Vercel Dashboard > ultimo deploy = commit certo?
3. DevTools > Console > erros JS
4. Network tab > redirect URL correta?
5. Supabase Dashboard > Google Provider habilitado?

---

## 2. CHECK constraint bloqueando RPCs silenciosamente

**Sintoma:** Import de glicemia (CGM) retorna sucesso na UI mas 0 registros chegam ao banco `glucose_logs`.

**Causa raiz:** A tabela `import_records` tinha `CHECK (source IN ('apple_health', 'hevy'))`. A RPC `import_glucose_readings` tentava inserir `source = 'import_csv'` — CHECK violation. Como glucose INSERT e import_records INSERT estao na mesma funcao, **tudo faz rollback silenciosamente**.

**Solucao:**
```sql
ALTER TABLE import_records DROP CONSTRAINT IF EXISTS import_records_source_check;
ALTER TABLE import_records ADD CONSTRAINT import_records_source_check
  CHECK (source IN ('apple_health', 'hevy', 'cgm', 'import_csv'));
```

**Licao:** CHECK constraints em tabelas podem bloquear RPCs inteiras sem erro visivel. Quando uma RPC insere em multiplas tabelas e qualquer INSERT viola uma constraint, tudo faz rollback. Sempre verificar constraints ao adicionar novos valores de enum.

---

## 3. RPC chamada sem parametro obrigatorio

**Sintoma:** `getGlucoseStats()` sempre retorna null, mesmo com dados no banco.

**Causa raiz:** A funcao SQL `get_glucose_stats(p_user_id UUID, p_days INTEGER)` requer `p_user_id`, mas o codigo TypeScript chamava apenas com `{ p_days: periodDays }`, sem passar o user_id.

**Solucao:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) return null;
const { data, error } = await supabase.rpc("get_glucose_stats", {
  p_user_id: user.id,
  p_days: periodDays,
});
```

**Licao:** RPCs do Supabase que precisam de `user_id` — sempre buscar via `supabase.auth.getUser()` antes de chamar. O Supabase nao retorna erro claro quando parametro obrigatorio esta faltando; apenas retorna null/vazio.

---

## 4. CGM mostrando 288 leituras individuais no chat

**Sintoma:** Ao perguntar sobre glicemia, o chat retorna valores minuto a minuto em vez de resumo diario.

**Causa raiz:** CGM (Continuous Glucose Monitor) gera ~288 leituras/dia (a cada 5 min). O contexto da AI estava listando leituras individuais.

**Solucao:** Agregar leituras por data — calcular media, min, max e contagem por dia. Limitar a 14 dias mais recentes.

**Licao:** Nunca mostrar leituras individuais de CGM no chat. Sempre agregar por dia.

---

## 5. Supabase sem acesso CLI/psql

**Sintoma:** Tentativa de executar SQL via API REST, CLI ou psql falha. Nao ha acesso direto ao PostgreSQL.

**Causa raiz:** Plano do Supabase nao tem conexao direta. REST API nao suporta DDL.

**Solucao:** Rodar DDL (CREATE/ALTER/DROP) exclusivamente no **SQL Editor** do Supabase Dashboard.

**Licao:** Migrations `.sql` no repositorio sao apenas referencia. A execucao real precisa ser manual no dashboard. Migrations `.bak` sao ignoradas pelo Supabase.

---

## 6. RPC com duas versoes — ambiguidade PostgreSQL

**Sintoma:** Import Apple Health retorna erro:
```
Could not choose the best candidate function between:
public.import_apple_health(..., p_sleep),
public.import_apple_health(..., p_sleep, p_glucose)
```

**Causa raiz:** `CREATE OR REPLACE FUNCTION` **NAO substitui** quando assinatura muda (numero de parametros). Em vez disso, cria **sobrecarga** (overload). Temos:
- V1: `import_apple_health(4 params)` - da migration inicial
- V2: `import_apple_health(5 params com default)` - da migration de glucose

PostgreSQL nao consegue decidir qual usar quando chamamos com 4 parametros.

**Solucao rapida:**
```typescript
// lib/supabase.ts
const { data: result, error } = await supabase.rpc("import_apple_health", {
  p_weights: data.weights || [],
  p_body_fat: data.body_fat || [],
  p_workouts: data.workouts || [],
  p_sleep: data.sleep || [],
  p_glucose: []  // ✅ Adicionar para forcar V2
});
```

**Solucao correta (longo prazo):** Criar migration para fazer `DROP FUNCTION IF EXISTS import_apple_health(JSONB, JSONB, JSONB, JSONB)` antes de recriar V2.

**Licao:** Quando mudar assinatura de RPC no PostgreSQL, sempre fazer `DROP FUNCTION IF EXISTS` com a assinatura antiga antes de `CREATE OR REPLACE` com a nova.

**Update 2026-02-07:** Migration `20260208_001_fix_import_rpc.sql` faz DROP da V1 permanentemente.

---

## 7. Dedup client-side usando localStorage bloqueia import no Supabase

**Sintoma:** Import Apple Health mostra "sucesso" mas 0 registros chegam ao Supabase. Dados so existem em localStorage.

**Causa raiz:** Antes de enviar ao Supabase, o codigo filtrava "duplicatas" lendo de `getWeightLogs()`, `getBodyFatLogs()`, `getWorkouts()` — todas funcoes de localStorage. Se o usuario ja tinha importado antes (offline ou antes de fazer login), todos os registros com datas iguais eram filtrados. O RPC recebia arrays vazios.

**Solucao:** Quando `user` esta presente (logado), enviar TODOS os dados ao Supabase sem dedup client-side. O servidor lida com duplicatas via `UNIQUE constraint + EXCEPTION WHEN unique_violation` no RPC. Dedup por localStorage so se aplica ao path offline.

**Licao:** Nunca usar localStorage como fonte de dedup quando o destino eh o servidor. Dual storage (Supabase + localStorage) exige logica de dedup separada para cada path.

---

## 8. Race condition: user null durante import

**Sintoma:** Dados vao para localStorage mesmo com usuario logado. Console mostra "⚠️ Dados salvos em localStorage (modo offline)".

**Causa raiz:** O `isLoading` do hook `useImportLogic` controlava apenas se o historico de import carregou (sincrono, localStorage). Nao esperava o `isLoading` do `useAuth()` (assincrono, `getSession()`). Se o usuario selecionava o ZIP antes do auth resolver, `user` era `null`.

**Solucao:** Combinar os dois loading states:
```typescript
const { user, isLoading: authLoading } = useAuth();
// ...
return { isLoading: isLoading || authLoading, ... };
```

**Licao:** Quando uma pagina depende de auth, sempre incluir o loading state do auth provider no loading da pagina. Nao assumir que auth resolve antes da UI ficar interativa.

---

## 9. EXCEPTION WHEN unique_violation nao captura CHECK violations

**Sintoma:** Um unico registro com peso fora de 30-300kg ou body fat fora de 1-60% causa rollback de TODA a importacao — inclusive registros validos ja inseridos.

**Causa raiz:** Os loops de INSERT no RPC `import_apple_health` tinham `EXCEPTION WHEN unique_violation` mas nao capturavam outros erros (check_violation, not_null_violation, etc). Em PostgreSQL, uma excecao nao capturada propaga para fora e faz rollback de toda a transacao.

**Solucao:** Adicionar `WHEN OTHERS` em todos os loops:
```sql
EXCEPTION
  WHEN unique_violation THEN v_duplicates := v_duplicates + 1;
  WHEN OTHERS THEN v_skipped := v_skipped + 1;
```

**Licao:** Em RPCs que processam lotes, sempre capturar `WHEN OTHERS` para que um registro ruim nao destrua o lote inteiro. Contar skipped para diagnostico.

---

## 10. Playwright strict mode violation com regex

**Sintoma:** Teste E2E falha com "strict mode violation: getByText(...) resolved to N elements".

**Causa raiz:** `page.getByText(/regex/)` encontra multiplos elementos no DOM que casam com a regex. Playwright no strict mode (padrão) rejeita quando mais de 1 elemento é encontrado.

**Solucao:** Adicionar `.first()` ao locator:
```typescript
await expect(page.getByText(/texto/i).first()).toBeVisible();
```

**Licao:** Sempre usar `.first()` quando a regex pode casar com mais de um elemento. Alternativa: usar texto mais específico ou `{ exact: true }`.

---

## 11. Dev server zombie bloqueia porta 3000

**Sintoma:** `npm run dev` falha com "Port 3000 is in use" e "Unable to acquire lock at .next/dev/lock".

**Causa raiz:** Processo Node.js da sessão anterior ficou rodando como zombie. O arquivo `.next/dev/lock` persiste.

**Solucao:**
```bash
taskkill //F //PID <PID>   # matar processo na porta
rm -f .next/dev/lock       # remover lock
npm run dev                # reiniciar
```

**Licao:** O script `dev:clean` do package.json ja resolve isso automaticamente no PowerShell.
