-- ============================================
-- FIT TRACK v3 - Seed Data for Testing
-- ============================================
-- Este script popula o banco com dados de teste
-- Substitua 'USER_ID_HERE' pelo UUID do usuário de teste
--
-- Para executar:
-- 1. No Supabase Dashboard, vá em SQL Editor
-- 2. Substitua USER_ID_HERE pelo seu user_id (da tabela auth.users)
-- 3. Execute o script

-- ============================================
-- CONFIGURAÇÃO
-- ============================================
-- Defina o USER_ID aqui (substitua pelo UUID real):
-- DO $$
-- DECLARE
--   v_user_id UUID := 'USER_ID_HERE';
-- BEGIN

-- ============================================
-- PESO (últimos 30 dias)
-- ============================================
-- INSERT INTO weight_logs (user_id, weight_kg, date, source)
-- SELECT
--   v_user_id,
--   82.5 - (random() * 2) + (ROW_NUMBER() OVER () * -0.1), -- Tendência de queda
--   CURRENT_DATE - (30 - ROW_NUMBER() OVER ())::INTEGER,
--   'manual'
-- FROM generate_series(1, 8);

-- Exemplo manual (copie e substitua USER_ID_HERE):
/*
INSERT INTO weight_logs (user_id, weight_kg, date, source) VALUES
('USER_ID_HERE', 82.5, CURRENT_DATE - 28, 'manual'),
('USER_ID_HERE', 82.2, CURRENT_DATE - 21, 'manual'),
('USER_ID_HERE', 81.8, CURRENT_DATE - 14, 'manual'),
('USER_ID_HERE', 81.5, CURRENT_DATE - 7, 'manual'),
('USER_ID_HERE', 81.0, CURRENT_DATE, 'manual');
*/

-- ============================================
-- BODY FAT
-- ============================================
/*
INSERT INTO body_fat_logs (user_id, body_fat_pct, date, source) VALUES
('USER_ID_HERE', 22.5, CURRENT_DATE - 28, 'manual'),
('USER_ID_HERE', 22.2, CURRENT_DATE - 14, 'manual'),
('USER_ID_HERE', 21.8, CURRENT_DATE, 'manual');
*/

-- ============================================
-- REFEIÇÕES (últimos 7 dias)
-- ============================================
/*
-- Café da manhã típico
INSERT INTO meals (user_id, meal_type, date, total_calories, total_protein_g, total_carbs_g, total_fat_g, source, raw_text) VALUES
('USER_ID_HERE', 'breakfast', CURRENT_DATE - 6, 450, 25, 40, 20, 'chat', '2 ovos, 2 fatias de pão integral, café'),
('USER_ID_HERE', 'breakfast', CURRENT_DATE - 5, 380, 30, 25, 15, 'chat', 'Omelete de 3 ovos com queijo'),
('USER_ID_HERE', 'breakfast', CURRENT_DATE - 4, 420, 22, 50, 18, 'chat', 'Aveia com whey e banana'),
('USER_ID_HERE', 'breakfast', CURRENT_DATE - 3, 450, 25, 40, 20, 'chat', '2 ovos, pão, café'),
('USER_ID_HERE', 'breakfast', CURRENT_DATE - 2, 350, 28, 30, 12, 'chat', 'Iogurte grego com granola'),
('USER_ID_HERE', 'breakfast', CURRENT_DATE - 1, 400, 35, 20, 18, 'chat', 'Omelete proteica'),
('USER_ID_HERE', 'breakfast', CURRENT_DATE, 380, 26, 35, 16, 'chat', 'Pão com ovos e queijo');

-- Almoço
INSERT INTO meals (user_id, meal_type, date, total_calories, total_protein_g, total_carbs_g, total_fat_g, source, raw_text) VALUES
('USER_ID_HERE', 'lunch', CURRENT_DATE - 6, 650, 45, 60, 25, 'chat', 'Arroz, feijão, frango grelhado, salada'),
('USER_ID_HERE', 'lunch', CURRENT_DATE - 5, 720, 50, 55, 30, 'chat', 'Arroz integral, carne moída, legumes'),
('USER_ID_HERE', 'lunch', CURRENT_DATE - 4, 580, 40, 45, 28, 'chat', 'Macarrão com frango desfiado'),
('USER_ID_HERE', 'lunch', CURRENT_DATE - 3, 680, 48, 58, 26, 'chat', 'Arroz, feijão, bife, salada'),
('USER_ID_HERE', 'lunch', CURRENT_DATE - 2, 750, 55, 50, 35, 'chat', 'Churrasco com salada'),
('USER_ID_HERE', 'lunch', CURRENT_DATE - 1, 620, 42, 55, 24, 'chat', 'Arroz, feijão, peixe grelhado'),
('USER_ID_HERE', 'lunch', CURRENT_DATE, 650, 45, 58, 26, 'chat', 'Arroz, frango, legumes');

-- Jantar
INSERT INTO meals (user_id, meal_type, date, total_calories, total_protein_g, total_carbs_g, total_fat_g, source, raw_text) VALUES
('USER_ID_HERE', 'dinner', CURRENT_DATE - 6, 480, 35, 30, 25, 'chat', 'Salmão com batata doce'),
('USER_ID_HERE', 'dinner', CURRENT_DATE - 5, 420, 38, 20, 22, 'chat', 'Frango grelhado com salada'),
('USER_ID_HERE', 'dinner', CURRENT_DATE - 4, 380, 32, 25, 18, 'chat', 'Omelete com salada'),
('USER_ID_HERE', 'dinner', CURRENT_DATE - 3, 520, 40, 35, 24, 'chat', 'Carne com legumes'),
('USER_ID_HERE', 'dinner', CURRENT_DATE - 2, 450, 36, 28, 22, 'chat', 'Peixe assado com batata'),
('USER_ID_HERE', 'dinner', CURRENT_DATE - 1, 400, 34, 22, 20, 'chat', 'Frango com brócolis'),
('USER_ID_HERE', 'dinner', CURRENT_DATE, 480, 38, 30, 23, 'chat', 'Carne moída com abobrinha');

-- Lanches
INSERT INTO meals (user_id, meal_type, date, total_calories, total_protein_g, total_carbs_g, total_fat_g, source, raw_text) VALUES
('USER_ID_HERE', 'snack', CURRENT_DATE - 5, 180, 25, 8, 5, 'chat', 'Whey protein'),
('USER_ID_HERE', 'snack', CURRENT_DATE - 4, 200, 8, 25, 10, 'chat', 'Banana com pasta de amendoim'),
('USER_ID_HERE', 'snack', CURRENT_DATE - 2, 150, 22, 5, 4, 'chat', 'Shake de whey'),
('USER_ID_HERE', 'snack', CURRENT_DATE, 120, 5, 18, 4, 'chat', 'Iogurte natural');
*/

-- ============================================
-- TREINOS (última semana)
-- ============================================
/*
INSERT INTO workouts (user_id, workout_type, date, duration_min, calories_burned, source, raw_text) VALUES
('USER_ID_HERE', 'strength', CURRENT_DATE - 6, 65, 280, 'chat', 'Treino de peito e tríceps'),
('USER_ID_HERE', 'cardio', CURRENT_DATE - 5, 35, 380, 'chat', 'Corrida 5km'),
('USER_ID_HERE', 'strength', CURRENT_DATE - 4, 70, 320, 'chat', 'Treino de costas e bíceps'),
('USER_ID_HERE', 'cardio', CURRENT_DATE - 3, 25, 280, 'chat', 'HIIT'),
('USER_ID_HERE', 'strength', CURRENT_DATE - 2, 75, 350, 'chat', 'Treino de pernas'),
('USER_ID_HERE', 'cardio', CURRENT_DATE - 1, 40, 350, 'chat', 'Natação'),
('USER_ID_HERE', 'strength', CURRENT_DATE, 60, 260, 'chat', 'Treino de ombros');

-- Exercícios detalhados
INSERT INTO workout_sets (workout_id, exercise_name, sets, reps, weight_kg)
SELECT w.id, 'Supino Reto', 4, 10, 80
FROM workouts w WHERE w.raw_text = 'Treino de peito e tríceps' AND w.user_id = 'USER_ID_HERE';

INSERT INTO workout_sets (workout_id, exercise_name, sets, reps, weight_kg)
SELECT w.id, 'Supino Inclinado', 3, 12, 60
FROM workouts w WHERE w.raw_text = 'Treino de peito e tríceps' AND w.user_id = 'USER_ID_HERE';

INSERT INTO workout_sets (workout_id, exercise_name, sets, reps, weight_kg)
SELECT w.id, 'Tríceps Corda', 3, 15, 25
FROM workouts w WHERE w.raw_text = 'Treino de peito e tríceps' AND w.user_id = 'USER_ID_HERE';
*/

-- ============================================
-- GLICEMIA (última semana)
-- ============================================
/*
INSERT INTO glucose_logs (user_id, glucose_mg_dl, date, time, measurement_type, source) VALUES
-- Dia -6
('USER_ID_HERE', 95, CURRENT_DATE - 6, '06:30:00', 'fasting', 'manual'),
('USER_ID_HERE', 142, CURRENT_DATE - 6, '09:30:00', 'post_meal', 'manual'),
('USER_ID_HERE', 88, CURRENT_DATE - 6, '12:00:00', 'pre_meal', 'manual'),
('USER_ID_HERE', 138, CURRENT_DATE - 6, '14:15:00', 'post_meal', 'manual'),
('USER_ID_HERE', 105, CURRENT_DATE - 6, '22:30:00', 'bedtime', 'manual'),

-- Dia -5
('USER_ID_HERE', 92, CURRENT_DATE - 5, '06:45:00', 'fasting', 'manual'),
('USER_ID_HERE', 155, CURRENT_DATE - 5, '09:00:00', 'post_meal', 'manual'),
('USER_ID_HERE', 90, CURRENT_DATE - 5, '12:30:00', 'pre_meal', 'manual'),
('USER_ID_HERE', 145, CURRENT_DATE - 5, '14:30:00', 'post_meal', 'manual'),

-- Dia -4
('USER_ID_HERE', 88, CURRENT_DATE - 4, '07:00:00', 'fasting', 'manual'),
('USER_ID_HERE', 130, CURRENT_DATE - 4, '09:15:00', 'post_meal', 'manual'),
('USER_ID_HERE', 85, CURRENT_DATE - 4, '12:00:00', 'pre_meal', 'manual'),
('USER_ID_HERE', 128, CURRENT_DATE - 4, '14:00:00', 'post_meal', 'manual'),
('USER_ID_HERE', 100, CURRENT_DATE - 4, '23:00:00', 'bedtime', 'manual'),

-- Dia -3
('USER_ID_HERE', 90, CURRENT_DATE - 3, '06:30:00', 'fasting', 'manual'),
('USER_ID_HERE', 148, CURRENT_DATE - 3, '09:30:00', 'post_meal', 'manual'),
('USER_ID_HERE', 92, CURRENT_DATE - 3, '12:15:00', 'pre_meal', 'manual'),
('USER_ID_HERE', 140, CURRENT_DATE - 3, '14:30:00', 'post_meal', 'manual'),

-- Dia -2
('USER_ID_HERE', 94, CURRENT_DATE - 2, '07:00:00', 'fasting', 'manual'),
('USER_ID_HERE', 135, CURRENT_DATE - 2, '09:00:00', 'post_meal', 'manual'),
('USER_ID_HERE', 88, CURRENT_DATE - 2, '12:00:00', 'pre_meal', 'manual'),
('USER_ID_HERE', 132, CURRENT_DATE - 2, '14:15:00', 'post_meal', 'manual'),
('USER_ID_HERE', 102, CURRENT_DATE - 2, '22:45:00', 'bedtime', 'manual'),

-- Dia -1
('USER_ID_HERE', 91, CURRENT_DATE - 1, '06:45:00', 'fasting', 'manual'),
('USER_ID_HERE', 140, CURRENT_DATE - 1, '09:15:00', 'post_meal', 'manual'),
('USER_ID_HERE', 86, CURRENT_DATE - 1, '12:30:00', 'pre_meal', 'manual'),
('USER_ID_HERE', 130, CURRENT_DATE - 1, '14:30:00', 'post_meal', 'manual'),

-- Hoje
('USER_ID_HERE', 89, CURRENT_DATE, '06:30:00', 'fasting', 'manual'),
('USER_ID_HERE', 138, CURRENT_DATE, '09:30:00', 'post_meal', 'manual'),
('USER_ID_HERE', 90, CURRENT_DATE, '12:00:00', 'pre_meal', 'manual');
*/

-- ============================================
-- SONO (última semana)
-- ============================================
/*
INSERT INTO sleep_sessions (user_id, date, start_time, end_time, source) VALUES
('USER_ID_HERE', CURRENT_DATE - 6, (CURRENT_DATE - 6)::timestamp + interval '23 hours 15 minutes', (CURRENT_DATE - 5)::timestamp + interval '6 hours 45 minutes', 'manual'),
('USER_ID_HERE', CURRENT_DATE - 5, (CURRENT_DATE - 5)::timestamp + interval '23 hours', (CURRENT_DATE - 4)::timestamp + interval '7 hours', 'manual'),
('USER_ID_HERE', CURRENT_DATE - 4, (CURRENT_DATE - 4)::timestamp + interval '22 hours 45 minutes', (CURRENT_DATE - 3)::timestamp + interval '6 hours 30 minutes', 'manual'),
('USER_ID_HERE', CURRENT_DATE - 3, (CURRENT_DATE - 3)::timestamp + interval '23 hours 30 minutes', (CURRENT_DATE - 2)::timestamp + interval '7 hours 15 minutes', 'manual'),
('USER_ID_HERE', CURRENT_DATE - 2, (CURRENT_DATE - 2)::timestamp + interval '23 hours', (CURRENT_DATE - 1)::timestamp + interval '6 hours 45 minutes', 'manual'),
('USER_ID_HERE', CURRENT_DATE - 1, (CURRENT_DATE - 1)::timestamp + interval '22 hours 30 minutes', CURRENT_DATE::timestamp + interval '6 hours 15 minutes', 'manual');

-- Estágios de sono para a última noite
INSERT INTO sleep_stages (sleep_session_id, stage, duration_min, percentage)
SELECT s.id, stage, duration, pct FROM sleep_sessions s
CROSS JOIN (VALUES
  ('light', 180, 40),
  ('deep', 90, 20),
  ('rem', 100, 22),
  ('awake', 15, 3)
) AS stages(stage, duration, pct)
WHERE s.date = CURRENT_DATE - 1 AND s.user_id = 'USER_ID_HERE';
*/

-- ============================================
-- COMO USAR
-- ============================================
-- 1. Encontre seu user_id:
--    SELECT id, email FROM auth.users;
--
-- 2. Descomente as seções desejadas acima
--
-- 3. Substitua 'USER_ID_HERE' pelo UUID encontrado
--
-- 4. Execute o script no SQL Editor do Supabase
--
-- 5. Verifique os dados:
--    SELECT * FROM meals WHERE user_id = 'seu_user_id' ORDER BY date DESC LIMIT 5;
--    SELECT * FROM workouts WHERE user_id = 'seu_user_id' ORDER BY date DESC LIMIT 5;
--    SELECT * FROM glucose_logs WHERE user_id = 'seu_user_id' ORDER BY date DESC LIMIT 10;
