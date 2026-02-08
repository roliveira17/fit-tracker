-- ============================================
-- Queries para Verificar Dados Importados
-- Apple Health no Supabase
-- ============================================

-- 1. PESO (weight_logs)
-- Deve ter source = 'import_apple'
SELECT
  date,
  weight_kg,
  source,
  created_at
FROM weight_logs
WHERE source = 'import_apple'
ORDER BY date DESC
LIMIT 10;

-- 2. BODY FAT (body_fat_logs)
SELECT
  date,
  body_fat_pct,
  source,
  created_at
FROM body_fat_logs
WHERE source = 'import_apple'
ORDER BY date DESC
LIMIT 10;

-- 3. TREINOS (workouts)
SELECT
  date,
  workout_type,
  duration_min,
  calories_burned,
  source,
  created_at
FROM workouts
WHERE source = 'import_apple'
ORDER BY date DESC
LIMIT 10;

-- 4. SONO - Sessões (sleep_sessions)
SELECT
  date,
  start_time,
  end_time,
  total_minutes,
  source,
  created_at
FROM sleep_sessions
WHERE source = 'import_apple'
ORDER BY date DESC
LIMIT 10;

-- 5. SONO - Estágios (sleep_stages)
SELECT
  ss.date as sleep_date,
  st.stage,
  st.duration_min,
  st.percentage
FROM sleep_stages st
JOIN sleep_sessions ss ON ss.id = st.sleep_session_id
WHERE ss.source = 'import_apple'
ORDER BY ss.date DESC, st.stage
LIMIT 20;

-- ============================================
-- VERIFICAÇÕES DE DIAGNÓSTICO
-- ============================================

-- Total de registros por fonte
SELECT
  'weight_logs' as tabela,
  source,
  COUNT(*) as total
FROM weight_logs
GROUP BY source

UNION ALL

SELECT
  'body_fat_logs' as tabela,
  source,
  COUNT(*) as total
FROM body_fat_logs
GROUP BY source

UNION ALL

SELECT
  'workouts' as tabela,
  source,
  COUNT(*) as total
FROM workouts
GROUP BY source

UNION ALL

SELECT
  'sleep_sessions' as tabela,
  source,
  COUNT(*) as total
FROM sleep_sessions
GROUP BY source;

-- Histórico de importações
SELECT
  source,
  imported_at,
  records_count,
  duplicates_skipped,
  summary
FROM import_records
ORDER BY imported_at DESC
LIMIT 5;

-- ============================================
-- VERIFICAR SEU USER_ID
-- ============================================

-- Primeiro, descubra seu user_id atual
-- Execute no console do app:
-- const { data: { user } } = await supabase.auth.getUser();
-- console.log(user.id);

-- Depois, use aqui (substitua USER_ID_AQUI):
SELECT
  id,
  name,
  created_at
FROM profiles
WHERE id = 'USER_ID_AQUI';

-- Verificar dados com user_id específico
SELECT COUNT(*) as total_weight FROM weight_logs WHERE user_id = 'USER_ID_AQUI';
SELECT COUNT(*) as total_bodyfat FROM body_fat_logs WHERE user_id = 'USER_ID_AQUI';
SELECT COUNT(*) as total_workouts FROM workouts WHERE user_id = 'USER_ID_AQUI';
SELECT COUNT(*) as total_sleep FROM sleep_sessions WHERE user_id = 'USER_ID_AQUI';
