import type { InsightsData, SleepInsightsData, WorkoutProgressionData } from "@/lib/supabase";

// ========================================
// INSIGHTS DELTAS ENGINE
// ========================================
// Compara periodo atual vs anterior para gerar destaques.
// Ex: "Proteina subiu 15% essa semana"

export interface DeltaHighlight {
  id: string;
  metric: string;
  icon: string;
  currentValue: number;
  previousValue: number;
  delta: number;
  deltaPct: number;
  direction: "up" | "down" | "stable";
  sentiment: "positive" | "warning" | "neutral";
  text: string;
  unit: string;
}

interface DeltaInput {
  periodDays: number;
  insights: InsightsData | null;
  insightsDouble: InsightsData | null;
  sleep: SleepInsightsData | null;
  sleepDouble: SleepInsightsData | null;
  workout: WorkoutProgressionData | null;
  workoutDouble: WorkoutProgressionData | null;
}

export function computeDeltas(input: DeltaInput): DeltaHighlight[] {
  const highlights: DeltaHighlight[] = [];
  const cutoff = getCutoffDate(input.periodDays);

  // --- Calorias ---
  if (input.insightsDouble) {
    const [prev, curr] = splitByDate(input.insightsDouble.calories_by_day, cutoff, "date");
    const prevDays = prev.filter((d) => d.calories > 0);
    const currDays = curr.filter((d) => d.calories > 0);

    if (prevDays.length >= 3 && currDays.length >= 3) {
      const prevAvg = avg(prevDays.map((d) => d.calories));
      const currAvg = avg(currDays.map((d) => d.calories));
      const h = makeDelta("calorias", "Calorias", "local_fire_department", prevAvg, currAvg, "kcal/dia", "lower_ok");
      if (h) highlights.push(h);
    }
  }

  // --- Proteina ---
  if (input.insightsDouble) {
    const [prev, curr] = splitByDate(input.insightsDouble.protein_by_day, cutoff, "date");
    const prevDays = prev.filter((d) => d.protein > 0);
    const currDays = curr.filter((d) => d.protein > 0);

    if (prevDays.length >= 3 && currDays.length >= 3) {
      const prevAvg = avg(prevDays.map((d) => d.protein));
      const currAvg = avg(currDays.map((d) => d.protein));
      const h = makeDelta("proteina", "Proteina", "egg_alt", prevAvg, currAvg, "g/dia", "higher_better");
      if (h) highlights.push(h);
    }
  }

  // --- Treinos ---
  if (input.workoutDouble) {
    const [prev, curr] = splitByDate(input.workoutDouble.volume_by_day, cutoff, "date");
    if (prev.length > 0 || curr.length > 0) {
      const h = makeDelta("treinos", "Treinos", "fitness_center", prev.length, curr.length, "sessoes", "higher_better");
      if (h) highlights.push(h);
    }
  }

  // --- Sono ---
  if (input.sleepDouble) {
    const [prev, curr] = splitByDate(input.sleepDouble.by_day, cutoff, "date");
    const prevNights = prev.filter((d) => d.total_min > 0);
    const currNights = curr.filter((d) => d.total_min > 0);

    if (prevNights.length >= 3 && currNights.length >= 3) {
      const prevAvg = avg(prevNights.map((d) => d.total_min)) / 60;
      const currAvg = avg(currNights.map((d) => d.total_min)) / 60;
      const h = makeDelta("sono", "Sono", "bedtime", prevAvg, currAvg, "h/noite", "higher_better");
      if (h) highlights.push(h);
    }
  }

  // --- Glicemia ---
  if (input.insightsDouble?.glucose?.by_day && input.insightsDouble.glucose.by_day.length > 0) {
    const [prev, curr] = splitByDate(input.insightsDouble.glucose.by_day, cutoff, "date");

    if (prev.length >= 3 && curr.length >= 3) {
      const prevAvg = avg(prev.map((d) => d.avg));
      const currAvg = avg(curr.map((d) => d.avg));
      const h = makeDelta("glicemia", "Glicemia", "bloodtype", prevAvg, currAvg, "mg/dL", "lower_better");
      if (h) highlights.push(h);
    }
  }

  // --- Peso ---
  if (input.insightsDouble) {
    const [prev, curr] = splitByDate(input.insightsDouble.weights, cutoff, "date");

    if (prev.length >= 1 && curr.length >= 1) {
      const prevLast = prev[prev.length - 1].weight;
      const currLast = curr[curr.length - 1].weight;
      const h = makeDelta("peso", "Peso", "monitor_weight", prevLast, currLast, "kg", "neutral_dir");
      if (h) highlights.push(h);
    }
  }

  // Ordena por magnitude do delta e retorna top 4
  return highlights
    .sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct))
    .slice(0, 4);
}

// ------ HELPERS ------

type Bias = "higher_better" | "lower_better" | "lower_ok" | "neutral_dir";

function makeDelta(
  id: string,
  metric: string,
  icon: string,
  prevValue: number,
  currValue: number,
  unit: string,
  bias: Bias
): DeltaHighlight | null {
  if (prevValue === 0 && currValue === 0) return null;

  const delta = currValue - prevValue;
  const deltaPct = prevValue !== 0 ? (delta / prevValue) * 100 : 0;

  if (Math.abs(deltaPct) < 3) return null; // ignorar mudancas <3%

  const direction: DeltaHighlight["direction"] =
    deltaPct > 3 ? "up" : deltaPct < -3 ? "down" : "stable";

  let sentiment: DeltaHighlight["sentiment"] = "neutral";
  if (bias === "higher_better") {
    sentiment = direction === "up" ? "positive" : direction === "down" ? "warning" : "neutral";
  } else if (bias === "lower_better") {
    sentiment = direction === "down" ? "positive" : direction === "up" ? "warning" : "neutral";
  } else if (bias === "lower_ok") {
    sentiment = Math.abs(deltaPct) < 10 ? "neutral" : direction === "up" ? "warning" : "neutral";
  }

  const sign = delta > 0 ? "+" : "";
  const pctStr = `${delta > 0 ? "+" : ""}${Math.round(deltaPct)}%`;
  const valStr = Math.abs(delta) < 1
    ? `${sign}${delta.toFixed(1)}`
    : `${sign}${Math.round(delta)}`;

  const dirText = direction === "up" ? "subiu" : "caiu";
  const text = `${metric} ${dirText} ${Math.abs(Math.round(deltaPct))}% (${valStr} ${unit})`;

  return {
    id,
    metric,
    icon,
    currentValue: Math.round(currValue * 10) / 10,
    previousValue: Math.round(prevValue * 10) / 10,
    delta: Math.round(delta * 10) / 10,
    deltaPct: Math.round(deltaPct),
    direction,
    sentiment,
    text,
    unit,
  };
}

function getCutoffDate(periodDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() - periodDays);
  return date.toISOString().split("T")[0];
}

function splitByDate<T>(data: T[], cutoff: string, dateKey: string): [T[], T[]] {
  const prev = data.filter((d) => (d as Record<string, unknown>)[dateKey] as string < cutoff);
  const curr = data.filter((d) => (d as Record<string, unknown>)[dateKey] as string >= cutoff);
  return [prev, curr];
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}
