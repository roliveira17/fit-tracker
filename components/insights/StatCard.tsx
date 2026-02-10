"use client";

// ========================================
// STAT CARD - Card de estatística simples
// ========================================
// Usado para exibir valores únicos como peso, BF%, média de proteína, etc.
// Usa Material Symbols para ícones

interface StatCardProps {
  label: string;
  value: number | string;
  unit: string;
  icon?: string; // Nome do ícone Material Symbols (ex: "scale", "fitness_center")
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  subtitle?: string;
  color?: "default" | "green" | "red" | "orange" | "blue";
}

export function StatCard({
  label,
  value,
  unit,
  icon,
  trend,
  trendValue,
  subtitle,
  color = "default",
}: StatCardProps) {
  // Cores do valor principal
  const colorClasses = {
    default: "text-gray-800",
    green: "text-green-500",
    red: "text-red-500",
    orange: "text-primary",
    blue: "text-blue-500",
  };

  // Cores do indicador de tendência
  const trendColorClasses = {
    up: "text-red-500",
    down: "text-green-500",
    stable: "text-gray-500",
  };

  // Ícone de tendência (Material Symbols)
  const trendIcon =
    trend === "up"
      ? "trending_up"
      : trend === "down"
        ? "trending_down"
        : "remove";

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      {/* Header com ícone e label */}
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <span className="material-symbols-outlined text-[18px] text-gray-500">
            {icon}
          </span>
        )}
        <h3 className="text-sm font-medium text-gray-500">{label}</h3>
      </div>

      {/* Valor principal */}
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold ${colorClasses[color]}`}>
          {typeof value === "number" ? value.toFixed(1) : value}
        </span>
        <span className="text-sm text-gray-500">{unit}</span>
      </div>

      {/* Indicador de tendência */}
      {trend && trendValue && (
        <div className="flex items-center gap-1 mt-2">
          <span
            className={`material-symbols-outlined text-[14px] ${trendColorClasses[trend]}`}
          >
            {trendIcon}
          </span>
          <span className={`text-xs ${trendColorClasses[trend]}`}>
            {trendValue}
          </span>
        </div>
      )}

      {/* Subtítulo alternativo */}
      {subtitle && !trend && (
        <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
}
