"use client";

// ========================================
// CHARTS - Componentes de gráficos
// ========================================
// Coleção de componentes visuais para dados

// ========================================
// RING CHART - Gráfico circular
// ========================================
// Gráfico de anel para mostrar porcentagem
// Usado em SummaryCard e outros lugares

interface RingChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export function RingChart({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = "#eb6028",
  trackColor = "rgba(255,255,255,0.1)",
  children,
}: RingChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Center content */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

// ========================================
// PROGRESS BAR - Barra de progresso
// ========================================
// Barra horizontal para mostrar progresso

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "success" | "warning" | "error";
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  size = "md",
  color = "primary",
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const colorClasses = {
    primary: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  return (
    <div className="w-full">
      {/* Header */}
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm text-text-secondary">{label}</span>
          )}
          {showValue && (
            <span className="text-sm font-semibold text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Bar */}
      <div
        className={`w-full bg-white/10 rounded-full overflow-hidden ${sizeClasses[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ========================================
// LINE CHART PLACEHOLDER
// ========================================
// Placeholder para gráfico de linha
// Em produção, usar Recharts, Chart.js ou similar

interface LineChartProps {
  data?: number[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  label?: string;
}

export function LineChart({
  data = [30, 45, 35, 50, 40, 60, 55],
  height = 120,
  color = "#eb6028",
  showGrid = true,
  label,
}: LineChartProps) {
  // Normaliza os dados para o SVG
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const width = 100;
  const padding = 10;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Gera os pontos do path
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  // Path para área preenchida
  const areaD = `${pathD} L ${padding + chartWidth},${padding + chartHeight} L ${padding},${padding + chartHeight} Z`;

  return (
    <div className="w-full">
      {label && (
        <span className="text-sm text-text-secondary mb-2 block">{label}</span>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {showGrid && (
          <g className="text-white/5">
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1={padding}
                y1={padding + (i * chartHeight) / 4}
                x2={padding + chartWidth}
                y2={padding + (i * chartHeight) / 4}
                stroke="currentColor"
                strokeWidth="0.5"
              />
            ))}
          </g>
        )}

        {/* Area fill */}
        <path d={areaD} fill={color} fillOpacity="0.1" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {data.map((value, index) => {
          const x = padding + (index / (data.length - 1)) * chartWidth;
          const y =
            padding + chartHeight - ((value - minValue) / range) * chartHeight;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill={color}
              className="opacity-0 hover:opacity-100 transition-opacity"
            />
          );
        })}
      </svg>
    </div>
  );
}

// ========================================
// BAR CHART PLACEHOLDER
// ========================================
// Placeholder para gráfico de barras
// Em produção, usar Recharts, Chart.js ou similar

interface BarChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data?: BarChartData[];
  height?: number;
  color?: string;
  showLabels?: boolean;
  showValues?: boolean;
}

export function BarChart({
  data = [
    { label: "Seg", value: 65 },
    { label: "Ter", value: 80 },
    { label: "Qua", value: 45 },
    { label: "Qui", value: 90 },
    { label: "Sex", value: 70 },
    { label: "Sáb", value: 55 },
    { label: "Dom", value: 40 },
  ],
  height = 120,
  color = "#eb6028",
  showLabels = true,
  showValues = false,
}: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="w-full">
      <div
        className="flex items-end justify-between gap-2"
        style={{ height }}
      >
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-1"
            >
              {/* Value */}
              {showValues && (
                <span className="text-[10px] text-text-secondary">
                  {item.value}
                </span>
              )}

              {/* Bar */}
              <div
                className="w-full rounded-t-sm transition-all duration-300 hover:opacity-80"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: color,
                  minHeight: "4px",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex justify-between gap-2 mt-2">
          {data.map((item, index) => (
            <span
              key={index}
              className="flex-1 text-center text-[10px] text-text-secondary truncate"
            >
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
