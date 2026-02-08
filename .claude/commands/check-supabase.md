Verificar estado dos dados no Supabase. Monte as queries e oriente o usuario a executar no SQL Editor do Dashboard.

Dashboard: https://supabase.com/dashboard/project/bsutppgtcihgzdblxfqc/sql/new

## 1. Visao geral — contagem por tabela

```sql
SELECT 'profiles' as tabela, COUNT(*) as total FROM profiles
UNION ALL SELECT 'meals', COUNT(*) FROM meals
UNION ALL SELECT 'meal_items', COUNT(*) FROM meal_items
UNION ALL SELECT 'workouts', COUNT(*) FROM workouts
UNION ALL SELECT 'workout_sets', COUNT(*) FROM workout_sets
UNION ALL SELECT 'weight_logs', COUNT(*) FROM weight_logs
UNION ALL SELECT 'body_fat_logs', COUNT(*) FROM body_fat_logs
UNION ALL SELECT 'glucose_logs', COUNT(*) FROM glucose_logs
UNION ALL SELECT 'sleep_sessions', COUNT(*) FROM sleep_sessions
UNION ALL SELECT 'sleep_stages', COUNT(*) FROM sleep_stages
UNION ALL SELECT 'import_records', COUNT(*) FROM import_records
UNION ALL SELECT 'barcode_cache', COUNT(*) FROM barcode_cache
UNION ALL SELECT 'foods', COUNT(*) FROM foods
ORDER BY tabela;
```

## 2. Imports realizados

```sql
SELECT source, status, COUNT(*) as total, MAX(created_at) as ultimo
FROM import_records
GROUP BY source, status
ORDER BY ultimo DESC;
```

## 3. Dados recentes (ultimos 7 dias)

```sql
SELECT 'weight_logs' as t, COUNT(*) FROM weight_logs WHERE date >= NOW() - INTERVAL '7 days'
UNION ALL SELECT 'meals', COUNT(*) FROM meals WHERE date >= NOW() - INTERVAL '7 days'
UNION ALL SELECT 'workouts', COUNT(*) FROM workouts WHERE date >= NOW() - INTERVAL '7 days'
UNION ALL SELECT 'glucose_logs', COUNT(*) FROM glucose_logs WHERE reading_time >= NOW() - INTERVAL '7 days';
```

## 4. RPCs disponiveis

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

## 5. Interpretar e reportar

Apresente:
- Tabelas com dados vs tabelas vazias
- Ultimo import e de qual fonte
- Se ha dados recentes sendo inseridos
- Qualquer anomalia (tabela que deveria ter dados mas esta vazia)

Se encontrar problema, consulte `docs/learnings/armadilhas.md` para solucoes conhecidas.