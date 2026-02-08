-- Fix: import_apple_health RPC
-- 1. DROP V1 (4 params) para eliminar ambiguidade permanentemente
-- 2. Recria V2 com EXCEPTION WHEN OTHERS para evitar rollback total por CHECK violations
-- 3. Adiciona BEGIN/EXCEPTION em workouts (que nao tinha)

-- Step 1: Drop V1 (4 params) que causa ambiguidade com V2 (5 params)
DROP FUNCTION IF EXISTS import_apple_health(JSONB, JSONB, JSONB, JSONB);

-- Step 2: Drop V2 para recriar com melhor error handling
DROP FUNCTION IF EXISTS import_apple_health(JSONB, JSONB, JSONB, JSONB, JSONB);

-- Step 3: Recriar com WHEN OTHERS em todos os loops
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
  v_skipped INTEGER := 0;
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
    EXCEPTION
      WHEN unique_violation THEN
        v_duplicates := v_duplicates + 1;
      WHEN OTHERS THEN
        v_skipped := v_skipped + 1;
    END;
  END LOOP;

  -- BODY FAT
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_body_fat)
  LOOP
    BEGIN
      INSERT INTO body_fat_logs (user_id, body_fat_pct, date, source)
      VALUES (auth.uid(), (v_record->>'body_fat')::DECIMAL, (v_record->>'date')::DATE, 'import_apple');
      v_imported := v_imported + 1;
    EXCEPTION
      WHEN unique_violation THEN
        v_duplicates := v_duplicates + 1;
      WHEN OTHERS THEN
        v_skipped := v_skipped + 1;
    END;
  END LOOP;

  -- WORKOUTS
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_workouts)
  LOOP
    BEGIN
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
    EXCEPTION
      WHEN OTHERS THEN
        v_skipped := v_skipped + 1;
    END;
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
    EXCEPTION
      WHEN unique_violation THEN
        v_duplicates := v_duplicates + 1;
      WHEN OTHERS THEN
        v_skipped := v_skipped + 1;
    END;
  END LOOP;

  -- GLUCOSE
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_glucose)
  LOOP
    BEGIN
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
    EXCEPTION
      WHEN OTHERS THEN
        v_skipped := v_skipped + 1;
    END;
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
      'glucose', jsonb_array_length(p_glucose),
      'skipped_errors', v_skipped
    )
  );

  RETURN json_build_object('imported', v_imported, 'duplicates_skipped', v_duplicates, 'skipped_errors', v_skipped);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
