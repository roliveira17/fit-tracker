"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Header } from "@/components/ui/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { LineChart } from "@/components/insights/LineChart";
import { BarChart } from "@/components/insights/BarChart";
import { StatCard } from "@/components/insights/StatCard";
import { InsightText } from "@/components/insights/InsightText";
import { DonutChart } from "@/components/insights/DonutChart";
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
import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import {
  getInsights,
  getTdee,
  getSleepInsights,
  getWorkoutProgression,
  type InsightsData,
  type SleepInsightsData,
  type WorkoutProgressionData,
} from "@/lib/supabase";

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
): { date: string; calories: number; protein: number; carbs: number; fat: number }[] {
  return dates.map((date) => {
    const dayMeals = meals.filter((m) => m.date === date);
    return {
      date,
      calories: dayMeals.reduce((sum, m) => sum + m.totalCalories, 0),
      protein: dayMeals.reduce((sum, m) => sum + m.totalProtein, 0),
      carbs: dayMeals.reduce((sum, m) => sum + m.totalCarbs, 0),
      fat: dayMeals.reduce((sum, m) => sum + m.totalFat, 0),
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
  nutritionData: { date: string; calories: number; protein: number; carbs: number; fat: number }[],
  bmr: number,
  workoutCount: number,
  sleep?: SleepInsightsData | null,
  glucose?: InsightsData["glucose"] | null,
  workout?: WorkoutProgressionData | null,
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

  // Análise de distribuição de macros
  if (daysWithFood.length >= 3) {
    const avgProteinMacro = daysWithFood.reduce((sum, d) => sum + d.protein, 0) / daysWithFood.length;
    const avgCarbs = daysWithFood.reduce((sum, d) => sum + d.carbs, 0) / daysWithFood.length;
    const avgFat = daysWithFood.reduce((sum, d) => sum + d.fat, 0) / daysWithFood.length;
    const avgProteinCal = avgProteinMacro * 4;
    const avgCarbsCal = avgCarbs * 4;
    const avgFatCal = avgFat * 9;
    const totalMacroCal = avgProteinCal + avgCarbsCal + avgFatCal;

    if (totalMacroCal > 0) {
      const protPct = (avgProteinCal / totalMacroCal) * 100;
      const fatPct = (avgFatCal / totalMacroCal) * 100;

      if (protPct >= 25 && protPct <= 35 && fatPct >= 20 && fatPct <= 35) {
        insights.push({
          type: "positive",
          title: "Boa distribuição de macros",
          description: `Proteína ${Math.round(protPct)}%, Carboidratos ${Math.round(100 - protPct - fatPct)}%, Gordura ${Math.round(fatPct)}%.`,
        });
      } else if (fatPct > 40) {
        insights.push({
          type: "warning",
          title: "Gordura acima de 40%",
          description: `Gordura representa ${Math.round(fatPct)}% das calorias. Considere reduzir gorduras saturadas.`,
        });
      }
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

  // Análise de sono
  if (sleep && sleep.total_nights > 0) {
    const avgMin = sleep.avg_duration_min;
    if (avgMin !== null) {
      if (avgMin < 360) {
        insights.push({
          type: "warning",
          title: "Sono insuficiente",
          description: `Média de ${Math.floor(avgMin / 60)}h${Math.round(avgMin % 60)}min por noite. O recomendado é 7-9 horas.`,
        });
      } else if (avgMin >= 420) {
        insights.push({
          type: "positive",
          title: "Bom sono",
          description: `Média de ${Math.floor(avgMin / 60)}h${Math.round(avgMin % 60)}min por noite. Dentro do recomendado!`,
        });
      }
    }

    const deepStage = sleep.avg_stages.find(s => s.stage === "deep");
    if (deepStage && deepStage.avg_pct < 15) {
      insights.push({
        type: "warning",
        title: "Sono profundo baixo",
        description: `Apenas ${deepStage.avg_pct}% de sono profundo. O ideal é >15% para boa recuperação.`,
      });
    }
  }

  // Análise de glicose
  if (glucose && glucose.by_day.length > 0) {
    if (glucose.avg_fasting !== null) {
      if (glucose.avg_fasting <= 100) {
        insights.push({
          type: "positive",
          title: "Glicose de jejum normal",
          description: `Média de ${Math.round(glucose.avg_fasting)} mg/dL. Dentro da faixa saudável.`,
        });
      } else {
        insights.push({
          type: "warning",
          title: "Glicose de jejum elevada",
          description: `Média de ${Math.round(glucose.avg_fasting)} mg/dL. Acima de 100 mg/dL pode indicar resistência à insulina.`,
        });
      }
    }

    if (glucose.time_in_range !== null) {
      if (glucose.time_in_range >= 80) {
        insights.push({
          type: "positive",
          title: "Excelente time in range",
          description: `${Math.round(glucose.time_in_range)}% das leituras entre 70-140 mg/dL.`,
        });
      } else if (glucose.time_in_range < 60) {
        insights.push({
          type: "warning",
          title: "Time in range baixo",
          description: `Apenas ${Math.round(glucose.time_in_range)}% entre 70-140 mg/dL. Revise carboidratos simples.`,
        });
      }
    }
  }

  // Análise de progressão de treino
  if (workout && workout.top_exercises.length > 0) {
    const topEx = workout.top_exercises[0];
    if (topEx.progression.length >= 2) {
      const first = topEx.progression[0].max_weight;
      const last = topEx.progression[topEx.progression.length - 1].max_weight;
      const diff = last - first;
      if (diff > 0) {
        insights.push({
          type: "positive",
          title: `${topEx.exercise_name}: +${diff.toFixed(1)}kg`,
          description: `Progressão de carga de ${first}kg para ${last}kg no período.`,
        });
      }
    }
  }

  return insights;
}

/**
 * Página de Insights & Trends
 */
export default function InsightsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>(7);

  // Dados do Supabase
  const [supabaseInsights, setSupabaseInsights] = useState<InsightsData | null>(null);
  const [supabaseTdee, setSupabaseTdee] = useState<number | null>(null);

  // Dados agregados (localStorage fallback)
  const [weightData, setWeightData] = useState<
    { date: string; value: number | null }[]
  >([]);
  const [caloriesData, setCaloriesData] = useState<
    { date: string; value: number }[]
  >([]);
  const [proteinData, setProteinData] = useState<
    { date: string; value: number }[]
  >([]);
  const [carbsData, setCarbsData] = useState<
    { date: string; value: number }[]
  >([]);
  const [fatData, setFatData] = useState<
    { date: string; value: number }[]
  >([]);
  const [latestBF, setLatestBF] = useState<number | null>(null);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [sleepData, setSleepData] = useState<SleepInsightsData | null>(null);
  const [glucoseData, setGlucoseData] = useState<InsightsData["glucose"] | null>(null);
  const [workoutProgression, setWorkoutProgression] = useState<WorkoutProgressionData | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [bodyFatData, setBodyFatData] = useState<{ date: string; value: number | null }[]>([]);
  const [caloriesBurnedData, setCaloriesBurnedData] = useState<{ date: string; value: number }[]>([]);
  const [mealsByType, setMealsByType] = useState<{ meal_type: string; count: number; avg_calories: number }[]>([]);
  const [topFoods, setTopFoods] = useState<{ food_name: string; times_eaten: number; avg_calories: number }[]>([]);

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

    // Se usuário logado, busca do Supabase
    if (user) {
      const loadSupabaseData = async () => {
        const [insightsData, tdee, sleepInsights, workoutProg] = await Promise.all([
          getInsights(period),
          getTdee(),
          getSleepInsights(period),
          getWorkoutProgression(period),
        ]);
        setSupabaseInsights(insightsData);
        setSupabaseTdee(tdee);
        setSleepData(sleepInsights);
        setWorkoutProgression(workoutProg);

        if (insightsData?.glucose) {
          setGlucoseData(insightsData.glucose);
        }

        if (workoutProg?.top_exercises?.length && !selectedExercise) {
          setSelectedExercise(workoutProg.top_exercises[0].exercise_name);
        }

        // Usa dados do Supabase se disponível
        if (insightsData) {
          // Peso
          const supabaseWeightData = insightsData.weights.map(w => ({
            date: w.date,
            value: w.weight
          }));
          if (supabaseWeightData.length > 0) {
            setWeightData(supabaseWeightData);
          }

          // Calorias
          const supabaseCaloriesData = insightsData.calories_by_day.map(c => ({
            date: c.date,
            value: c.calories
          }));
          if (supabaseCaloriesData.length > 0) {
            setCaloriesData(supabaseCaloriesData);
          }

          // Proteína
          const supabaseProteinData = insightsData.protein_by_day.map(p => ({
            date: p.date,
            value: p.protein
          }));
          if (supabaseProteinData.length > 0) {
            setProteinData(supabaseProteinData);
          }

          // Carbs
          if (insightsData.carbs_by_day) {
            const supabaseCarbsData = insightsData.carbs_by_day.map(c => ({
              date: c.date,
              value: c.carbs
            }));
            if (supabaseCarbsData.length > 0) {
              setCarbsData(supabaseCarbsData);
            }
          }

          // Fat
          if (insightsData.fat_by_day) {
            const supabaseFatData = insightsData.fat_by_day.map(f => ({
              date: f.date,
              value: f.fat
            }));
            if (supabaseFatData.length > 0) {
              setFatData(supabaseFatData);
            }
          }

          // Body Fat
          if (insightsData.body_fat_by_day?.length > 0) {
            setBodyFatData(insightsData.body_fat_by_day.map(b => ({
              date: b.date,
              value: b.body_fat
            })));
          }

          // Calories Burned
          if (insightsData.calories_burned_by_day?.length > 0) {
            setCaloriesBurnedData(insightsData.calories_burned_by_day.map(c => ({
              date: c.date,
              value: c.calories_burned
            })));
          }

          // Meals by Type
          if (insightsData.meals_by_type?.length > 0) {
            setMealsByType(insightsData.meals_by_type);
          }

          // Top Foods
          if (insightsData.top_foods?.length > 0) {
            setTopFoods(insightsData.top_foods);
          }
        }
      };
      loadSupabaseData();
    }

    // Sempre carrega localStorage como fallback
    // Peso
    const allWeightLogs = getWeightLogs();
    const aggregatedWeight = aggregateWeightByDate(allWeightLogs, dates);
    if (!user) setWeightData(aggregatedWeight);

    // Refeições
    const allMeals = getMeals();
    const aggregatedMeals = aggregateMealsByDate(allMeals, dates);
    if (!user) {
      setCaloriesData(aggregatedMeals.map((d) => ({ date: d.date, value: d.calories })));
      setProteinData(aggregatedMeals.map((d) => ({ date: d.date, value: d.protein })));
      setCarbsData(aggregatedMeals.map((d) => ({ date: d.date, value: d.carbs })));
      setFatData(aggregatedMeals.map((d) => ({ date: d.date, value: d.fat })));
    }

    // Body Fat
    const bf = getLatestBodyFat();
    setLatestBF(bf?.percentage ?? null);

    // Treinos no período
    const allWorkouts = getWorkouts();
    const periodWorkouts = allWorkouts.filter((w) => dates.includes(w.date));
    setWorkoutCount(periodWorkouts.length);

    // Gera insights
    const bmrValue = supabaseTdee || profile.bmr;
    const generatedInsights = generateInsights(
      aggregatedWeight,
      aggregatedMeals,
      bmrValue,
      periodWorkouts.length,
      sleepData,
      glucoseData,
      workoutProgression,
    );
    setInsights(generatedInsights);
  }, [period, profile, user, supabaseTdee, sleepData, glucoseData, workoutProgression]);

  // Opções do SegmentedControl
  const periodOptions = [
    { value: "7", label: "7 dias" },
    { value: "14", label: "14 dias" },
    { value: "30", label: "30 dias" },
  ];

  if (isLoading) {
    return (
      <ScreenContainer>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </ScreenContainer>
    );
  }

  const hasAnyData =
    weightData.some((d) => d.value !== null) ||
    caloriesData.some((d) => d.value > 0) ||
    (sleepData && sleepData.total_nights > 0) ||
    (glucoseData && glucoseData.by_day.length > 0) ||
    (workoutProgression && workoutProgression.total_workouts > 0);

  return (
    <ScreenContainer>
      {/* Header do Design System */}
      <Header variant="simple" title="Insights" />

      <div className="flex flex-1 flex-col px-4 pb-24">
        {/* Seletor de período */}
        <div className="py-4">
          <SegmentedControl
            options={periodOptions}
            value={period.toString()}
            onChange={(value) => setPeriod(Number(value) as Period)}
          />
        </div>

        {/* Conteúdo */}
        {!hasAnyData ? (
          // Empty state
          <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
            <div className="rounded-full bg-surface-dark p-4 mb-4">
              <span className="material-symbols-outlined text-[32px] text-text-secondary">
                scale
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Sem dados ainda
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Registre refeições, peso ou treinos no Chat para ver seus
              insights aqui.
            </p>
            <button
              onClick={() => router.push("/chat")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary/30 active:scale-95 transition-transform"
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
                icon="scale"
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
                icon="fitness_center"
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
                icon="local_fire_department"
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

            {/* Gráfico de body fat */}
            {bodyFatData.some((d) => d.value !== null) && (
              <LineChart
                data={bodyFatData}
                label="Evolução do Body Fat"
                unit="%"
                color="green"
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

            {/* Balanço energético (IN vs OUT) */}
            {caloriesBurnedData.length > 0 && caloriesData.some(d => d.value > 0) && (
              <>
                <BarChart
                  data={caloriesBurnedData}
                  label="Calorias Queimadas por Dia"
                  unit="kcal"
                  color="blue"
                />
                {(() => {
                  const daysWithBoth = caloriesData.filter(d => d.value > 0);
                  const avgIn = daysWithBoth.length > 0
                    ? daysWithBoth.reduce((s, d) => s + d.value, 0) / daysWithBoth.length
                    : 0;
                  const avgOut = caloriesBurnedData.length > 0
                    ? caloriesBurnedData.reduce((s, d) => s + d.value, 0) / caloriesBurnedData.length
                    : 0;
                  const balance = Math.round(avgIn - avgOut);
                  return (
                    <div className="grid grid-cols-3 gap-2">
                      <StatCard label="Média IN" value={Math.round(avgIn)} unit="kcal" icon="restaurant" color="orange" />
                      <StatCard label="Média OUT" value={Math.round(avgOut)} unit="kcal" icon="local_fire_department" color="blue" />
                      <StatCard
                        label="Saldo"
                        value={balance > 0 ? `+${balance}` : balance}
                        unit="kcal"
                        icon="balance"
                        color={balance <= 0 ? "green" : "red"}
                      />
                    </div>
                  );
                })()}
              </>
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

            {/* Distribuição de macros */}
            {(() => {
              const totalProtein = proteinData.reduce((sum, d) => sum + d.value, 0);
              const totalCarbs = carbsData.reduce((sum, d) => sum + d.value, 0);
              const totalFat = fatData.reduce((sum, d) => sum + d.value, 0);
              const daysWithData = caloriesData.filter((d) => d.value > 0).length;
              const hasMacros = totalProtein > 0 || totalCarbs > 0 || totalFat > 0;

              if (!hasMacros) return null;

              const avgProtein = daysWithData > 0 ? totalProtein / daysWithData : 0;
              const avgCarbs = daysWithData > 0 ? totalCarbs / daysWithData : 0;
              const avgFat = daysWithData > 0 ? totalFat / daysWithData : 0;
              const avgCalories = daysWithData > 0
                ? caloriesData.filter((d) => d.value > 0).reduce((sum, d) => sum + d.value, 0) / daysWithData
                : 0;

              return (
                <>
                  <DonutChart
                    segments={[
                      { label: "Proteína", value: avgProtein, color: "#60a5fa" },
                      { label: "Carboidratos", value: avgCarbs, color: "#eab308" },
                      { label: "Gordura", value: avgFat, color: "#ef4444" },
                    ]}
                    label="Distribuição de Macros"
                    centerText={`${Math.round(avgCalories)}`}
                    centerSubtext="kcal/dia"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <StatCard
                      label="Proteína"
                      value={Math.round(avgProtein)}
                      unit="g/dia"
                      color="blue"
                    />
                    <StatCard
                      label="Carbs"
                      value={Math.round(avgCarbs)}
                      unit="g/dia"
                      color="orange"
                    />
                    <StatCard
                      label="Gordura"
                      value={Math.round(avgFat)}
                      unit="g/dia"
                      color="red"
                    />
                  </div>
                </>
              );
            })()}

            {/* Distribuição por tipo de refeição */}
            {mealsByType.length > 0 && (
              <DonutChart
                segments={mealsByType.map(m => {
                  const colors: Record<string, string> = {
                    breakfast: "#eab308",
                    lunch: "#22c55e",
                    dinner: "#60a5fa",
                    snack: "#a1a1aa",
                  };
                  const labels: Record<string, string> = {
                    breakfast: "Café",
                    lunch: "Almoço",
                    dinner: "Janta",
                    snack: "Lanche",
                  };
                  return {
                    label: labels[m.meal_type] || m.meal_type,
                    value: m.count,
                    color: colors[m.meal_type] || "#a1a1aa",
                  };
                })}
                label="Refeições por Tipo"
                centerText={`${mealsByType.reduce((s, m) => s + m.count, 0)}`}
                centerSubtext="refeições"
              />
            )}

            {/* Top alimentos consumidos */}
            {topFoods.length > 0 && (
              <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Top Alimentos</h3>
                <div className="flex flex-col gap-2">
                  {topFoods.map((food, i) => (
                    <div key={food.food_name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-primary w-5 shrink-0">#{i + 1}</span>
                        <span className="text-sm text-white truncate">{food.food_name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-xs text-text-secondary">{food.times_eaten}x</span>
                        <span className="text-xs text-white/60">{food.avg_calories} kcal</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== SEÇÃO: SONO ===== */}
            {sleepData && sleepData.total_nights > 0 && (
              <>
                <div className="flex items-center gap-2 mt-4">
                  <span className="material-symbols-outlined text-[20px] text-purple-400">
                    bedtime
                  </span>
                  <h2 className="text-base font-semibold text-white">Sono</h2>
                </div>

                {/* Duração por noite */}
                <BarChart
                  data={sleepData.by_day.map((d) => ({
                    date: d.date,
                    value: Math.round(d.total_min / 60 * 10) / 10,
                  }))}
                  label="Duração por Noite"
                  unit="h"
                  target={8}
                  color="blue"
                  invertColors={false}
                />

                {/* Estágios do sono */}
                {sleepData.avg_stages.length > 0 && (
                  <DonutChart
                    segments={[
                      { label: "Profundo", value: sleepData.avg_stages.find(s => s.stage === "deep")?.avg_pct || 0, color: "#6366f1" },
                      { label: "REM", value: sleepData.avg_stages.find(s => s.stage === "rem")?.avg_pct || 0, color: "#c084fc" },
                      { label: "Leve", value: sleepData.avg_stages.find(s => s.stage === "light")?.avg_pct || 0, color: "#60a5fa" },
                      { label: "Acordado", value: sleepData.avg_stages.find(s => s.stage === "awake")?.avg_pct || 0, color: "#f87171" },
                    ]}
                    label="Estágios do Sono (média)"
                    centerText={sleepData.avg_duration_min ? `${Math.floor(sleepData.avg_duration_min / 60)}h${String(Math.round(sleepData.avg_duration_min % 60)).padStart(2, "0")}` : "-"}
                    centerSubtext="média/noite"
                  />
                )}

                {/* Stats de sono */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    label="Média de sono"
                    value={sleepData.avg_duration_min ? `${Math.floor(sleepData.avg_duration_min / 60)}h${String(Math.round(sleepData.avg_duration_min % 60)).padStart(2, "0")}` : "-"}
                    unit=""
                    icon="bedtime"
                    color={sleepData.avg_duration_min && sleepData.avg_duration_min >= 420 ? "green" : "orange"}
                  />
                  <StatCard
                    label="Consistência"
                    value={sleepData.consistency ?? "-"}
                    unit="%"
                    icon="check_circle"
                    subtitle="noites com 6h+"
                  />
                  {sleepData.best_night && (
                    <StatCard
                      label="Melhor noite"
                      value={`${Math.floor(sleepData.best_night.total_min / 60)}h${String(Math.round(sleepData.best_night.total_min % 60)).padStart(2, "0")}`}
                      unit=""
                      icon="trending_up"
                      color="green"
                    />
                  )}
                  {sleepData.worst_night && (
                    <StatCard
                      label="Pior noite"
                      value={`${Math.floor(sleepData.worst_night.total_min / 60)}h${String(Math.round(sleepData.worst_night.total_min % 60)).padStart(2, "0")}`}
                      unit=""
                      icon="trending_down"
                      color="red"
                    />
                  )}
                </div>
              </>
            )}

            {/* ===== SEÇÃO: GLICOSE ===== */}
            {glucoseData && glucoseData.by_day.length > 0 && (
              <>
                <div className="flex items-center gap-2 mt-4">
                  <span className="material-symbols-outlined text-[20px] text-green-400">
                    bloodtype
                  </span>
                  <h2 className="text-base font-semibold text-white">Glicose</h2>
                </div>

                {/* Line chart glicose média diária */}
                <LineChart
                  data={glucoseData.by_day.map((d) => ({
                    date: d.date,
                    value: d.avg,
                  }))}
                  label="Glicose Média Diária"
                  unit="mg/dL"
                  color="green"
                  referenceRange={{ min: 70, max: 140 }}
                />

                {/* Time in Range gauge */}
                {glucoseData.time_in_range !== null && (
                  <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
                    <h3 className="text-sm font-medium text-text-secondary mb-3">Time in Range</h3>
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-14">
                        <svg viewBox="0 0 100 60" className="w-full h-full">
                          {/* Background arc */}
                          <path
                            d="M 10 55 A 40 40 0 0 1 90 55"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={8}
                            className="text-border-subtle"
                            opacity={0.3}
                            strokeLinecap="round"
                          />
                          {/* Value arc */}
                          <path
                            d="M 10 55 A 40 40 0 0 1 90 55"
                            fill="none"
                            stroke={glucoseData.time_in_range >= 70 ? "#22c55e" : glucoseData.time_in_range >= 50 ? "#eab308" : "#ef4444"}
                            strokeWidth={8}
                            strokeLinecap="round"
                            strokeDasharray={`${(glucoseData.time_in_range / 100) * 126} 126`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-end justify-center pb-0">
                          <span className="text-lg font-bold text-white">{Math.round(glucoseData.time_in_range)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">
                          {glucoseData.time_in_range >= 70 ? "Excelente controle" : glucoseData.time_in_range >= 50 ? "Controle moderado" : "Atenção necessária"}
                        </p>
                        <p className="text-xs text-text-secondary">Faixa alvo: 70-140 mg/dL</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats de glicose */}
                <div className="grid grid-cols-2 gap-3">
                  {glucoseData.avg_fasting !== null && (
                    <StatCard
                      label="Jejum médio"
                      value={Math.round(glucoseData.avg_fasting)}
                      unit="mg/dL"
                      icon="wb_sunny"
                      color={glucoseData.avg_fasting <= 100 ? "green" : "orange"}
                    />
                  )}
                  {glucoseData.avg_post_meal !== null && (
                    <StatCard
                      label="Pós-prandial"
                      value={Math.round(glucoseData.avg_post_meal)}
                      unit="mg/dL"
                      icon="restaurant"
                      color={glucoseData.avg_post_meal <= 140 ? "green" : "orange"}
                    />
                  )}
                  {glucoseData.by_day.length > 0 && (
                    <>
                      <StatCard
                        label="Mínima"
                        value={Math.min(...glucoseData.by_day.map(d => d.min))}
                        unit="mg/dL"
                        icon="arrow_downward"
                        color="blue"
                      />
                      <StatCard
                        label="Máxima"
                        value={Math.max(...glucoseData.by_day.map(d => d.max))}
                        unit="mg/dL"
                        icon="arrow_upward"
                        color="red"
                      />
                    </>
                  )}
                </div>
              </>
            )}

            {/* ===== SEÇÃO: TREINOS (Progressão) ===== */}
            {workoutProgression && workoutProgression.total_workouts > 0 && (
              <>
                <div className="flex items-center gap-2 mt-4">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    fitness_center
                  </span>
                  <h2 className="text-base font-semibold text-white">Treinos</h2>
                </div>

                {/* Seletor de exercício */}
                {workoutProgression.top_exercises.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {workoutProgression.top_exercises.slice(0, 5).map((ex) => (
                      <button
                        key={ex.exercise_name}
                        onClick={() => setSelectedExercise(ex.exercise_name)}
                        className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedExercise === ex.exercise_name
                            ? "bg-primary text-white"
                            : "bg-surface-card border border-border-subtle text-text-secondary"
                        }`}
                      >
                        {ex.exercise_name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Progressão de carga do exercício selecionado */}
                {(() => {
                  const exercise = workoutProgression.top_exercises.find(
                    (ex) => ex.exercise_name === selectedExercise
                  );
                  if (!exercise || exercise.progression.length < 2) return null;

                  return (
                    <LineChart
                      data={exercise.progression.map((p) => ({
                        date: p.date,
                        value: p.max_weight,
                      }))}
                      label={`Progressão: ${exercise.exercise_name}`}
                      unit="kg"
                      color="primary"
                    />
                  );
                })()}

                {/* Volume por treino */}
                {workoutProgression.volume_by_day.length > 0 && (
                  <BarChart
                    data={workoutProgression.volume_by_day.map((d) => ({
                      date: d.date,
                      value: d.volume,
                    }))}
                    label="Volume por Treino"
                    unit="kg"
                    color="orange"
                  />
                )}

                {/* Stats de treino */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    label="Total treinos"
                    value={workoutProgression.total_workouts}
                    unit="no período"
                    icon="fitness_center"
                  />
                  <StatCard
                    label="Volume total"
                    value={workoutProgression.total_volume >= 1000 ? `${(workoutProgression.total_volume / 1000).toFixed(1)}k` : workoutProgression.total_volume}
                    unit="kg"
                    icon="monitoring"
                  />
                  {workoutProgression.avg_duration_min && (
                    <StatCard
                      label="Duração média"
                      value={Math.round(workoutProgression.avg_duration_min)}
                      unit="min"
                      icon="timer"
                    />
                  )}
                  {workoutProgression.top_exercises.length > 0 && (
                    <StatCard
                      label="Melhor carga"
                      value={workoutProgression.top_exercises[0].best_weight}
                      unit="kg"
                      icon="emoji_events"
                      subtitle={workoutProgression.top_exercises[0].exercise_name}
                      color="orange"
                    />
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav variant="with-fab" onFabClick={() => router.push("/chat")} />
    </ScreenContainer>
  );
}
