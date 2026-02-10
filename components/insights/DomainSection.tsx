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
      <div className="rounded-xl border border-border-subtle bg-surface-card p-4 opacity-60">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-rounded text-xl"
            style={{ color: domain.color }}
          >
            {domain.icon}
          </span>
          <span className="text-sm font-medium text-white">{domain.label}</span>
          <span className="text-xs text-text-secondary ml-auto">Sem dados</span>
        </div>
        <p className="text-xs text-text-secondary mt-2">
          Importe dados do Apple Health ou registre pelo Chat.
        </p>
      </div>
    );
  }

  const scorePct = domain.maxScore > 0 ? Math.round((domain.score / domain.maxScore) * 100) : 0;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card overflow-hidden">
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
        <span className="text-sm font-medium text-white flex-1">{domain.label}</span>

        {/* Score badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-white">{domain.score}</span>
            <span className="text-xs text-text-secondary">/{domain.maxScore}</span>
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
          <span className={`material-symbols-rounded text-lg text-text-secondary transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
            expand_more
          </span>
        </div>
      </button>

      {/* Content — collapsible */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border-subtle/50 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}
