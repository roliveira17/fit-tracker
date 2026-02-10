"use client";

import type { DomainScore } from "@/lib/insights-score";
import type { InsightsData } from "@/lib/supabase";
import type { Recommendation } from "@/lib/insights-recommendations";
import { DomainSection } from "@/components/insights/DomainSection";
import { Sparkline } from "@/components/insights/Sparkline";

interface GlicemiaSectionProps {
  domain: DomainScore;
  glucose: InsightsData["glucose"];
  recommendation: Recommendation | null;
}

export function GlicemiaSection({ domain, glucose, recommendation }: GlicemiaSectionProps) {
  const tirPct = glucose.time_in_range ?? 0;
  const avgGlucose = glucose.by_day.length > 0
    ? Math.round(glucose.by_day.reduce((s, d) => s + d.avg, 0) / glucose.by_day.length)
    : 0;

  // Sparkline of daily averages
  const glucoseData = glucose.by_day.map((d) => d.avg);

  return (
    <DomainSection domain={domain}>
      {/* TIR ring + stats */}
      <div className="flex items-center gap-5">
        <TIRRing tirPct={tirPct} />

        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Media geral</span>
            <span className="text-sm font-medium text-gray-800">{avgGlucose} mg/dL</span>
          </div>
          {glucose.avg_fasting !== null && (
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Jejum</span>
              <span className="text-sm font-medium text-gray-500">
                {Math.round(glucose.avg_fasting)} mg/dL
              </span>
            </div>
          )}
          {glucose.avg_post_meal !== null && (
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Pos-refeicao</span>
              <span className="text-sm font-medium text-gray-500">
                {Math.round(glucose.avg_post_meal)} mg/dL
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Dias medidos</span>
            <span className="text-sm font-medium text-gray-500">{glucose.by_day.length}</span>
          </div>
        </div>
      </div>

      {/* Glucose trend */}
      {glucoseData.length >= 3 && (
        <div>
          <h4 className="text-xs text-gray-500 mb-1">Tendencia diaria</h4>
          <Sparkline data={glucoseData} color="#22c55e" height={36} />
        </div>
      )}

      {/* Min/Max */}
      {glucose.by_day.length > 0 && (
        <div className="flex gap-3">
          <div className="flex-1 rounded-lg bg-green-500/5 border border-green-500/20 p-2.5">
            <p className="text-[10px] text-green-400">Minimo</p>
            <p className="text-sm font-medium text-gray-800">
              {Math.round(Math.min(...glucose.by_day.map((d) => d.min)))} mg/dL
            </p>
          </div>
          <div className="flex-1 rounded-lg bg-red-500/5 border border-red-500/20 p-2.5">
            <p className="text-[10px] text-red-400">Maximo</p>
            <p className="text-sm font-medium text-gray-800">
              {Math.round(Math.max(...glucose.by_day.map((d) => d.max)))} mg/dL
            </p>
          </div>
        </div>
      )}

      {/* Insight */}
      {recommendation && <InsightBanner recommendation={recommendation} />}
    </DomainSection>
  );
}

function TIRRing({ tirPct }: { tirPct: number }) {
  const size = 100;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 38;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  const filled = (tirPct / 100) * circumference;

  let color = "#22c55e"; // green ≥70%
  if (tirPct < 50) color = "#ef4444"; // red
  else if (tirPct < 70) color = "#eab308"; // yellow

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
        <span className="text-lg font-bold text-gray-800">{Math.round(tirPct)}%</span>
        <span className="text-[10px] text-gray-500">no alvo</span>
      </div>
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
