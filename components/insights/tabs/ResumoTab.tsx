"use client";

import { StatCard } from "@/components/insights/StatCard";
import { RecommendationCard } from "@/components/insights/RecommendationCard";
import type { Recommendation } from "@/lib/insights-recommendations";
import type { SleepInsightsData } from "@/lib/supabase";

interface ResumoTabProps {
  recommendations: Recommendation[];
  lastWeight: number | null;
  avgCalories: number;
  workoutCount: number;
  sleepData: SleepInsightsData | null;
  latestBF: number | null;
}

export function ResumoTab({
  recommendations,
  lastWeight,
  avgCalories,
  workoutCount,
  sleepData,
  latestBF,
}: ResumoTabProps) {
  const sleepFmt = sleepData?.avg_duration_min
    ? `${Math.floor(sleepData.avg_duration_min / 60)}h${String(Math.round(sleepData.avg_duration_min % 60)).padStart(2, "0")}`
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Recomendações acionáveis — top 3 */}
      {recommendations.length > 0 && (
        <div className="flex flex-col gap-2">
          {recommendations.slice(0, 3).map((rec, i) => (
            <RecommendationCard key={i} rec={rec} />
          ))}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Último peso"
          value={lastWeight ?? "-"}
          unit="kg"
          icon="scale"
        />
        <StatCard
          label="Média kcal"
          value={avgCalories > 0 ? Math.round(avgCalories) : "-"}
          unit="/dia"
          icon="local_fire_department"
        />
        <StatCard
          label="Treinos"
          value={workoutCount}
          unit="no período"
          icon="fitness_center"
        />
        {sleepFmt ? (
          <StatCard
            label="Sono médio"
            value={sleepFmt}
            unit=""
            icon="bedtime"
            color={sleepData!.avg_duration_min! >= 420 ? "green" : "orange"}
          />
        ) : latestBF ? (
          <StatCard
            label="Body Fat"
            value={latestBF}
            unit="%"
            subtitle="Último registro"
          />
        ) : (
          <StatCard
            label="Sono médio"
            value="-"
            unit=""
            icon="bedtime"
          />
        )}
      </div>

      {/* Mais recomendações se houver */}
      {recommendations.length > 3 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mt-2">
            Mais observações
          </p>
          {recommendations.slice(3, 6).map((rec, i) => (
            <RecommendationCard key={i + 3} rec={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
