import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types para as tabelas do banco
export interface Profile {
  id: string;
  name: string;
  gender: "masculino" | "feminino";
  birth_date: string;
  height_cm: number;
  weight_kg: number;
  tdee_multiplier: number;
  created_at: string;
  updated_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  date: string;
  source: "chat" | "import_apple" | "import_hevy" | "manual";
  raw_text?: string;
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  date: string;
  total_calories?: number;
  total_protein_g?: number;
  total_carbs_g?: number;
  total_fat_g?: number;
  source: "chat" | "import_apple" | "manual";
  raw_text?: string;
  created_at: string;
  meal_items?: MealItem[];
}

export interface MealItem {
  id: string;
  meal_id: string;
  food_id?: string;
  food_name: string;
  quantity_g: number;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  workout_type: "cardio" | "strength" | "mixed";
  date: string;
  duration_min?: number;
  calories_burned?: number;
  avg_hr?: number;
  source: "chat" | "import_apple" | "import_hevy" | "manual";
  raw_text?: string;
  created_at: string;
  workout_sets?: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_name: string;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  duration_min?: number;
  created_at: string;
}

export interface SleepSession {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_minutes: number;
  source: "import_apple" | "manual";
  created_at: string;
  sleep_stages?: SleepStage[];
}

export interface SleepStage {
  id: string;
  sleep_session_id: string;
  stage: "awake" | "light" | "deep" | "rem";
  duration_min: number;
  percentage?: number;
  created_at: string;
}

export interface Food {
  id: string;
  user_id?: string;
  name: string;
  brand?: string;
  serving_g: number;
  calories_per_100g: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
  aliases: string[];
  created_at: string;
}

export interface ImportRecord {
  id: string;
  user_id: string;
  source: "apple_health" | "hevy";
  imported_at: string;
  records_count: number;
  duplicates_skipped: number;
  summary?: {
    weights?: number;
    body_fat?: number;
    workouts?: number;
    sleep?: number;
  };
}

// Response types para RPC
export interface HomeSummary {
  date: string;
  calories_in: number;
  calories_out: number;
  protein: number;
  carbs: number;
  fat: number;
  weight: number | null;
  workout_minutes: number;
}

export interface InsightsData {
  period_days: number;
  weights: { date: string; weight: number }[];
  calories_by_day: { date: string; calories: number }[];
  protein_by_day: { date: string; protein: number }[];
  carbs_by_day: { date: string; carbs: number }[];
  fat_by_day: { date: string; fat: number }[];
  avg_sleep_stages: { stage: string; avg_pct: number }[];
  body_fat_by_day: { date: string; body_fat: number }[];
  calories_burned_by_day: { date: string; calories_burned: number }[];
  meals_by_type: { meal_type: string; count: number; avg_calories: number }[];
  top_foods: { food_name: string; times_eaten: number; avg_calories: number }[];
  glucose: {
    avg_fasting: number | null;
    avg_post_meal: number | null;
    time_in_range: number | null;
    by_day: { date: string; avg: number; min: number; max: number }[];
  };
}

export interface SleepInsightsData {
  avg_duration_min: number | null;
  total_nights: number;
  by_day: {
    date: string;
    total_min: number;
    deep_min: number;
    rem_min: number;
    light_min: number;
    awake_min: number;
  }[];
  avg_stages: { stage: string; avg_pct: number }[];
  best_night: { date: string; total_min: number } | null;
  worst_night: { date: string; total_min: number } | null;
  consistency: number | null;
}

export interface WorkoutProgressionData {
  total_workouts: number;
  total_volume: number;
  avg_duration_min: number | null;
  volume_by_day: { date: string; volume: number; duration: number }[];
  top_exercises: {
    exercise_name: string;
    times_performed: number;
    progression: { date: string; max_weight: number; total_volume: number }[];
    best_weight: number;
    best_volume: number;
  }[];
  workout_types: { type: string; count: number }[];
}

// Helper functions
export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
  return data;
}

export async function createProfile(profile: Omit<Profile, "id" | "created_at" | "updated_at">): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .insert({ ...profile, id: user.id })
    .select()
    .single();

  if (error) {
    console.error("Error creating profile:", error);
    return null;
  }
  return data;
}

export async function updateProfile(updates: Partial<Profile>): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    return null;
  }
  return data;
}

export async function getHomeSummary(targetDate?: string): Promise<HomeSummary | null> {
  const { data, error } = await supabase
    .rpc("get_home_summary", { target_date: targetDate || new Date().toISOString().split("T")[0] });

  if (error) {
    console.error("Error fetching home summary:", error);
    return null;
  }
  return data;
}

export async function getInsights(periodDays: number = 7): Promise<InsightsData | null> {
  const { data, error } = await supabase
    .rpc("get_insights", { period_days: periodDays });

  if (error) {
    console.error("Error fetching insights:", error);
    return null;
  }
  return data;
}

export async function getSleepInsights(periodDays: number = 7): Promise<SleepInsightsData | null> {
  const { data, error } = await supabase
    .rpc("get_sleep_insights", { p_days: periodDays });

  if (error) {
    console.error("Error fetching sleep insights:", error);
    return null;
  }
  return data;
}

export async function getWorkoutProgression(periodDays: number = 7): Promise<WorkoutProgressionData | null> {
  const { data, error } = await supabase
    .rpc("get_workout_progression", { p_days: periodDays });

  if (error) {
    console.error("Error fetching workout progression:", error);
    return null;
  }
  return data;
}

export async function getBmr(): Promise<number | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .rpc("get_bmr", { p_user_id: user.id });

  if (error) {
    console.error("Error fetching BMR:", error);
    return null;
  }
  return data;
}

export async function getTdee(): Promise<number | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .rpc("get_tdee", { p_user_id: user.id });

  if (error) {
    console.error("Error fetching TDEE:", error);
    return null;
  }
  return data;
}

export async function searchFoods(query: string): Promise<Food[]> {
  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .ilike("name", `%${query}%`)
    .limit(10);

  if (error) {
    console.error("Error searching foods:", error);
    return [];
  }
  return data || [];
}

export async function logWeight(weightKg: number, rawText?: string): Promise<WeightLog | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const date = new Date().toISOString().split("T")[0];

  // Usar função RPC com SECURITY DEFINER para bypass RLS
  const { data: weightId, error } = await supabase.rpc("insert_weight_log", {
    p_user_id: user.id,
    p_weight_kg: weightKg,
    p_date: date,
    p_source: "chat",
    p_raw_text: rawText || null
  });

  if (error || !weightId) {
    console.error("Error logging weight:", error);
    return null;
  }

  return {
    id: weightId,
    user_id: user.id,
    weight_kg: weightKg,
    date,
    source: "chat",
    raw_text: rawText,
    created_at: new Date().toISOString()
  };
}

export async function logMeal(
  mealType: Meal["meal_type"],
  items: Omit<MealItem, "id" | "meal_id" | "created_at">[],
  rawText?: string
): Promise<Meal | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("logMeal: Erro ao obter usuário:", authError.message);
  }
  if (!user) {
    console.error("logMeal: Usuário não autenticado no Supabase");
    return null;
  }

  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein_g || 0),
      carbs: acc.carbs + (item.carbs_g || 0),
      fat: acc.fat + (item.fat_g || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Usar função RPC com SECURITY DEFINER para bypass RLS
  const { data: mealId, error: mealError } = await supabase.rpc("insert_meal", {
    p_user_id: user.id,
    p_meal_type: mealType,
    p_date: new Date().toISOString().split("T")[0],
    p_total_calories: Math.round(totals.calories),
    p_total_protein_g: totals.protein,
    p_total_carbs_g: totals.carbs,
    p_total_fat_g: totals.fat,
    p_source: "chat",
    p_raw_text: rawText || null
  });

  if (mealError || !mealId) {
    console.error("Error creating meal:", mealError);
    return null;
  }

  // Inserir cada item usando função RPC
  for (const item of items) {
    const { error: itemError } = await supabase.rpc("insert_meal_item", {
      p_meal_id: mealId,
      p_food_name: item.food_name,
      p_quantity_g: item.quantity_g,
      p_calories: Math.round(item.calories),
      p_protein_g: item.protein_g || 0,
      p_carbs_g: item.carbs_g || 0,
      p_fat_g: item.fat_g || 0
    });

    if (itemError) {
      console.error("Error adding meal item:", itemError);
    }
  }

  // Retornar objeto Meal com os dados
  return {
    id: mealId,
    user_id: user.id,
    meal_type: mealType,
    date: new Date().toISOString().split("T")[0],
    total_calories: Math.round(totals.calories),
    total_protein_g: totals.protein,
    total_carbs_g: totals.carbs,
    total_fat_g: totals.fat,
    source: "chat",
    raw_text: rawText,
    created_at: new Date().toISOString()
  };
}

export async function logWorkout(
  workoutType: Workout["workout_type"],
  durationMin?: number,
  caloriesBurned?: number,
  exercises?: Omit<WorkoutSet, "id" | "workout_id" | "created_at">[],
  rawText?: string
): Promise<Workout | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const date = new Date().toISOString().split("T")[0];

  // Usar função RPC com SECURITY DEFINER para bypass RLS
  const { data: workoutId, error: workoutError } = await supabase.rpc("insert_workout", {
    p_user_id: user.id,
    p_workout_type: workoutType,
    p_date: date,
    p_duration_min: durationMin || null,
    p_calories_burned: caloriesBurned || null,
    p_source: "chat",
    p_raw_text: rawText || null
  });

  if (workoutError || !workoutId) {
    console.error("Error creating workout:", workoutError);
    return null;
  }

  // Inserir cada exercício usando função RPC
  if (exercises && exercises.length > 0) {
    for (const ex of exercises) {
      const { error: setError } = await supabase.rpc("insert_workout_set", {
        p_workout_id: workoutId,
        p_exercise_name: ex.exercise_name,
        p_sets: ex.sets || null,
        p_reps: ex.reps || null,
        p_weight_kg: ex.weight_kg || null,
        p_duration_min: ex.duration_min || null
      });

      if (setError) {
        console.error("Error adding workout set:", setError);
      }
    }
  }

  return {
    id: workoutId,
    user_id: user.id,
    workout_type: workoutType,
    date,
    duration_min: durationMin,
    calories_burned: caloriesBurned,
    source: "chat",
    raw_text: rawText,
    created_at: new Date().toISOString()
  };
}

export async function importAppleHealth(data: {
  weights?: { weight: number; date: string }[];
  body_fat?: { body_fat: number; date: string }[];
  workouts?: { type: string; date: string; duration: number; calories: number }[];
  sleep?: { date: string; start: string; end: string; stages: { stage: string; duration: number; pct: number }[] }[];
}): Promise<{ imported: number; duplicates_skipped: number } | null> {
  const { data: result, error } = await supabase.rpc("import_apple_health", {
    p_weights: data.weights || [],
    p_body_fat: data.body_fat || [],
    p_workouts: data.workouts || [],
    p_sleep: data.sleep || []
  });

  if (error) {
    console.error("Error importing Apple Health data:", error);
    return null;
  }
  return result;
}

export async function importHevy(workouts: {
  date: string;
  name: string;
  exercises: { name: string; sets: { weight: number; reps: number }[] }[];
}[]): Promise<{ imported: number; duplicates_skipped: number } | null> {
  const { data: result, error } = await supabase.rpc("import_hevy", {
    p_workouts: workouts
  });

  if (error) {
    console.error("Error importing Hevy data:", error);
    return null;
  }
  return result;
}

export async function deleteImportedData(source: "apple_health" | "hevy"): Promise<{ deleted: number } | null> {
  const { data, error } = await supabase.rpc("delete_imported_data", { p_source: source });

  if (error) {
    console.error("Error deleting imported data:", error);
    return null;
  }
  return data;
}

export interface BodyFatLog {
  id: string;
  user_id: string;
  body_fat_pct: number;
  date: string;
  source: "chat" | "import_apple" | "manual";
  raw_text?: string;
  created_at: string;
}

export async function logBodyFat(percentage: number, rawText?: string): Promise<BodyFatLog | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const date = new Date().toISOString().split("T")[0];

  // Usar função RPC com SECURITY DEFINER para bypass RLS
  const { data: bodyFatId, error } = await supabase.rpc("insert_body_fat_log", {
    p_user_id: user.id,
    p_body_fat_pct: percentage,
    p_date: date,
    p_source: "chat",
    p_raw_text: rawText || null
  });

  if (error || !bodyFatId) {
    console.error("Error logging body fat:", error);
    return null;
  }

  return {
    id: bodyFatId,
    user_id: user.id,
    body_fat_pct: percentage,
    date,
    source: "chat",
    raw_text: rawText,
    created_at: new Date().toISOString()
  };
}

// ============================================
// GLICEMIA (Glucose)
// ============================================

export interface GlucoseLog {
  id: string;
  user_id: string;
  glucose_mg_dl: number;
  date: string;
  time: string;
  measurement_type: "fasting" | "pre_meal" | "post_meal" | "bedtime" | "random" | "cgm";
  notes?: string;
  device?: string;
  source: "chat" | "import_apple" | "import_csv" | "manual";
  created_at: string;
}

export interface GlucoseStats {
  period_days: number;
  avg_fasting: number | null;
  avg_post_meal: number | null;
  min_glucose: number | null;
  max_glucose: number | null;
  readings_count: number;
  time_in_range: number | null;
  by_day: { date: string; avg: number; count: number }[];
}

export async function logGlucose(
  glucoseMgDl: number,
  measurementType: GlucoseLog["measurement_type"],
  notes?: string
): Promise<GlucoseLog | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0];

  // Usar função RPC com SECURITY DEFINER para bypass RLS
  const { data: glucoseId, error } = await supabase.rpc("insert_glucose_log", {
    p_user_id: user.id,
    p_glucose_mg_dl: glucoseMgDl,
    p_date: date,
    p_time: time,
    p_measurement_type: measurementType,
    p_notes: notes || null,
    p_device: null,
    p_source: "chat"
  });

  if (error || !glucoseId) {
    console.error("Error logging glucose:", error);
    return null;
  }

  return {
    id: glucoseId,
    user_id: user.id,
    glucose_mg_dl: glucoseMgDl,
    date,
    time,
    measurement_type: measurementType,
    notes,
    source: "chat",
    created_at: new Date().toISOString()
  };
}

export interface GlucoseReadingImport {
  glucose_mg_dl: number;
  date: string;
  time: string;
  measurement_type: GlucoseLog["measurement_type"];
  notes?: string;
  device?: string;
  source?: string;
}

/**
 * Importa múltiplas leituras de glicose (para importação de CGM)
 */
export async function importGlucoseReadings(
  readings: GlucoseReadingImport[]
): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  let imported = 0;
  for (const reading of readings) {
    const { error } = await supabase
      .from("glucose_logs")
      .insert({
        user_id: user.id,
        glucose_mg_dl: reading.glucose_mg_dl,
        date: reading.date,
        time: reading.time,
        measurement_type: reading.measurement_type,
        notes: reading.notes,
        source: reading.source || "import_csv"
      });

    if (!error) {
      imported++;
    }
  }

  return imported;
}

export async function getGlucoseStats(periodDays: number = 7): Promise<GlucoseStats | null> {
  const { data, error } = await supabase.rpc("get_glucose_stats", { p_days: periodDays });

  if (error) {
    console.error("Error fetching glucose stats:", error);
    return null;
  }
  return data;
}

export async function getRecentGlucoseLogs(limit: number = 10): Promise<GlucoseLog[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("glucose_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("time", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching glucose logs:", error);
    return [];
  }
  return data || [];
}

// ============================================
// CONTEXTO PARA AI
// ============================================

export interface UserContext {
  profile: Profile | null;
  recentMeals: { date: string; meal_type: string; total_calories: number; total_protein_g: number }[];
  recentWorkouts: { date: string; workout_type: string; duration_min: number; calories_burned: number }[];
  recentWeights: { date: string; weight_kg: number }[];
  recentGlucose: { date: string; time: string; glucose_mg_dl: number; measurement_type: string }[];
  todaySummary: HomeSummary | null;
  glucoseStats: GlucoseStats | null;
}

/**
 * Busca contexto completo do usuário para passar para a AI
 * Inclui: perfil, refeições recentes, treinos, peso, glicemia
 */
export async function getUserContextForAI(): Promise<UserContext | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Buscar dados em paralelo para performance
  const [
    profileResult,
    mealsResult,
    workoutsResult,
    weightsResult,
    glucoseResult,
    summaryResult,
    glucoseStatsResult
  ] = await Promise.all([
    // Profile
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    // Últimas 30 refeições (últimos 7 dias aproximadamente)
    supabase
      .from("meals")
      .select("date, meal_type, total_calories, total_protein_g")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(30),
    // Últimos 14 treinos
    supabase
      .from("workouts")
      .select("date, workout_type, duration_min, calories_burned")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(14),
    // Últimos 30 registros de peso
    supabase
      .from("weight_logs")
      .select("date, weight_kg")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(30),
    // Últimos 50 registros de glicemia (aproximadamente 1 semana de CGM)
    supabase
      .from("glucose_logs")
      .select("date, time, glucose_mg_dl, measurement_type")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("time", { ascending: false })
      .limit(50),
    // Resumo de hoje
    getHomeSummary(),
    // Estatísticas de glicemia dos últimos 7 dias
    getGlucoseStats(7)
  ]);

  return {
    profile: profileResult.data,
    recentMeals: mealsResult.data || [],
    recentWorkouts: workoutsResult.data || [],
    recentWeights: weightsResult.data || [],
    recentGlucose: glucoseResult.data || [],
    todaySummary: summaryResult,
    glucoseStats: glucoseStatsResult
  };
}

/**
 * Formata o contexto do usuário como texto para incluir no prompt da AI
 */
export function formatUserContextForPrompt(context: UserContext): string {
  const lines: string[] = [];

  // Profile
  if (context.profile) {
    const age = new Date().getFullYear() - new Date(context.profile.birth_date).getFullYear();
    lines.push(`## Perfil do Usuário`);
    lines.push(`- Nome: ${context.profile.name}`);
    lines.push(`- Gênero: ${context.profile.gender}`);
    lines.push(`- Idade: ${age} anos`);
    lines.push(`- Altura: ${context.profile.height_cm}cm`);
    lines.push(`- Peso atual: ${context.profile.weight_kg}kg`);
    lines.push(``);
  }

  // Resumo de hoje
  if (context.todaySummary) {
    lines.push(`## Hoje (${context.todaySummary.date})`);
    lines.push(`- Calorias consumidas: ${context.todaySummary.calories_in} kcal`);
    lines.push(`- Calorias gastas: ${context.todaySummary.calories_out} kcal`);
    lines.push(`- Proteína: ${context.todaySummary.protein}g`);
    lines.push(`- Treino: ${context.todaySummary.workout_minutes} min`);
    lines.push(``);
  }

  // Refeições recentes (últimos 3 dias)
  if (context.recentMeals.length > 0) {
    const last3Days = [...new Set(context.recentMeals.slice(0, 12).map(m => m.date))].slice(0, 3);
    lines.push(`## Refeições Recentes`);
    for (const date of last3Days) {
      const dayMeals = context.recentMeals.filter(m => m.date === date);
      const totalCal = dayMeals.reduce((sum, m) => sum + (m.total_calories || 0), 0);
      const totalProt = dayMeals.reduce((sum, m) => sum + (m.total_protein_g || 0), 0);
      lines.push(`- ${date}: ${totalCal} kcal, ${Math.round(totalProt)}g proteína (${dayMeals.length} refeições)`);
    }
    lines.push(``);
  }

  // Treinos recentes
  if (context.recentWorkouts.length > 0) {
    lines.push(`## Treinos Recentes`);
    for (const w of context.recentWorkouts.slice(0, 5)) {
      lines.push(`- ${w.date}: ${w.workout_type} (${w.duration_min || 0}min, ${w.calories_burned || 0}kcal)`);
    }
    lines.push(``);
  }

  // Evolução de peso
  if (context.recentWeights.length > 0) {
    lines.push(`## Evolução de Peso`);
    const weights = context.recentWeights.slice(0, 5);
    for (const w of weights) {
      lines.push(`- ${w.date}: ${w.weight_kg}kg`);
    }
    if (weights.length >= 2) {
      const diff = weights[0].weight_kg - weights[weights.length - 1].weight_kg;
      const trend = diff > 0 ? "ganhou" : diff < 0 ? "perdeu" : "manteve";
      lines.push(`- Tendência: ${trend} ${Math.abs(diff).toFixed(1)}kg no período`);
    }
    lines.push(``);
  }

  // Glicemia
  if (context.glucoseStats && context.glucoseStats.readings_count > 0) {
    lines.push(`## Glicemia (últimos 7 dias)`);
    if (context.glucoseStats.avg_fasting) {
      lines.push(`- Média em jejum: ${context.glucoseStats.avg_fasting} mg/dL`);
    }
    if (context.glucoseStats.avg_post_meal) {
      lines.push(`- Média pós-refeição: ${context.glucoseStats.avg_post_meal} mg/dL`);
    }
    if (context.glucoseStats.time_in_range) {
      lines.push(`- Tempo no alvo (70-140): ${context.glucoseStats.time_in_range}%`);
    }
    if (context.glucoseStats.min_glucose && context.glucoseStats.max_glucose) {
      lines.push(`- Range: ${context.glucoseStats.min_glucose}-${context.glucoseStats.max_glucose} mg/dL`);
    }
    lines.push(``);
  }

  return lines.join("\n");
}
