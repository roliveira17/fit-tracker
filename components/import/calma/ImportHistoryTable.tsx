"use client";

import { useState } from "react";
import type { ImportRecord } from "@/lib/storage";

interface ImportHistoryTableProps {
  records: ImportRecord[];
}

const SOURCE_META: Record<
  string,
  { icon: string; iconColor: string; label: string; dataLabel: string }
> = {
  apple_health: {
    icon: "favorite",
    iconColor: "text-red-400",
    label: "Health",
    dataLabel: "Steps, Sleep",
  },
  hevy: {
    icon: "fitness_center",
    iconColor: "text-blue-400",
    label: "Hevy",
    dataLabel: "Upper Body",
  },
  cgm: {
    icon: "monitoring",
    iconColor: "text-amber-400",
    label: "CGM",
    dataLabel: "Glicemia",
  },
};

const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  success: {
    label: "Success",
    className: "text-calma-primary bg-calma-accent-20 font-medium",
  },
  partial: {
    label: "Partial",
    className: "text-orange-600 bg-orange-100 font-medium",
  },
  error: {
    label: "Error",
    className: "text-red-600 bg-red-100 font-medium",
  },
};

export function ImportHistoryTable({ records }: ImportHistoryTableProps) {
  const [showAll, setShowAll] = useState(false);

  if (records.length === 0) return null;

  const visibleRecords = showAll ? records : records.slice(0, 3);

  return (
    <section>
      <h2 className="text-lg font-semibold text-calma-text mb-4">
        Import History
      </h2>
      <div className="rounded-2xl bg-calma-surface border border-calma-border overflow-hidden shadow-sm">
        {/* Table header */}
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-calma-border">
              <th className="px-5 py-4 text-xs font-semibold text-calma-text-muted uppercase tracking-wider">
                Source
              </th>
              <th className="px-5 py-4 text-xs font-semibold text-calma-text-muted uppercase tracking-wider">
                Data
              </th>
              <th className="px-5 py-4 text-xs font-semibold text-calma-text-muted uppercase tracking-wider text-right">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-calma-border/50">
            {visibleRecords.map((record) => {
              const source =
                SOURCE_META[record.source] || SOURCE_META.apple_health;
              const badge = STATUS_BADGE[record.status] || STATUS_BADGE.success;

              return (
                <tr key={record.id}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`material-symbols-outlined text-lg ${source.iconColor}`}
                      >
                        {source.icon}
                      </span>
                      <span className="text-sm font-medium text-calma-text">
                        {source.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-calma-text-muted">
                    {record.itemsImported > 0
                      ? `${record.itemsImported} itens`
                      : source.dataLabel}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer */}
        {records.length > 3 && (
          <div className="px-5 py-4 bg-gray-50 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-medium text-calma-text-muted hover:text-calma-primary transition-colors"
            >
              {showAll ? "Mostrar menos" : "Ver log completo"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
