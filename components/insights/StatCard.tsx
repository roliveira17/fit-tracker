"use client";

import { TrendingDown, TrendingUp, Minus, type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  unit: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  subtitle?: string;
  color?: "default" | "green" | "red" | "orange" | "blue";
}

/**
 * Componente StatCard - Card de estatística simples
 * Usado para exibir valores únicos como BF%, média de proteína, etc.
 */
export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
  subtitle,
  color = "default",
}: StatCardProps) {
  const colorClasses = {
    default: "text-foreground",
    green: "text-green-500",
    red: "text-red-500",
    orange: "text-orange-500",
    blue: "text-blue-500",
  };

  const trendColorClasses = {
    up: "text-red-500",
    down: "text-green-500",
    stable: "text-muted-foreground",
  };

  const TrendIcon =
    trend === "up"
      ? TrendingUp
      : trend === "down"
        ? TrendingDown
        : Minus;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      </div>

      {/* Valor principal */}
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold ${colorClasses[color]}`}>
          {typeof value === "number" ? value.toFixed(1) : value}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>

      {/* Trend ou subtitle */}
      {trend && trendValue && (
        <div className="flex items-center gap-1 mt-2">
          <TrendIcon className={`h-3 w-3 ${trendColorClasses[trend]}`} />
          <span className={`text-xs ${trendColorClasses[trend]}`}>
            {trendValue}
          </span>
        </div>
      )}

      {subtitle && !trend && (
        <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
      )}
    </div>
  );
}
