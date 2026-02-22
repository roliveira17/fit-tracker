"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { FAB } from "@/components/ui/FAB";
import { DateNavigator } from "@/components/home/DateNavigator";
import { SummaryCard } from "@/components/home/SummaryCard";
import { EmptyState } from "@/components/home/EmptyState";
import { MiniChart } from "@/components/home/MiniChart";
import { ProgressCard } from "@/components/home/ProgressCard";
import { InsightCard } from "@/components/home/InsightCard";
import {
  getUserProfile,
  isOnboardingComplete,
  getMealsByDate,
  getWorkouts,
  getWeightLogs,
  getWeightLogsLastDays,
  getLatestBodyFat,
  calculateStreak,
  type UserProfile,
  type Meal,
  type Workout,
} from "@/lib/storage";
import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import { getHomeSummary, getTdee, type HomeSummary } from "@/lib/supabase";
import { getLocalDateString } from "@/lib/date-utils";
import { PullToRefresh } from "@/components/ui/PullToRefresh";

/**
 * Formata data para YYYY-MM-DD (formato usado no storage)
 */
function formatDateKey(date: Date): string {
  return getLocalDateString(date);
}

/**
 * Página Home - Hub Minimalista
 * Exibe resumo diário do usuário com navegação temporal
 */
export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Dados do Supabase
  const [supabaseSummary, setSupabaseSummary] = useState<HomeSummary | null>(null);
  const [supabaseTdee, setSupabaseTdee] = useState<number | null>(null);

  // Dados do dia selecionado (localStorage fallback)
  const [meals, setMeals] = useState<Meal[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [hasWeightLog, setHasWeightLog] = useState(false);
  const [weightData, setWeightData] = useState<Array<{ date: string; weight: number | null }>>([]);
  const [latestBodyFat, setLatestBodyFat] = useState<number | null>(null);
  const [streakData, setStreakData] = useState<{ streak: number; lastActiveDate: string | null }>({ streak: 0, lastActiveDate: null });

  useEffect(() => {
    // Verifica se o onboarding foi completado
    if (!isOnboardingComplete()) {
      router.push("/onboarding");
      return;
    }

    // Carrega o perfil do usuário
    const userProfile = getUserProfile();
    if (userProfile) {
      setProfile(userProfile);
    }

    setIsLoading(false);
  }, [router]);

  // Carrega dados do dia selecionado
  const lastLoadRef = useRef(0);
  const loadData = useCallback(() => {
    const dateKey = formatDateKey(selectedDate);

    // Se usuário logado, busca do Supabase
    if (user) {
      const loadSupabaseData = async () => {
        const [summary, tdee] = await Promise.all([
          getHomeSummary(dateKey),
          getTdee()
        ]);
        setSupabaseSummary(summary);
        setSupabaseTdee(tdee);
      };
      loadSupabaseData();
    }

    // Sempre carrega localStorage como fallback
    const dayMeals = getMealsByDate(dateKey);
    setMeals(dayMeals);

    const allWorkouts = getWorkouts();
    const dayWorkouts = allWorkouts.filter((w) => w.date === dateKey);
    setWorkouts(dayWorkouts);

    const weightLogs = getWeightLogs();
    setHasWeightLog(weightLogs.length > 0);

    const last7Days = getWeightLogsLastDays(7);
    setWeightData(last7Days);

    const bf = getLatestBodyFat();
    setLatestBodyFat(bf?.percentage ?? null);

    const streak = calculateStreak();
    setStreakData(streak);
  }, [selectedDate, user]);

  // Carrega dados quando a data muda
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Re-carrega dados ao voltar para a página (focus)
  useEffect(() => {
    const handleFocus = () => {
      const now = Date.now();
      if (now - lastLoadRef.current > 10_000) {
        lastLoadRef.current = now;
        loadData();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadData]);

  // Calcula totais do dia - prefere Supabase se disponível
  const totals = supabaseSummary
    ? {
        calories: supabaseSummary.calories_in,
        protein: supabaseSummary.protein,
        carbs: supabaseSummary.carbs,
        fat: supabaseSummary.fat,
      }
    : {
        calories: meals.reduce((sum, m) => sum + m.totalCalories, 0),
        protein: meals.reduce((sum, m) => sum + m.totalProtein, 0),
        carbs: meals.reduce((sum, m) => sum + m.totalCarbs, 0),
        fat: meals.reduce((sum, m) => sum + m.totalFat, 0),
      };

  const hasWorkout = supabaseSummary
    ? supabaseSummary.workout_minutes > 0
    : workouts.length > 0;
  const bmr = supabaseTdee || profile?.bmr || 0;
  const deficit = bmr - totals.calories;

  // Calcula tendência de peso baseado nos dados de 7 dias
  const getWeightTrend = (): "up" | "down" | "stable" | null => {
    const validWeights = weightData.filter((d) => d.weight !== null);
    if (validWeights.length < 2) return null;

    const first = validWeights[0].weight as number;
    const last = validWeights[validWeights.length - 1].weight as number;
    const diff = last - first;

    if (diff < -0.3) return "down";
    if (diff > 0.3) return "up";
    return "stable";
  };
  const weightTrend = getWeightTrend();

  if (isLoading) {
    return (
      <ScreenContainer className="bg-[#F5F3EF] text-gray-800">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-[#F5F3EF] text-gray-800">
      <PullToRefresh onRefresh={loadData}>
        {/* Navegação temporal */}
        <DateNavigator
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          theme="light"
        />

        {/* Conteúdo principal */}
        <div className="flex flex-1 flex-col gap-6 py-4">
          {/* Card de resumo do dia */}
          <SummaryCard
            calories={totals.calories}
            protein={totals.protein}
            carbs={totals.carbs}
            fat={totals.fat}
            deficit={deficit}
            hasWorkout={hasWorkout}
            bmr={bmr}
          />

          {/* Insight do dia */}
          <InsightCard
            calories={totals.calories}
            protein={totals.protein}
            bmr={bmr}
            hasWorkout={hasWorkout}
            streak={streakData.streak}
            weightTrend={weightTrend}
          />

          {/* Checklist guiado (Zero Data Experience) */}
          <EmptyState
            hasMeals={meals.length > 0}
            hasWeight={hasWeightLog}
            hasWorkout={workouts.length > 0}
          />

          {/* Card de streak */}
          <ProgressCard
            streak={streakData.streak}
            lastActiveDate={streakData.lastActiveDate}
          />

          {/* Gráfico de peso dos últimos 7 dias */}
          <MiniChart data={weightData} latestBodyFat={latestBodyFat} />

          {/* Lista de refeições do dia */}
          {meals.length > 0 && (
            <div className="rounded-2xl bg-white p-4 shadow-soft">
              <h2 className="mb-3 text-sm font-medium text-gray-500">
                Refeições ({meals.length})
              </h2>
              <div className="flex flex-col gap-2">
                {meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {meal.type === "breakfast"
                          ? "Café da manhã"
                          : meal.type === "lunch"
                          ? "Almoço"
                          : meal.type === "dinner"
                          ? "Jantar"
                          : meal.type === "snack"
                          ? "Lanche"
                          : "Refeição"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {meal.items.map((i) => i.name).join(", ")}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                      {meal.totalCalories} kcal
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de treinos do dia */}
          {workouts.length > 0 && (
            <div className="rounded-2xl bg-white p-4 shadow-soft">
              <h2 className="mb-3 text-sm font-medium text-gray-500">
                Treinos ({workouts.length})
              </h2>
              <div className="flex flex-col gap-2">
                {workouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {workout.exercises.map((e) => e.name).join(", ")}
                      </p>
                      {workout.totalDuration && (
                        <p className="text-xs text-gray-500">
                          {workout.totalDuration} min
                        </p>
                      )}
                    </div>
                    {workout.totalCaloriesBurned && (
                      <p className="text-sm font-medium text-gray-800">
                        -{workout.totalCaloriesBurned} kcal
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PullToRefresh>
      <FAB theme="light" onClick={() => router.push("/chat")} />
    </ScreenContainer>
  );
}
