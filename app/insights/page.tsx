"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { LineChart } from "@/components/insights/LineChart";
import { BarChart } from "@/components/insights/BarChart";
import { StatCard } from "@/components/insights/StatCard";
import { InsightText } from "@/components/insights/InsightText";
import {
  getUserProfile,
  isOnboardingComplete,
  getMeals,
  getWorkouts,
  getWeightLogs,
  getLatestBodyFat,
  type UserProfile,
  type Meal,
  type WeightLog,
} from "@/lib/storage";
import { Scale, Zap, Flame, Dumbbell } from "lucide-react";

type Period = 7 | 14 | 30;

/**
 * Retorna array de datas para o período selecionado
 */
function getDateRange(days: number): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
}

/**
 * Agrupa refeições por data
 */
function aggregateMealsByDate(
  meals: Meal[],
  dates: string[]
): { date: string; calories: number; protein: number }[] {
  return dates.map((date) => {
    const dayMeals = meals.filter((m) => m.date === date);
    return {
      date,
      calories: dayMeals.reduce((sum, m) => sum + m.totalCalories, 0),
      protein: dayMeals.reduce((sum, m) => sum + m.totalProtein, 0),
    };
  });
}

/**
 * Agrupa peso por data
 */
function aggregateWeightByDate(
  logs: WeightLog[],
  dates: string[]
): { date: string; value: number | null }[] {
  return dates.map((date) => {
    const dayLogs = logs.filter((l) => l.date === date);
    const lastLog = dayLogs.length > 0 ? dayLogs[dayLogs.length - 1] : null;
    return {
      date,
      value: lastLog?.weight ?? null,
    };
  });
}

interface Insight {
  type: "info" | "positive" | "warning" | "neutral";
  title: string;
  description: string;
}

/**
 * Gera insights baseados nos dados
 */
function generateInsights(
  weightData: { date: string; value: number | null }[],
  nutritionData: { date: string; calories: number; protein: number }[],
  bmr: number,
  workoutCount: number
): Insight[] {
  const insights: Insight[] = [];

  // Análise de peso
  const validWeights = weightData.filter((d) => d.value !== null);
  if (validWeights.length >= 2) {
    const first = validWeights[0].value as number;
    const last = validWeights[validWeights.length - 1].value as number;
    const diff = last - first;

    if (diff < -0.5) {
      insights.push({
        type: "positive",
        title: "Peso em queda",
        description: `Você perdeu ${Math.abs(diff).toFixed(1)}kg no período. O progresso está acontecendo!`,
      });
    } else if (diff > 0.5) {
      insights.push({
        type: "warning",
        title: "Peso em alta",
        description: `Ganho de ${diff.toFixed(1)}kg no período. Pode ser retenção de líquido ou hora de ajustar a dieta.`,
      });
    } else if (validWeights.length >= 5) {
      insights.push({
        type: "neutral",
        title: "Peso estável",
        description: "Seu peso se manteve praticamente igual no período.",
      });
    }
  }

  // Análise de calorias
  const daysWithFood = nutritionData.filter((d) => d.calories > 0);
  if (daysWithFood.length >= 3 && bmr > 0) {
    const avgCalories =
      daysWithFood.reduce((sum, d) => sum + d.calories, 0) / daysWithFood.length;
    const deficit = bmr - avgCalories;
    const deficitPercent = (deficit / bmr) * 100;

    if (deficitPercent > 30) {
      insights.push({
        type: "warning",
        title: "Déficit muito agressivo",
        description: `Média de ${Math.round(avgCalories)} kcal/dia (${Math.round(deficitPercent)}% abaixo do BMR). Considere aumentar um pouco.`,
      });
    } else if (deficitPercent >= 10 && deficitPercent <= 25) {
      insights.push({
        type: "positive",
        title: "Déficit saudável",
        description: `Média de ${Math.round(avgCalories)} kcal/dia mantém um déficit sustentável de ${Math.round(deficitPercent)}%.`,
      });
    } else if (deficitPercent < 0) {
      insights.push({
        type: "info",
        title: "Superávit calórico",
        description: `Média de ${Math.round(avgCalories)} kcal/dia está ${Math.abs(Math.round(deficitPercent))}% acima do BMR.`,
      });
    }
  }

  // Análise de proteína
  if (daysWithFood.length >= 3) {
    const avgProtein =
      daysWithFood.reduce((sum, d) => sum + d.protein, 0) / daysWithFood.length;

    if (avgProtein < 50) {
      insights.push({
        type: "warning",
        title: "Proteína baixa",
        description: `Média de ${Math.round(avgProtein)}g/dia. Tente consumir mais carnes, ovos ou leguminosas.`,
      });
    } else if (avgProtein >= 100) {
      insights.push({
        type: "positive",
        title: "Boa ingestão de proteína",
        description: `Média de ${Math.round(avgProtein)}g/dia. Ótimo para manter massa muscular!`,
      });
    }
  }

  // Análise de treinos
  if (workoutCount >= 3) {
    insights.push({
      type: "positive",
      title: "Treinos consistentes",
      description: `${workoutCount} treinos registrados no período. Continue assim!`,
    });
  } else if (workoutCount === 0 && daysWithFood.length >= 5) {
    insights.push({
      type: "neutral",
      title: "Sem treinos registrados",
      description: "Considere adicionar exercícios para potencializar resultados.",
    });
  }

  return insights;
}

/**
 * Página de Insights & Trends
 */
export default function InsightsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>(7);

  // Dados agregados
  const [weightData, setWeightData] = useState<
    { date: string; value: number | null }[]
  >([]);
  const [caloriesData, setCaloriesData] = useState<
    { date: string; value: number }[]
  >([]);
  const [proteinData, setProteinData] = useState<
    { date: string; value: number }[]
  >([]);
  const [latestBF, setLatestBF] = useState<number | null>(null);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    if (!isOnboardingComplete()) {
      router.push("/onboarding");
      return;
    }

    const userProfile = getUserProfile();
    if (userProfile) {
      setProfile(userProfile);
    }

    setIsLoading(false);
  }, [router]);

  // Carrega dados quando o período muda
  useEffect(() => {
    if (!profile) return;

    const dates = getDateRange(period);

    // Peso
    const allWeightLogs = getWeightLogs();
    const aggregatedWeight = aggregateWeightByDate(allWeightLogs, dates);
    setWeightData(aggregatedWeight);

    // Refeições
    const allMeals = getMeals();
    const aggregatedMeals = aggregateMealsByDate(allMeals, dates);
    setCaloriesData(aggregatedMeals.map((d) => ({ date: d.date, value: d.calories })));
    setProteinData(aggregatedMeals.map((d) => ({ date: d.date, value: d.protein })));

    // Body Fat
    const bf = getLatestBodyFat();
    setLatestBF(bf?.percentage ?? null);

    // Treinos no período
    const allWorkouts = getWorkouts();
    const periodWorkouts = allWorkouts.filter((w) => dates.includes(w.date));
    setWorkoutCount(periodWorkouts.length);

    // Gera insights
    const generatedInsights = generateInsights(
      aggregatedWeight,
      aggregatedMeals,
      profile.bmr,
      periodWorkouts.length
    );
    setInsights(generatedInsights);
  }, [period, profile]);

  if (isLoading) {
    return (
      <ScreenContainer>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </ScreenContainer>
    );
  }

  const hasAnyData =
    weightData.some((d) => d.value !== null) ||
    caloriesData.some((d) => d.value > 0);

  return (
    <ScreenContainer>
      <div className="flex flex-1 flex-col pb-4">
        {/* Header */}
        <div className="py-4">
          <h1 className="text-xl font-bold text-foreground">Insights</h1>
          <p className="text-sm text-muted-foreground">
            Análise da sua evolução
          </p>
        </div>

        {/* Toggle de período */}
        <div className="flex gap-2 mb-4">
          {([7, 14, 30] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {p} dias
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        {!hasAnyData ? (
          // Empty state
          <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Scale className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Sem dados ainda
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Registre refeições, peso ou treinos no Chat para ver seus
              insights aqui.
            </p>
            <button
              onClick={() => router.push("/chat")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Ir para o Chat
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Insights textuais */}
            {insights.length > 0 && (
              <div className="flex flex-col gap-2">
                {insights.slice(0, 3).map((insight, i) => (
                  <InsightText
                    key={i}
                    type={insight.type}
                    title={insight.title}
                    description={insight.description}
                  />
                ))}
              </div>
            )}

            {/* Stats resumidos */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Último peso"
                value={
                  weightData.filter((d) => d.value !== null).slice(-1)[0]
                    ?.value || "-"
                }
                unit="kg"
                icon={Scale}
              />
              {latestBF && (
                <StatCard
                  label="Body Fat"
                  value={latestBF}
                  unit="%"
                  subtitle="Último registro"
                />
              )}
              <StatCard
                label="Treinos"
                value={workoutCount}
                unit={`no período`}
                icon={Dumbbell}
              />
              <StatCard
                label="Média kcal"
                value={
                  caloriesData.filter((d) => d.value > 0).length > 0
                    ? Math.round(
                        caloriesData
                          .filter((d) => d.value > 0)
                          .reduce((sum, d) => sum + d.value, 0) /
                          caloriesData.filter((d) => d.value > 0).length
                      )
                    : 0
                }
                unit="/dia"
                icon={Flame}
              />
            </div>

            {/* Gráfico de peso */}
            {weightData.some((d) => d.value !== null) && (
              <LineChart
                data={weightData}
                label="Evolução do Peso"
                unit="kg"
                color="blue"
              />
            )}

            {/* Gráfico de calorias */}
            {caloriesData.some((d) => d.value > 0) && (
              <BarChart
                data={caloriesData}
                label="Calorias por Dia"
                unit="kcal"
                target={profile?.bmr}
                color="orange"
                invertColors={true}
              />
            )}

            {/* Gráfico de proteína */}
            {proteinData.some((d) => d.value > 0) && (
              <BarChart
                data={proteinData}
                label="Proteína por Dia"
                unit="g"
                target={100}
                color="blue"
                invertColors={false}
              />
            )}
          </div>
        )}
      </div>
    </ScreenContainer>
  );
}
