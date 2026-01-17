"use client";

import { Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface WeightDataPoint {
  date: string;
  weight: number | null;
}

interface MiniChartProps {
  data: WeightDataPoint[];
  latestBodyFat?: number | null;
}

/**
 * Formata data para exibição curta (ex: "Seg", "Ter")
 */
function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3);
}

/**
 * Componente MiniChart - Gráfico de peso dos últimos 7 dias
 * Gráfico simples de linhas, sem bibliotecas externas
 */
export function MiniChart({ data, latestBodyFat }: MiniChartProps) {
  // Filtra apenas pontos com dados
  const validPoints = data.filter((d) => d.weight !== null);

  // Se não há dados suficientes, mostra mensagem
  if (validPoints.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-muted-foreground">
            Peso & BF
          </h2>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          Registre seu peso no Chat para ver o gráfico
        </p>
      </div>
    );
  }

  // Calcula min/max para escala
  const weights = validPoints.map((d) => d.weight as number);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const range = maxWeight - minWeight || 1; // Evita divisão por zero

  // Calcula variação
  const firstWeight = validPoints[0].weight as number;
  const lastWeight = validPoints[validPoints.length - 1].weight as number;
  const variation = lastWeight - firstWeight;
  const variationPercent = ((variation / firstWeight) * 100).toFixed(1);

  // Altura do gráfico
  const chartHeight = 80;
  const chartWidth = 100; // percentual

  // Gera pontos do SVG
  const points = data
    .map((d, i) => {
      if (d.weight === null) return null;
      const x = (i / (data.length - 1)) * chartWidth;
      const y = chartHeight - ((d.weight - minWeight) / range) * (chartHeight - 20);
      return { x, y, weight: d.weight, date: d.date };
    })
    .filter(Boolean) as Array<{ x: number; y: number; weight: number; date: string }>;

  // Cria path para a linha
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Cria path para área preenchida
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-muted-foreground">
            Peso & BF
          </h2>
        </div>

        {/* Variação */}
        <div className="flex items-center gap-1">
          {variation < 0 ? (
            <TrendingDown className="h-4 w-4 text-green-500" />
          ) : variation > 0 ? (
            <TrendingUp className="h-4 w-4 text-red-500" />
          ) : (
            <Minus className="h-4 w-4 text-muted-foreground" />
          )}
          <span
            className={`text-sm font-medium ${
              variation < 0
                ? "text-green-500"
                : variation > 0
                ? "text-red-500"
                : "text-muted-foreground"
            }`}
          >
            {variation > 0 ? "+" : ""}
            {variation.toFixed(1)}kg ({variationPercent}%)
          </span>
        </div>
      </div>

      {/* Valores atuais */}
      <div className="flex items-baseline gap-4 mb-4">
        <div>
          <span className="text-3xl font-bold text-foreground">
            {lastWeight.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground ml-1">kg</span>
        </div>
        {latestBodyFat && (
          <div>
            <span className="text-lg font-semibold text-foreground">
              {latestBodyFat.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground ml-1">% BF</span>
          </div>
        )}
      </div>

      {/* Gráfico SVG */}
      <div className="relative h-20">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Área preenchida */}
          <path
            d={areaPath}
            fill="url(#gradient)"
            opacity={0.3}
          />

          {/* Linha */}
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="text-primary"
          />

          {/* Pontos */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3}
              className="fill-primary"
            />
          ))}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="currentColor" className="text-primary" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Labels dos dias */}
      <div className="flex justify-between mt-2">
        {data.map((d, i) => (
          <span
            key={i}
            className={`text-xs ${
              d.weight !== null ? "text-muted-foreground" : "text-muted-foreground/50"
            }`}
          >
            {formatShortDate(d.date)}
          </span>
        ))}
      </div>
    </div>
  );
}
