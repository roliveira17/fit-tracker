"use client";

interface ProgressCardProps {
  streak: number;
  lastActiveDate: string | null;
}

/**
 * Componente ProgressCard - Mostra streak de dias consecutivos
 */
export function ProgressCard({ streak, lastActiveDate }: ProgressCardProps) {
  if (streak === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-icon-bg text-primary">
            <span className="material-symbols-outlined fill-1">local_fire_department</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Comece sua sequencia</p>
            <p className="text-xs text-text-secondary">
              Registre algo hoje para iniciar
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = lastActiveDate
    ? new Date(lastActiveDate).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    : null;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[20px] fill-1 text-primary">
              local_fire_department
            </span>
            <span className="text-sm font-bold text-primary">
              {streak} dias seguidos
            </span>
          </div>
        </div>
        {formattedDate && (
          <div className="text-xs text-text-secondary">
            Ultimo registro: {formattedDate}
          </div>
        )}
      </div>
    </div>
  );
}
