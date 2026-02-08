# Ingestion Prep — Fit Track v3

> Preparação para importação de dados externos (Apple Health, Hevy).

---

## 1. Visão Geral

### 1.1 Fontes Suportadas

| Fonte | Formato | Dados |
|-------|---------|-------|
| Apple Health | ZIP → XML | Peso, BF%, Treinos, Sono (stages), HR |
| Hevy | CSV | Treinos com sets/reps detalhados |

### 1.2 Fluxo de Importação

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Parser     │────▶│   Supabase   │
│   (Upload)   │     │   (Client)   │     │   RPC        │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │  arquivo ZIP/CSV   │  JSON estruturado  │  INSERT + dedup
       ▼                    ▼                    ▼
```

**Decisão:** Parser roda no frontend (já implementado), backend recebe JSON estruturado.

---

## 2. Apple Health

### 2.1 Estrutura do Export

```
apple_health_export.zip
└── export.xml
    └── HealthData
        └── Record (type="HKQuantityTypeIdentifierBodyMass")
        └── Record (type="HKQuantityTypeIdentifierBodyFatPercentage")
        └── Workout (workoutActivityType="HKWorkoutActivityTypeRunning")
        └── Record (type="HKCategoryTypeIdentifierSleepAnalysis")
```

### 2.2 Mapeamento de Tipos

| Apple Health Type | Tabela Supabase | Notas |
|-------------------|-----------------|-------|
| HKQuantityTypeIdentifierBodyMass | weight_logs | value em kg |
| HKQuantityTypeIdentifierBodyFatPercentage | body_fat_logs | value em % |
| HKWorkoutActivityType* | workouts | duration, calories |
| HKCategoryTypeIdentifierSleepAnalysis | sleep_sessions + sleep_stages | Processar stages |

### 2.3 Parser Frontend (Existente)

```typescript
// lib/apple-health-parser.ts (já implementado)
export interface AppleHealthData {
  weights: { weight: number; date: string }[]
  bodyFat: { bodyFat: number; date: string }[]
  workouts: { type: string; date: string; duration: number; calories: number }[]
  sleep: {
    date: string
    start: string
    end: string
    stages: { stage: string; duration: number; pct: number }[]
  }[]
}

export async function parseAppleHealthExport(file: File): Promise<AppleHealthData>
```

### 2.4 SQL Function

```sql
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
  -- ========== WEIGHTS ==========
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_weights)
  LOOP
    BEGIN
      INSERT INTO weight_logs (user_id, weight_kg, date, source)
      VALUES (
        auth.uid(),
        (v_record->>'weight')::DECIMAL,
        (v_record->>'date')::DATE,
        'import_apple'
      );
      v_imported := v_imported + 1;
    EXCEPTION WHEN unique_violation THEN
      v_duplicates := v_duplicates + 1;
    END;
  END LOOP;

  -- ========== BODY FAT ==========
  FOR v_record IN SELECT * FROM jsonb_array_elements(p_body_fat)
  LOOP
    BEGIN
      INSERT INTO body_fat_logs (user_id, body_fat_pct, date, source)
      VALUES (
        auth.uid(),
        (v_record->>'body_fat')::DECIMAL,
        (v_record->>'date')::DATE,
        'import_apple'
      );
      v_imported := v_imported + 1;
    EXCEPTION WHEN unique_violation THEN
      v_duplicates := v_duplicates + 1;
    END;
  END LOOP;

  -- ========== WORKOUTS ==========
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

  -- ========== SLEEP ==========
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

      -- Insert stages
      FOR v_stage IN SELECT * FROM jsonb_array_elements(v_record->'stages')
      LOOP
        INSERT INTO sleep_stages (sleep_session_id, stage, duration_min, percentage)
        VALUES (
          v_sleep_id,
          v_stage->>'stage',
          (v_stage->>'duration')::INTEGER,
          (v_stage->>'pct')::DECIMAL
        );
      END LOOP;

      v_imported := v_imported + 1;
    EXCEPTION WHEN unique_violation THEN
      v_duplicates := v_duplicates + 1;
    END;
  END LOOP;

  -- ========== REGISTRO DE IMPORTAÇÃO ==========
  INSERT INTO import_records (user_id, source, records_count, duplicates_skipped, summary)
  VALUES (
    auth.uid(),
    'apple_health',
    v_imported,
    v_duplicates,
    jsonb_build_object(
      'weights', jsonb_array_length(p_weights),
      'body_fat', jsonb_array_length(p_body_fat),
      'workouts', jsonb_array_length(p_workouts),
      'sleep', jsonb_array_length(p_sleep)
    )
  );

  RETURN json_build_object(
    'imported', v_imported,
    'duplicates_skipped', v_duplicates
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 3. Hevy

### 3.1 Estrutura do CSV

```csv
Date,Workout Name,Exercise Name,Set Order,Weight (kg),Reps,Duration
2026-01-20,Push Day,Bench Press,1,80,10,
2026-01-20,Push Day,Bench Press,2,80,10,
2026-01-20,Push Day,Shoulder Press,1,40,12,
```

### 3.2 Parser Frontend

```typescript
// lib/hevy-parser.ts (já implementado)
export interface HevyData {
  workouts: {
    date: string
    name: string
    exercises: {
      name: string
      sets: { weight: number; reps: number }[]
    }[]
  }[]
}

export function parseHevyCSV(csv: string): HevyData
```

### 3.3 SQL Function

```sql
CREATE OR REPLACE FUNCTION import_hevy(
  p_workouts JSONB DEFAULT '[]'
)
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
    -- Calcular duração estimada (10min por exercício)
    v_total_duration := jsonb_array_length(v_workout->'exercises') * 10;

    -- Criar workout
    INSERT INTO workouts (user_id, workout_type, date, duration_min, source, raw_text)
    VALUES (
      auth.uid(),
      'strength',
      (v_workout->>'date')::DATE,
      v_total_duration,
      'import_hevy',
      v_workout->>'name'
    )
    RETURNING id INTO v_workout_id;

    -- Criar sets para cada exercício
    FOR v_exercise IN SELECT * FROM jsonb_array_elements(v_workout->'exercises')
    LOOP
      FOR v_set IN SELECT * FROM jsonb_array_elements(v_exercise->'sets')
      LOOP
        INSERT INTO workout_sets (workout_id, exercise_name, sets, reps, weight_kg)
        VALUES (
          v_workout_id,
          v_exercise->>'name',
          1,  -- Cada row do CSV é 1 set
          (v_set->>'reps')::INTEGER,
          (v_set->>'weight')::DECIMAL
        );
      END LOOP;
    END LOOP;

    v_imported := v_imported + 1;
  END LOOP;

  -- Registro de importação
  INSERT INTO import_records (user_id, source, records_count, duplicates_skipped, summary)
  VALUES (
    auth.uid(),
    'hevy',
    v_imported,
    0,
    jsonb_build_object('workouts', jsonb_array_length(p_workouts))
  );

  RETURN json_build_object(
    'imported', v_imported,
    'duplicates_skipped', 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Deduplicação

### 4.1 Estratégia

| Tabela | Constraint | Comportamento |
|--------|------------|---------------|
| weight_logs | UNIQUE(user_id, date) | Skip duplicata |
| body_fat_logs | UNIQUE(user_id, date) | Skip duplicata |
| sleep_sessions | UNIQUE(user_id, date) | Skip duplicata |
| workouts | SEM unique | Permite múltiplos (Hevy pode ter 2 treinos/dia) |

### 4.2 Regra de Prioridade

> **Chat sempre vence.**

Se o usuário registrou 75kg via Chat e importou 74.5kg do Apple Health para a mesma data:
- O registro do Chat (75kg) permanece
- O registro importado é ignorado (UNIQUE violation)

Para corrigir, o usuário deve usar o Chat novamente.

---

## 5. Reprocessamento

### 5.1 Objetivo

Permitir ao usuário apagar todos os dados importados e reimportar.

### 5.2 SQL Function

```sql
CREATE OR REPLACE FUNCTION delete_imported_data(p_source TEXT)
RETURNS JSON AS $$
DECLARE
  v_deleted INTEGER := 0;
BEGIN
  -- Deletar dados da fonte especificada
  DELETE FROM weight_logs WHERE user_id = auth.uid() AND source = p_source;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  DELETE FROM body_fat_logs WHERE user_id = auth.uid() AND source = p_source;
  DELETE FROM workouts WHERE user_id = auth.uid() AND source = p_source;
  DELETE FROM sleep_sessions WHERE user_id = auth.uid() AND source = p_source;

  -- Limpar histórico de importações
  DELETE FROM import_records WHERE user_id = auth.uid() AND source = p_source;

  RETURN json_build_object('deleted', v_deleted);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.3 Uso no Frontend

```typescript
// Apagar dados do Apple Health
const { data, error } = await supabase
  .rpc('delete_imported_data', { p_source: 'import_apple' })

// Reimportar
const parsed = await parseAppleHealthExport(file)
await supabase.rpc('import_apple_health', parsed)
```

---

## 6. Histórico de Importações

### 6.1 Listar Importações

```typescript
const { data, error } = await supabase
  .from('import_records')
  .select('*')
  .order('imported_at', { ascending: false })
```

### 6.2 Response

```json
[
  {
    "id": "uuid",
    "source": "apple_health",
    "imported_at": "2026-01-26T10:30:00Z",
    "records_count": 45,
    "duplicates_skipped": 3,
    "summary": {
      "weights": 30,
      "body_fat": 5,
      "workouts": 8,
      "sleep": 5
    }
  }
]
```

---

## 7. Preparação Futura

### 7.1 Glicemia (CGM)

Quando suportarmos dados de glicemia (Freestyle Libre, etc):

```sql
-- Futura tabela
CREATE TABLE glucose_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  glucose_mg_dl INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para queries por período
CREATE INDEX idx_glucose_user_timestamp ON glucose_readings(user_id, timestamp DESC);
```

### 7.2 Strava (API)

Quando integrarmos via API (não arquivo):

```sql
-- Tabela de tokens OAuth
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
```

---

## 8. Checklist de Implementação

- [ ] Parser Apple Health funciona com arquivos >100MB
- [ ] Parser Hevy funciona com CSVs multi-mês
- [ ] RPC `import_apple_health` criada e testada
- [ ] RPC `import_hevy` criada e testada
- [ ] RPC `delete_imported_data` criada e testada
- [ ] Frontend chama RPC após parse
- [ ] Toast de sucesso/erro exibido
- [ ] Histórico de importações exibido
