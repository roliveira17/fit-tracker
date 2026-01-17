"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
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

/**
 * Formata data para YYYY-MM-DD (formato usado no storage)
 */
function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Página Home - Hub Minimalista
 * Exibe resumo diário do usuário com navegação temporal
 */
export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Dados do dia selecionado
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

  // Carrega dados quando a data muda
  useEffect(() => {
    const dateKey = formatDateKey(selectedDate);

    // Busca refeições do dia
    const dayMeals = getMealsByDate(dateKey);
    setMeals(dayMeals);

    // Busca treinos do dia
    const allWorkouts = getWorkouts();
    const dayWorkouts = allWorkouts.filter((w) => w.date === dateKey);
    setWorkouts(dayWorkouts);

    // Verifica se tem registro de peso (qualquer data)
    const weightLogs = getWeightLogs();
    setHasWeightLog(weightLogs.length > 0);

    // Busca dados de peso dos últimos 7 dias
    const last7Days = getWeightLogsLastDays(7);
    setWeightData(last7Days);

    // Busca último BF
    const bf = getLatestBodyFat();
    setLatestBodyFat(bf?.percentage ?? null);

    // Calcula streak
    const streak = calculateStreak();
    setStreakData(streak);
  }, [selectedDate]);

  // Calcula totais do dia
  const totals = {
    calories: meals.reduce((sum, m) => sum + m.totalCalories, 0),
    protein: meals.reduce((sum, m) => sum + m.totalProtein, 0),
    carbs: meals.reduce((sum, m) => sum + m.totalCarbs, 0),
    fat: meals.reduce((sum, m) => sum + m.totalFat, 0),
  };

  const hasWorkout = workouts.length > 0;
  const bmr = profile?.bmr || 0;
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
      <ScreenContainer>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <div className="flex flex-1 flex-col">
        {/* Navegação temporal */}
        <DateNavigator
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* Conteúdo principal */}
        <div className="flex flex-1 flex-col gap-4 py-4">
          {/* Card de resumo do dia */}
          <SummaryCard
            calories={totals.calories}
            protein={totals.protein}
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
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                Refeições ({meals.length})
              </h2>
              <div className="flex flex-col gap-2">
                {meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
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
                      <p className="text-xs text-muted-foreground">
                        {meal.items.map((i) => i.name).join(", ")}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {meal.totalCalories} kcal
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de treinos do dia */}
          {workouts.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                Treinos ({workouts.length})
              </h2>
              <div className="flex flex-col gap-2">
                {workouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {workout.exercises.map((e) => e.name).join(", ")}
                      </p>
                      {workout.totalDuration && (
                        <p className="text-xs text-muted-foreground">
                          {workout.totalDuration} min
                        </p>
                      )}
                    </div>
                    {workout.totalCaloriesBurned && (
                      <p className="text-sm font-medium text-foreground">
                        -{workout.totalCaloriesBurned} kcal
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ScreenContainer>
  );
}
