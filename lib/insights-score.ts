import type { InsightsData, SleepInsightsData, WorkoutProgressionData } from "@/lib/supabase";

// ========================================
// INSIGHTS SCORE ENGINE
// ========================================
// Score composto 0-100, 100% deterministico.
// Inspirado no WHOOP Recovery Score.

export interface ScoreFactor {
  name: string;
  score: number;
  maxScore: number;
  detail: string;
}

export interface DomainScore {
  domain: "nutricao" | "treino" | "sono" | "glicemia" | "corpo";
  score: number;
  maxScore: number;
  label: string;
  icon: string;
  color: string;
  factors: ScoreFactor[];
  hasData: boolean;
}

export type Grade = "A" | "B" | "C" | "D" | "F";

export interface CompositeScore {
  total: number;
  grade: Grade;
  domains: DomainScore[];
  activeDomains: number;
}

export interface ScoreInput {
  caloriesData: { date: string; value: number }[];
  proteinData: { date: string; value: number }[];
  carbsData: { date: string; value: number }[];
  fatData: { date: string; value: number }[];
  tdee: number;
  weightKg: number;
  periodDays: number;
  workout: WorkoutProgressionData | null;
  sleep: SleepInsightsData | null;
  glucose: InsightsData["glucose"] | null;
  weightData: { date: string; value: number | null }[];
  bodyFatData: { date: string; value: number | null }[];
}

export function computeCompositeScore(input: ScoreInput): CompositeScore {
  const domains = [
    scoreNutricao(input),
    scoreTreino(input),
    scoreSono(input),
    scoreGlicemia(input),
    scoreCorpo(input),
  ];

  const activeDomains = domains.filter((d) => d.hasData).length;
  const rawTotal = domains.reduce((s, d) => s + d.score, 0);

  // Normaliza para 0-100 baseado nos dominios ativos
  const maxPossible = domains
    .filter((d) => d.hasData)
    .reduce((s, d) => s + d.maxScore, 0);

  const total = maxPossible > 0 ? Math.round((rawTotal / maxPossible) * 100) : 0;

  return {
    total: Math.min(100, total),
    grade: toGrade(total),
    domains,
    activeDomains,
  };
}

function toGrade(score: number): Grade {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

// ------ NUTRICAO (0-25) ------

function scoreNutricao(input: ScoreInput): DomainScore {
  const daysWithFood = input.caloriesData.filter((d) => d.value > 0);
  const factors: ScoreFactor[] = [];

  if (daysWithFood.length < 3 || input.tdee <= 0) {
    return makeDomain("nutricao", 0, 25, factors, false);
  }

  // Calorias vs TDEE (0-10)
  const avgCal = avg(daysWithFood.map((d) => d.value));
  const calDeviation = Math.abs(avgCal - input.tdee) / (input.tdee * 0.2);
  const calScore = Math.round(10 * Math.max(0, 1 - calDeviation));
  const calPct = Math.round(((avgCal - input.tdee) / input.tdee) * 100);
  factors.push({
    name: "Calorias vs TDEE",
    score: calScore,
    maxScore: 10,
    detail: calPct >= 0 ? `+${calPct}% do gasto` : `${calPct}% do gasto`,
  });

  // Proteina vs 1.6g/kg (0-10)
  const daysWithProtein = input.proteinData.filter((d) => d.value > 0);
  const avgProt = daysWithProtein.length > 0 ? avg(daysWithProtein.map((d) => d.value)) : 0;
  const protTarget = input.weightKg > 0 ? input.weightKg * 1.6 : 120;
  const protRatio = Math.min(1, avgProt / protTarget);
  const protScore = Math.round(10 * protRatio);
  factors.push({
    name: "Proteina",
    score: protScore,
    maxScore: 10,
    detail: `${Math.round(avgProt)}g / ${Math.round(protTarget)}g meta`,
  });

  // Macro balance (0-5)
  const avgFat = avg(input.fatData.filter((d) => d.value > 0).map((d) => d.value));
  const avgCarbs = avg(input.carbsData.filter((d) => d.value > 0).map((d) => d.value));
  const totalMacroCal = avgProt * 4 + avgCarbs * 4 + avgFat * 9;
  let macroScore = 0;
  if (totalMacroCal > 0) {
    const fatPct = (avgFat * 9) / totalMacroCal * 100;
    const protPct = (avgProt * 4) / totalMacroCal * 100;
    const fatOk = fatPct >= 20 && fatPct <= 35;
    const protOk = protPct >= 20 && protPct <= 40;
    macroScore = (fatOk ? 2.5 : 0) + (protOk ? 2.5 : 0);
  }
  factors.push({
    name: "Equilibrio macros",
    score: Math.round(macroScore),
    maxScore: 5,
    detail: macroScore >= 4 ? "Equilibrado" : "Ajustar distribuicao",
  });

  const total = calScore + protScore + Math.round(macroScore);
  return makeDomain("nutricao", total, 25, factors, true);
}

// ------ TREINO (0-25) ------

function scoreTreino(input: ScoreInput): DomainScore {
  const factors: ScoreFactor[] = [];
  const { workout, periodDays } = input;

  if (!workout || workout.total_workouts === 0) {
    return makeDomain("treino", 0, 25, factors, false);
  }

  const weeksInPeriod = periodDays / 7;
  const perWeek = workout.total_workouts / weeksInPeriod;

  // Frequencia vs 4x/sem (0-12)
  const freqScore = Math.round(12 * Math.min(1, perWeek / 4));
  factors.push({
    name: "Frequencia",
    score: freqScore,
    maxScore: 12,
    detail: `${perWeek.toFixed(1)}x/semana`,
  });

  // Progressao de volume (0-8)
  let progScore = 4; // default neutro
  if (workout.volume_by_day.length >= 4) {
    const half = Math.floor(workout.volume_by_day.length / 2);
    const firstHalf = workout.volume_by_day.slice(0, half);
    const secondHalf = workout.volume_by_day.slice(half);
    const avgFirst = avg(firstHalf.map((d) => d.volume));
    const avgSecond = avg(secondHalf.map((d) => d.volume));

    if (avgFirst > 0) {
      const delta = (avgSecond - avgFirst) / avgFirst;
      if (delta > 0.05) progScore = 8;
      else if (delta > -0.05) progScore = 4;
      else progScore = 1;
    }
  }
  factors.push({
    name: "Progressao",
    score: progScore,
    maxScore: 8,
    detail: progScore >= 6 ? "Volume crescendo" : progScore >= 3 ? "Estavel" : "Queda",
  });

  // Consistencia — quao regularmente treina (0-5)
  const workoutDates = workout.volume_by_day.map((d) => new Date(d.date).getTime());
  let consScore = 5;
  if (workoutDates.length >= 3) {
    const gaps: number[] = [];
    for (let i = 1; i < workoutDates.length; i++) {
      gaps.push((workoutDates[i] - workoutDates[i - 1]) / (1000 * 60 * 60 * 24));
    }
    const gapStd = stdDev(gaps);
    consScore = Math.round(5 * Math.max(0, 1 - gapStd / 3));
  }
  factors.push({
    name: "Consistencia",
    score: consScore,
    maxScore: 5,
    detail: consScore >= 4 ? "Regular" : "Irregular",
  });

  const total = freqScore + progScore + consScore;
  return makeDomain("treino", total, 25, factors, true);
}

// ------ SONO (0-25) ------

function scoreSono(input: ScoreInput): DomainScore {
  const factors: ScoreFactor[] = [];
  const { sleep } = input;

  if (!sleep || sleep.total_nights === 0) {
    return makeDomain("sono", 0, 25, factors, false);
  }

  // Duracao vs 7-9h (0-12)
  let durScore = 0;
  if (sleep.avg_duration_min !== null) {
    const avgMin = sleep.avg_duration_min;
    if (avgMin >= 420 && avgMin <= 540) {
      durScore = 12;
    } else if (avgMin < 420) {
      durScore = Math.round(12 * Math.max(0, avgMin / 420));
    } else {
      durScore = Math.round(12 * Math.max(0, 1 - (avgMin - 540) / 120));
    }
    const h = Math.floor(avgMin / 60);
    const m = Math.round(avgMin % 60);
    factors.push({
      name: "Duracao",
      score: durScore,
      maxScore: 12,
      detail: `${h}h${String(m).padStart(2, "0")} media`,
    });
  }

  // Consistencia noites com 6h+ (0-8)
  let consScore = 0;
  if (sleep.consistency !== null) {
    consScore = Math.round(8 * (sleep.consistency / 100));
    factors.push({
      name: "Consistencia",
      score: consScore,
      maxScore: 8,
      detail: `${Math.round(sleep.consistency)}% das noites com 6h+`,
    });
  }

  // Deep sleep >15% (0-5)
  let deepScore = 0;
  const deepStage = sleep.avg_stages.find((s) => s.stage === "deep");
  if (deepStage) {
    deepScore = Math.round(5 * Math.min(1, deepStage.avg_pct / 15));
    factors.push({
      name: "Sono profundo",
      score: deepScore,
      maxScore: 5,
      detail: `${Math.round(deepStage.avg_pct)}% do total`,
    });
  }

  const total = durScore + consScore + deepScore;
  return makeDomain("sono", total, 25, factors, true);
}

// ------ GLICEMIA (0-25) ------

function scoreGlicemia(input: ScoreInput): DomainScore {
  const factors: ScoreFactor[] = [];
  const { glucose } = input;

  if (!glucose || glucose.by_day.length === 0) {
    return makeDomain("glicemia", 0, 25, factors, false);
  }

  // TIR >80% (0-12)
  let tirScore = 0;
  if (glucose.time_in_range !== null) {
    tirScore = Math.round(12 * Math.min(1, glucose.time_in_range / 80));
    factors.push({
      name: "Time in Range",
      score: tirScore,
      maxScore: 12,
      detail: `${Math.round(glucose.time_in_range)}% em 70-140`,
    });
  }

  // Jejum <100 mg/dL (0-8)
  let fastScore = 0;
  if (glucose.avg_fasting !== null) {
    if (glucose.avg_fasting <= 100) {
      fastScore = 8;
    } else {
      fastScore = Math.round(8 * Math.max(0, 1 - (glucose.avg_fasting - 100) / 40));
    }
    factors.push({
      name: "Glicose jejum",
      score: fastScore,
      maxScore: 8,
      detail: `${Math.round(glucose.avg_fasting)} mg/dL`,
    });
  }

  // Variabilidade baixa (0-5)
  let varScore = 0;
  if (glucose.by_day.length >= 3) {
    const dailyAvgs = glucose.by_day.map((d) => d.avg);
    const sd = stdDev(dailyAvgs);
    varScore = Math.round(5 * Math.max(0, 1 - sd / 30));
    factors.push({
      name: "Estabilidade",
      score: varScore,
      maxScore: 5,
      detail: sd < 15 ? "Estavel" : sd < 25 ? "Moderada" : "Alta variacao",
    });
  }

  const total = tirScore + fastScore + varScore;
  return makeDomain("glicemia", total, 25, factors, true);
}

// ------ CORPO (0-5 bonus) ------

function scoreCorpo(input: ScoreInput): DomainScore {
  const factors: ScoreFactor[] = [];
  const valid = input.weightData.filter((d) => d.value !== null);

  if (valid.length < 2) {
    return makeDomain("corpo", 0, 5, factors, false);
  }

  const first = valid[0].value as number;
  const last = valid[valid.length - 1].value as number;
  const diff = last - first;

  // Assume objetivo de perda se em deficit, manutencao se proximo do TDEE
  const avgCal = avg(input.caloriesData.filter((d) => d.value > 0).map((d) => d.value));
  const inDeficit = input.tdee > 0 && avgCal < input.tdee * 0.95;
  const inSurplus = input.tdee > 0 && avgCal > input.tdee * 1.05;

  let score = 0;
  let detail = "";

  if (inDeficit && diff <= 0) {
    score = 5;
    detail = `−${Math.abs(diff).toFixed(1)}kg (alinhado com deficit)`;
  } else if (inSurplus && diff >= 0) {
    score = 3;
    detail = `+${diff.toFixed(1)}kg (bulking)`;
  } else if (Math.abs(diff) < 0.3) {
    score = 4;
    detail = "Peso estavel";
  } else {
    score = 1;
    detail = diff > 0 ? `+${diff.toFixed(1)}kg` : `${diff.toFixed(1)}kg`;
  }

  factors.push({
    name: "Tendencia de peso",
    score,
    maxScore: 5,
    detail,
  });

  return makeDomain("corpo", score, 5, factors, true);
}

// ------ HELPERS ------

const DOMAIN_META: Record<string, { label: string; icon: string; color: string }> = {
  nutricao: { label: "Nutricao", icon: "restaurant", color: "#eb6028" },
  treino: { label: "Treino", icon: "fitness_center", color: "#60a5fa" },
  sono: { label: "Sono", icon: "bedtime", color: "#a78bfa" },
  glicemia: { label: "Glicemia", icon: "bloodtype", color: "#22c55e" },
  corpo: { label: "Corpo", icon: "monitor_weight", color: "#eab308" },
};

function makeDomain(
  domain: DomainScore["domain"],
  score: number,
  maxScore: number,
  factors: ScoreFactor[],
  hasData: boolean
): DomainScore {
  const meta = DOMAIN_META[domain];
  return {
    domain,
    score: Math.min(score, maxScore),
    maxScore,
    label: meta.label,
    icon: meta.icon,
    color: meta.color,
    factors,
    hasData,
  };
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = avg(values);
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}
