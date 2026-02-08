# Fix: Apple Health Import — Dados Não Persistiam no Supabase

**Data:** 2026-02-05
**Problema:** UI mostrava "Importado com sucesso" mas dados NÃO apareciam no Supabase
**Status:** ✅ CORRIGIDO (aguardando teste)

---

## Resumo do Bug

Quando usuário logado importava Apple Health ZIP:
1. ✅ Parsing funcionava
2. ✅ Mapeamento funcionava
3. ❌ **Supabase RPC falhava silenciosamente**
4. ✅ localStorage executava como fallback
5. ✅ UI mostrava "sucesso"
6. ❌ **Supabase ficava vazio**

**Resultado:** Usuário achava que dados foram salvos no servidor, mas estavam apenas em localStorage.

---

## Causa Raiz

### 3 Problemas no Código

**1. `importAppleHealth` retornava `null` em erro** (não lançava exceção)

```typescript
// ANTES (lib/supabase.ts:511-513)
if (error) {
  console.error("Error importing Apple Health data:", error);
  return null;  // ⚠️ Não lança exceção
}
```

**2. Try/catch não capturava porque não era exceção**

```typescript
// ANTES (hooks/useImportLogic.ts:184-186)
} catch (error) {
  console.error("Erro ao importar no Supabase:", error);
  // ⚠️ Nunca executava porque não houve throw
}
```

**3. localStorage sempre executava depois**

```typescript
// ANTES (hooks/useImportLogic.ts:189-197)
addedWeightLogs = newWeightLogs.length > 0
  ? saveWeightLogsBatch(newWeightLogs)  // ⚠️ Sempre executava
  : addedWeightLogs;
```

---

## Correção Implementada

### 1. `lib/supabase.ts` — Lançar Exceção

```typescript
// DEPOIS (linha 498-520)
export async function importAppleHealth(data: {
  // ...
}): Promise<{ imported: number; duplicates_skipped: number }> {  // ✅ Removeu "| null"
  const { data: result, error } = await supabase.rpc("import_apple_health", {
    // ...
  });

  if (error) {
    console.error("Error importing Apple Health data:", error);
    throw new Error(`Falha ao importar no Supabase: ${error.message}`);  // ✅ Lança exceção
  }

  if (!result) {
    throw new Error("Supabase retornou resultado vazio");  // ✅ Valida result
  }

  return result;
}
```

### 2. `hooks/useImportLogic.ts` — Separar Supabase vs localStorage

```typescript
// DEPOIS (linha 156-203)
if (user) {
  // ✅ Logado: EXIGE Supabase (não tenta localStorage)
  const supabaseResult = await importAppleHealth({
    weights: newWeightLogs.map(w => ({ weight: w.weight, date: w.date })),
    body_fat: newBodyFatLogs.map(b => ({ body_fat: b.percentage, date: b.date })),
    workouts: newWorkouts.map(w => ({ /* ... */ })),
    sleep: mappedData.sleepSessions.map(s => ({ /* ... */ }))
  });

  // ✅ Se chegou aqui sem erro, sucesso!
  addedWeightLogs = newWeightLogs.length;
  addedBodyFatLogs = newBodyFatLogs.length;
  addedWorkouts = newWorkouts.length;

  console.log(`✓ Dados salvos no Supabase: ${supabaseResult.imported} registros`);

} else {
  // ✅ Offline: usa localStorage
  addedWeightLogs = newWeightLogs.length > 0
    ? saveWeightLogsBatch(newWeightLogs)
    : 0;
  // ...
  console.log("⚠️ Dados salvos em localStorage (modo offline)");
}
```

### 3. Melhor Tratamento de Erro

```typescript
// DEPOIS (linha 233-247)
} catch (err) {
  console.error("Erro ao importar Apple Health:", err);

  const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
  const isSupabaseError = errorMessage.includes("Falha ao importar no Supabase");

  setImportStats({
    ...EMPTY_STATS,
    errors: [
      isSupabaseError
        ? `Erro ao salvar no servidor: ${errorMessage}`
        : "Erro ao processar arquivo. Verifique se é um ZIP válido do Apple Health.",
      isSupabaseError
        ? "Seus dados NÃO foram salvos. Tente novamente ou entre em contato com suporte."
        : ""
    ].filter(msg => msg.length > 0),
  });
  setImportStatus("error");
}
```

---

## Como Testar

### Passo 1: Iniciar Dev Server

```bash
npm run dev
```

### Passo 2: Login no App

Acesse http://localhost:3000 e faça login com Google.

### Passo 3: Importar ZIP

1. Navegue para página "Importar"
2. Selecione seu ZIP do Apple Health
3. **Abra DevTools (F12) → Console**

### Passo 4: Verificar Logs

**Sucesso esperado:**
```
[Import] Dados mapeados: { weights: 23, bodyFat: 21, workouts: 544, sleep: 0, ... }
✓ Dados salvos no Supabase: 588 registros, 0 duplicatas
```

**Erro (se houver):**
```
Error importing Apple Health data: { message: "...", ... }
Erro ao importar Apple Health: Error: Falha ao importar no Supabase: ...
```

### Passo 5: Verificar Supabase

Acesse SQL Editor: https://supabase.com/dashboard/project/bsutppgtcihgzdblxfqc/sql/new

Execute:

```sql
-- Ver dados importados
SELECT 'weight_logs' as tabela, COUNT(*) as total
FROM weight_logs
WHERE source = 'import_apple'

UNION ALL

SELECT 'body_fat_logs' as tabela, COUNT(*) as total
FROM body_fat_logs
WHERE source = 'import_apple'

UNION ALL

SELECT 'workouts' as tabela, COUNT(*) as total
FROM workouts
WHERE source = 'import_apple'

UNION ALL

SELECT 'sleep_sessions' as tabela, COUNT(*) as total
FROM sleep_sessions
WHERE source = 'import_apple';
```

**Resultado esperado:** Números > 0 nas tabelas com dados do seu ZIP.

### Passo 6: Verificar Dados Específicos

```sql
-- Últimos 10 pesos importados
SELECT date, weight_kg, created_at
FROM weight_logs
WHERE source = 'import_apple'
ORDER BY date DESC
LIMIT 10;

-- Últimos 10 treinos importados
SELECT date, workout_type, duration_min, calories_burned
FROM workouts
WHERE source = 'import_apple'
ORDER BY date DESC
LIMIT 10;
```

---

## Troubleshooting

### Se "Erro ao salvar no servidor" aparecer:

1. **Verifique auth:**
   ```javascript
   // No console do navegador:
   const { data: { user } } = await supabase.auth.getUser();
   console.log("User ID:", user?.id);
   console.log("Email:", user?.email);
   ```

2. **Verifique mensagem de erro completa** no console

3. **Possíveis causas:**
   - RLS bloqueando insert (verificar policies)
   - CHECK constraint falhando (ex: peso fora do range 30-300kg)
   - Conexão com Supabase falhando
   - Token de auth expirado

### Se localStorage está sendo usado quando deveria usar Supabase:

Verifique se `user` está undefined:
```javascript
// No console durante import:
console.log("User:", user);
```

---

## Checklist de Validação

- [ ] Import com usuário logado salva no Supabase ✓
- [ ] Dados aparecem nas queries SQL ✓
- [ ] Console mostra "✓ Dados salvos no Supabase"
- [ ] UI mostra "Importado" com números corretos
- [ ] Não aparecem erros no console
- [ ] localStorage NÃO é usado quando logado
- [ ] Import sem login ainda usa localStorage (fallback)
- [ ] Mensagem de erro clara quando Supabase falha

---

## Próximos Passos

Após confirmar que import funciona:
1. Testar dados de sono (item #2 do ROADMAP)
2. Verificar se `sleep_sessions` foi populada
3. Se `sleep: 0` nos logs, investigar parser de sono
4. Atualizar ROADMAP com status do teste

---

## Links Relacionados

- **ROADMAP:** Item #1 (pendência corrigida)
- **Plano completo:** `C:\Users\roger\.claude\plans\generic-marinating-flamingo.md`
- **Debug de sono:** `docs/learnings/apple-health-sleep-debug.md`
- **Armadilhas conhecidas:** `docs/learnings/armadilhas.md`
