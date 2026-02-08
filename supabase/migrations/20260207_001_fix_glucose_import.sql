-- ============================================
-- FIT TRACK v3 - Fix Glucose Import Pipeline
-- ============================================
-- Corrige 2 blockers que impediam o import de glicemia:
-- 1. CHECK constraint em import_records que só aceitava 'apple_health' e 'hevy'
-- 2. RPC import_glucose_readings possivelmente inexistente

-- ============================================
-- FIX 1: Expandir CHECK constraint de import_records
-- ============================================
-- A constraint original só permitia 'apple_health' e 'hevy'.
-- Precisamos aceitar 'cgm' e 'import_csv' para o import de glicemia.

ALTER TABLE import_records DROP CONSTRAINT IF EXISTS import_records_source_check;
ALTER TABLE import_records ADD CONSTRAINT import_records_source_check
  CHECK (source IN ('apple_health', 'hevy', 'cgm', 'import_csv'));

-- ============================================
-- FIX 2: Criar/recriar a RPC import_glucose_readings
-- ============================================
-- SECURITY DEFINER para bypass de RLS
-- Recebe array JSONB para import em batch (CGM pode ter 1000+ leituras)

CREATE OR REPLACE FUNCTION import_glucose_readings(p_readings JSONB)
RETURNS JSON AS $$
DECLARE
  v_imported INTEGER := 0;
  v_duplicates INTEGER := 0;
  v_errors INTEGER := 0;
  v_record JSONB;
BEGIN
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_readings)
  LOOP
    BEGIN
      INSERT INTO glucose_logs (
        user_id,
        glucose_mg_dl,
        date,
        time,
        measurement_type,
        notes,
        device,
        source
      ) VALUES (
        auth.uid(),
        (v_record->>'glucose_mg_dl')::INTEGER,
        (v_record->>'date')::DATE,
        (v_record->>'time')::TIME,
        COALESCE(v_record->>'measurement_type', 'cgm'),
        v_record->>'notes',
        v_record->>'device',
        COALESCE(v_record->>'source', 'import_csv')
      );
      v_imported := v_imported + 1;
    EXCEPTION
      WHEN unique_violation THEN
        v_duplicates := v_duplicates + 1;
      WHEN check_violation THEN
        v_errors := v_errors + 1;
      WHEN OTHERS THEN
        v_errors := v_errors + 1;
    END;
  END LOOP;

  -- Log de importacao
  INSERT INTO import_records (user_id, source, records_count, duplicates_skipped, summary)
  VALUES (
    auth.uid(),
    'import_csv',
    v_imported,
    v_duplicates,
    jsonb_build_object(
      'type', 'glucose_batch',
      'total_sent', jsonb_array_length(p_readings),
      'imported', v_imported,
      'duplicates', v_duplicates,
      'errors', v_errors
    )
  );

  RETURN json_build_object(
    'imported', v_imported,
    'duplicates_skipped', v_duplicates,
    'errors', v_errors
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
