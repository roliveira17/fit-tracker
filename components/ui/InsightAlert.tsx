"use client";

// ========================================
// INSIGHT ALERT - Alerta com borda lateral
// ========================================
// Alerta para insights na tela de Insights
// Variantes: warning, success, info

type AlertVariant = "warning" | "success" | "info";

interface InsightAlertProps {
  variant?: AlertVariant;
  icon?: string;
  title: string;
  description: string;
  onClick?: () => void;
}

export function InsightAlert({
  variant = "warning",
  icon,
  title,
  description,
  onClick,
}: InsightAlertProps) {
  const variantStyles: Record<
    AlertVariant,
    { iconBg: string; iconColor: string; border: string; defaultIcon: string }
  > = {
    warning: {
      iconBg: "bg-primary/20",
      iconColor: "text-primary",
      border: "bg-orange-500",
      defaultIcon: "warning",
    },
    success: {
      iconBg: "bg-green-500/20",
      iconColor: "text-green-500",
      border: "bg-green-500",
      defaultIcon: "check_circle",
    },
    info: {
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-500",
      border: "bg-blue-500",
      defaultIcon: "info",
    },
  };

  const styles = variantStyles[variant];
  const displayIcon = icon || styles.defaultIcon;

  return (
    <div
      onClick={onClick}
      className={`
        group relative overflow-hidden rounded-xl bg-icon-bg/60 p-4
        transition-all active:scale-[0.98]
        ${onClick ? "cursor-pointer" : ""}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${styles.iconBg} ${styles.iconColor}`}
        >
          <span className="material-symbols-outlined">{displayIcon}</span>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
            {description}
          </p>
        </div>

        {/* Arrow */}
        {onClick && (
          <span className="material-symbols-outlined text-[20px] text-text-secondary">
            chevron_right
          </span>
        )}
      </div>

      {/* Accent Line */}
      <div className={`absolute left-0 top-0 h-full w-1 ${styles.border}`} />
    </div>
  );
}
