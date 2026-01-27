-- ============================================
-- FIT TRACK v3 - Glucose Logs
-- ============================================
-- Nova tabela para armazenar dados de glicemia
-- Suporta medições manuais e CGM (continuous glucose monitor)

-- ============================================
-- TABLE: glucose_logs
-- ============================================

CREATE TABLE IF NOT EXISTS glucose_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  glucose_mg_dl INTEGER NOT NULL CHECK (glucose_mg_dl >= 20 AND glucose_mg_dl <= 600),
  date DATE NOT NULL,
  time TIME NOT NULL,
  measurement_type TEXT NOT NULL CHECK (measurement_type IN ('fasting', 'pre_meal', 'post_meal', 'bedtime', 'random', 'cgm')),
  notes TEXT,
  device TEXT,
  source TEXT NOT NULL CHECK (source IN ('chat', 'import_apple', 'import_csv', 'manual')) DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para queries por usuário e data
CREATE INDEX idx_glucose_logs_user_date ON glucose_logs(user_id, date DESC, time DESC);

-- Índice para queries por tipo de medição
CREATE INDEX idx_glucose_logs_type ON glucose_logs(user_id, measurement_type, date DESC);

-- RLS
ALTER TABLE glucose_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "glucose_logs_all_own" ON glucose_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Calcula média de glicemia em jejum dos últimos N dias
CREATE OR REPLACE FUNCTION get_avg_fasting_glucose(p_user_id UUID, p_days INTEGER DEFAULT 7)
RETURNS DECIMAL AS $$
DECLARE
  v_avg DECIMAL;
BEGIN
  SELECT AVG(glucose_mg_dl)::DECIMAL(5,1) INTO v_avg
  FROM glucose_logs
  WHERE user_id = p_user_id
    AND measurement_type = 'fasting'
    AND date >= CURRENT_DATE - p_days;
  RETURN v_avg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Retorna estatísticas de glicemia
CREATE OR REPLACE FUNCTION get_glucose_stats(p_user_id UUID, p_days INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'period_days', p_days,
    'avg_fasting', (
      SELECT ROUND(AVG(glucose_mg_dl)::numeric, 1)
      FROM glucose_logs
      WHERE user_id = p_user_id AND measurement_type = 'fasting' AND date >= CURRENT_DATE - p_days
    ),
    'avg_post_meal', (
      SELECT ROUND(AVG(glucose_mg_dl)::numeric, 1)
      FROM glucose_logs
      WHERE user_id = p_user_id AND measurement_type = 'post_meal' AND date >= CURRENT_DATE - p_days
    ),
    'min_glucose', (
      SELECT MIN(glucose_mg_dl)
      FROM glucose_logs
      WHERE user_id = p_user_id AND date >= CURRENT_DATE - p_days
    ),
    'max_glucose', (
      SELECT MAX(glucose_mg_dl)
      FROM glucose_logs
      WHERE user_id = p_user_id AND date >= CURRENT_DATE - p_days
    ),
    'readings_count', (
      SELECT COUNT(*)
      FROM glucose_logs
      WHERE user_id = p_user_id AND date >= CURRENT_DATE - p_days
    ),
    'time_in_range', (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE glucose_mg_dl BETWEEN 70 AND 140)::numeric /
         NULLIF(COUNT(*)::numeric, 0)) * 100, 1
      )
      FROM glucose_logs
      WHERE user_id = p_user_id AND date >= CURRENT_DATE - p_days
    ),
    'by_day', (
      SELECT COALESCE(json_agg(
        json_build_object('date', day_data.date, 'avg', day_data.avg_glucose, 'count', day_data.reading_count)
        ORDER BY day_data.date
      ), '[]')
      FROM (
        SELECT date, ROUND(AVG(glucose_mg_dl)::numeric, 1) as avg_glucose, COUNT(*) as reading_count
        FROM glucose_logs
        WHERE user_id = p_user_id AND date >= CURRENT_DATE - p_days
        GROUP BY date
      ) day_data
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ATUALIZAR get_insights PARA INCLUIR GLICEMIA
-- ============================================

CREATE OR REPLACE FUNCTION get_insights(period_days INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
  start_date DATE := CURRENT_DATE - period_days;
  result JSON;
BEGIN
  SELECT json_build_object(
    'period_days', period_days,
    'weights', COALESCE((
      SELECT json_agg(json_build_object('date', date, 'weight', weight_kg) ORDER BY date)
      FROM weight_logs WHERE user_id = auth.uid() AND date >= start_date
    ), '[]'),
    'calories_by_day', COALESCE((
      SELECT json_agg(json_build_object('date', date, 'calories', daily_cal) ORDER BY date)
      FROM (
        SELECT date, SUM(total_calories) as daily_cal
        FROM meals WHERE user_id = auth.uid() AND date >= start_date
        GROUP BY date
      ) sub
    ), '[]'),
    'protein_by_day', COALESCE((
      SELECT json_agg(json_build_object('date', date, 'protein', daily_prot) ORDER BY date)
      FROM (
        SELECT date, SUM(total_protein_g) as daily_prot
        FROM meals WHERE user_id = auth.uid() AND date >= start_date
        GROUP BY date
      ) sub
    ), '[]'),
    'avg_sleep_stages', COALESCE((
      SELECT json_agg(json_build_object('stage', stage, 'avg_pct', avg_pct))
      FROM (
        SELECT ss.stage, ROUND(AVG(ss.percentage)::numeric, 1) as avg_pct
        FROM sleep_stages ss
        JOIN sleep_sessions s ON s.id = ss.sleep_session_id
        WHERE s.user_id = auth.uid() AND s.date >= start_date
        GROUP BY ss.stage
      ) sub
    ), '[]'),
    'glucose', COALESCE((
      SELECT json_build_object(
        'avg_fasting', (
          SELECT ROUND(AVG(glucose_mg_dl)::numeric, 1)
          FROM glucose_logs
          WHERE user_id = auth.uid() AND measurement_type = 'fasting' AND date >= start_date
        ),
        'avg_post_meal', (
          SELECT ROUND(AVG(glucose_mg_dl)::numeric, 1)
          FROM glucose_logs
          WHERE user_id = auth.uid() AND measurement_type = 'post_meal' AND date >= start_date
        ),
        'time_in_range', (
          SELECT ROUND(
            (COUNT(*) FILTER (WHERE glucose_mg_dl BETWEEN 70 AND 140)::numeric /
             NULLIF(COUNT(*)::numeric, 0)) * 100, 1
          )
          FROM glucose_logs
          WHERE user_id = auth.uid() AND date >= start_date
        ),
        'by_day', (
          SELECT COALESCE(json_agg(
            json_build_object('date', date, 'avg', avg_gl, 'min', min_gl, 'max', max_gl)
            ORDER BY date
          ), '[]')
          FROM (
            SELECT date,
                   ROUND(AVG(glucose_mg_dl)::numeric, 1) as avg_gl,
                   MIN(glucose_mg_dl) as min_gl,
                   MAX(glucose_mg_dl) as max_gl
            FROM glucose_logs
            WHERE user_id = auth.uid() AND date >= start_date
            GROUP BY date
          ) gl_sub
        )
      )
    ), '{"avg_fasting": null, "avg_post_meal": null, "time_in_range": null, "by_day": []}')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ATUALIZAR import_apple_health PARA INCLUIR GLICEMIA
-- ============================================

CREATE OR REPLACE FUNCTION import_apple_health(
  p_weights JSONB DEFAULT '[]',
  p_body_fat JSONB DEFAULT '[]',
  p_workouts JSONB DEFAULT '[]',
  p_sleep JSONB DEFAULT '[]',
  p_glucose JSONB DEFAULT '[]'
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

  -- GLUCOSE (NOVO)
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_glucose)
  LOOP
    INSERT INTO glucose_logs (user_id, glucose_mg_dl, date, time, measurement_type, notes, device, source)
    VALUES (
      auth.uid(),
      (v_record->>'glucose')::INTEGER,
      (v_record->>'date')::DATE,
      COALESCE((v_record->>'time')::TIME, '00:00:00'),
      COALESCE(v_record->>'type', 'random'),
      v_record->>'notes',
      v_record->>'device',
      'import_apple'
    );
    v_imported := v_imported + 1;
  END LOOP;

  -- LOG IMPORT
  INSERT INTO import_records (user_id, source, records_count, duplicates_skipped, summary)
  VALUES (
    auth.uid(), 'apple_health', v_imported, v_duplicates,
    jsonb_build_object(
      'weights', jsonb_array_length(p_weights),
      'body_fat', jsonb_array_length(p_body_fat),
      'workouts', jsonb_array_length(p_workouts),
      'sleep', jsonb_array_length(p_sleep),
      'glucose', jsonb_array_length(p_glucose)
    )
  );

  RETURN json_build_object('imported', v_imported, 'duplicates_skipped', v_duplicates);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
