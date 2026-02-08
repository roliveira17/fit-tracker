"use client";

interface MetricItem {
  label: string;
  value: string;
  status: "good" | "warning" | "low";
  detail?: string;
}

interface RecommendationItem {
  text: string;
}

interface WeeklyAnalysisCardProps {
  metrics?: MetricItem[];
  recommendations?: RecommendationItem[];
  summary?: string;
}

export function WeeklyAnalysisCard({
  metrics,
  recommendations,
  summary,
}: WeeklyAnalysisCardProps) {
  const statusIcons: Record<string, string> = {
    good: "check_circle",
    warning: "arrow_upward",
    low: "error",
  };
  const statusIconColors: Record<string, string> = {
    good: "text-green-500",
    warning: "text-orange-400",
    low: "text-red-400",
  };

  return (
    <>
      {/* Title */}
      <h2 className="font-serif-display text-2xl text-[#3E2723] font-medium mb-4 tracking-tight">
        Análise da Semana
      </h2>

      {/* Summary */}
      {summary && (
        <p className="text-[14px] text-[#3E2723]/80 leading-relaxed mb-4">
          {summary}
        </p>
      )}

      {/* Metrics */}
      {metrics && metrics.length > 0 && (
        <div className="space-y-4">
          {metrics.map((metric, i) => (
            <div key={i} className="flex items-start gap-3">
              <span
                className={`material-symbols-outlined text-[18px] mt-0.5 ${statusIconColors[metric.status]}`}
              >
                {statusIcons[metric.status]}
              </span>
              <div>
                <p className="text-[11px] font-bold text-[#3E2723] uppercase tracking-wide mb-0.5">
                  {metric.label}
                </p>
                <p className="text-base text-[#3E2723]/80 leading-snug">
                  {metric.detail || metric.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Separator + Recommendation */}
      {recommendations && recommendations.length > 0 && (
        <>
          <div className="h-px bg-[#3E2723]/5 w-full my-4" />
          <div className="bg-[#F8FCF9] rounded-xl p-3 border border-green-500/20">
            {recommendations.map((rec, i) => (
              <p
                key={i}
                className="text-[15px] italic text-[#3E2723]/90 leading-relaxed font-serif-display"
              >
                &ldquo;{rec.text}&rdquo;
              </p>
            ))}
          </div>
        </>
      )}
    </>
  );
}
