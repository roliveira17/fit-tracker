"use client";

import { CheckCircle, AlertTriangle, XCircle, Dumbbell, Scale, Flame } from "lucide-react";

interface ImportStats {
  workouts: number;
  weightLogs: number;
  duplicatesSkipped: number;
  errors: string[];
}

interface ImportResultProps {
  status: "success" | "partial" | "error";
  stats: ImportStats;
  onDismiss: () => void;
}

/**
 * Componente ImportResult - Exibe resultado da importação
 */
export function ImportResult({ status, stats, onDismiss }: ImportResultProps) {
  const statusConfig = {
    success: {
      icon: CheckCircle,
      title: "Importação concluída",
      bg: "bg-green-500/10 border-green-500/20",
      iconColor: "text-green-500",
    },
    partial: {
      icon: AlertTriangle,
      title: "Importação parcial",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      iconColor: "text-yellow-500",
    },
    error: {
      icon: XCircle,
      title: "Erro na importação",
      bg: "bg-red-500/10 border-red-500/20",
      iconColor: "text-red-500",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const totalImported = stats.workouts + stats.weightLogs;

  return (
    <div className={`rounded-xl border p-4 ${config.bg}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Icon className={`h-6 w-6 ${config.iconColor}`} />
        <h3 className="text-lg font-semibold text-foreground">{config.title}</h3>
      </div>

      {/* Stats */}
      {totalImported > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {stats.workouts > 0 && (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              <span>{stats.workouts} treinos importados</span>
            </div>
          )}
          {stats.weightLogs > 0 && (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Scale className="h-4 w-4 text-muted-foreground" />
              <span>{stats.weightLogs} registros de peso</span>
            </div>
          )}
        </div>
      )}

      {/* Avisos */}
      {stats.duplicatesSkipped > 0 && (
        <p className="text-sm text-muted-foreground mb-2">
          {stats.duplicatesSkipped} duplicatas ignoradas
        </p>
      )}

      {/* Erros */}
      {stats.errors.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-foreground mb-1">Avisos:</p>
          <ul className="text-sm text-muted-foreground list-disc list-inside">
            {stats.errors.slice(0, 3).map((error, i) => (
              <li key={i}>{error}</li>
            ))}
            {stats.errors.length > 3 && (
              <li>...e mais {stats.errors.length - 3} avisos</li>
            )}
          </ul>
        </div>
      )}

      {/* Botão */}
      <button
        onClick={onDismiss}
        className="w-full rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80"
      >
        Fechar
      </button>
    </div>
  );
}
