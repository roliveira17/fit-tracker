/**
 * Glucose Analysis — Agregacao deterministica de dados de glicemia
 *
 * Gera metricas estruturadas (time in range, media, min/max, tendencia diaria)
 * para o GlucoseAnalysisCard sem depender da IA.
 *
 * 2 paths:
 * - Supabase: metricas completas (glucoseStats + recentGlucose)
 * - Sem dados: mensagem incentivando registro
 */

import { type UserContext, type GlucoseStats } from "./supabase";

export interface GlucoseDaySummary {
  date: string;
  avg: number;
  min: number;
  max: number;
  count: number;
}

export interface GlucoseAnalysisResult {
  timeInRange: number | null;
  avgGlucose: number | null;
  avgFasting: number | null;
  avgPostMeal: number | null;
  minGlucose: number | null;
  maxGlucose: number | null;
  readingsCount: number;
  byDay: GlucoseDaySummary[];
  status: "good" | "warning" | "low";
  summary: string;
  recommendation: string;
}

/**
 * Entry point — constroi analise de glicemia a partir do contexto
 */
export function buildGlucoseAnalysis(
  supabaseContext?: UserContext
): GlucoseAnalysisResult {
  if (!supabaseContext) {
    return buildEmpty();
  }

  const { glucoseStats, recentGlucose } = supabaseContext;

  if (!glucoseStats || glucoseStats.readings_count === 0) {
    if (recentGlucose && recentGlucose.length > 0) {
      return buildFromReadings(recentGlucose);
    }
    return buildEmpty();
  }

  return buildFromStats(glucoseStats, recentGlucose);
}

// ============================================
// BUILD FROM STATS (primary path)
// ============================================

function buildFromStats(
  stats: GlucoseStats,
  recentGlucose: { date: string; time: string; glucose_mg_dl: number; measurement_type: string }[]
): GlucoseAnalysisResult {
  const byDay = buildByDay(recentGlucose);
  const avgGlucose = computeOverallAvg(recentGlucose);
  const status = evaluateStatus(stats.time_in_range, avgGlucose);
  const summary = generateSummary(stats, status);
  const recommendation = generateRecommendation(stats, status);

  return {
    timeInRange: stats.time_in_range,
    avgGlucose,
    avgFasting: stats.avg_fasting,
    avgPostMeal: stats.avg_post_meal,
    minGlucose: stats.min_glucose,
    maxGlucose: stats.max_glucose,
    readingsCount: stats.readings_count,
    byDay,
    status,
    summary,
    recommendation,
  };
}

// ============================================
// BUILD FROM RAW READINGS (fallback)
// ============================================

function buildFromReadings(
  readings: { date: string; time: string; glucose_mg_dl: number; measurement_type: string }[]
): GlucoseAnalysisResult {
  const values = readings.map((r) => r.glucose_mg_dl);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const inRange = values.filter((v) => v >= 70 && v <= 140).length;
  const timeInRange = Math.round((inRange / values.length) * 100);

  const fasting = readings.filter((r) => r.measurement_type === "fasting");
  const postMeal = readings.filter((r) => r.measurement_type === "post_meal");

  const avgFasting = fasting.length > 0
    ? Math.round(fasting.reduce((s, r) => s + r.glucose_mg_dl, 0) / fasting.length)
    : null;
  const avgPostMeal = postMeal.length > 0
    ? Math.round(postMeal.reduce((s, r) => s + r.glucose_mg_dl, 0) / postMeal.length)
    : null;

  const byDay = buildByDay(readings);
  const status = evaluateStatus(timeInRange, avg);

  const mockStats: GlucoseStats = {
    period_days: 7,
    avg_fasting: avgFasting,
    avg_post_meal: avgPostMeal,
    min_glucose: min,
    max_glucose: max,
    readings_count: readings.length,
    time_in_range: timeInRange,
    by_day: [],
  };

  return {
    timeInRange,
    avgGlucose: avg,
    avgFasting,
    avgPostMeal,
    minGlucose: min,
    maxGlucose: max,
    readingsCount: readings.length,
    byDay,
    status,
    summary: generateSummary(mockStats, status),
    recommendation: generateRecommendation(mockStats, status),
  };
}

// ============================================
// EMPTY PATH
// ============================================

function buildEmpty(): GlucoseAnalysisResult {
  return {
    timeInRange: null,
    avgGlucose: null,
    avgFasting: null,
    avgPostMeal: null,
    minGlucose: null,
    maxGlucose: null,
    readingsCount: 0,
    byDay: [],
    status: "low",
    summary: "Sem dados de glicemia registrados.",
    recommendation: "Importe dados do seu sensor CGM ou registre leituras manuais para ver sua análise.",
  };
}

// ============================================
// HELPERS
// ============================================

function buildByDay(
  readings: { date: string; glucose_mg_dl: number }[]
): GlucoseDaySummary[] {
  const map = new Map<string, number[]>();
  for (const r of readings) {
    const arr = map.get(r.date) || [];
    arr.push(r.glucose_mg_dl);
    map.set(r.date, arr);
  }

  return [...map.entries()]
    .map(([date, values]) => ({
      date,
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function computeOverallAvg(
  readings: { glucose_mg_dl: number }[]
): number | null {
  if (readings.length === 0) return null;
  return Math.round(
    readings.reduce((s, r) => s + r.glucose_mg_dl, 0) / readings.length
  );
}

function evaluateStatus(
  timeInRange: number | null,
  avgGlucose: number | null
): "good" | "warning" | "low" {
  if (timeInRange !== null) {
    if (timeInRange >= 85) return "good";
    if (timeInRange >= 70) return "warning";
    return "low";
  }
  if (avgGlucose !== null) {
    if (avgGlucose >= 70 && avgGlucose <= 110) return "good";
    if (avgGlucose >= 60 && avgGlucose <= 140) return "warning";
    return "low";
  }
  return "low";
}

function generateSummary(
  stats: GlucoseStats,
  status: "good" | "warning" | "low"
): string {
  const { readings_count, time_in_range } = stats;

  if (status === "good") {
    return `Glicemia estável com ${readings_count} leituras. ${time_in_range !== null ? `${time_in_range}% do tempo no alvo.` : ""}`;
  }
  if (status === "warning") {
    return `Atenção: algumas leituras fora do alvo. ${readings_count} leituras nos últimos 7 dias.`;
  }
  return `Glicemia precisa de atenção. Consulte seu médico se os valores persistirem.`;
}

function generateRecommendation(
  stats: GlucoseStats,
  status: "good" | "warning" | "low"
): string {
  if (status === "good") {
    return "Continue monitorando. Seus níveis estão dentro do esperado.";
  }
  if (stats.avg_post_meal && stats.avg_post_meal > 140) {
    return "Sua glicemia pós-refeição está alta. Considere reduzir carboidratos refinados.";
  }
  if (stats.avg_fasting && stats.avg_fasting > 100) {
    return "Sua glicemia em jejum está elevada. Converse com seu médico sobre isso.";
  }
  if (status === "warning") {
    return "Monitore com mais frequência e observe quais alimentos impactam mais seus níveis.";
  }
  return "Registre mais leituras para uma análise mais precisa.";
}
