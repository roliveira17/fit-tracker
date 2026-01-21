"use client";

// ========================================
// INSIGHT TEXT - Card de insight textual
// ========================================
// Exibe observações e insights baseados nos dados do usuário
// Usa Material Symbols para ícones

interface InsightTextProps {
  type: "info" | "positive" | "warning" | "neutral";
  title: string;
  description: string;
}

export function InsightText({ type, title, description }: InsightTextProps) {
  // Configuração de estilo por tipo
  const config = {
    info: {
      icon: "info",
      bg: "bg-blue-500/10 border-blue-500/20",
      iconColor: "text-blue-500",
    },
    positive: {
      icon: "check_circle",
      bg: "bg-green-500/10 border-green-500/20",
      iconColor: "text-green-500",
    },
    warning: {
      icon: "warning",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      iconColor: "text-yellow-500",
    },
    neutral: {
      icon: "lightbulb",
      bg: "bg-surface-dark/50 border-border-subtle",
      iconColor: "text-text-secondary",
    },
  };

  const { icon, bg, iconColor } = config[type];

  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex gap-3">
        <span
          className={`material-symbols-outlined text-[20px] flex-shrink-0 ${iconColor}`}
        >
          {icon}
        </span>
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-xs text-text-secondary mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}
