# Data Model — Fit Track v3

> Modelo de dados PostgreSQL para Supabase.

---

## 1. ERD (Entity Relationship Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              auth.users                                      │
│                         (gerenciado pelo Supabase)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ 1:1
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               profiles                                       │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          │ 1:N (user_id como FK)
          ├──────────────┬──────────────┬──────────────┬──────────────┐
          ▼              ▼              ▼              ▼              ▼
    weight_logs    body_fat_logs     meals        workouts     sleep_sessions
                                       │              │              │
                                       │ 1:N         │ 1:N         │ 1:N
                                       ▼              ▼              ▼
                                  meal_items    workout_sets   sleep_stages

┌─────────────────┐    ┌─────────────────┐
│      foods      │    │  import_records │
│  (user_id NULL  │    │                 │
│   = global)     │    │                 │
└─────────────────┘    └─────────────────┘
```

---

## 2. Tabelas

### 2.1 `profiles`

Perfil do usuário, criado após onboarding.

```sql
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

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | FK para auth.users |
| name | TEXT | Nome do usuário |
| gender | TEXT | 'masculino' ou 'feminino' |
| birth_date | DATE | Data de nascimento |
| height_cm | INTEGER | Altura em cm (100-250) |
| weight_kg | DECIMAL | Peso em kg (30-300) |
| tdee_multiplier | DECIMAL | Multiplicador de atividade (1.2-1.9) |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Última atualização |

---

### 2.2 `weight_logs`

Registros de peso.

```sql
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
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| user_id | UUID | FK para profiles |
| weight_kg | DECIMAL | Peso registrado |
| date | DATE | Data do registro |
| source | TEXT | Origem: chat, import_apple, etc |
| raw_text | TEXT | Texto original (se via chat) |
| created_at | TIMESTAMPTZ | Timestamp de criação |

**Constraint:** 1 peso por usuário por dia (UNIQUE).

---

### 2.3 `body_fat_logs`

Registros de percentual de gordura.

```sql
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
```

---

### 2.4 `meals` + `meal_items`

Refeições e seus itens.

```sql
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

CREATE TABLE meal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id),
  food_name TEXT NOT NULL,
  quantity_g DECIMAL(7,2) NOT NULL,
  calories INTEGER NOT NULL,
  protein_g DECIMAL(6,2),
  carbs_g DECIMAL(6,2),
  fat_g DECIMAL(6,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meal_items_meal ON meal_items(meal_id);
```

| meals | Tipo | Descrição |
|-------|------|-----------|
| meal_type | TEXT | breakfast, lunch, dinner, snack |
| total_* | DECIMAL | Totais calculados |

| meal_items | Tipo | Descrição |
|------------|------|-----------|
| food_id | UUID | FK opcional para foods |
| food_name | TEXT | Nome do alimento |
| quantity_g | DECIMAL | Quantidade em gramas |

---

### 2.5 `workouts` + `workout_sets`

Treinos e séries.

```sql
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
```

| workouts | Tipo | Descrição |
|----------|------|-----------|
| workout_type | TEXT | cardio, strength, mixed |
| avg_hr | INTEGER | HR média (agregada) |

| workout_sets | Tipo | Descrição |
|--------------|------|-----------|
| exercise_name | TEXT | Nome do exercício |
| sets/reps | INTEGER | Para musculação |
| duration_min | INTEGER | Para cardio |

---

### 2.6 `sleep_sessions` + `sleep_stages`

Sessões de sono e estágios detalhados.

```sql
CREATE TABLE sleep_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  total_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER / 60
  ) STORED,
  source TEXT NOT NULL CHECK (source IN ('import_apple', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, date)
);

CREATE INDEX idx_sleep_sessions_user_date ON sleep_sessions(user_id, date DESC);

CREATE TABLE sleep_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sleep_session_id UUID NOT NULL REFERENCES sleep_sessions(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('awake', 'light', 'deep', 'rem')),
  duration_min INTEGER NOT NULL,
  percentage DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sleep_stages_session ON sleep_stages(sleep_session_id);
```

| sleep_stages | Tipo | Descrição |
|--------------|------|-----------|
| stage | TEXT | awake, light, deep, rem |
| duration_min | INTEGER | Duração em minutos |
| percentage | DECIMAL | % do total de sono |

---

### 2.7 `foods`

Banco de alimentos (global + custom).

```sql
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

-- Índices para busca
CREATE INDEX idx_foods_name ON foods USING gin(to_tsvector('portuguese', name));
CREATE INDEX idx_foods_aliases ON foods USING gin(aliases);
CREATE INDEX idx_foods_user ON foods(user_id);
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| user_id | UUID | NULL = global, UUID = custom do usuário |
| aliases | TEXT[] | Nomes alternativos para busca |

---

### 2.8 `import_records`

Histórico de importações.

```sql
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
```

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| source | TEXT | apple_health, hevy |
| summary | JSONB | {"weights": 10, "workouts": 5} |

---

## 3. Functions

### 3.1 `get_bmr()`

Calcula BMR (Mifflin-St Jeor) com idade atual.

```sql
CREATE OR REPLACE FUNCTION get_bmr(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_age INTEGER;
  v_bmr INTEGER;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_age := EXTRACT(YEAR FROM age(v_profile.birth_date));

  IF v_profile.gender = 'masculino' THEN
    v_bmr := ROUND(10 * v_profile.weight_kg + 6.25 * v_profile.height_cm - 5 * v_age + 5);
  ELSE
    v_bmr := ROUND(10 * v_profile.weight_kg + 6.25 * v_profile.height_cm - 5 * v_age - 161);
  END IF;

  RETURN v_bmr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.2 `get_tdee()`

Calcula TDEE = BMR × multiplicador.

```sql
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
```

---

## 4. Enums e Tipos

```sql
-- Source types (usado em várias tabelas)
-- Valores: 'chat', 'import_apple', 'import_hevy', 'manual'

-- Meal types
-- Valores: 'breakfast', 'lunch', 'dinner', 'snack'

-- Workout types
-- Valores: 'cardio', 'strength', 'mixed'

-- Sleep stages
-- Valores: 'awake', 'light', 'deep', 'rem'

-- Import sources
-- Valores: 'apple_health', 'hevy'

-- Gender
-- Valores: 'masculino', 'feminino'
```

---

## 5. Constraints Importantes

| Tabela | Constraint | Motivo |
|--------|------------|--------|
| weight_logs | UNIQUE(user_id, date) | 1 peso por dia |
| body_fat_logs | UNIQUE(user_id, date) | 1 BF por dia |
| sleep_sessions | UNIQUE(user_id, date) | 1 sessão por noite |
| meals | SEM unique | Múltiplas refeições mesmo tipo/dia |
| workouts | SEM unique | Múltiplos treinos por dia |
