"use client";

import { useState } from "react";
import type { DomainScore } from "@/lib/insights-score";

interface DomainSectionProps {
  domain: DomainScore;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function DomainSection({ domain, children, defaultExpanded = true }: DomainSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!domain.hasData) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 opacity-60">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-rounded text-xl"
            style={{ color: domain.color }}
          >
            {domain.icon}
          </span>
          <span className="text-sm font-medium text-gray-800">{domain.label}</span>
          <span className="text-xs text-gray-500 ml-auto">Sem dados</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Importe dados do Apple Health ou registre pelo Chat.
        </p>
      </div>
    );
  }

  const scorePct = domain.maxScore > 0 ? Math.round((domain.score / domain.maxScore) * 100) : 0;

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      {/* Header — always visible, toggles expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <span
          className="material-symbols-rounded text-xl"
          style={{ color: domain.color }}
        >
          {domain.icon}
        </span>
        <span className="text-sm font-medium text-gray-800 flex-1">{domain.label}</span>

        {/* Score badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-gray-800">{domain.score}</span>
            <span className="text-xs text-gray-500">/{domain.maxScore}</span>
          </div>
          {/* Mini progress bar */}
          <div className="w-12 h-1.5 rounded-full bg-border-subtle/30 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${scorePct}%`,
                backgroundColor: domain.color,
              }}
            />
          </div>
          <span className={`material-symbols-rounded text-lg text-gray-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
            expand_more
          </span>
        </div>
      </button>

      {/* Content — collapsible */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100/50 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}
