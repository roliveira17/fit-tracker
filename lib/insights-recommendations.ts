import type { InsightsData, SleepInsightsData, WorkoutProgressionData } from "@/lib/supabase";

// ========================================
// INSIGHTS RECOMMENDATIONS ENGINE
// ========================================
// Gera recomendações acionáveis baseadas nos dados do usuário.
// Cada recomendação inclui observação + ação concreta.
// 100% determinístico — sem IA.

export type RecommendationDomain = "dieta" | "treino" | "sono" | "glicemia" | "corpo";

export interface Recommendation {
  type: "positive" | "warning" | "info" | "neutral";
  domain: RecommendationDomain;
  icon: string;
  title: string;
  observation: string;
  action: string;
}

interface RecommendationInput {
  weightData: { date: string; value: number | null }[];
  caloriesData: { date: string; value: number }[];
  proteinData: { date: string; value: number }[];
  carbsData: { date: string; value: number }[];
  fatData: { date: string; value: number }[];
  bmr: number;
  weightKg?: number;
  workoutCount: number;
  periodDays: number;
  sleep?: SleepInsightsData | null;
  glucose?: InsightsData["glucose"] | null;
  workout?: WorkoutProgressionData | null;
}

export function generateRecommendations(input: RecommendationInput): Recommendation[] {
  const recs: Recommendation[] = [];

  analyzeWeight(input, recs);
  analyzeCalories(input, recs);
  analyzeProtein(input, recs);
  analyzeMacros(input, recs);
  analyzeWorkouts(input, recs);
  analyzeSleep(input, recs);
  analyzeGlucose(input, recs);

  return prioritize(recs);
}

function analyzeWeight(input: RecommendationInput, recs: Recommendation[]) {
  const valid = input.weightData.filter((d) => d.value !== null);
  if (valid.length < 2) return;

  const first = valid[0].value as number;
  const last = valid[valid.length - 1].value as number;
  const diff = last - first;

  if (diff < -0.5) {
    recs.push({
      type: "positive",
      domain: "corpo",
      icon: "trending_down",
      title: "Peso em queda",
      observation: `−${Math.abs(diff).toFixed(1)}kg no período (${last.toFixed(1)}kg)`,
      action: "Continue no ritmo atual. Priorize proteína para preservar massa muscular.",
    });
  } else if (diff > 0.5) {
    recs.push({
      type: "warning",
      domain: "corpo",
      icon: "trending_up",
      title: "Peso subindo",
      observation: `+${diff.toFixed(1)}kg no período (${last.toFixed(1)}kg)`,
      action: "Revise porções e priorize alimentos de alta saciedade (proteína + fibra).",
    });
  } else if (valid.length >= 5) {
    recs.push({
      type: "neutral",
      domain: "corpo",
      icon: "balance",
      title: "Peso estável",
      observation: `Manteve ~${last.toFixed(1)}kg no período`,
      action: "Se quer perder, reduza 200kcal/dia. Se quer manter, está no caminho certo.",
    });
  }
}

function analyzeCalories(input: RecommendationInput, recs: Recommendation[]) {
  const daysWithFood = input.caloriesData.filter((d) => d.value > 0);
  if (daysWithFood.length < 3 || input.bmr <= 0) return;

  const avg = daysWithFood.reduce((s, d) => s + d.value, 0) / daysWithFood.length;
  const deficit = input.bmr - avg;
  const deficitPct = (deficit / input.bmr) * 100;

  if (deficitPct > 30) {
    recs.push({
      type: "warning",
      domain: "dieta",
      icon: "local_fire_department",
      title: "Déficit muito agressivo",
      observation: `${Math.round(avg)} kcal/dia (${Math.round(deficitPct)}% abaixo do gasto)`,
      action: "Aumente 200kcal com um snack rico em proteína para evitar perda muscular.",
    });
  } else if (deficitPct >= 10 && deficitPct <= 25) {
    recs.push({
      type: "positive",
      domain: "dieta",
      icon: "local_fire_department",
      title: "Déficit saudável",
      observation: `${Math.round(avg)} kcal/dia (−${Math.round(deficitPct)}% do gasto)`,
      action: "Ritmo sustentável. Mantenha a consistência.",
    });
  } else if (deficitPct < 0) {
    recs.push({
      type: "info",
      domain: "dieta",
      icon: "local_fire_department",
      title: "Superávit calórico",
      observation: `${Math.round(avg)} kcal/dia (+${Math.abs(Math.round(deficitPct))}% acima do gasto)`,
      action: "Ok se estiver em bulking. Se não, reduza porções de carboidratos nas refeições.",
    });
  }

  // Consistência calórica
  if (daysWithFood.length >= 5) {
    const values = daysWithFood.map((d) => d.value);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    const cv = (Math.sqrt(variance) / mean) * 100;

    if (cv > 30) {
      recs.push({
        type: "warning",
        domain: "dieta",
        icon: "show_chart",
        title: "Calorias muito inconsistentes",
        observation: `Variação de ${Math.round(cv)}% entre os dias`,
        action: "Mantenha refeições regulares. Prepare marmitas para dias corridos.",
      });
    }
  }
}

function analyzeProtein(input: RecommendationInput, recs: Recommendation[]) {
  const daysWithFood = input.proteinData.filter((d) => d.value > 0);
  if (daysWithFood.length < 3) return;

  const avg = daysWithFood.reduce((s, d) => s + d.value, 0) / daysWithFood.length;
  const targetGkg = 1.6;
  const targetG = input.weightKg ? Math.round(input.weightKg * targetGkg) : 120;

  if (avg < 50) {
    recs.push({
      type: "warning",
      domain: "dieta",
      icon: "egg_alt",
      title: "Proteína muito baixa",
      observation: `${Math.round(avg)}g/dia (meta: ${targetG}g)`,
      action: "Adicione ovos no café e whey pós-treino. Cada um soma ~25g.",
    });
  } else if (avg < targetG * 0.8) {
    recs.push({
      type: "warning",
      domain: "dieta",
      icon: "egg_alt",
      title: "Proteína abaixo da meta",
      observation: `${Math.round(avg)}g/dia (meta: ${targetG}g)`,
      action: `Faltam ~${Math.round(targetG - avg)}g/dia. Adicione 1 porção de proteína em cada refeição.`,
    });
  } else if (avg >= targetG) {
    recs.push({
      type: "positive",
      domain: "dieta",
      icon: "egg_alt",
      title: "Proteína no alvo",
      observation: `${Math.round(avg)}g/dia (meta: ${targetG}g)`,
      action: "Excelente para manutenção e ganho muscular. Continue assim.",
    });
  }
}

function analyzeMacros(input: RecommendationInput, recs: Recommendation[]) {
  const daysWithFood = input.caloriesData.filter((d) => d.value > 0);
  if (daysWithFood.length < 3) return;

  const avgP = input.proteinData.filter((d) => d.value > 0).reduce((s, d) => s + d.value, 0) / daysWithFood.length;
  const avgC = input.carbsData.filter((d) => d.value > 0).reduce((s, d) => s + d.value, 0) / daysWithFood.length;
  const avgF = input.fatData.filter((d) => d.value > 0).reduce((s, d) => s + d.value, 0) / daysWithFood.length;

  const totalCal = avgP * 4 + avgC * 4 + avgF * 9;
  if (totalCal <= 0) return;

  const fatPct = (avgF * 9 / totalCal) * 100;
  const protPct = (avgP * 4 / totalCal) * 100;

  if (fatPct > 40) {
    recs.push({
      type: "warning",
      domain: "dieta",
      icon: "oil_barrel",
      title: "Gordura elevada",
      observation: `${Math.round(fatPct)}% das calorias vêm de gordura`,
      action: "Troque frituras por grelhados. Reduza azeite e queijos nas porções.",
    });
  } else if (protPct >= 25 && protPct <= 35 && fatPct >= 20 && fatPct <= 35) {
    recs.push({
      type: "positive",
      domain: "dieta",
      icon: "pie_chart",
      title: "Macros equilibrados",
      observation: `P:${Math.round(protPct)}% C:${Math.round(100 - protPct - fatPct)}% G:${Math.round(fatPct)}%`,
      action: "Distribuição ideal para performance e saúde. Mantenha.",
    });
  }
}

function analyzeWorkouts(input: RecommendationInput, recs: Recommendation[]) {
  const { workoutCount, periodDays, workout } = input;
  const weeksInPeriod = periodDays / 7;
  const perWeek = workoutCount / weeksInPeriod;

  if (workoutCount === 0) {
    const hasFood = input.caloriesData.some((d) => d.value > 0);
    if (hasFood) {
      recs.push({
        type: "warning",
        domain: "treino",
        icon: "fitness_center",
        title: "Sem treinos registrados",
        observation: `Nenhum treino nos últimos ${periodDays} dias`,
        action: "Comece com 2-3 sessões de 30min por semana. Registre via chat.",
      });
    }
    return;
  }

  if (perWeek >= 3) {
    recs.push({
      type: "positive",
      domain: "treino",
      icon: "fitness_center",
      title: "Treinos consistentes",
      observation: `${workoutCount} treinos (${perWeek.toFixed(1)}x/semana)`,
      action: "Frequência ótima. Foque em progressão de carga.",
    });
  } else if (perWeek < 2) {
    recs.push({
      type: "warning",
      domain: "treino",
      icon: "fitness_center",
      title: "Frequência baixa",
      observation: `${workoutCount} treinos (${perWeek.toFixed(1)}x/semana)`,
      action: "Agende dias fixos de treino. 3x/semana é o mínimo para progresso.",
    });
  }

  // Progressão de carga
  if (workout && workout.top_exercises.length > 0) {
    const topEx = workout.top_exercises[0];
    if (topEx.progression.length >= 2) {
      const first = topEx.progression[0].max_weight;
      const last = topEx.progression[topEx.progression.length - 1].max_weight;
      const diff = last - first;

      if (diff > 0) {
        recs.push({
          type: "positive",
          domain: "treino",
          icon: "emoji_events",
          title: `PR: ${topEx.exercise_name}`,
          observation: `${first}kg → ${last}kg (+${diff.toFixed(1)}kg no período)`,
          action: "Progressão de carga ativa. Continue aumentando gradualmente.",
        });
      } else if (diff === 0 && topEx.progression.length >= 3) {
        recs.push({
          type: "info",
          domain: "treino",
          icon: "pause_circle",
          title: "Carga estagnada",
          observation: `${topEx.exercise_name}: ${last}kg sem aumento`,
          action: "Aumente 5% no peso ou adicione 1 série extra.",
        });
      }
    }
  }
}

function analyzeSleep(input: RecommendationInput, recs: Recommendation[]) {
  const { sleep } = input;
  if (!sleep || sleep.total_nights === 0) return;

  const avgMin = sleep.avg_duration_min;
  if (avgMin !== null) {
    const h = Math.floor(avgMin / 60);
    const m = Math.round(avgMin % 60);
    const fmt = `${h}h${String(m).padStart(2, "0")}`;

    if (avgMin < 360) {
      recs.push({
        type: "warning",
        domain: "sono",
        icon: "bedtime",
        title: "Sono insuficiente",
        observation: `Média de ${fmt}/noite (ideal: 7-9h)`,
        action: "Tente dormir 30min mais cedo esta semana. Alarme para lembrar.",
      });
    } else if (avgMin < 420) {
      recs.push({
        type: "info",
        domain: "sono",
        icon: "bedtime",
        title: "Sono abaixo do ideal",
        observation: `Média de ${fmt}/noite (ideal: 7-9h)`,
        action: `Faltam ~${Math.round(420 - avgMin)}min. Deite 30min antes do horário usual.`,
      });
    } else {
      recs.push({
        type: "positive",
        domain: "sono",
        icon: "bedtime",
        title: "Sono adequado",
        observation: `Média de ${fmt}/noite`,
        action: "Dentro do recomendado. Mantenha a rotina.",
      });
    }
  }

  const deepStage = sleep.avg_stages.find((s) => s.stage === "deep");
  if (deepStage && deepStage.avg_pct < 15) {
    recs.push({
      type: "warning",
      domain: "sono",
      icon: "nights_stay",
      title: "Sono profundo baixo",
      observation: `${deepStage.avg_pct}% (ideal: >15%)`,
      action: "Evite telas 1h antes de dormir. Quarto escuro e fresco.",
    });
  }

  if (sleep.consistency !== null && sleep.consistency < 60) {
    recs.push({
      type: "warning",
      domain: "sono",
      icon: "event_repeat",
      title: "Sono inconsistente",
      observation: `Apenas ${sleep.consistency}% das noites com 6h+`,
      action: "Defina horário fixo para dormir e acordar, inclusive nos finais de semana.",
    });
  }
}

function analyzeGlucose(input: RecommendationInput, recs: Recommendation[]) {
  const { glucose } = input;
  if (!glucose || glucose.by_day.length === 0) return;

  if (glucose.avg_fasting !== null) {
    if (glucose.avg_fasting <= 100) {
      recs.push({
        type: "positive",
        domain: "glicemia",
        icon: "bloodtype",
        title: "Glicose de jejum normal",
        observation: `Média: ${Math.round(glucose.avg_fasting)} mg/dL`,
        action: "Dentro da faixa saudável (<100 mg/dL).",
      });
    } else {
      recs.push({
        type: "warning",
        domain: "glicemia",
        icon: "bloodtype",
        title: "Glicose de jejum elevada",
        observation: `Média: ${Math.round(glucose.avg_fasting)} mg/dL (ideal: <100)`,
        action: "Caminhe 10min após jantar e reduza carboidratos à noite.",
      });
    }
  }

  if (glucose.time_in_range !== null) {
    if (glucose.time_in_range >= 80) {
      recs.push({
        type: "positive",
        domain: "glicemia",
        icon: "target",
        title: "Time in Range excelente",
        observation: `${Math.round(glucose.time_in_range)}% entre 70-140 mg/dL`,
        action: "Controle glicêmico ótimo. Continue com a dieta atual.",
      });
    } else if (glucose.time_in_range < 60) {
      recs.push({
        type: "warning",
        domain: "glicemia",
        icon: "target",
        title: "Time in Range baixo",
        observation: `${Math.round(glucose.time_in_range)}% entre 70-140 mg/dL (meta: >70%)`,
        action: "Priorize proteína antes de carboidratos. Adicione fibra nas refeições.",
      });
    } else {
      recs.push({
        type: "info",
        domain: "glicemia",
        icon: "target",
        title: "Time in Range moderado",
        observation: `${Math.round(glucose.time_in_range)}% entre 70-140 mg/dL`,
        action: "Tente caminhadas de 10min após refeições para melhorar.",
      });
    }
  }
}

function prioritize(recs: Recommendation[]): Recommendation[] {
  const order: Record<Recommendation["type"], number> = {
    warning: 0,
    info: 1,
    neutral: 2,
    positive: 3,
  };
  return recs.sort((a, b) => order[a.type] - order[b.type]);
}
