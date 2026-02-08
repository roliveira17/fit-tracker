Debug de import Apple Health. Siga este checklist em ordem:

## 1. Verificar estado do codigo

Leia estes arquivos e confirme que os fixes estao presentes:
- `lib/supabase.ts` (~linha 498-522) — deve ter `throw new Error` em vez de `return null`
- `hooks/useImportLogic.ts` (~linha 147-240) — deve separar Supabase (logado) vs localStorage (offline)
- `lib/import/appleHealthMapper.ts` — deve ter logs `[mapSleepSessions]`

## 2. Verificar armadilhas conhecidas

Leia `docs/learnings/armadilhas.md` e confirme:
- RPC `import_apple_health` nao tem ambiguidade (deve passar `p_glucose: []`)
- CHECK constraint de `import_records` aceita `'apple_health'`
- `getGlucoseStats` passa `p_user_id`

## 3. Testar dev server

```bash
npm run dev
```

Se der erro de porta, use:
```bash
npm run dev:clean
```

## 4. Simular fluxo de import

Indique ao usuario:
1. Abrir http://localhost:3000 e fazer login com Google
2. Ir para pagina "Importar"
3. Abrir DevTools (F12) > Console
4. Selecionar ZIP do Apple Health
5. Observar logs no console

## 5. Interpretar resultado

**Sucesso:**
```
[Import] Dados mapeados: { weights: X, bodyFat: X, workouts: X, sleep: X }
✓ Dados salvos no Supabase: N registros
```

**Falha no Supabase:**
```
Error importing Apple Health data: { message: "..." }
```
→ Verificar mensagem de erro especifica
→ Causas comuns: RLS, CHECK constraint, token expirado, RPC ambiguidade

**Sleep = 0:**
→ Ver `docs/learnings/apple-health-sleep-debug.md`
→ Verificar se valores de `SLEEP_VALUES` correspondem ao XML real

## 6. Verificar banco

Orientar usuario a rodar no SQL Editor do Supabase Dashboard:
```sql
SELECT 'weight_logs' as t, COUNT(*) FROM weight_logs WHERE source = 'import_apple'
UNION ALL
SELECT 'body_fat_logs', COUNT(*) FROM body_fat_logs WHERE source = 'import_apple'
UNION ALL
SELECT 'workouts', COUNT(*) FROM workouts WHERE source = 'import_apple'
UNION ALL
SELECT 'sleep_sessions', COUNT(*) FROM sleep_sessions WHERE source = 'import_apple';
```

Reporte o resultado e sugira proximo passo.