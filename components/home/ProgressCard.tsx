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
      <div className="rounded-2xl bg-white p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-calma-primary/10 text-calma-primary">
            <span className="material-symbols-outlined fill-1">local_fire_department</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Comece sua sequencia</p>
            <p className="text-xs text-gray-500">
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
    <div className="rounded-2xl bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-calma-primary/20 bg-calma-primary/10 px-4 py-1.5 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[20px] fill-1 text-calma-primary">
              local_fire_department
            </span>
            <span className="text-sm font-bold text-calma-primary">
              {streak} dias seguidos
            </span>
          </div>
        </div>
        {formattedDate && (
          <div className="text-xs text-gray-500">
            Ultimo registro: {formattedDate}
          </div>
        )}
      </div>
    </div>
  );
}
