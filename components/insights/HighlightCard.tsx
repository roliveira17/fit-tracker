"use client";

import type { DeltaHighlight } from "@/lib/insights-deltas";

interface HighlightCardProps {
  highlight: DeltaHighlight;
}

const SENTIMENT_STYLES = {
  positive: {
    border: "border-green-500/40",
    bg: "bg-green-500/10",
    badge: "bg-green-500/20 text-green-400",
    icon: "text-green-400",
  },
  warning: {
    border: "border-red-500/40",
    bg: "bg-red-500/10",
    badge: "bg-red-500/20 text-red-400",
    icon: "text-red-400",
  },
  neutral: {
    border: "border-border-subtle",
    bg: "bg-surface-card",
    badge: "bg-white/10 text-text-secondary",
    icon: "text-text-secondary",
  },
};

export function HighlightCard({ highlight }: HighlightCardProps) {
  const style = SENTIMENT_STYLES[highlight.sentiment];
  const arrow = highlight.direction === "up" ? "arrow_upward" : highlight.direction === "down" ? "arrow_downward" : "remove";

  return (
    <div
      className={`flex-shrink-0 rounded-xl border p-3 ${style.border} ${style.bg}`}
      style={{ width: "260px" }}
    >
      <div className="flex items-start gap-2.5">
        <span className={`material-symbols-rounded text-xl ${style.icon}`}>
          {highlight.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {highlight.metric}
            </span>
            <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${style.badge}`}>
              <span className="material-symbols-rounded text-xs align-middle">
                {arrow}
              </span>
              {" "}{Math.abs(highlight.deltaPct)}%
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
            {highlight.text}
          </p>
        </div>
      </div>
    </div>
  );
}

export function HighlightCardList({ highlights }: { highlights: DeltaHighlight[] }) {
  if (highlights.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-text-secondary px-1">
        Destaques da Semana
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {highlights.map((h) => (
          <HighlightCard key={h.id} highlight={h} />
        ))}
      </div>
    </div>
  );
}
