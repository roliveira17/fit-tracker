"use client";

interface WeightDataPoint {
  date: string;
  weight: number | null;
}

interface WeightCardProps {
  weight: number;
  weightChange?: number;
  bodyFat?: number;
  bodyFatChange?: number;
  recentWeights?: WeightDataPoint[];
  timestamp?: string;
}

/**
 * Build an SVG path from real weight data points.
 * Returns { linePath, areaPath, lastPoint } or null if insufficient data.
 */
function buildChartPaths(
  points: WeightDataPoint[],
  currentWeight: number
): {
  linePath: string;
  areaPath: string;
  lastX: number;
  lastY: number;
} | null {
  // Collect valid weight values, appending current weight as last point
  const values: number[] = [];
  for (const p of points) {
    if (p.weight !== null) values.push(p.weight);
  }
  // Always include the current registration as the last point
  values.push(currentWeight);

  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // avoid division by zero
  const padding = 5; // SVG padding top/bottom

  // Map values to SVG coordinates (viewBox 0 0 100 50)
  const coords = values.map((v, i) => ({
    x: (i / (values.length - 1)) * 100,
    // Invert Y: higher weight = lower Y value in SVG
    y: padding + ((max - v) / range) * (50 - padding * 2),
  }));

  // Build smooth path using quadratic bezier curves
  let linePath = `M${coords[0].x},${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const cpx = (prev.x + curr.x) / 2;
    linePath += ` Q${cpx},${prev.y} ${curr.x},${curr.y}`;
  }

  const last = coords[coords.length - 1];
  const areaPath = `${linePath} V50 H0 Z`;

  return { linePath, areaPath, lastX: last.x, lastY: last.y };
}

export function WeightCard({
  weight,
  weightChange,
  bodyFat,
  bodyFatChange,
  recentWeights,
}: WeightCardProps) {
  const showWeight = weight > 0;
  const showBodyFat = bodyFat !== undefined && bodyFat > 0;

  // Dynamic title
  const title =
    showWeight && showBodyFat
      ? "Peso e Gordura"
      : showBodyFat
        ? "Gordura Corporal"
        : "Peso Registrado";

  // Build chart from real data
  const chart =
    recentWeights && recentWeights.length > 0
      ? buildChartPaths(recentWeights, weight)
      : null;

  return (
    <>
      {/* Header: title + checkmark */}
      <div className="flex justify-between items-start mb-2">
        <h2 className="font-serif-display text-[1.75rem] text-gray-800 leading-tight">
          {title}
        </h2>
        <div className="bg-[#F2F8F2] text-[#2E7D32] rounded-full p-1.5 flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">check</span>
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-[#816965] text-sm font-medium mb-6">
        Seus registros foram salvos com sucesso.
      </p>

      {/* Stats grid */}
      <div
        className={`grid gap-4 mb-8 ${showWeight && showBodyFat ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {/* Weight */}
        {showWeight && (
          <div className="flex flex-col">
            <p className="text-[#816965] text-sm font-medium mb-1">
              Peso atual
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-gray-800">
                {weight}
              </span>
              <span className="text-xl font-medium text-[#816965]">kg</span>
            </div>
            {weightChange !== undefined && weightChange !== 0 && (
              <div className="mt-2 flex">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                    weightChange <= 0
                      ? "bg-[#F2F8F2] text-[#2E7D32]"
                      : "bg-[#FFF3E0] text-[#E65100]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {weightChange <= 0 ? "trending_down" : "trending_up"}
                  </span>
                  <span className="text-xs font-bold">
                    {weightChange > 0 ? "+" : ""}
                    {weightChange} kg
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Body Fat */}
        {showBodyFat && (
          <div
            className={`flex flex-col ${showWeight ? "pl-4 border-l border-gray-100" : ""}`}
          >
            <p className="text-[#816965] text-sm font-medium mb-1">
              Gordura (BF)
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-gray-800">
                {bodyFat}
              </span>
              <span className="text-xl font-medium text-[#816965]">%</span>
            </div>
            {bodyFatChange !== undefined && bodyFatChange !== 0 && (
              <div className="mt-2 flex">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                    bodyFatChange <= 0
                      ? "bg-[#F2F8F2] text-[#2E7D32]"
                      : "bg-[#FFF3E0] text-[#E65100]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {bodyFatChange <= 0 ? "trending_down" : "trending_up"}
                  </span>
                  <span className="text-xs font-bold">
                    {bodyFatChange > 0 ? "+" : ""}
                    {bodyFatChange}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sparkline chart — Últimos 7 dias (real data) */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#816965]">
            Últimos 7 dias
          </span>
          <span className="text-xs font-medium text-[#816965] bg-gray-50 px-2 py-0.5 rounded-md">
            {getDateRange()}
          </span>
        </div>
        <div className="h-24 w-full relative">
          {chart ? (
            <svg
              className="absolute inset-0 w-full h-full overflow-visible"
              viewBox="0 0 100 50"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="weightChartGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#d46211" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#d46211" stopOpacity={0} />
                </linearGradient>
              </defs>
              <path d={chart.areaPath} fill="url(#weightChartGradient)" />
              <path
                d={chart.linePath}
                fill="none"
                stroke="#d46211"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={chart.lastX}
                cy={chart.lastY}
                r="3"
                fill="#d46211"
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
          ) : (
            <div className="flex items-center justify-center h-full text-[#816965]/50 text-sm">
              Primeiro registro — dados insuficientes para gráfico
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function getDateRange(): string {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const format = (d: Date) => `${d.getDate()} ${months[d.getMonth()]}`;

  return `${format(weekAgo)} - ${format(now)}`;
}
