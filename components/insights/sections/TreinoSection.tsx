"use client";

import type { DomainScore } from "@/lib/insights-score";
import type { WorkoutProgressionData } from "@/lib/supabase";
import type { Recommendation } from "@/lib/insights-recommendations";
import { DomainSection } from "@/components/insights/DomainSection";
import { FrequencyDots } from "@/components/insights/FrequencyDots";
import { Sparkline } from "@/components/insights/Sparkline";

interface TreinoSectionProps {
  domain: DomainScore;
  workout: WorkoutProgressionData;
  periodDays: number;
  recentWorkoutDates: string[];
  recommendation: Recommendation | null;
}

export function TreinoSection({
  domain,
  workout,
  periodDays,
  recentWorkoutDates,
  recommendation,
}: TreinoSectionProps) {
  const weeksInPeriod = periodDays / 7;
  const perWeek = workout.total_workouts / weeksInPeriod;

  // Last 7 days dots
  const last7 = getLast7DaysDots(recentWorkoutDates);

  // Volume sparkline
  const volumeData = workout.volume_by_day.map((d) => d.volume);

  // PRs this period
  const prs = workout.top_exercises
    .filter((ex) => {
      if (ex.progression.length < 2) return false;
      const first = ex.progression[0].max_weight;
      const last = ex.progression[ex.progression.length - 1].max_weight;
      return last > first;
    })
    .map((ex) => ({
      name: ex.exercise_name,
      from: ex.progression[0].max_weight,
      to: ex.progression[ex.progression.length - 1].max_weight,
    }));

  return (
    <DomainSection domain={domain}>
      {/* Frequency dots */}
      <div>
        <h4 className="text-xs text-gray-500 mb-2">Ultimos 7 dias</h4>
        <FrequencyDots days={last7.dots} labels={last7.labels} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatMini label="Frequencia" value={`${perWeek.toFixed(1)}x`} sub="/semana" />
        <StatMini label="Volume total" value={formatVolume(workout.total_volume)} sub="kg" />
        <StatMini
          label="Duracao media"
          value={workout.avg_duration_min ? `${Math.round(workout.avg_duration_min)}` : "—"}
          sub="min"
        />
      </div>

      {/* Volume trend */}
      {volumeData.length >= 3 && (
        <div>
          <h4 className="text-xs text-gray-500 mb-1">Volume por sessao</h4>
          <Sparkline data={volumeData} color="#60a5fa" height={36} />
        </div>
      )}

      {/* PRs */}
      {prs.length > 0 && (
        <div>
          <h4 className="text-xs text-gray-500 mb-2">Records no periodo</h4>
          <div className="flex flex-wrap gap-2">
            {prs.slice(0, 3).map((pr) => (
              <div
                key={pr.name}
                className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 px-2.5 py-1.5"
              >
                <span className="material-symbols-rounded text-sm text-blue-400">
                  emoji_events
                </span>
                <span className="text-xs text-gray-800">{pr.name}</span>
                <span className="text-xs text-blue-400 font-medium">
                  {pr.from} → {pr.to}kg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insight */}
      {recommendation && <InsightBanner recommendation={recommendation} />}
    </DomainSection>
  );
}

function StatMini({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-800">
        {value}
        <span className="text-xs font-normal text-gray-500 ml-0.5">{sub}</span>
      </p>
    </div>
  );
}

function InsightBanner({ recommendation }: { recommendation: Recommendation }) {
  const colors = {
    positive: "border-green-500/30 bg-green-500/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
    info: "border-blue-500/30 bg-blue-500/5",
    neutral: "border-gray-100 bg-gray-100",
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[recommendation.type]}`}>
      <p className="text-xs text-gray-500">{recommendation.observation}</p>
      <p className="text-xs font-medium text-gray-800 mt-1">{recommendation.action}</p>
    </div>
  );
}

function getLast7DaysDots(workoutDates: string[]) {
  const dayLabels = ["D", "S", "T", "Q", "Q", "S", "S"];
  const dates: string[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  const workoutSet = new Set(workoutDates);
  const dots = dates.map((d) => workoutSet.has(d));
  const labels = dates.map((d) => {
    const day = new Date(d + "T12:00:00").getDay();
    return dayLabels[day];
  });

  return { dots, labels };
}

function formatVolume(vol: number): string {
  if (vol >= 10000) return `${(vol / 1000).toFixed(0)}k`;
  if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
  return `${Math.round(vol)}`;
}
