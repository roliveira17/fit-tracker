"use client";

import { LineChart } from "@/components/insights/LineChart";
import { StatCard } from "@/components/insights/StatCard";
import type { InsightsData } from "@/lib/supabase";

interface GlicemiaTabProps {
  glucose: InsightsData["glucose"];
}

export function GlicemiaTab({ glucose }: GlicemiaTabProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Glicose média diária */}
      <LineChart
        data={glucose.by_day.map((d) => ({
          date: d.date,
          value: d.avg,
        }))}
        label="Glicose Média Diária"
        unit="mg/dL"
        color="green"
        referenceRange={{ min: 70, max: 140 }}
      />

      {/* Time in Range gauge */}
      {glucose.time_in_range !== null && (
        <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Time in Range</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-14">
              <svg viewBox="0 0 100 60" className="w-full h-full">
                <path
                  d="M 10 55 A 40 40 0 0 1 90 55"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={8}
                  className="text-border-subtle"
                  opacity={0.3}
                  strokeLinecap="round"
                />
                <path
                  d="M 10 55 A 40 40 0 0 1 90 55"
                  fill="none"
                  stroke={
                    glucose.time_in_range >= 70
                      ? "#22c55e"
                      : glucose.time_in_range >= 50
                        ? "#eab308"
                        : "#ef4444"
                  }
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeDasharray={`${(glucose.time_in_range / 100) * 126} 126`}
                />
              </svg>
              <div className="absolute inset-0 flex items-end justify-center pb-0">
                <span className="text-lg font-bold text-white">
                  {Math.round(glucose.time_in_range)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-white font-medium">
                {glucose.time_in_range >= 70
                  ? "Excelente controle"
                  : glucose.time_in_range >= 50
                    ? "Controle moderado"
                    : "Atenção necessária"}
              </p>
              <p className="text-xs text-text-secondary">Faixa alvo: 70-140 mg/dL</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {glucose.avg_fasting !== null && (
          <StatCard
            label="Jejum médio"
            value={Math.round(glucose.avg_fasting)}
            unit="mg/dL"
            icon="wb_sunny"
            color={glucose.avg_fasting <= 100 ? "green" : "orange"}
          />
        )}
        {glucose.avg_post_meal !== null && (
          <StatCard
            label="Pós-prandial"
            value={Math.round(glucose.avg_post_meal)}
            unit="mg/dL"
            icon="restaurant"
            color={glucose.avg_post_meal <= 140 ? "green" : "orange"}
          />
        )}
        {glucose.by_day.length > 0 && (
          <>
            <StatCard
              label="Mínima"
              value={Math.min(...glucose.by_day.map((d) => d.min))}
              unit="mg/dL"
              icon="arrow_downward"
              color="blue"
            />
            <StatCard
              label="Máxima"
              value={Math.max(...glucose.by_day.map((d) => d.max))}
              unit="mg/dL"
              icon="arrow_upward"
              color="red"
            />
          </>
        )}
      </div>
    </div>
  );
}
