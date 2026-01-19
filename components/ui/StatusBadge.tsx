"use client";

// ========================================
// STATUS BADGE - Badge de status
// ========================================
// Badge para indicar status de operações
// Variantes: success, error, processing

type BadgeStatus = "success" | "error" | "processing";

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const statusConfig: Record<
    BadgeStatus,
    { label: string; colorClass: string; dotClass: string; animate?: boolean }
  > = {
    success: {
      label: "Sucesso",
      colorClass: "bg-green-500/10 text-green-400 border-green-500/20",
      dotClass: "bg-green-500",
    },
    error: {
      label: "Erro",
      colorClass: "bg-red-500/10 text-red-400 border-red-500/20",
      dotClass: "bg-red-500",
    },
    processing: {
      label: "Processando",
      colorClass: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      dotClass: "bg-yellow-500",
      animate: true,
    },
  };

  const config = statusConfig[status];
  const displayLabel = label || config.label;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
        text-[11px] font-bold uppercase tracking-wider
        border ${config.colorClass}
      `}
    >
      <span
        className={`size-1.5 rounded-full ${config.dotClass} ${
          config.animate ? "animate-pulse" : ""
        }`}
      />
      {displayLabel}
    </span>
  );
}
