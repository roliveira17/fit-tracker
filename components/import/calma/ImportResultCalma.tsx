"use client";

import type { ImportStats } from "@/hooks/useImportLogic";

interface ImportResultCalmaProps {
  status: "success" | "partial" | "error";
  stats: ImportStats;
  onDismiss: () => void;
}

const STATUS_CONFIG = {
  success: {
    icon: "check_circle",
    label: "Importado",
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  partial: {
    icon: "warning",
    label: "Parcial",
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  error: {
    icon: "error",
    label: "Erro",
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
};

export function ImportResultCalma({
  status,
  stats,
  onDismiss,
}: ImportResultCalmaProps) {
  const config = STATUS_CONFIG[status];

  const items = [
    { label: "Treinos", value: stats.workouts, icon: "fitness_center" },
    { label: "Peso", value: stats.weightLogs, icon: "monitor_weight" },
    { label: "Body Fat", value: stats.bodyFatLogs, icon: "percent" },
    { label: "Sono", value: stats.sleepSessions, icon: "bedtime" },
    { label: "Glicemia", value: stats.glucoseReadings, icon: "monitoring" },
  ].filter((item) => item.value > 0);

  return (
    <div
      className={`rounded-xl border p-4 ${config.bgColor} ${config.borderColor}`}
    >
      {/* Status header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`material-symbols-outlined text-xl ${config.iconColor}`}
          >
            {config.icon}
          </span>
          <span className={`text-sm font-semibold ${config.iconColor}`}>
            {config.label}
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="text-calma-text-muted hover:text-calma-text transition-colors"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* Stats grid */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-1.5 text-calma-text-secondary"
            >
              <span className="material-symbols-outlined text-sm">
                {item.icon}
              </span>
              <span className="text-xs">
                {item.value} {item.label.toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Storage destination */}
      {stats.savedTo && status !== "error" && (
        <p className={`text-xs mt-1 ${stats.savedTo === "supabase" ? "text-green-600" : "text-amber-600"}`}>
          {stats.savedTo === "supabase"
            ? "Dados salvos na nuvem"
            : "Dados salvos localmente (faça login para sincronizar)"}
        </p>
      )}

      {/* Duplicates warning */}
      {stats.duplicatesSkipped > 0 && (
        <p className="text-xs text-amber-600 mt-1">
          {stats.duplicatesSkipped} duplicata(s) ignorada(s)
        </p>
      )}

      {/* Errors */}
      {stats.errors.length > 0 && (
        <div className="mt-2 space-y-1">
          {stats.errors.slice(0, 3).map((err, i) => (
            <p key={i} className="text-xs text-red-600">
              {err}
            </p>
          ))}
          {stats.errors.length > 3 && (
            <p className="text-xs text-calma-text-muted">
              +{stats.errors.length - 3} erro(s)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
