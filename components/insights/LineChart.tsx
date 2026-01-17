"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface DataPoint {
  date: string;
  value: number | null;
}

interface LineChartProps {
  data: DataPoint[];
  label: string;
  unit: string;
  color?: string;
  showTrend?: boolean;
}

/**
 * Formata data para exibição curta (ex: "17", "18")
 */
function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.getDate().toString();
}

/**
 * Componente LineChart - Gráfico de linha SVG
 * Usado para visualizar peso ao longo do tempo
 */
export function LineChart({
  data,
  label,
  unit,
  color = "primary",
  showTrend = true,
}: LineChartProps) {
  // Filtra apenas pontos com dados
  const validPoints = data.filter((d) => d.value !== null);

  // Se não há dados suficientes
  if (validPoints.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          {label}
        </h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          Sem dados para exibir
        </p>
      </div>
    );
  }

  // Calcula min/max para escala
  const values = validPoints.map((d) => d.value as number);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  const padding = range * 0.1; // 10% de padding

  // Calcula variação
  const firstValue = validPoints[0].value as number;
  const lastValue = validPoints[validPoints.length - 1].value as number;
  const variation = lastValue - firstValue;
  const variationPercent = ((variation / firstValue) * 100).toFixed(1);

  // Dimensões do gráfico
  const chartHeight = 120;
  const chartWidth = 100;

  // Gera pontos do SVG
  const points = data
    .map((d, i) => {
      if (d.value === null) return null;
      const x = data.length > 1 ? (i / (data.length - 1)) * chartWidth : 50;
      const y =
        chartHeight -
        20 -
        ((d.value - (minValue - padding)) / (range + 2 * padding)) *
          (chartHeight - 40);
      return { x, y, value: d.value, date: d.date };
    })
    .filter(Boolean) as Array<{
    x: number;
    y: number;
    value: number;
    date: string;
  }>;

  // Cria path para a linha
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Cria path para área preenchida
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - 10} L ${points[0].x} ${chartHeight - 10} Z`;

  // Cor do gráfico
  const colorClass = {
    primary: "text-primary",
    green: "text-green-500",
    blue: "text-blue-500",
    orange: "text-orange-500",
  }[color] || "text-primary";

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>

        {/* Variação */}
        {showTrend && validPoints.length >= 2 && (
          <div className="flex items-center gap-1">
            {variation < 0 ? (
              <TrendingDown className="h-4 w-4 text-green-500" />
            ) : variation > 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span
              className={`text-xs font-medium ${
                variation < 0
                  ? "text-green-500"
                  : variation > 0
                    ? "text-red-500"
                    : "text-muted-foreground"
              }`}
            >
              {variation > 0 ? "+" : ""}
              {variation.toFixed(1)}
              {unit} ({variationPercent}%)
            </span>
          </div>
        )}
      </div>

      {/* Valor atual */}
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-2xl font-bold text-foreground">
          {lastValue.toFixed(1)}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>

      {/* Gráfico SVG */}
      <div className="relative h-32">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <line
            x1="0"
            y1={chartHeight / 3}
            x2={chartWidth}
            y2={chartHeight / 3}
            stroke="currentColor"
            strokeOpacity={0.1}
            className="text-border"
          />
          <line
            x1="0"
            y1={(chartHeight * 2) / 3}
            x2={chartWidth}
            y2={(chartHeight * 2) / 3}
            stroke="currentColor"
            strokeOpacity={0.1}
            className="text-border"
          />

          {/* Área preenchida */}
          <path d={areaPath} fill="currentColor" opacity={0.1} className={colorClass} />

          {/* Linha */}
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className={colorClass}
          />

          {/* Pontos */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3}
              fill="currentColor"
              className={colorClass}
            />
          ))}
        </svg>
      </div>

      {/* Labels dos dias */}
      <div className="flex justify-between mt-2">
        {data.map((d, i) => (
          <span
            key={i}
            className={`text-xs ${
              d.value !== null
                ? "text-muted-foreground"
                : "text-muted-foreground/30"
            }`}
          >
            {formatShortDate(d.date)}
          </span>
        ))}
      </div>
    </div>
  );
}
