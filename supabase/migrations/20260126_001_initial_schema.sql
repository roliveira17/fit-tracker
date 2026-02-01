-- ============================================
-- FIT TRACK v3 - Initial Schema
-- ============================================

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Função para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLE: profiles
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('masculino', 'feminino')),
  birth_date DATE NOT NULL,
  height_cm INTEGER NOT NULL CHECK (height_cm >= 100 AND height_cm <= 250),
  weight_kg DECIMAL(5,2) NOT NULL CHECK (weight_kg >= 30 AND weight_kg <= 300),
  tdee_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- ============================================
-- TABLE: weight_logs
-- ============================================

CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,2) NOT NULL CHECK (weight_kg >= 30 AND weight_kg <= 300),
  date DATE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('chat', 'import_apple', 'import_hevy', 'manual')),
  raw_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_weight_logs_user_date ON weight_logs(user_id, date DESC);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weight_logs_all_own" ON weight_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TABLE: body_fat_logs
-- ============================================

CREATE TABLE body_fat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body_fat_pct DECIMAL(4,2) NOT NULL CHECK (body_fat_pct >= 1 AND body_fat_pct <= 60),
  date DATE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('chat', 'import_apple', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_body_fat_logs_user_date ON body_fat_logs(user_id, date DESC);

ALTER TABLE body_fat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "body_fat_logs_all_own" ON body_fat_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TABLE: meals + meal_items
-- ============================================

CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  date DATE NOT NULL,
  total_calories INTEGER,
  total_protein_g DECIMAL(6,2),
  total_carbs_g DECIMAL(6,2),
  total_fat_g DECIMAL(6,2),
  source TEXT NOT NULL CHECK (source IN ('chat', 'import_apple', 'manual')),
  raw_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meals_user_date ON meals(user_id, date DESC);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meals_all_own" ON meals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  food_id UUID,
  food_name TEXT NOT NULL,
  quantity_g DECIMAL(7,2) NOT NULL,
  calories INTEGER NOT NULL,
  protein_g DECIMAL(6,2),
  carbs_g DECIMAL(6,2),
  fat_g DECIMAL(6,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meal_items_meal ON meal_items(meal_id);

ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_items_all_own" ON meal_items
  FOR ALL USING (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()));

-- ============================================
-- TABLE: workouts + workout_sets
-- ============================================

CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workout_type TEXT CHECK (workout_type IN ('cardio', 'strength', 'mixed')),
  date DATE NOT NULL,
  duration_min INTEGER,
  calories_burned INTEGER,
  avg_hr INTEGER,
  source TEXT NOT NULL CHECK (source IN ('chat', 'import_apple', 'import_hevy', 'manual')),
  raw_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workouts_user_date ON workouts(user_id, date DESC);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workouts_all_own" ON workouts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight_kg DECIMAL(5,2),
  duration_min INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workout_sets_workout ON workout_sets(workout_id);

ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_sets_all_own" ON workout_sets
  FOR ALL USING (EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_sets.workout_id AND workouts.user_id = auth.uid()));

-- ============================================
-- TABLE: sleep_sessions + sleep_stages
-- ============================================

CREATE TABLE sleep_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  total_minutes INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER / 60) STORED,
  source TEXT NOT NULL CHECK (source IN ('import_apple', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_sleep_sessions_user_date ON sleep_sessions(user_id, date DESC);

ALTER TABLE sleep_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sleep_sessions_all_own" ON sleep_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE sleep_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sleep_session_id UUID NOT NULL REFERENCES sleep_sessions(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('awake', 'light', 'deep', 'rem')),
  duration_min INTEGER NOT NULL,
  percentage DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sleep_stages_session ON sleep_stages(sleep_session_id);

ALTER TABLE sleep_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sleep_stages_all_own" ON sleep_stages
  FOR ALL USING (EXISTS (SELECT 1 FROM sleep_sessions WHERE sleep_sessions.id = sleep_stages.sleep_session_id AND sleep_sessions.user_id = auth.uid()));

-- ============================================
-- TABLE: foods
-- ============================================

CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  serving_g INTEGER NOT NULL DEFAULT 100,
  calories_per_100g INTEGER NOT NULL,
  protein_per_100g DECIMAL(5,2),
  carbs_per_100g DECIMAL(5,2),
  fat_per_100g DECIMAL(5,2),
  aliases TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_foods_name ON foods USING gin(to_tsvector('portuguese', name));
CREATE INDEX idx_foods_aliases ON foods USING gin(aliases);
CREATE INDEX idx_foods_user ON foods(user_id);

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "foods_select" ON foods
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "foods_insert_own" ON foods
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "foods_update_own" ON foods
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "foods_delete_own" ON foods
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- TABLE: import_records
-- ============================================

CREATE TABLE import_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('apple_health', 'hevy')),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  records_count INTEGER NOT NULL,
  duplicates_skipped INTEGER NOT NULL DEFAULT 0,
  summary JSONB
);

CREATE INDEX idx_import_records_user ON import_records(user_id, imported_at DESC);

ALTER TABLE import_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_records_all_own" ON import_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SEED: foods (alimentos globais)
-- ============================================

INSERT INTO foods (user_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, aliases) VALUES
(NULL, 'Arroz branco cozido', 130, 2.7, 28, 0.3, ARRAY['arroz', 'arroz branco']),
(NULL, 'Feijão carioca cozido', 76, 4.8, 14, 0.5, ARRAY['feijão', 'feijao']),
(NULL, 'Frango grelhado', 165, 31, 0, 3.6, ARRAY['frango', 'peito de frango']),
(NULL, 'Ovo cozido', 155, 13, 1.1, 11, ARRAY['ovo', 'ovos']),
(NULL, 'Banana', 89, 1.1, 23, 0.3, ARRAY['banana prata', 'banana nanica']),
(NULL, 'Maçã', 52, 0.3, 14, 0.2, ARRAY['maca']),
(NULL, 'Batata doce cozida', 86, 1.6, 20, 0.1, ARRAY['batata doce']),
(NULL, 'Pão francês', 289, 8, 57, 3.1, ARRAY['pao', 'pão']),
(NULL, 'Leite integral', 61, 3.2, 4.8, 3.3, ARRAY['leite']),
(NULL, 'Queijo mussarela', 280, 22, 2.2, 21, ARRAY['mussarela', 'queijo']),
(NULL, 'Carne bovina (patinho)', 219, 35, 0, 8, ARRAY['carne', 'bife', 'patinho']),
(NULL, 'Salmão grelhado', 208, 20, 0, 13, ARRAY['salmão', 'salmao']),
(NULL, 'Brócolis cozido', 35, 2.4, 7, 0.4, ARRAY['brócolis', 'brocolis']),
(NULL, 'Aveia', 389, 17, 66, 7, ARRAY['aveia em flocos']),
(NULL, 'Iogurte natural', 59, 3.5, 4.7, 3.3, ARRAY['iogurte']),
(NULL, 'Azeite de oliva', 884, 0, 0, 100, ARRAY['azeite']),
(NULL, 'Amendoim torrado', 567, 26, 16, 49, ARRAY['amendoim']),
(NULL, 'Whey protein', 400, 80, 8, 4, ARRAY['whey', 'proteina']),
(NULL, 'Macarrão cozido', 131, 5, 25, 1.1, ARRAY['macarrão', 'massa', 'espaguete']);

-- ============================================
-- FUNCTIONS
-- ============================================

-- get_bmr
CREATE OR REPLACE FUNCTION get_bmr(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_age INTEGER;
  v_bmr INTEGER;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  v_age := EXTRACT(YEAR FROM age(v_profile.birth_date));

  IF v_profile.gender = 'masculino' THEN
    v_bmr := ROUND(10 * v_profile.weight_kg + 6.25 * v_profile.height_cm - 5 * v_age + 5);
  ELSE
    v_bmr := ROUND(10 * v_profile.weight_kg + 6.25 * v_profile.height_cm - 5 * v_age - 161);
  END IF;

  RETURN v_bmr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_tdee
CREATE OR REPLACE FUNCTION get_tdee(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_bmr INTEGER;
  v_multiplier DECIMAL;
BEGIN
  v_bmr := get_bmr(p_user_id);
  SELECT tdee_multiplier INTO v_multiplier FROM profiles WHERE id = p_user_id;
  RETURN ROUND(v_bmr * v_multiplier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_home_summary
CREATE OR REPLACE FUNCTION get_home_summary(target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'date', target_date,
    'calories_in', COALESCE((SELECT SUM(total_calories) FROM meals WHERE user_id = auth.uid() AND date = target_date), 0),
    'calories_out', COALESCE((SELECT SUM(calories_burned) FROM workouts WHERE user_id = auth.uid() AND date = target_date), 0),
    'protein', COALESCE((SELECT SUM(total_protein_g) FROM meals WHERE user_id = auth.uid() AND date = target_date), 0),
    'carbs', COALESCE((SELECT SUM(total_carbs_g) FROM meals WHERE user_id = auth.uid() AND date = target_date), 0),
    'fat', COALESCE((SELECT SUM(total_fat_g) FROM meals WHERE user_id = auth.uid() AND date = target_date), 0),
    'weight', (SELECT weight_kg FROM weight_logs WHERE user_id = auth.uid() AND date <= target_date ORDER BY date DESC LIMIT 1),
    'workout_minutes', COALESCE((SELECT SUM(duration_min) FROM workouts WHERE user_id = auth.uid() AND date = target_date), 0)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_insights
CREATE OR REPLACE FUNCTION get_insights(period_days INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
  start_date DATE := CURRENT_DATE - period_days;
  result JSON;
BEGIN
  SELECT json_build_object(
    'period_days', period_days,
    'weights', COALESCE((SELECT json_agg(json_build_object('date', date, 'weight', weight_kg) ORDER BY date) FROM weight_logs WHERE user_id = auth.uid() AND date >= start_date), '[]'),
    'calories_by_day', COALESCE((SELECT json_agg(json_build_object('date', date, 'calories', daily_cal) ORDER BY date) FROM (SELECT date, SUM(total_calories) as daily_cal FROM meals WHERE user_id = auth.uid() AND date >= start_date GROUP BY date) sub), '[]'),
    'protein_by_day', COALESCE((SELECT json_agg(json_build_object('date', date, 'protein', daily_prot) ORDER BY date) FROM (SELECT date, SUM(total_protein_g) as daily_prot FROM meals WHERE user_id = auth.uid() AND date >= start_date GROUP BY date) sub), '[]'),
    'avg_sleep_stages', COALESCE((SELECT json_agg(json_build_object('stage', stage, 'avg_pct', avg_pct)) FROM (SELECT ss.stage, ROUND(AVG(ss.percentage)::numeric, 1) as avg_pct FROM sleep_stages ss JOIN sleep_sessions s ON s.id = ss.sleep_session_id WHERE s.user_id = auth.uid() AND s.date >= start_date GROUP BY ss.stage) sub), '[]')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- import_apple_health
CREATE OR REPLACE FUNCTION import_apple_health(
  p_weights JSONB DEFAULT '[]',
  p_body_fat JSONB DEFAULT '[]',
  p_workouts JSONB DEFAULT '[]',
  p_sleep JSONB DEFAULT '[]'
)
RETURNS JSON AS $$
DECLARE
  v_imported INTEGER := 0;
  v_duplicates INTEGER := 0;
  v_record JSONB;
  v_sleep_id UUID;
  v_stage JSONB;
BEGIN
  -- WEIGHTS
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_weights)
  LOOP
    BEGIN
      INSERT INTO weight_logs (user_id, weight_kg, date, source)
      VALUES (auth.uid(), (v_record->>'weight')::DECIMAL, (v_record->>'date')::DATE, 'import_apple');
      v_imported := v_imported + 1;
    EXCEPTION WHEN unique_violation THEN
      v_duplicates := v_duplicates + 1;
    END;
  END LOOP;

  -- BODY FAT
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_body_fat)
  LOOP
    BEGIN
      INSERT INTO body_fat_logs (user_id, body_fat_pct, date, source)
      VALUES (auth.uid(), (v_record->>'body_fat')::DECIMAL, (v_record->>'date')::DATE, 'import_apple');
      v_imported := v_imported + 1;
    EXCEPTION WHEN unique_violation THEN
      v_duplicates := v_duplicates + 1;
    END;
  END LOOP;

  -- WORKOUTS
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_workouts)
  LOOP
    INSERT INTO workouts (user_id, workout_type, date, duration_min, calories_burned, source)
    VALUES (
      auth.uid(),
      CASE
        WHEN (v_record->>'type') ILIKE '%run%' THEN 'cardio'
        WHEN (v_record->>'type') ILIKE '%strength%' THEN 'strength'
        ELSE 'mixed'
      END,
      (v_record->>'date')::DATE,
      (v_record->>'duration')::INTEGER,
      (v_record->>'calories')::INTEGER,
      'import_apple'
    );
    v_imported := v_imported + 1;
  END LOOP;

  -- SLEEP
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_sleep)
  LOOP
    BEGIN
      INSERT INTO sleep_sessions (user_id, date, start_time, end_time, source)
      VALUES (
        auth.uid(),
        (v_record->>'date')::DATE,
        (v_record->>'start')::TIMESTAMPTZ,
        (v_record->>'end')::TIMESTAMPTZ,
        'import_apple'
      )
      RETURNING id INTO v_sleep_id;

      FOR v_stage IN SELECT * FROM jsonb_array_elements(v_record->'stages')
      LOOP
        INSERT INTO sleep_stages (sleep_session_id, stage, duration_min, percentage)
        VALUES (v_sleep_id, v_stage->>'stage', (v_stage->>'duration')::INTEGER, (v_stage->>'pct')::DECIMAL);
      END LOOP;

      v_imported := v_imported + 1;
    EXCEPTION WHEN unique_violation THEN
      v_duplicates := v_duplicates + 1;
    END;
  END LOOP;

  -- LOG IMPORT
  INSERT INTO import_records (user_id, source, records_count, duplicates_skipped, summary)
  VALUES (
    auth.uid(), 'apple_health', v_imported, v_duplicates,
    jsonb_build_object('weights', jsonb_array_length(p_weights), 'body_fat', jsonb_array_length(p_body_fat), 'workouts', jsonb_array_length(p_workouts), 'sleep', jsonb_array_length(p_sleep))
  );

  RETURN json_build_object('imported', v_imported, 'duplicates_skipped', v_duplicates);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- import_hevy
CREATE OR REPLACE FUNCTION import_hevy(p_workouts JSONB DEFAULT '[]')
RETURNS JSON AS $$
DECLARE
  v_imported INTEGER := 0;
  v_workout JSONB;
  v_exercise JSONB;
  v_set JSONB;
  v_workout_id UUID;
  v_total_duration INTEGER;
BEGIN
  FOR v_workout IN SELECT * FROM jsonb_array_elements(p_workouts)
  LOOP
    v_total_duration := jsonb_array_length(v_workout->'exercises') * 10;

    INSERT INTO workouts (user_id, workout_type, date, duration_min, source, raw_text)
    VALUES (auth.uid(), 'strength', (v_workout->>'date')::DATE, v_total_duration, 'import_hevy', v_workout->>'name')
    RETURNING id INTO v_workout_id;

    FOR v_exercise IN SELECT * FROM jsonb_array_elements(v_workout->'exercises')
    LOOP
      FOR v_set IN SELECT * FROM jsonb_array_elements(v_exercise->'sets')
      LOOP
        INSERT INTO workout_sets (workout_id, exercise_name, sets, reps, weight_kg)
        VALUES (v_workout_id, v_exercise->>'name', 1, (v_set->>'reps')::INTEGER, (v_set->>'weight')::DECIMAL);
      END LOOP;
    END LOOP;

    v_imported := v_imported + 1;
  END LOOP;

  INSERT INTO import_records (user_id, source, records_count, duplicates_skipped, summary)
  VALUES (auth.uid(), 'hevy', v_imported, 0, jsonb_build_object('workouts', jsonb_array_length(p_workouts)));

  RETURN json_build_object('imported', v_imported, 'duplicates_skipped', 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- delete_imported_data
CREATE OR REPLACE FUNCTION delete_imported_data(p_source TEXT)
RETURNS JSON AS $$
DECLARE
  v_deleted INTEGER := 0;
  v_source_filter TEXT;
BEGIN
  IF p_source = 'apple_health' THEN
    v_source_filter := 'import_apple';
  ELSIF p_source = 'hevy' THEN
    v_source_filter := 'import_hevy';
  ELSE
    RETURN json_build_object('error', 'Invalid source');
  END IF;

  DELETE FROM weight_logs WHERE user_id = auth.uid() AND source = v_source_filter;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  DELETE FROM body_fat_logs WHERE user_id = auth.uid() AND source = v_source_filter;
  DELETE FROM workouts WHERE user_id = auth.uid() AND source = v_source_filter;
  DELETE FROM sleep_sessions WHERE user_id = auth.uid() AND source = v_source_filter;
  DELETE FROM import_records WHERE user_id = auth.uid() AND source = p_source;

  RETURN json_build_object('deleted', v_deleted);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
