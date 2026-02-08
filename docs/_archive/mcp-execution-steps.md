# MCP Execution Steps — Fit Track v3

> Passo a passo executável para implementar o backend via MCP (Supabase).

---

## Pré-requisitos

- [ ] Conta Supabase criada (https://supabase.com)
- [ ] Projeto Next.js funcionando localmente
- [ ] Node.js 18+
- [ ] Acesso ao Google Cloud Console (para OAuth)
- [ ] Acesso ao Apple Developer (para Sign in with Apple)

---

## Milestone 1: Foundation

### Step 1.1 — Criar Projeto Supabase

1. Acesse https://supabase.com/dashboard
2. Clique em "New Project"
3. Preencha:
   - Name: `fittrack`
   - Database Password: (gerar senha forte)
   - Region: `South America (São Paulo)` ou mais próximo
4. Aguarde criação (~2 min)
5. Anote:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### Step 1.2 — Configurar Auth Google

1. **Google Cloud Console:**
   - Acesse https://console.cloud.google.com
   - Crie projeto ou selecione existente
   - APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `https://xxxxx.supabase.co/auth/v1/callback`
   - Copie Client ID e Client Secret

2. **Supabase Dashboard:**
   - Authentication > Providers > Google
   - Enable Google
   - Cole Client ID e Client Secret
   - Save

---

### Step 1.3 — Configurar Auth Apple (Opcional)

1. **Apple Developer:**
   - Certificates, Identifiers & Profiles > Identifiers
   - Register App ID com Sign in with Apple
   - Create Services ID
   - Configure redirect: `https://xxxxx.supabase.co/auth/v1/callback`

2. **Supabase Dashboard:**
   - Authentication > Providers > Apple
   - Enable Apple
   - Configure Client ID, Secret Key
   - Save

---

### Step 1.4 — Criar Tabela `profiles`

No SQL Editor do Supabase, execute:

```sql
-- Função para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela profiles
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
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE USING (auth.uid() = id);
```

---

### Step 1.5 — Criar Funções BMR e TDEE

```sql
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
```

---

### Step 1.6 — Instalar Dependências no Frontend

```bash
npm uninstall next-auth
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

---

### Step 1.7 — Configurar Cliente Supabase

Criar arquivo `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Adicionar em `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Step 1.8 — Criar Auth Callback Route

Criar `app/auth/callback/route.ts`:

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(requestUrl.origin)
}
```

---

### Step 1.9 — Atualizar Onboarding

Substituir lógica de NextAuth por Supabase Auth no componente de login.

**Checkpoint M1:** Usuário consegue logar com Google e criar perfil.

---

## Milestone 2: Core Data

### Step 2.1 — Criar Tabelas de Dados

```sql
-- weight_logs
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

-- body_fat_logs
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

-- meals
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

-- meal_items
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

-- workouts
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

-- workout_sets
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

-- sleep_sessions
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

-- sleep_stages
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
```

---

### Step 2.2 — Criar Tabela de Alimentos

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
```

---

### Step 2.3 — Seed de Alimentos

```sql
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
(NULL, 'Queijo mussarela', 280, 22, 2.2, 21, ARRAY['mussarela', 'queijo']);
```

---

### Step 2.4 — Criar RPC Functions

```sql
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
```

---

### Step 2.5 — Atualizar Frontend

Substituir chamadas de localStorage por Supabase em:
- Chat (registrar peso, refeição, treino)
- Home (usar `get_home_summary`)
- Insights (usar `get_insights`)

**Checkpoint M2:** App funciona completamente com Supabase.

---

## Milestone 3: Import

### Step 3.1 — Criar Tabela de Importações

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

ALTER TABLE import_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "import_records_all_own" ON import_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

### Step 3.2 — Criar RPC de Importação

Ver arquivo [ingestion-prep.md](./ingestion-prep.md) para SQL completo de:
- `import_apple_health()`
- `import_hevy()`
- `delete_imported_data()`

---

### Step 3.3 — Atualizar Frontend Import

Modificar página de importação para chamar RPC após parse.

**Checkpoint M3:** Importação funciona via backend.

---

## Milestone 4: Polish

### Step 4.1 — Testar RLS

Criar 2 usuários de teste e verificar isolamento de dados.

### Step 4.2 — Criar Índices Adicionais

Verificar EXPLAIN ANALYZE das queries mais usadas e criar índices se necessário.

### Step 4.3 — Documentar Variáveis

Atualizar README com:
- Setup Supabase
- Variáveis de ambiente
- Deploy

---

## Checklist Final

- [ ] M1: Auth funciona (Google)
- [ ] M1: Profile é salvo/carregado
- [ ] M2: Peso via Chat persiste
- [ ] M2: Refeição via Chat persiste
- [ ] M2: Treino via Chat persiste
- [ ] M2: Home usa RPC
- [ ] M2: Insights usa RPC
- [ ] M3: Import Apple Health funciona
- [ ] M3: Deduplicação funciona
- [ ] M4: RLS testado
- [ ] M4: README atualizado
