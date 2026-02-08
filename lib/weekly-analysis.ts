/**
 * Weekly Analysis — Agregacao deterministica de dados do usuario
 *
 * Gera metricas estruturadas (calories, protein, workouts, weight)
 * para o WeeklyAnalysisCard sem depender da IA.
 *
 * 3 paths:
 * - Supabase: metricas completas (meals, workouts, weight)
 * - localStorage: so nutricao (meals)
 * - Sem dados: mensagem incentivando registro
 */

import { type UserContext } from "./supabase";
import { type UserProfile, type Meal } from "./storage";

interface MetricItem {
  label: string;
  value: string;
  status: "good" | "warning" | "low";
  detail?: string;
}

interface RecommendationItem {
  text: string;
}

export interface WeeklyAnalysisResult {
  metrics: MetricItem[];
  recommendations: RecommendationItem[];
  summary: string;
}

/**
 * Entry point — escolhe o path correto baseado nos dados disponiveis
 */
export function buildWeeklyAnalysis(
  profile: UserProfile,
  supabaseContext?: UserContext,
  mealHistory?: Meal[]
): WeeklyAnalysisResult {
  if (supabaseContext && hasSupabaseData(supabaseContext)) {
    return buildFromSupabase(profile, supabaseContext);
  }
  if (mealHistory && mealHistory.length > 0) {
    return buildFromLocalStorage(profile, mealHistory);
  }
  return buildEmpty();
}

// ============================================
// HELPERS
// ============================================

function hasSupabaseData(ctx: UserContext): boolean {
  return (
    ctx.recentMeals.length > 0 ||
    ctx.recentWorkouts.length > 0 ||
    ctx.recentWeights.length > 0
  );
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function filterLast7Days<T extends { date: string }>(items: T[]): T[] {
  const cutoff = daysAgo(7);
  return items.filter((item) => item.date >= cutoff);
}

function uniqueDates(items: { date: string }[]): string[] {
  return [...new Set(items.map((i) => i.date))];
}

// ============================================
// SUPABASE PATH (metricas completas)
// ============================================

function buildFromSupabase(
  profile: UserProfile,
  ctx: UserContext
): WeeklyAnalysisResult {
  const metrics: MetricItem[] = [];

  const meals7d = filterLast7Days(ctx.recentMeals);
  const workouts7d = filterLast7Days(ctx.recentWorkouts);
  const weights7d = filterLast7Days(ctx.recentWeights);

  const daysWithMeals = uniqueDates(meals7d).length;

  // Metrica: Calorias medias
  if (daysWithMeals > 0) {
    const totalCal = meals7d.reduce((s, m) => s + (m.total_calories || 0), 0);
    const avgCal = Math.round(totalCal / daysWithMeals);
    const bmr = profile.bmr || 2000;
    const ratio = avgCal / bmr;

    let status: MetricItem["status"] = "good";
    let detail = `Dentro do esperado para seu BMR de ${bmr} kcal`;
    if (ratio < 0.7) {
      status = "low";
      detail = `Muito abaixo do seu BMR de ${bmr} kcal. Cuidado com deficit excessivo.`;
    } else if (ratio < 0.85 || ratio > 1.15) {
      status = "warning";
      detail = ratio < 1
        ? `Um pouco abaixo do BMR de ${bmr} kcal`
        : `Acima do BMR de ${bmr} kcal — verifique se é intencional`;
    }

    metrics.push({
      label: "CALORIAS MÉDIAS",
      value: `${avgCal} kcal/dia`,
      status,
      detail,
    });
  }

  // Metrica: Proteina media
  if (daysWithMeals > 0) {
    const totalProt = meals7d.reduce(
      (s, m) => s + (m.total_protein_g || 0),
      0
    );
    const avgProt = Math.round(totalProt / daysWithMeals);
    const gPerKg = avgProt / profile.weight;

    let status: MetricItem["status"] = "good";
    let detail = `${gPerKg.toFixed(1)}g/kg — nível alto mantido`;
    if (gPerKg < 1.2) {
      status = "low";
      detail = `${gPerKg.toFixed(1)}g/kg — precisa aumentar para pelo menos 1.6g/kg`;
    } else if (gPerKg < 1.6) {
      status = "warning";
      detail = `${gPerKg.toFixed(1)}g/kg — quase lá, falta um pouco para o ideal`;
    }

    metrics.push({
      label: "PROTEÍNA MÉDIA",
      value: `${avgProt}g/dia`,
      status,
      detail,
    });
  }

  // Metrica: Treinos na semana
  const workoutDays = uniqueDates(workouts7d).length;
  if (ctx.recentWorkouts.length > 0 || daysWithMeals > 0) {
    let status: MetricItem["status"] = "good";
    let detail = "Boa consistência de treinos";
    if (workoutDays === 0) {
      status = "low";
      detail = "Nenhum treino registrado nos últimos 7 dias";
    } else if (workoutDays < 3) {
      status = "warning";
      detail = `${workoutDays} dia${workoutDays > 1 ? "s" : ""} de treino — tente chegar a 3+`;
    }

    metrics.push({
      label: "TREINOS NA SEMANA",
      value: `${workoutDays}x`,
      status,
      detail,
    });
  }

  // Metrica: Tendencia de peso (so se tiver 2+ registros)
  if (weights7d.length >= 2) {
    const sorted = [...weights7d].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0].weight_kg;
    const last = sorted[sorted.length - 1].weight_kg;
    const delta = last - first;
    const absDelta = Math.abs(delta);

    let status: MetricItem["status"] = "good";
    let detail = "Peso estável nos últimos 7 dias";
    if (absDelta > 1) {
      status = "warning";
      detail = delta > 0
        ? `Aumento de ${absDelta.toFixed(1)}kg — monitore`
        : `Queda de ${absDelta.toFixed(1)}kg — monitore`;
    } else if (absDelta > 0.3) {
      detail = delta > 0
        ? `Leve aumento de ${absDelta.toFixed(1)}kg`
        : `Leve queda de ${absDelta.toFixed(1)}kg`;
    }

    const sign = delta > 0 ? "+" : "";
    metrics.push({
      label: "TENDÊNCIA DE PESO",
      value: `${sign}${delta.toFixed(1)} kg`,
      status,
      detail,
    });
  }

  const recommendations = generateRecommendations(metrics);
  const summary = generateSummary(metrics, daysWithMeals);

  return { metrics, recommendations, summary };
}

// ============================================
// LOCALSTORAGE PATH (so nutricao)
// ============================================

function buildFromLocalStorage(
  profile: UserProfile,
  meals: Meal[]
): WeeklyAnalysisResult {
  const metrics: MetricItem[] = [];

  // Filtra ultimos 7 dias
  const cutoff = daysAgo(7);
  const meals7d = meals.filter((m) => m.date >= cutoff);
  const daysWithMeals = [...new Set(meals7d.map((m) => m.date))].length;

  if (daysWithMeals === 0) {
    return buildEmpty();
  }

  // Calorias
  const totalCal = meals7d.reduce((s, m) => s + (m.totalCalories || 0), 0);
  const avgCal = Math.round(totalCal / daysWithMeals);
  const bmr = profile.bmr || 2000;
  const ratio = avgCal / bmr;

  let calStatus: MetricItem["status"] = "good";
  let calDetail = `Dentro do esperado para seu BMR de ${bmr} kcal`;
  if (ratio < 0.7) {
    calStatus = "low";
    calDetail = `Muito abaixo do seu BMR de ${bmr} kcal`;
  } else if (ratio < 0.85 || ratio > 1.15) {
    calStatus = "warning";
    calDetail = ratio < 1 ? `Abaixo do BMR de ${bmr} kcal` : `Acima do BMR de ${bmr} kcal`;
  }

  metrics.push({
    label: "CALORIAS MÉDIAS",
    value: `${avgCal} kcal/dia`,
    status: calStatus,
    detail: calDetail,
  });

  // Proteina
  const totalProt = meals7d.reduce((s, m) => s + (m.totalProtein || 0), 0);
  const avgProt = Math.round(totalProt / daysWithMeals);
  if (avgProt > 0) {
    const gPerKg = avgProt / profile.weight;
    let protStatus: MetricItem["status"] = "good";
    let protDetail = `${gPerKg.toFixed(1)}g/kg — nível alto mantido`;
    if (gPerKg < 1.2) {
      protStatus = "low";
      protDetail = `${gPerKg.toFixed(1)}g/kg — precisa aumentar`;
    } else if (gPerKg < 1.6) {
      protStatus = "warning";
      protDetail = `${gPerKg.toFixed(1)}g/kg — quase no ideal`;
    }

    metrics.push({
      label: "PROTEÍNA MÉDIA",
      value: `${avgProt}g/dia`,
      status: protStatus,
      detail: protDetail,
    });
  }

  const recommendations = generateRecommendations(metrics);
  const summary = generateSummary(metrics, daysWithMeals);

  return { metrics, recommendations, summary };
}

// ============================================
// EMPTY PATH
// ============================================

function buildEmpty(): WeeklyAnalysisResult {
  return {
    metrics: [],
    recommendations: [
      { text: "Comece registrando suas refeições e treinos para obter uma análise personalizada." },
    ],
    summary: "Sem dados suficientes para análise semanal.",
  };
}

// ============================================
// RECOMMENDATIONS (regras deterministicas)
// ============================================

function generateRecommendations(metrics: MetricItem[]): RecommendationItem[] {
  const recs: RecommendationItem[] = [];

  for (const m of metrics) {
    if (m.status === "good") continue;

    if (m.label === "CALORIAS MÉDIAS") {
      if (m.status === "low") {
        recs.push({ text: "Suas calorias estão muito baixas. Adicione lanches nutritivos entre as refeições." });
      } else {
        recs.push({ text: "Ajuste suas porções para ficar mais próximo do seu gasto calórico diário." });
      }
    }

    if (m.label === "PROTEÍNA MÉDIA") {
      if (m.status === "low") {
        recs.push({ text: "Aumente a proteína: inclua ovos, frango, peixe ou whey em cada refeição." });
      } else {
        recs.push({ text: "Tente adicionar uma fonte extra de proteína no almoço ou jantar." });
      }
    }

    if (m.label === "TREINOS NA SEMANA") {
      if (m.status === "low") {
        recs.push({ text: "Tente incluir ao menos 2-3 sessões de exercício por semana." });
      } else {
        recs.push({ text: "Bom ritmo! Tente manter a consistência e chegar a 3+ treinos semanais." });
      }
    }

    if (m.label === "TENDÊNCIA DE PESO" && m.status === "warning") {
      recs.push({ text: "Variação de peso acima do normal. Verifique hidratação e consistência alimentar." });
    }
  }

  // Se tudo esta bom, dica motivacional
  if (recs.length === 0 && metrics.length > 0) {
    recs.push({ text: "Continue assim! Todos os indicadores estão no alvo esta semana." });
  }

  return recs.slice(0, 3);
}

// ============================================
// SUMMARY
// ============================================

function generateSummary(metrics: MetricItem[], daysWithData: number): string {
  if (metrics.length === 0) {
    return "Sem dados suficientes para análise semanal.";
  }

  const goodCount = metrics.filter((m) => m.status === "good").length;
  const total = metrics.length;

  if (goodCount === total) {
    return `Semana excelente! ${daysWithData} dias com registros, todos os indicadores positivos.`;
  }
  if (goodCount >= total / 2) {
    return `Semana boa no geral. ${goodCount} de ${total} métricas no alvo.`;
  }
  return `Semana com pontos de atenção. Veja as recomendações abaixo.`;
}
