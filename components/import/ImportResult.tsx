"use client";

interface ImportStats {
  workouts: number;
  weightLogs: number;
  bodyFatLogs?: number;
  sleepSessions?: number;
  glucoseReadings?: number;
  duplicatesSkipped: number;
  errors: string[];
}

interface ImportResultProps {
  status: "success" | "partial" | "error";
  stats: ImportStats;
  onDismiss: () => void;
}

/**
 * Componente ImportResult - Exibe resultado da importacao
 */
export function ImportResult({ status, stats, onDismiss }: ImportResultProps) {
  const config = {
    success: {
      icon: "check_circle",
      title: "Importacao concluida",
      badge: "bg-success/10 text-success border-success/20",
    },
    partial: {
      icon: "warning",
      title: "Importacao parcial",
      badge: "bg-warning/10 text-warning border-warning/20",
    },
    error: {
      icon: "error",
      title: "Erro na importacao",
      badge: "bg-error/10 text-error border-error/20",
    },
  }[status];

  const totalImported = stats.workouts + stats.weightLogs + (stats.bodyFatLogs || 0) + (stats.sleepSessions || 0) + (stats.glucoseReadings || 0);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${config.badge}`}>
            <span className="material-symbols-outlined text-[14px]">
              {config.icon}
            </span>
            {config.title}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-xs font-medium text-text-secondary transition-colors hover:text-white"
        >
          Fechar
        </button>
      </div>

      {totalImported > 0 && (
        <div className="mt-3 flex flex-col gap-2 text-sm text-text-secondary">
          {stats.workouts > 0 && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">
                fitness_center
              </span>
              <span>{stats.workouts} treinos importados</span>
            </div>
          )}
          {stats.weightLogs > 0 && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">
                monitor_weight
              </span>
              <span>{stats.weightLogs} registros de peso</span>
            </div>
          )}
          {(stats.bodyFatLogs || 0) > 0 && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">
                percent
              </span>
              <span>{stats.bodyFatLogs} registros de body fat</span>
            </div>
          )}
          {(stats.sleepSessions || 0) > 0 && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">
                bedtime
              </span>
              <span>{stats.sleepSessions} noites de sono</span>
            </div>
          )}
          {(stats.glucoseReadings || 0) > 0 && (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-warning">
                monitoring
              </span>
              <span>{stats.glucoseReadings} leituras de glicemia</span>
            </div>
          )}
        </div>
      )}

      {stats.duplicatesSkipped > 0 && (
        <p className="mt-3 text-xs text-text-secondary">
          {stats.duplicatesSkipped} duplicatas ignoradas
        </p>
      )}

      {stats.errors.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-bold text-white">Avisos:</p>
          <ul className="mt-1 list-inside list-disc text-xs text-text-secondary">
            {stats.errors.slice(0, 3).map((error, i) => (
              <li key={i}>{error}</li>
            ))}
            {stats.errors.length > 3 && (
              <li>...e mais {stats.errors.length - 3} avisos</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
