"use client";

import type { DomainScore } from "@/lib/insights-score";
import type { SleepInsightsData } from "@/lib/supabase";
import type { Recommendation } from "@/lib/insights-recommendations";
import { DomainSection } from "@/components/insights/DomainSection";
import { Sparkline } from "@/components/insights/Sparkline";

interface SonoSectionProps {
  domain: DomainScore;
  sleep: SleepInsightsData;
  recommendation: Recommendation | null;
}

export function SonoSection({ domain, sleep, recommendation }: SonoSectionProps) {
  const avgH = sleep.avg_duration_min !== null ? sleep.avg_duration_min / 60 : 0;
  const avgFormatted = formatDuration(sleep.avg_duration_min ?? 0);

  // Duration sparkline
  const durationData = sleep.by_day.map((d) => d.total_min / 60);

  // Stages
  const deep = sleep.avg_stages.find((s) => s.stage === "deep");
  const rem = sleep.avg_stages.find((s) => s.stage === "rem");
  const light = sleep.avg_stages.find((s) => s.stage === "light");

  return (
    <DomainSection domain={domain}>
      {/* Main metric */}
      <div className="flex items-center gap-5">
        {/* Duration ring */}
        <DurationRing avgHours={avgH} />

        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Media/noite</span>
            <span className="text-sm font-medium text-gray-800">{avgFormatted}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Noites</span>
            <span className="text-sm font-medium text-gray-500">{sleep.total_nights}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Consistencia</span>
            <span className="text-sm font-medium text-gray-500">
              {sleep.consistency !== null ? `${Math.round(sleep.consistency)}%` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Duration trend */}
      {durationData.length >= 3 && (
        <div>
          <h4 className="text-xs text-gray-500 mb-1">Duracao por noite</h4>
          <Sparkline data={durationData} color="#a78bfa" height={36} />
        </div>
      )}

      {/* Sleep stages */}
      {(deep || rem || light) && (
        <div>
          <h4 className="text-xs text-gray-500 mb-2">Estagios (media)</h4>
          <div className="flex gap-3">
            {deep && <StagePill label="Profundo" pct={deep.avg_pct} color="#6366f1" />}
            {rem && <StagePill label="REM" pct={rem.avg_pct} color="#c084fc" />}
            {light && <StagePill label="Leve" pct={light.avg_pct} color="#60a5fa" />}
          </div>
        </div>
      )}

      {/* Best / worst */}
      {sleep.best_night && sleep.worst_night && (
        <div className="flex gap-3">
          <div className="flex-1 rounded-lg bg-green-500/5 border border-green-500/20 p-2.5">
            <p className="text-[10px] text-green-400">Melhor noite</p>
            <p className="text-sm font-medium text-gray-800">{formatDuration(sleep.best_night.total_min)}</p>
          </div>
          <div className="flex-1 rounded-lg bg-red-500/5 border border-red-500/20 p-2.5">
            <p className="text-[10px] text-red-400">Pior noite</p>
            <p className="text-sm font-medium text-gray-800">{formatDuration(sleep.worst_night.total_min)}</p>
          </div>
        </div>
      )}

      {/* Insight */}
      {recommendation && <InsightBanner recommendation={recommendation} />}
    </DomainSection>
  );
}

function DurationRing({ avgHours }: { avgHours: number }) {
  const size = 100;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 38;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  const target = 8; // 8h target
  const ratio = Math.min(avgHours / target, 1.2);
  const filled = ratio * circumference;

  let color = "#a78bfa"; // purple default
  if (avgHours >= 7 && avgHours <= 9) color = "#22c55e"; // green — on target
  else if (avgHours < 6) color = "#ef4444"; // red — very low

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          className="text-border-subtle" opacity={0.2}
        />
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-gray-800">{avgHours.toFixed(1)}</span>
        <span className="text-[10px] text-gray-500">h/noite</span>
      </div>
    </div>
  );
}

function StagePill({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-800">{Math.round(pct)}%</span>
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

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h${String(m).padStart(2, "0")}`;
}
