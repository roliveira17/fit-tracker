# API Contracts — Fit Track v3

> Contratos de comunicação entre Frontend e Supabase.

---

## 1. Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  supabase.auth.*        → Autenticação                          │
│  supabase.from('table') → CRUD via PostgREST                    │
│  supabase.rpc('fn')     → Lógica complexa via SQL Functions     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Autenticação

### 2.1 Login com Google

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
```

**Retorno:** Redireciona para Google, depois volta para `/auth/callback`

---

### 2.2 Login com Apple

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'apple',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
```

---

### 2.3 Logout

```typescript
const { error } = await supabase.auth.signOut()
```

---

### 2.4 Obter Sessão

```typescript
const { data: { session }, error } = await supabase.auth.getSession()

// session.user.id → UUID do usuário
// session.access_token → JWT para requests
```

---

### 2.5 Listener de Auth

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    // event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED'
  }
)

// Cleanup
subscription.unsubscribe()
```

---

## 3. Profile

### 3.1 Criar Profile (Onboarding)

```typescript
const { data, error } = await supabase
  .from('profiles')
  .insert({
    id: session.user.id,  // IMPORTANTE: usar o auth.uid()
    name: 'João Silva',
    gender: 'masculino',
    birth_date: '1990-05-15',
    height_cm: 175,
    weight_kg: 75.5,
    tdee_multiplier: 1.375
  })
  .select()
  .single()
```

**Request:**
```json
{
  "id": "uuid",
  "name": "string",
  "gender": "masculino | feminino",
  "birth_date": "YYYY-MM-DD",
  "height_cm": 175,
  "weight_kg": 75.5,
  "tdee_multiplier": 1.375
}
```

**Response:** Profile criado

---

### 3.2 Ler Profile

```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .single()

// RLS filtra automaticamente pelo auth.uid()
```

**Response:**
```json
{
  "id": "uuid",
  "name": "João Silva",
  "gender": "masculino",
  "birth_date": "1990-05-15",
  "height_cm": 175,
  "weight_kg": 75.5,
  "tdee_multiplier": 1.375,
  "created_at": "2026-01-26T10:00:00Z",
  "updated_at": "2026-01-26T10:00:00Z"
}
```

---

### 3.3 Atualizar Profile

```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({
    name: 'João Silva Jr',
    weight_kg: 74.0
  })
  .eq('id', session.user.id)
  .select()
  .single()
```

---

### 3.4 Obter BMR

```typescript
const { data, error } = await supabase
  .rpc('get_bmr', { p_user_id: session.user.id })

// data = 1717 (integer)
```

---

### 3.5 Obter TDEE

```typescript
const { data, error } = await supabase
  .rpc('get_tdee', { p_user_id: session.user.id })

// data = 2360 (integer)
```

---

## 4. Weight Logs

### 4.1 Registrar Peso

```typescript
const { data, error } = await supabase
  .from('weight_logs')
  .insert({
    user_id: session.user.id,
    weight_kg: 75.0,
    date: '2026-01-26',
    source: 'chat',
    raw_text: '75kg'
  })
  .select()
  .single()
```

**Nota:** Se já existe registro para a data, retorna erro (UNIQUE constraint).

---

### 4.2 Atualizar Peso (Correção via Chat)

```typescript
const { data, error } = await supabase
  .from('weight_logs')
  .update({
    weight_kg: 74.5,
    raw_text: 'Na verdade 74.5kg'
  })
  .eq('user_id', session.user.id)
  .eq('date', '2026-01-26')
  .select()
  .single()
```

---

### 4.3 Listar Pesos (últimos N dias)

```typescript
const { data, error } = await supabase
  .from('weight_logs')
  .select('*')
  .order('date', { ascending: false })
  .limit(30)
```

---

### 4.4 Último Peso

```typescript
const { data, error } = await supabase
  .from('weight_logs')
  .select('weight_kg, date')
  .order('date', { ascending: false })
  .limit(1)
  .single()
```

---

## 5. Meals

### 5.1 Registrar Refeição

```typescript
// 1. Criar meal
const { data: meal, error: mealError } = await supabase
  .from('meals')
  .insert({
    user_id: session.user.id,
    meal_type: 'lunch',
    date: '2026-01-26',
    total_calories: 650,
    total_protein_g: 45,
    total_carbs_g: 60,
    total_fat_g: 20,
    source: 'chat',
    raw_text: '150g arroz, 200g frango grelhado'
  })
  .select()
  .single()

// 2. Criar meal_items
const { data: items, error: itemsError } = await supabase
  .from('meal_items')
  .insert([
    {
      meal_id: meal.id,
      food_name: 'Arroz branco',
      quantity_g: 150,
      calories: 195,
      protein_g: 4,
      carbs_g: 42,
      fat_g: 0.5
    },
    {
      meal_id: meal.id,
      food_name: 'Frango grelhado',
      quantity_g: 200,
      calories: 330,
      protein_g: 62,
      carbs_g: 0,
      fat_g: 8
    }
  ])
```

---

### 5.2 Listar Refeições do Dia

```typescript
const { data, error } = await supabase
  .from('meals')
  .select(`
    *,
    meal_items (*)
  `)
  .eq('date', '2026-01-26')
  .order('created_at', { ascending: true })
```

**Response:**
```json
[
  {
    "id": "uuid",
    "meal_type": "lunch",
    "date": "2026-01-26",
    "total_calories": 650,
    "meal_items": [
      { "food_name": "Arroz branco", "quantity_g": 150, ... },
      { "food_name": "Frango grelhado", "quantity_g": 200, ... }
    ]
  }
]
```

---

## 6. Workouts

### 6.1 Registrar Treino

```typescript
// 1. Criar workout
const { data: workout, error } = await supabase
  .from('workouts')
  .insert({
    user_id: session.user.id,
    workout_type: 'strength',
    date: '2026-01-26',
    duration_min: 60,
    calories_burned: 350,
    source: 'chat',
    raw_text: 'Supino 4x10 80kg, rosca 3x12 15kg'
  })
  .select()
  .single()

// 2. Criar workout_sets
const { data: sets, error: setsError } = await supabase
  .from('workout_sets')
  .insert([
    {
      workout_id: workout.id,
      exercise_name: 'Supino reto',
      sets: 4,
      reps: 10,
      weight_kg: 80
    },
    {
      workout_id: workout.id,
      exercise_name: 'Rosca direta',
      sets: 3,
      reps: 12,
      weight_kg: 15
    }
  ])
```

---

### 6.2 Listar Treinos do Dia

```typescript
const { data, error } = await supabase
  .from('workouts')
  .select(`
    *,
    workout_sets (*)
  `)
  .eq('date', '2026-01-26')
```

---

## 7. Foods (Busca de Alimentos)

### 7.1 Buscar por Nome

```typescript
const { data, error } = await supabase
  .from('foods')
  .select('*')
  .ilike('name', '%arroz%')
  .limit(10)
```

---

### 7.2 Buscar por Alias

```typescript
const { data, error } = await supabase
  .from('foods')
  .select('*')
  .contains('aliases', ['arroz branco'])
```

---

### 7.3 Criar Alimento Custom

```typescript
const { data, error } = await supabase
  .from('foods')
  .insert({
    user_id: session.user.id,  // torna custom
    name: 'Minha granola caseira',
    calories_per_100g: 420,
    protein_per_100g: 10,
    carbs_per_100g: 65,
    fat_per_100g: 15,
    aliases: ['granola', 'granola caseira']
  })
  .select()
  .single()
```

---

## 8. RPC Functions

### 8.1 `get_home_summary`

Dados agregados para a Home.

```typescript
const { data, error } = await supabase
  .rpc('get_home_summary', { target_date: '2026-01-26' })
```

**Response:**
```json
{
  "date": "2026-01-26",
  "calories_in": 1850,
  "calories_out": 350,
  "protein": 120,
  "weight": 75.0,
  "workout_minutes": 60
}
```

**SQL Function:**
```sql
CREATE OR REPLACE FUNCTION get_home_summary(target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'date', target_date,
    'calories_in', COALESCE((
      SELECT SUM(total_calories) FROM meals
      WHERE user_id = auth.uid() AND date = target_date
    ), 0),
    'calories_out', COALESCE((
      SELECT SUM(calories_burned) FROM workouts
      WHERE user_id = auth.uid() AND date = target_date
    ), 0),
    'protein', COALESCE((
      SELECT SUM(total_protein_g) FROM meals
      WHERE user_id = auth.uid() AND date = target_date
    ), 0),
    'weight', (
      SELECT weight_kg FROM weight_logs
      WHERE user_id = auth.uid() AND date <= target_date
      ORDER BY date DESC LIMIT 1
    ),
    'workout_minutes', COALESCE((
      SELECT SUM(duration_min) FROM workouts
      WHERE user_id = auth.uid() AND date = target_date
    ), 0)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 8.2 `get_insights`

Dados para gráficos de Insights.

```typescript
const { data, error } = await supabase
  .rpc('get_insights', { period_days: 7 })
```

**Response:**
```json
{
  "period_days": 7,
  "weights": [
    { "date": "2026-01-20", "weight": 76.0 },
    { "date": "2026-01-23", "weight": 75.5 },
    { "date": "2026-01-26", "weight": 75.0 }
  ],
  "calories_by_day": [
    { "date": "2026-01-25", "calories": 1800 },
    { "date": "2026-01-26", "calories": 1850 }
  ],
  "protein_by_day": [
    { "date": "2026-01-25", "protein": 110 },
    { "date": "2026-01-26", "protein": 120 }
  ],
  "avg_sleep_stages": [
    { "stage": "deep", "avg_pct": 18.5 },
    { "stage": "light", "avg_pct": 52.0 },
    { "stage": "rem", "avg_pct": 22.0 },
    { "stage": "awake", "avg_pct": 7.5 }
  ]
}
```

**SQL Function:**
```sql
CREATE OR REPLACE FUNCTION get_insights(period_days INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
  start_date DATE := CURRENT_DATE - period_days;
  result JSON;
BEGIN
  SELECT json_build_object(
    'period_days', period_days,
    'weights', (
      SELECT COALESCE(json_agg(json_build_object('date', date, 'weight', weight_kg) ORDER BY date), '[]')
      FROM weight_logs WHERE user_id = auth.uid() AND date >= start_date
    ),
    'calories_by_day', (
      SELECT COALESCE(json_agg(json_build_object('date', date, 'calories', daily_cal) ORDER BY date), '[]')
      FROM (
        SELECT date, SUM(total_calories) as daily_cal
        FROM meals WHERE user_id = auth.uid() AND date >= start_date
        GROUP BY date
      ) sub
    ),
    'protein_by_day', (
      SELECT COALESCE(json_agg(json_build_object('date', date, 'protein', daily_prot) ORDER BY date), '[]')
      FROM (
        SELECT date, SUM(total_protein_g) as daily_prot
        FROM meals WHERE user_id = auth.uid() AND date >= start_date
        GROUP BY date
      ) sub
    ),
    'avg_sleep_stages', (
      SELECT COALESCE(json_agg(json_build_object('stage', stage, 'avg_pct', avg_pct)), '[]')
      FROM (
        SELECT ss.stage, ROUND(AVG(ss.percentage)::numeric, 1) as avg_pct
        FROM sleep_stages ss
        JOIN sleep_sessions s ON s.id = ss.sleep_session_id
        WHERE s.user_id = auth.uid() AND s.date >= start_date
        GROUP BY ss.stage
      ) sub
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 8.3 `import_apple_health`

Importação atômica de dados do Apple Health.

```typescript
const { data, error } = await supabase
  .rpc('import_apple_health', {
    p_weights: [
      { weight: 75.0, date: '2026-01-20' },
      { weight: 75.5, date: '2026-01-23' }
    ],
    p_body_fat: [
      { body_fat: 18.5, date: '2026-01-20' }
    ],
    p_workouts: [
      { type: 'cardio', date: '2026-01-21', duration: 30, calories: 250 }
    ],
    p_sleep: [
      {
        date: '2026-01-22',
        start: '2026-01-22T23:00:00Z',
        end: '2026-01-23T07:00:00Z',
        stages: [
          { stage: 'light', duration: 240, pct: 50 },
          { stage: 'deep', duration: 96, pct: 20 },
          { stage: 'rem', duration: 108, pct: 22.5 },
          { stage: 'awake', duration: 36, pct: 7.5 }
        ]
      }
    ]
  })
```

**Response:**
```json
{
  "imported": 5,
  "duplicates_skipped": 1
}
```

---

## 9. Error Handling

### 9.1 Padrão de Tratamento

```typescript
const { data, error } = await supabase.from('meals').insert({...})

if (error) {
  if (error.code === '23505') {
    // Duplicate key (UNIQUE violation)
    console.error('Registro já existe para esta data')
  } else if (error.code === '42501') {
    // RLS violation
    console.error('Sem permissão para acessar este recurso')
  } else {
    console.error('Erro:', error.message)
  }
  return
}

// Sucesso
console.log('Dados:', data)
```

### 9.2 Códigos Comuns

| Código | Significado |
|--------|-------------|
| 23505 | UNIQUE constraint violation |
| 23503 | Foreign key violation |
| 42501 | RLS policy violation |
| PGRST116 | Row not found (.single() sem resultado) |
