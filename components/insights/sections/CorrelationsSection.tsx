"use client";

import type { Correlation } from "@/lib/insights-correlations";

interface CorrelationsSectionProps {
  correlations: Correlation[];
}

export function CorrelationsSection({ correlations }: CorrelationsSectionProps) {
  if (correlations.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-rounded text-lg text-primary">
          insights
        </span>
        <h3 className="text-sm font-medium text-gray-800">Correlacoes Inteligentes</h3>
      </div>

      <div className="space-y-2">
        {correlations.map((corr) => (
          <CorrelationCard key={corr.id} correlation={corr} />
        ))}
      </div>
    </div>
  );
}

function CorrelationCard({ correlation }: { correlation: Correlation }) {
  const styles = {
    positive: {
      border: "border-green-500/30",
      bg: "bg-green-500/5",
      icon: "text-green-400",
    },
    warning: {
      border: "border-yellow-500/30",
      bg: "bg-yellow-500/5",
      icon: "text-yellow-400",
    },
    info: {
      border: "border-blue-500/30",
      bg: "bg-blue-500/5",
      icon: "text-blue-400",
    },
  };

  const style = styles[correlation.type];

  return (
    <div className={`rounded-xl border p-3.5 ${style.border} ${style.bg}`}>
      <div className="flex items-start gap-3">
        <span className={`material-symbols-rounded text-xl ${style.icon} mt-0.5`}>
          {correlation.icon}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] uppercase tracking-wider text-gray-500">
              {correlation.domains.join(" × ")}
            </span>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">
            {correlation.text}
          </p>
        </div>
      </div>
    </div>
  );
}
