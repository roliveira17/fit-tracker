"use client";

import type { Recommendation } from "@/lib/insights-recommendations";

interface RecommendationCardProps {
  rec: Recommendation;
}

const typeStyles = {
  positive: {
    border: "border-green-500/20",
    bg: "bg-green-500/10",
    iconColor: "text-green-500",
  },
  warning: {
    border: "border-yellow-500/20",
    bg: "bg-yellow-500/10",
    iconColor: "text-yellow-500",
  },
  info: {
    border: "border-blue-500/20",
    bg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  neutral: {
    border: "border-gray-100",
    bg: "bg-gray-200",
    iconColor: "text-gray-500",
  },
};

export function RecommendationCard({ rec }: RecommendationCardProps) {
  const style = typeStyles[rec.type] ?? typeStyles.neutral;

  return (
    <div className={`rounded-xl border p-4 ${style.border} ${style.bg}`}>
      <div className="flex gap-3">
        <span
          className={`material-symbols-outlined text-[22px] flex-shrink-0 mt-0.5 ${style.iconColor}`}
        >
          {rec.icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800">{rec.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{rec.observation}</p>
          <p className="text-xs text-gray-700 mt-2 font-medium leading-relaxed">
            {rec.action}
          </p>
        </div>
      </div>
    </div>
  );
}
