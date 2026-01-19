"use client";

// ========================================
// STREAK BADGE - Badge de sequência
// ========================================
// Badge para mostrar dias consecutivos de atividade
// Exibe ícone de fogo + texto

interface StreakBadgeProps {
  days: number;
  label?: string;
}

export function StreakBadge({ days, label }: StreakBadgeProps) {
  // Texto padrão baseado no número de dias
  const defaultLabel =
    days === 1 ? "1 dia seguido" : `${days} dias seguidos`;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 backdrop-blur-sm">
      <span className="material-symbols-outlined text-primary text-[20px] fill-1">
        local_fire_department
      </span>
      <span className="text-primary text-sm font-bold">
        {label || defaultLabel}
      </span>
    </div>
  );
}
