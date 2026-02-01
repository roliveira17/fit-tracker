-- ============================================
-- FIX: Criar funções SECURITY DEFINER para todas as tabelas
-- Isso bypassa RLS e permite os foreign key checks funcionarem
-- ============================================

-- ============================================
-- WEIGHT LOGS
-- ============================================
CREATE OR REPLACE FUNCTION insert_weight_log(
  p_user_id UUID,
  p_weight_kg NUMERIC,
  p_date DATE,
  p_source TEXT,
  p_raw_text TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO weight_logs (user_id, weight_kg, date, source, raw_text)
  VALUES (p_user_id, p_weight_kg, p_date, p_source, p_raw_text)
  ON CONFLICT (user_id, date)
  DO UPDATE SET weight_kg = p_weight_kg, source = p_source, raw_text = p_raw_text
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- BODY FAT LOGS
-- ============================================
CREATE OR REPLACE FUNCTION insert_body_fat_log(
  p_user_id UUID,
  p_body_fat_pct NUMERIC,
  p_date DATE,
  p_source TEXT,
  p_raw_text TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO body_fat_logs (user_id, body_fat_pct, date, source, raw_text)
  VALUES (p_user_id, p_body_fat_pct, p_date, p_source, p_raw_text)
  ON CONFLICT (user_id, date)
  DO UPDATE SET body_fat_pct = p_body_fat_pct, source = p_source, raw_text = p_raw_text
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- WORKOUTS
-- ============================================
CREATE OR REPLACE FUNCTION insert_workout(
  p_user_id UUID,
  p_workout_type TEXT,
  p_date DATE,
  p_duration_min INTEGER DEFAULT NULL,
  p_calories_burned INTEGER DEFAULT NULL,
  p_source TEXT DEFAULT 'chat',
  p_raw_text TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO workouts (user_id, workout_type, date, duration_min, calories_burned, source, raw_text)
  VALUES (p_user_id, p_workout_type, p_date, p_duration_min, p_calories_burned, p_source, p_raw_text)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- WORKOUT SETS
-- ============================================
CREATE OR REPLACE FUNCTION insert_workout_set(
  p_workout_id UUID,
  p_exercise_name TEXT,
  p_sets INTEGER DEFAULT NULL,
  p_reps INTEGER DEFAULT NULL,
  p_weight_kg NUMERIC DEFAULT NULL,
  p_duration_min INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO workout_sets (workout_id, exercise_name, sets, reps, weight_kg, duration_min)
  VALUES (p_workout_id, p_exercise_name, p_sets, p_reps, p_weight_kg, p_duration_min)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GLUCOSE LOGS
-- ============================================
CREATE OR REPLACE FUNCTION insert_glucose_log(
  p_user_id UUID,
  p_glucose_mg_dl INTEGER,
  p_date DATE,
  p_time TIME,
  p_measurement_type TEXT,
  p_notes TEXT DEFAULT NULL,
  p_device TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'chat'
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO glucose_logs (user_id, glucose_mg_dl, date, time, measurement_type, notes, device, source)
  VALUES (p_user_id, p_glucose_mg_dl, p_date, p_time, p_measurement_type, p_notes, p_device, p_source)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT permissions para usuários autenticados
-- ============================================
GRANT EXECUTE ON FUNCTION insert_weight_log TO authenticated;
GRANT EXECUTE ON FUNCTION insert_body_fat_log TO authenticated;
GRANT EXECUTE ON FUNCTION insert_workout TO authenticated;
GRANT EXECUTE ON FUNCTION insert_workout_set TO authenticated;
GRANT EXECUTE ON FUNCTION insert_glucose_log TO authenticated;

-- Também para as funções de meal que já existem
GRANT EXECUTE ON FUNCTION insert_meal TO authenticated;
GRANT EXECUTE ON FUNCTION insert_meal_item TO authenticated;
