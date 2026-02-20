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

---

## 12. BottomNav duplicado — ScreenContainer + pagina

**Sintoma:** Aparece um "quadro" extra acima dos botoes de navegacao na Home, Profile e Insights. Dois conjuntos de tabs visiveis na tela.

**Causa raiz:** O `ScreenContainer` (layout) renderiza automaticamente um `<BottomNav />` fixo no fundo. Mas as paginas (Home, Insights, Profile) tambem renderizavam seu proprio `<BottomNav theme="light" />` dentro de `children`. Como ambos sao `position: fixed`, sobrepoem — e o segundo aparece como bloco inline no conteudo scrollavel.

Agravante: existiam **dois componentes BottomNav diferentes**:
- `components/layout/BottomNav.tsx` — antigo (dark, 5 tabs, Lucide icons)
- `components/ui/BottomNav.tsx` — novo (light, 4 tabs, Material Symbols)

**Solucao:**
1. Remover `<BottomNav>` de todas as paginas (Home, Insights, Profile)
2. Atualizar `layout/BottomNav.tsx` para usar tema light + Material Symbols
3. ScreenContainer como unica fonte de BottomNav

**Licao:** Quando um wrapper (ScreenContainer) ja renderiza navegacao, as paginas internas NUNCA devem renderizar navegacao propria. Um unico ponto de controle para nav evita duplicacoes.

---

## 13. Insights page nao abre — auth race condition + non-null assertions

**Sintoma:** Pagina Insights mostra tela branca. Sem erro no console, build passa normalmente.

**Causa raiz (multipla):**
1. Auth race condition: pagina tentava carregar dados do Supabase antes do `authLoading` resolver
2. Profile sempre lido de localStorage, mesmo com usuario logado
3. Sem try/catch nas chamadas ao Supabase — erro silencioso
4. Non-null assertions (`data!.field`) em secoes de dominio causavam crash se dados null
5. Double padding: ScreenContainer ja aplicava `pb-24`, pagina adicionava `px-4 pb-24` extra

**Solucao:**
1. Adicionar `authLoading` do `useAuth()` como guard
2. `getProfile()` do Supabase quando autenticado, localStorage como fallback
3. try/catch com console.error em todas as chamadas Supabase
4. Guards condicionais (`data &&`) antes de renderizar secoes
5. Remover padding duplicado da pagina

**Licao:** Paginas que dependem de auth precisam SEMPRE esperar `authLoading` antes de tentar carregar dados. Build passando (sem erros TS) nao garante que a pagina funciona — problemas de runtime (null, race condition) nao aparecem no build.

---

## 14. Merge conflict ao mergear PR com master divergente

**Sintoma:** `gh pr merge` falha com "not mergeable: the merge commit cannot be cleanly created".

**Causa raiz:** Outra sessao ja havia mergeado commits na master que conflitavam com arquivos da branch (ROADMAP.md, settings.local.json).

**Solucao:**
```bash
git stash                    # stash local changes
git fetch origin master
git merge origin/master      # resolve conflicts locally
# resolver conflitos manualmente
git add . && git commit
git push
gh pr merge --merge --delete-branch
```

**Licao:** Antes de mergear PR, sempre `git fetch origin master` e verificar se ha divergencia. Se a PR tem vida longa (varios dias), conflicts sao quase garantidos.

---

## 15. Insights crash — RPC retorna dados incompletos (glucose undefined)

**Sintoma:** Pagina `/insights` crasha com "Application error: a client-side exception has occurred" em producao.

**Causa raiz:** A RPC `get_insights` na versao antiga (migration inicial) nao retornava os campos `glucose`, `carbs_by_day`, `fat_by_day`, `body_fat_by_day`, `top_foods`. O codigo TypeScript assumia que `glucose` era sempre um objeto com `by_day: []`, mas recebia `undefined`. O acesso `insightsDouble.glucose.by_day.length` em `insights-deltas.ts:89` causava `TypeError: Cannot read properties of undefined (reading 'by_day')`.

**Solucao:**
1. Normalizer `normalizeInsightsData()` em `getInsights()` garante todos os campos com defaults seguros
2. Optional chaining `?.` em `insights-deltas.ts` e `insights-correlations.ts` para acesso ao glucose
3. Fallbacks em `supabaseToUserProfile()` para `birth_date`, `weight_kg`, `height_cm`

**Licao:** Nunca confiar que uma RPC retorna todos os campos esperados pela interface TypeScript. Migrations podem nao ter sido aplicadas, ou versoes antigas podem estar rodando. Sempre normalizar dados na fronteira (funcao que chama a RPC) com defaults seguros.

---

## 16. Supabase free tier pausa projeto apos inatividade

**Sintoma:** Login com Google falha com `DNS_PROBE_FINISHED_NXDOMAIN` em `bsutppgtcihgzdblxfqc.supabase.co`.

**Causa raiz:** Supabase free tier pausa projetos apos periodo de inatividade. O DNS do projeto para de resolver, causando falha em todas as chamadas.

**Solucao:** Acessar https://supabase.com/dashboard, localizar o projeto e clicar "Restore". DNS propaga em ~2 minutos.

**Licao:** Se o app para de funcionar com erro de DNS no Supabase, primeiro verificar se o projeto esta pausado no dashboard. Free tier pausa automaticamente.

---

## 17. useState usado como useRef — setState durante render

**Sintoma:** EditMealSheet crasha ao abrir com "Too many re-renders" ou tela branca. Botao "Registrar no diario" do PhotoAnalysisCard nao funciona.

**Causa raiz:** Codigo usava `useState(foods)[0]` como se fosse `useRef` para rastrear valor anterior de prop, e chamava `setItems(foods)` diretamente no corpo do render (fora de useEffect). Isso viola regras do React e causa loop infinito de re-renders.

```tsx
// ERRADO — setState durante render
const prevFoodsRef = useState(foods)[0];
if (prevFoodsRef !== foods && foods.length > 0) {
  setItems(foods);  // loop infinito
}
```

**Solucao:**
```tsx
// CORRETO — useEffect para sincronizar prop → state
useEffect(() => {
  if (foods.length > 0) setItems(foods);
}, [foods]);
```

**Licao:** Nunca chamar setState durante o render. Para sincronizar state com props, usar useEffect. Se precisar do valor anterior de uma prop, usar useRef (nao useState).

---

## 18. Migration aplicada parcialmente — CREATE OR REPLACE nao garante versao correta

**Sintoma:** `get_insights()` retornava dados mas sem o campo `glucose`. A funcao existia no Supabase, mas era uma versao anterior que nao incluia o bloco glucose.

**Causa raiz:** `CREATE OR REPLACE FUNCTION` foi executado numa versao anterior da migration que nao tinha o bloco glucose. Como a assinatura era a mesma, o PostgreSQL aceitou sem erro. Quando a migration completa (com glucose) foi criada no repositorio, ninguem percebeu que a versao no Supabase estava desatualizada.

**Solucao:** Verificar o conteudo real da funcao no Supabase (via `pg_proc.prosrc`) e reaplicar com a versao completa.

**Licao:** `CREATE OR REPLACE` nao falha se a funcao ja existe — silenciosamente mantem a versao antiga se nao for re-executado. Ao adicionar campos a uma RPC existente, sempre verificar que a versao correta esta no servidor, nao apenas que a funcao existe.

---

## 19. Sleep import descarta dados de usuarios sem Apple Watch

**Sintoma:** Import Apple Health mostra "0 sessoes de sono" mesmo com dados de sono no XML.

**Causa raiz:** O mapper `mapSleepSessions()` so contava minutos para estagios granulares (ASLEEP_DEEP, ASLEEP_REM, ASLEEP_CORE). O estagio `IN_BED` — o unico presente em exports de iPhone sem Apple Watch — era ignorado. Como `totalMinutes` ficava 0, a condicao `totalMinutes > 0` falhava e a sessao era descartada.

**Solucao:** Adicionar fallback: se `totalMinutes === 0` mas `inBedMinutes > 0`, usar IN_BED como sono leve (core).

**Licao:** Apple Health exporta dados diferentes dependendo do hardware. iPhone sem Watch so gera `HKCategoryValueSleepAnalysisInBed`. Sempre testar com exports de diferentes configuracoes de hardware.
