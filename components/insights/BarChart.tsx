"use client";

// ========================================
// BAR CHART - Gráfico de barras SVG
// ========================================
// Usado para visualizar calorias e proteína por dia

interface DataPoint {
  date: string;
  value: number;
}

interface BarChartProps {
  data: DataPoint[];
  label: string;
  unit: string;
  target?: number; // Meta opcional (ex: BMR para calorias)
  color?: "primary" | "green" | "blue" | "orange" | "red";
  invertColors?: boolean; // true = abaixo da meta é bom (ex: calorias)
}

// Formata data para exibição curta (ex: "17", "18")
function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.getDate().toString();
}

export function BarChart({
  data,
  label,
  unit,
  target,
  color = "primary",
  invertColors = false,
}: BarChartProps) {
  // Se não há dados
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
        <h3 className="text-sm font-medium text-text-secondary mb-4">
          {label}
        </h3>
        <p className="text-sm text-text-secondary text-center py-8">
          Sem dados para exibir
        </p>
      </div>
    );
  }

  // Calcula estatísticas
  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, target || 0);
  const avgValue = values.reduce((a, b) => a + b, 0) / values.length;

  // Conta dias dentro/fora da meta
  const daysOnTarget = target
    ? data.filter((d) =>
        invertColors ? d.value <= target : d.value >= target
      ).length
    : 0;

  // Dimensões
  const chartHeight = 100;
  const barWidth = 100 / data.length - 2; // Espaço entre barras

  // Cores
  const colorClasses = {
    primary: { bar: "fill-primary", text: "text-primary" },
    green: { bar: "fill-green-500", text: "text-green-500" },
    blue: { bar: "fill-blue-500", text: "text-blue-500" },
    orange: { bar: "fill-primary", text: "text-primary" },
    red: { bar: "fill-red-500", text: "text-red-500" },
  };

  const getBarColor = (value: number) => {
    if (!target) return colorClasses[color].bar;

    const isOnTarget = invertColors ? value <= target : value >= target;
    if (isOnTarget) {
      return invertColors ? "fill-green-500" : colorClasses[color].bar;
    }
    return invertColors ? "fill-red-500" : "fill-text-secondary/50";
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-text-secondary">{label}</h3>

        {/* Meta info */}
        {target && (
          <span className="text-xs text-text-secondary">
            {daysOnTarget}/{data.length} dias{" "}
            {invertColors ? "dentro" : "atingiram"} meta
          </span>
        )}
      </div>

      {/* Estatísticas */}
      <div className="flex items-baseline gap-4 mb-4">
        <div>
          <span className="text-2xl font-bold text-white">
            {Math.round(avgValue)}
          </span>
          <span className="text-sm text-text-secondary ml-1">
            {unit}/dia
          </span>
        </div>
        {target && (
          <div className="text-sm text-text-secondary">
            Meta: {target}
            {unit}
          </div>
        )}
      </div>

      {/* Gráfico SVG */}
      <div className="relative h-28">
        <svg viewBox={`0 0 100 ${chartHeight}`} className="w-full h-full">
          {/* Linha de meta */}
          {target && (
            <line
              x1="0"
              y1={chartHeight - (target / maxValue) * (chartHeight - 10)}
              x2="100"
              y2={chartHeight - (target / maxValue) * (chartHeight - 10)}
              stroke="currentColor"
              strokeWidth={1}
              strokeDasharray="4 2"
              className="text-text-secondary"
            />
          )}

          {/* Barras */}
          {data.map((d, i) => {
            const barHeight = (d.value / maxValue) * (chartHeight - 10);
            const x = (i / data.length) * 100 + 1;
            const y = chartHeight - barHeight;

            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={2}
                className={getBarColor(d.value)}
              />
            );
          })}
        </svg>
      </div>

      {/* Labels dos dias */}
      <div className="flex justify-between mt-2">
        {data.map((d, i) => (
          <span key={i} className="text-xs text-text-secondary">
            {formatShortDate(d.date)}
          </span>
        ))}
      </div>
    </div>
  );
}
