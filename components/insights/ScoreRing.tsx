"use client";

import type { DomainScore, Grade } from "@/lib/insights-score";

interface ScoreRingProps {
  total: number;
  grade: Grade;
  domains: DomainScore[];
}

const GRADE_COLORS: Record<Grade, string> = {
  A: "#22c55e",
  B: "#60a5fa",
  C: "#eab308",
  D: "#f97316",
  F: "#ef4444",
};

export function ScoreRing({ total, grade, domains }: ScoreRingProps) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 72;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  const activeDomains = domains.filter((d) => d.hasData);
  const totalMax = activeDomains.reduce((s, d) => s + d.maxScore, 0);

  // Build arc segments proportional to domain scores
  let accumulated = 0;
  const arcs = activeDomains.map((d) => {
    const pct = totalMax > 0 ? d.maxScore / totalMax : 0;
    const fillRatio = d.maxScore > 0 ? d.score / d.maxScore : 0;
    const dashLength = pct * circumference;
    const filledLength = dashLength * fillRatio;
    const offset = -accumulated * circumference + circumference * 0.25;
    accumulated += pct;
    return { ...d, pct, filledLength, dashLength, offset };
  });

  // Inactive domains (no data) — gray
  const inactiveDomains = domains.filter((d) => !d.hasData);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
          {/* Background ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-border-subtle"
            opacity={0.2}
          />

          {/* Domain segments (filled portion) */}
          {arcs.map((arc) => (
            <circle
              key={arc.domain}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arc.filledLength} ${circumference - arc.filledLength}`}
              strokeDashoffset={arc.offset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          ))}
        </svg>

        {/* Center: score + grade */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-bold"
            style={{ color: GRADE_COLORS[grade] }}
          >
            {total}
          </span>
          <span className="text-xs text-text-secondary mt-0.5">de 100</span>
        </div>
      </div>

      {/* Sub-score pills */}
      <div className="flex flex-wrap justify-center gap-2">
        {activeDomains.map((d) => (
          <div
            key={d.domain}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-surface-card border border-border-subtle"
          >
            <span
              className="material-symbols-rounded text-sm"
              style={{ color: d.color }}
            >
              {d.icon}
            </span>
            <span className="text-xs text-text-secondary">{d.label}</span>
            <span className="text-xs font-semibold text-white">
              {d.score}/{d.maxScore}
            </span>
          </div>
        ))}
        {inactiveDomains.map((d) => (
          <div
            key={d.domain}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-surface-card border border-border-subtle opacity-40"
          >
            <span className="material-symbols-rounded text-sm text-text-secondary">
              {d.icon}
            </span>
            <span className="text-xs text-text-secondary">{d.label}</span>
            <span className="text-xs text-text-secondary">—</span>
          </div>
        ))}
      </div>
    </div>
  );
}
