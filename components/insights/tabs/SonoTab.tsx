"use client";

import { BarChart } from "@/components/insights/BarChart";
import { DonutChart } from "@/components/insights/DonutChart";
import { StatCard } from "@/components/insights/StatCard";
import type { SleepInsightsData } from "@/lib/supabase";

interface SonoTabProps {
  sleep: SleepInsightsData;
}

export function SonoTab({ sleep }: SonoTabProps) {
  const fmtMin = (min: number) =>
    `${Math.floor(min / 60)}h${String(Math.round(min % 60)).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Duração por noite */}
      <BarChart
        data={sleep.by_day.map((d) => ({
          date: d.date,
          value: Math.round((d.total_min / 60) * 10) / 10,
        }))}
        label="Duração por Noite"
        unit="h"
        target={8}
        color="blue"
        invertColors={false}
      />

      {/* Estágios do sono */}
      {sleep.avg_stages.length > 0 && (
        <DonutChart
          segments={[
            { label: "Profundo", value: sleep.avg_stages.find((s) => s.stage === "deep")?.avg_pct || 0, color: "#6366f1" },
            { label: "REM", value: sleep.avg_stages.find((s) => s.stage === "rem")?.avg_pct || 0, color: "#c084fc" },
            { label: "Leve", value: sleep.avg_stages.find((s) => s.stage === "light")?.avg_pct || 0, color: "#60a5fa" },
            { label: "Acordado", value: sleep.avg_stages.find((s) => s.stage === "awake")?.avg_pct || 0, color: "#f87171" },
          ]}
          label="Estágios do Sono (média)"
          centerText={sleep.avg_duration_min ? fmtMin(sleep.avg_duration_min) : "-"}
          centerSubtext="média/noite"
          unit="%"
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Média de sono"
          value={sleep.avg_duration_min ? fmtMin(sleep.avg_duration_min) : "-"}
          unit=""
          icon="bedtime"
          color={sleep.avg_duration_min && sleep.avg_duration_min >= 420 ? "green" : "orange"}
        />
        <StatCard
          label="Consistência"
          value={sleep.consistency ?? "-"}
          unit="%"
          icon="check_circle"
          subtitle="noites com 6h+"
        />
        {sleep.best_night && (
          <StatCard
            label="Melhor noite"
            value={fmtMin(sleep.best_night.total_min)}
            unit=""
            icon="trending_up"
            color="green"
          />
        )}
        {sleep.worst_night && (
          <StatCard
            label="Pior noite"
            value={fmtMin(sleep.worst_night.total_min)}
            unit=""
            icon="trending_down"
            color="red"
          />
        )}
      </div>
    </div>
  );
}
