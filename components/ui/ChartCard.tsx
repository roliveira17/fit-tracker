"use client";

// ========================================
// CHART CARD - Card com gráfico
// ========================================
// Card para exibir gráficos de evolução
// Inclui título, valor atual e badge de tendência

interface ChartCardProps {
  title: string;
  value: string;
  unit?: string;
  trend?: {
    value: string;
    direction: "up" | "down";
    isPositive: boolean; // down pode ser positivo (peso) ou negativo (calorias)
  };
  children: React.ReactNode;
  onMoreClick?: () => void;
}

export function ChartCard({
  title,
  value,
  unit,
  trend,
  children,
  onMoreClick,
}: ChartCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-surface-card p-5 border border-border-subtle">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-medium text-text-secondary">{title}</h2>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {value}
              {unit && (
                <span className="text-lg font-normal text-white/60 ml-1">
                  {unit}
                </span>
              )}
            </span>
            {trend && <TrendBadge {...trend} />}
          </div>
        </div>
        {onMoreClick && (
          <button
            onClick={onMoreClick}
            className="text-text-secondary hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        )}
      </div>

      {/* Chart Area */}
      <div className="relative h-48 w-full">{children}</div>
    </div>
  );
}

// ========================================
// TREND BADGE - Badge de tendência
// ========================================
interface TrendBadgeProps {
  value: string;
  direction: "up" | "down";
  isPositive: boolean;
}

export function TrendBadge({ value, direction, isPositive }: TrendBadgeProps) {
  const colorClass = isPositive
    ? "text-green-500 bg-green-500/10"
    : "text-red-500 bg-red-500/10";

  const icon = direction === "up" ? "trending_up" : "trending_down";

  return (
    <span
      className={`flex items-center text-sm font-semibold ${colorClass} px-1.5 py-0.5 rounded`}
    >
      <span className="material-symbols-outlined text-[14px] mr-0.5">
        {icon}
      </span>
      {value}
    </span>
  );
}
