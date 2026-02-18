import type { InsightsData, SleepInsightsData, WorkoutProgressionData } from "@/lib/supabase";

// ========================================
// INSIGHTS CORRELATIONS ENGINE
// ========================================
// Analise cross-domain por agrupamento simples.
// Ex: "Dias com >7h de sono: glicemia media 95 vs 112"

export interface Correlation {
  id: string;
  domains: [string, string];
  icon: string;
  text: string;
  type: "positive" | "warning" | "info";
  strength: number;
}

export interface CorrelationInput {
  insights: InsightsData | null;
  sleep: SleepInsightsData | null;
  workout: WorkoutProgressionData | null;
  weightKg: number;
  proteinTarget: number;
}

export function computeCorrelations(input: CorrelationInput): Correlation[] {
  const results: Correlation[] = [];

  correlateSleepGlucose(input, results);
  correlateWorkoutSleep(input, results);
  correlateProteinWeight(input, results);
  correlateCalorieConsistencyWeight(input, results);
  correlateWorkoutCalories(input, results);

  return results
    .filter((c) => c.strength > 0)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3);
}

// Sono → Glicemia: dias com >7h sono vs <7h
function correlateSleepGlucose(input: CorrelationInput, results: Correlation[]) {
  const { sleep, insights } = input;
  if (!sleep || !insights || sleep.by_day.length < 5 || !insights.glucose?.by_day || insights.glucose.by_day.length < 5) return;

  const sleepMap = new Map(sleep.by_day.map((d) => [d.date, d.total_min]));
  const goodSleepGlucose: number[] = [];
  const badSleepGlucose: number[] = [];

  for (const g of insights.glucose.by_day) {
    const sleepMin = sleepMap.get(g.date);
    if (sleepMin === undefined) continue;
    if (sleepMin >= 420) goodSleepGlucose.push(g.avg);
    else badSleepGlucose.push(g.avg);
  }

  if (goodSleepGlucose.length < 3 || badSleepGlucose.length < 3) return;

  const goodAvg = avg(goodSleepGlucose);
  const badAvg = avg(badSleepGlucose);
  const diff = Math.abs(goodAvg - badAvg);

  if (diff < 5) return;

  const strength = Math.min(1, diff / 20);
  const better = goodAvg < badAvg;

  results.push({
    id: "sleep-glucose",
    domains: ["sono", "glicemia"],
    icon: "bedtime",
    text: better
      ? `Dias com 7h+ de sono: glicemia ${Math.round(goodAvg)} mg/dL vs ${Math.round(badAvg)} com menos sono`
      : `Glicemia similar independente do sono (${Math.round(goodAvg)} vs ${Math.round(badAvg)})`,
    type: better ? "positive" : "info",
    strength: better ? strength : strength * 0.5,
  });
}

// Treino → Sono: dias apos treino vs sem treino
function correlateWorkoutSleep(input: CorrelationInput, results: Correlation[]) {
  const { workout, sleep } = input;
  if (!workout || !sleep || workout.volume_by_day.length < 3 || sleep.by_day.length < 5) return;

  const workoutDates = new Set(workout.volume_by_day.map((d) => d.date));
  const afterWorkout: number[] = [];
  const noWorkout: number[] = [];

  for (const s of sleep.by_day) {
    if (s.total_min <= 0) continue;
    if (workoutDates.has(s.date)) afterWorkout.push(s.total_min);
    else noWorkout.push(s.total_min);
  }

  if (afterWorkout.length < 3 || noWorkout.length < 3) return;

  const avgAfter = avg(afterWorkout);
  const avgNo = avg(noWorkout);
  const diffMin = avgAfter - avgNo;

  if (Math.abs(diffMin) < 10) return;

  const strength = Math.min(1, Math.abs(diffMin) / 45);
  const better = diffMin > 0;

  results.push({
    id: "workout-sleep",
    domains: ["treino", "sono"],
    icon: "fitness_center",
    text: better
      ? `Sono ${Math.round(Math.abs(diffMin))}min maior em dias de treino`
      : `Sono ${Math.round(Math.abs(diffMin))}min menor em dias de treino`,
    type: better ? "positive" : "warning",
    strength,
  });
}

// Proteina alta vs baixa → variacao de peso
function correlateProteinWeight(input: CorrelationInput, results: Correlation[]) {
  const { insights } = input;
  if (!insights || insights.protein_by_day.length < 7 || insights.weights.length < 4) return;

  const protTarget = input.proteinTarget > 0 ? input.proteinTarget : 120;
  const protMap = new Map(insights.protein_by_day.map((d) => [d.date, d.protein]));
  const weightMap = new Map(insights.weights.map((d) => [d.date, d.weight]));

  // Agrupa por semanas
  const highProtWeights: number[] = [];
  const lowProtWeights: number[] = [];

  for (const [date, weight] of weightMap) {
    const prot = protMap.get(date);
    if (prot === undefined) continue;
    if (prot >= protTarget * 0.9) highProtWeights.push(weight);
    else lowProtWeights.push(weight);
  }

  if (highProtWeights.length < 2 || lowProtWeights.length < 2) return;

  const avgHigh = avg(highProtWeights);
  const avgLow = avg(lowProtWeights);
  const diff = avgLow - avgHigh;

  if (Math.abs(diff) < 0.2) return;

  const strength = Math.min(1, Math.abs(diff) / 1.5);
  const protHelps = diff > 0;

  results.push({
    id: "protein-weight",
    domains: ["dieta", "corpo"],
    icon: "egg_alt",
    text: protHelps
      ? `Peso menor (${avgHigh.toFixed(1)}kg) em dias com proteina alta vs ${avgLow.toFixed(1)}kg`
      : `Peso similar independente da proteina`,
    type: protHelps ? "positive" : "info",
    strength: protHelps ? strength : strength * 0.3,
  });
}

// Consistencia calorica → peso
function correlateCalorieConsistencyWeight(input: CorrelationInput, results: Correlation[]) {
  const { insights } = input;
  if (!insights || insights.calories_by_day.length < 10 || insights.weights.length < 4) return;

  const daysWithFood = insights.calories_by_day.filter((d) => d.calories > 0);
  if (daysWithFood.length < 7) return;

  const calValues = daysWithFood.map((d) => d.calories);
  const mean = avg(calValues);
  if (mean === 0) return;

  const variance = calValues.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / calValues.length;
  const cv = (Math.sqrt(variance) / mean) * 100;

  if (cv < 15) {
    const weights = insights.weights;
    if (weights.length < 2) return;

    const first = weights[0].weight;
    const last = weights[weights.length - 1].weight;
    const trend = last - first;

    results.push({
      id: "calorie-consistency",
      domains: ["dieta", "corpo"],
      icon: "show_chart",
      text: `Calorias consistentes (variacao ${Math.round(cv)}%) — peso ${trend <= 0 ? "estavel/caindo" : "subindo"}`,
      type: trend <= 0 ? "positive" : "info",
      strength: 0.6,
    });
  } else if (cv > 30) {
    results.push({
      id: "calorie-consistency",
      domains: ["dieta", "corpo"],
      icon: "show_chart",
      text: `Calorias muito variaveis (${Math.round(cv)}% de variacao entre dias)`,
      type: "warning",
      strength: 0.5,
    });
  }
}

// Treino → Calorias consumidas
function correlateWorkoutCalories(input: CorrelationInput, results: Correlation[]) {
  const { workout, insights } = input;
  if (!workout || !insights || workout.volume_by_day.length < 3) return;

  const workoutDates = new Set(workout.volume_by_day.map((d) => d.date));
  const calMap = new Map(insights.calories_by_day.map((d) => [d.date, d.calories]));

  const trainDayCal: number[] = [];
  const restDayCal: number[] = [];

  for (const [date, cal] of calMap) {
    if (cal <= 0) continue;
    if (workoutDates.has(date)) trainDayCal.push(cal);
    else restDayCal.push(cal);
  }

  if (trainDayCal.length < 3 || restDayCal.length < 3) return;

  const avgTrain = avg(trainDayCal);
  const avgRest = avg(restDayCal);
  const diff = avgTrain - avgRest;

  if (Math.abs(diff) < 100) return;

  const strength = Math.min(1, Math.abs(diff) / 500);

  results.push({
    id: "workout-calories",
    domains: ["treino", "dieta"],
    icon: "local_fire_department",
    text: diff > 0
      ? `Voce come ${Math.round(diff)} kcal a mais em dias de treino`
      : `Voce come ${Math.round(Math.abs(diff))} kcal a menos em dias de treino`,
    type: "info",
    strength,
  });
}

// ------ HELPERS ------

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}
