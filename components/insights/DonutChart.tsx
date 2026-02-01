"use client";

// ========================================
// DONUT CHART - Gráfico de rosca SVG
// ========================================
// Exibe distribuição percentual (macros, estágios de sono, etc.)

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: Segment[];
  label: string;
  centerText?: string;
  centerSubtext?: string;
}

export function DonutChart({
  segments,
  label,
  centerText,
  centerSubtext,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          {label}
        </h3>
        <p className="text-sm text-text-secondary text-center py-8">
          Sem dados para exibir
        </p>
      </div>
    );
  }

  // SVG donut params
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 44;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // Calcula offsets para cada segmento
  let accumulated = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const pct = s.value / total;
      const dashLength = pct * circumference;
      const dashGap = circumference - dashLength;
      const offset = -accumulated * circumference + circumference * 0.25; // start from top
      accumulated += pct;
      return { ...s, pct, dashLength, dashGap, offset };
    });

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
      <h3 className="text-sm font-medium text-text-secondary mb-4">{label}</h3>

      <div className="flex items-center gap-6">
        {/* Donut SVG */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
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
              opacity={0.3}
            />

            {/* Segments */}
            {arcs.map((arc, i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${arc.dashLength} ${arc.dashGap}`}
                strokeDashoffset={arc.offset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            ))}
          </svg>

          {/* Center text */}
          {centerText && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-white">{centerText}</span>
              {centerSubtext && (
                <span className="text-xs text-text-secondary">{centerSubtext}</span>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {arcs.map((arc, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: arc.color }}
                />
                <span className="text-sm text-text-secondary truncate">
                  {arc.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1 flex-shrink-0">
                <span className="text-sm font-medium text-white">
                  {Math.round(arc.value)}g
                </span>
                <span className="text-xs text-text-secondary">
                  {Math.round(arc.pct * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
