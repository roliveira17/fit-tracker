"use client";

interface WeightDataPoint {
  date: string;
  weight: number | null;
}

interface MiniChartProps {
  data: WeightDataPoint[];
  latestBodyFat?: number | null;
}

/**
 * Formata data para exibicao curta (ex: "Seg", "Ter")
 */
function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3);
}

/**
 * Componente MiniChart - Grafico de peso dos ultimos 7 dias
 */
export function MiniChart({ data, latestBodyFat }: MiniChartProps) {
  const validPoints = data.filter((d) => d.weight !== null);

  if (validPoints.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-gray-500">
            monitor_weight
          </span>
          <h2 className="text-sm font-medium text-gray-500">
            Peso & BF
          </h2>
        </div>
        <p className="py-4 text-center text-sm text-gray-500">
          Registre seu peso no Chat para ver o grafico
        </p>
      </div>
    );
  }

  const weights = validPoints.map((d) => d.weight as number);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const range = maxWeight - minWeight || 1;

  const firstWeight = validPoints[0].weight as number;
  const lastWeight = validPoints[validPoints.length - 1].weight as number;
  const variation = lastWeight - firstWeight;
  const variationPercent = ((variation / firstWeight) * 100).toFixed(1);

  const chartHeight = 80;
  const chartWidth = 100;

  const points = data
    .map((d, i) => {
      if (d.weight === null) return null;
      const x = (i / (data.length - 1)) * chartWidth;
      const y =
        chartHeight - ((d.weight - minWeight) / range) * (chartHeight - 20);
      return { x, y, weight: d.weight, date: d.date };
    })
    .filter(Boolean) as Array<{ x: number; y: number; weight: number; date: string }>;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-gray-500">
            monitor_weight
          </span>
          <h2 className="text-sm font-medium text-gray-500">
            Peso & BF
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <span
            className={`material-symbols-outlined text-[18px] ${
              variation < 0
                ? "text-success"
                : variation > 0
                ? "text-error"
                : "text-gray-500"
            }`}
          >
            {variation < 0
              ? "trending_down"
              : variation > 0
              ? "trending_up"
              : "remove"}
          </span>
          <span
            className={`text-sm font-medium ${
              variation < 0
                ? "text-success"
                : variation > 0
                ? "text-error"
                : "text-gray-500"
            }`}
          >
            {variation > 0 ? "+" : ""}
            {variation.toFixed(1)}kg ({variationPercent}%)
          </span>
        </div>
      </div>

      <div className="mb-4 flex items-baseline gap-4">
        <div>
          <span className="text-3xl font-bold text-gray-800">
            {lastWeight.toFixed(1)}
          </span>
          <span className="ml-1 text-sm text-gray-500">kg</span>
        </div>
        {latestBodyFat && (
          <div>
            <span className="text-lg font-semibold text-gray-800">
              {latestBodyFat.toFixed(1)}
            </span>
            <span className="ml-1 text-sm text-gray-500">% BF</span>
          </div>
        )}
      </div>

      <div className="relative h-20">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4F633A" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4F633A" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#chartGradient)" />
          <path
            d={linePath}
            fill="none"
            stroke="#4F633A"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3} fill="#4F633A" />
          ))}
        </svg>
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-gray-500">
        {data.map((d, i) => (
          <span key={i} className={d.weight !== null ? "" : "opacity-50"}>
            {formatShortDate(d.date)}
          </span>
        ))}
      </div>
    </div>
  );
}
