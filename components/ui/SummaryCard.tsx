"use client";

// ========================================
// SUMMARY CARD - Card hero principal
// ========================================
// Card grande usado na Home com resumo diário
// Inclui ring chart de calorias e estatísticas

interface SummaryCardProps {
  title?: string;
  children: React.ReactNode;
  onMoreClick?: () => void;
}

export function SummaryCard({
  title = "Resumo Diário",
  children,
  onMoreClick,
}: SummaryCardProps) {
  return (
    <section className="rounded-2xl bg-surface-dark p-6 shadow-lg border border-white/5 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          {onMoreClick && (
            <button
              onClick={onMoreClick}
              className="text-white/60 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-xl">
                more_horiz
              </span>
            </button>
          )}
        </div>

        {/* Content */}
        {children}
      </div>
    </section>
  );
}

// ========================================
// RING CHART - Gráfico circular de progresso
// ========================================
interface RingChartProps {
  value: number;
  max: number;
  label?: string;
  unit?: string;
  size?: "sm" | "md" | "lg";
}

export function RingChart({
  value,
  max,
  label = "Restam",
  unit = "kcal",
  size = "md",
}: RingChartProps) {
  const remaining = Math.max(0, max - value);
  const percentage = Math.min(100, (value / max) * 100);

  const sizeClasses = {
    sm: "size-20",
    md: "size-28",
    lg: "size-36",
  };

  const textSizes = {
    sm: { label: "text-[8px]", value: "text-sm", unit: "text-[8px]" },
    md: { label: "text-xs", value: "text-lg", unit: "text-[10px]" },
    lg: { label: "text-sm", value: "text-2xl", unit: "text-xs" },
  };

  return (
    <div className={`relative ${sizeClasses[size]} shrink-0`}>
      <svg className="size-full -rotate-90" viewBox="0 0 36 36">
        {/* Background Circle */}
        <path
          className="text-white/10"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        {/* Progress Circle */}
        <path
          className="text-primary drop-shadow-[0_0_4px_rgba(235,96,40,0.5)]"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeDasharray={`${percentage}, 100`}
          strokeLinecap="round"
          strokeWidth="3"
        />
      </svg>
      {/* Center Text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
        <span className={`${textSizes[size].label} text-white/60 font-medium`}>
          {label}
        </span>
        <span className={`${textSizes[size].value} font-bold text-white`}>
          {remaining}
        </span>
        <span className={`${textSizes[size].unit} text-white/40`}>{unit}</span>
      </div>
    </div>
  );
}
