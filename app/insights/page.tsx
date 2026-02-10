"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { BottomNav } from "@/components/ui/BottomNav";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ScoreRing } from "@/components/insights/ScoreRing";
import { HighlightCardList } from "@/components/insights/HighlightCard";
import { NutricaoSection } from "@/components/insights/sections/NutricaoSection";
import { TreinoSection } from "@/components/insights/sections/TreinoSection";
import { SonoSection } from "@/components/insights/sections/SonoSection";
import { GlicemiaSection } from "@/components/insights/sections/GlicemiaSection";
import { CorpoSection } from "@/components/insights/sections/CorpoSection";
import { CorrelationsSection } from "@/components/insights/sections/CorrelationsSection";
import {
  getUserProfile,
  isOnboardingComplete,
  getMeals,
  getWorkouts,
  getWeightLogs,
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
import {
  generateRecommendations,
  type Recommendation,
} from "@/lib/insights-recommendations";
import { computeCompositeScore, type CompositeScore, type ScoreInput } from "@/lib/insights-score";
import { computeDeltas, type DeltaHighlight } from "@/lib/insights-deltas";
import { computeCorrelations, type Correlation } from "@/lib/insights-correlations";

type Period = 7 | 14 | 30;

function getDateRange(days: number): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
}

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

function aggregateWeightByDate(
  logs: WeightLog[],
  dates: string[]
): { date: string; value: number | null }[] {
  return dates.map((date) => {
    const dayLogs = logs.filter((l) => l.date === date);
    const lastLog = dayLogs.length > 0 ? dayLogs[dayLogs.length - 1] : null;
    return { date, value: lastLog?.weight ?? null };
  });
}

export default function InsightsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>(7);

  // Dados do Supabase — periodo atual
  const [supabaseTdee, setSupabaseTdee] = useState<number | null>(null);
  const [weightData, setWeightData] = useState<{ date: string; value: number | null }[]>([]);
  const [caloriesData, setCaloriesData] = useState<{ date: string; value: number }[]>([]);
  const [proteinData, setProteinData] = useState<{ date: string; value: number }[]>([]);
  const [carbsData, setCarbsData] = useState<{ date: string; value: number }[]>([]);
  const [fatData, setFatData] = useState<{ date: string; value: number }[]>([]);
  const [sleepData, setSleepData] = useState<SleepInsightsData | null>(null);
  const [glucoseData, setGlucoseData] = useState<InsightsData["glucose"] | null>(null);
  const [workoutProgression, setWorkoutProgression] = useState<WorkoutProgressionData | null>(null);
  const [bodyFatData, setBodyFatData] = useState<{ date: string; value: number | null }[]>([]);
  const [topFoods, setTopFoods] = useState<{ food_name: string; times_eaten: number; avg_calories: number }[]>([]);
  const [workoutCount, setWorkoutCount] = useState(0);

  // Dados do Supabase — periodo duplo (para deltas)
  const [insightsDouble, setInsightsDouble] = useState<InsightsData | null>(null);
  const [sleepDouble, setSleepDouble] = useState<SleepInsightsData | null>(null);
  const [workoutDouble, setWorkoutDouble] = useState<WorkoutProgressionData | null>(null);

  // Computed
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    if (!isOnboardingComplete()) {
      router.push("/onboarding");
      return;
    }
    const userProfile = getUserProfile();
    if (userProfile) setProfile(userProfile);
    setIsLoading(false);
  }, [router]);

  // Carrega dados quando o periodo muda
  useEffect(() => {
    if (!profile) return;

    const dates = getDateRange(period);

    if (user) {
      const loadSupabaseData = async () => {
        // Fetch periodo atual + periodo duplo em paralelo
        const [insightsData, tdee, sleepInsights, workoutProg, insightsX2, sleepX2, workoutX2] =
          await Promise.all([
            getInsights(period),
            getTdee(),
            getSleepInsights(period),
            getWorkoutProgression(period),
            getInsights(period * 2),
            getSleepInsights(period * 2),
            getWorkoutProgression(period * 2),
          ]);

        setSupabaseTdee(tdee);
        setSleepData(sleepInsights);
        setWorkoutProgression(workoutProg);
        setInsightsDouble(insightsX2);
        setSleepDouble(sleepX2);
        setWorkoutDouble(workoutX2);

        if (insightsData?.glucose) setGlucoseData(insightsData.glucose);

        if (insightsData) {
          setWeightData(insightsData.weights.map((w) => ({ date: w.date, value: w.weight })));
          setCaloriesData(insightsData.calories_by_day.map((c) => ({ date: c.date, value: c.calories })));
          setProteinData(insightsData.protein_by_day.map((p) => ({ date: p.date, value: p.protein })));
          if (insightsData.carbs_by_day) setCarbsData(insightsData.carbs_by_day.map((c) => ({ date: c.date, value: c.carbs })));
          if (insightsData.fat_by_day) setFatData(insightsData.fat_by_day.map((f) => ({ date: f.date, value: f.fat })));
          if (insightsData.body_fat_by_day?.length > 0) {
            setBodyFatData(insightsData.body_fat_by_day.map((b) => ({ date: b.date, value: b.body_fat })));
          }
          if (insightsData.top_foods?.length > 0) setTopFoods(insightsData.top_foods);
        }
      };
      loadSupabaseData();
    }

    // localStorage fallback
    const allWeightLogs = getWeightLogs();
    const aggregatedWeight = aggregateWeightByDate(allWeightLogs, dates);
    if (!user) setWeightData(aggregatedWeight);

    const allMeals = getMeals();
    const aggregatedMeals = aggregateMealsByDate(allMeals, dates);
    if (!user) {
      setCaloriesData(aggregatedMeals.map((d) => ({ date: d.date, value: d.calories })));
      setProteinData(aggregatedMeals.map((d) => ({ date: d.date, value: d.protein })));
      setCarbsData(aggregatedMeals.map((d) => ({ date: d.date, value: d.carbs })));
      setFatData(aggregatedMeals.map((d) => ({ date: d.date, value: d.fat })));
    }

    const allWorkouts = getWorkouts();
    const periodWorkouts = allWorkouts.filter((w) => dates.includes(w.date));
    setWorkoutCount(periodWorkouts.length);
  }, [period, profile, user]);

  // Gera recomendacoes
  useEffect(() => {
    if (!profile) return;
    const bmrValue = supabaseTdee || profile.bmr;
    const recs = generateRecommendations({
      weightData,
      caloriesData,
      proteinData,
      carbsData,
      fatData,
      bmr: bmrValue,
      weightKg: profile.weight,
      workoutCount,
      periodDays: period,
      sleep: sleepData,
      glucose: glucoseData,
      workout: workoutProgression,
    });
    setRecommendations(recs);
  }, [profile, supabaseTdee, weightData, caloriesData, proteinData, carbsData, fatData, workoutCount, period, sleepData, glucoseData, workoutProgression]);

  // Compute score
  const score: CompositeScore = useMemo(() => {
    if (!profile) {
      return { total: 0, grade: "F" as const, domains: [], activeDomains: 0 };
    }
    const input: ScoreInput = {
      caloriesData,
      proteinData,
      carbsData,
      fatData,
      tdee: supabaseTdee || profile.bmr,
      weightKg: profile.weight,
      periodDays: period,
      workout: workoutProgression,
      sleep: sleepData,
      glucose: glucoseData,
      weightData,
      bodyFatData,
    };
    return computeCompositeScore(input);
  }, [profile, caloriesData, proteinData, carbsData, fatData, supabaseTdee, period, workoutProgression, sleepData, glucoseData, weightData, bodyFatData]);

  // Compute deltas
  const deltas: DeltaHighlight[] = useMemo(() => {
    return computeDeltas({
      periodDays: period,
      insights: null,
      insightsDouble,
      sleep: sleepData,
      sleepDouble,
      workout: workoutProgression,
      workoutDouble,
    });
  }, [period, insightsDouble, sleepData, sleepDouble, workoutProgression, workoutDouble]);

  // Compute correlations
  const correlations: Correlation[] = useMemo(() => {
    if (!insightsDouble) return [];
    return computeCorrelations({
      insights: insightsDouble,
      sleep: sleepData,
      workout: workoutProgression,
      weightKg: profile?.weight ?? 70,
      proteinTarget: profile?.weight ? profile.weight * 1.6 : 120,
    });
  }, [insightsDouble, sleepData, workoutProgression, profile]);

  // Helpers
  const hasAnyData = score.activeDomains > 0;
  const tdee = supabaseTdee || profile?.bmr || 0;
  const daysWithFood = caloriesData.filter((d) => d.value > 0);
  const avgCalories = daysWithFood.length > 0
    ? daysWithFood.reduce((s, d) => s + d.value, 0) / daysWithFood.length
    : 0;
  const avgProtein = proteinData.filter((d) => d.value > 0).length > 0
    ? proteinData.filter((d) => d.value > 0).reduce((s, d) => s + d.value, 0) / proteinData.filter((d) => d.value > 0).length
    : 0;
  const avgCarbs = carbsData.filter((d) => d.value > 0).length > 0
    ? carbsData.filter((d) => d.value > 0).reduce((s, d) => s + d.value, 0) / carbsData.filter((d) => d.value > 0).length
    : 0;
  const avgFat = fatData.filter((d) => d.value > 0).length > 0
    ? fatData.filter((d) => d.value > 0).reduce((s, d) => s + d.value, 0) / fatData.filter((d) => d.value > 0).length
    : 0;

  // Get top recommendation per domain
  const getRecForDomain = (domain: string): Recommendation | null => {
    return recommendations.find((r) => r.domain === domain) ?? null;
  };

  // Workout dates for frequency dots
  const recentWorkoutDates = workoutProgression?.volume_by_day.map((d) => d.date) ?? [];

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

  return (
    <ScreenContainer>
      <div className="flex flex-1 flex-col px-4 pb-24">
        {/* Header */}
        <header className="pt-6 pb-2">
          <h1 className="font-serif-display text-3xl text-primary">
            Insights
          </h1>
        </header>

        {/* Period selector */}
        <div className="py-3">
          <SegmentedControl
            options={periodOptions}
            value={period.toString()}
            onChange={(value) => setPeriod(Number(value) as Period)}
          />
        </div>

        {!hasAnyData ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
            <div className="rounded-full bg-surface-dark p-4 mb-4">
              <span className="material-symbols-outlined text-[32px] text-text-secondary">
                insights
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Sem dados ainda
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Registre refeicoes, peso ou treinos no Chat para ver seus
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
          <div className="flex flex-col gap-5 pt-2">
            {/* Score Card Hero */}
            <div className="rounded-xl border border-border-subtle bg-surface-card p-5">
              <h2 className="text-sm font-medium text-text-secondary text-center mb-4">
                Seu Score
              </h2>
              <ScoreRing
                total={score.total}
                grade={score.grade}
                domains={score.domains}
              />
            </div>

            {/* Destaques da Semana */}
            {deltas.length > 0 && (
              <HighlightCardList highlights={deltas} />
            )}

            {deltas.length === 0 && score.activeDomains > 0 && (
              <p className="text-xs text-text-secondary text-center py-2">
                Na proxima semana, voce vera comparacoes aqui.
              </p>
            )}

            {/* Domain Sections */}
            <NutricaoSection
              domain={score.domains.find((d) => d.domain === "nutricao")!}
              avgCalories={avgCalories}
              avgProtein={avgProtein}
              avgCarbs={avgCarbs}
              avgFat={avgFat}
              tdee={tdee}
              daysTracked={daysWithFood.length}
              topFoods={topFoods}
              recommendation={getRecForDomain("dieta")}
            />

            <TreinoSection
              domain={score.domains.find((d) => d.domain === "treino")!}
              workout={workoutProgression ?? { total_workouts: 0, total_volume: 0, avg_duration_min: null, volume_by_day: [], top_exercises: [], workout_types: [] }}
              periodDays={period}
              recentWorkoutDates={recentWorkoutDates}
              recommendation={getRecForDomain("treino")}
            />

            <SonoSection
              domain={score.domains.find((d) => d.domain === "sono")!}
              sleep={sleepData ?? { avg_duration_min: null, total_nights: 0, by_day: [], avg_stages: [], best_night: null, worst_night: null, consistency: null }}
              recommendation={getRecForDomain("sono")}
            />

            <GlicemiaSection
              domain={score.domains.find((d) => d.domain === "glicemia")!}
              glucose={glucoseData ?? { avg_fasting: null, avg_post_meal: null, time_in_range: null, by_day: [] }}
              recommendation={getRecForDomain("glicemia")}
            />

            <CorpoSection
              domain={score.domains.find((d) => d.domain === "corpo")!}
              weightData={weightData}
              bodyFatData={bodyFatData}
              recommendation={getRecForDomain("corpo")}
            />

            {/* Correlacoes Inteligentes */}
            <CorrelationsSection correlations={correlations} />
          </div>
        )}
      </div>

      <BottomNav variant="with-fab" onFabClick={() => router.push("/chat")} />
    </ScreenContainer>
  );
}
