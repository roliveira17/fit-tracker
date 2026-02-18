"use client";

interface SparklineProps {
  data: (number | null)[];
  color?: string;
  height?: number;
  showArea?: boolean;
}

export function Sparkline({
  data,
  color = "#eb6028",
  height = 32,
  showArea = true,
}: SparklineProps) {
  const validData = data.map((v, i) => (v !== null ? { x: i, y: v } : null)).filter(Boolean) as { x: number; y: number }[];

  if (validData.length < 2) {
    return <div style={{ height }} className="w-full" />;
  }

  const width = 200;
  const padding = 2;
  const yMin = Math.min(...validData.map((d) => d.y));
  const yMax = Math.max(...validData.map((d) => d.y));
  const yRange = yMax - yMin || 1;

  const xScale = (i: number) => padding + (i / (data.length - 1)) * (width - padding * 2);
  const yScale = (v: number) => padding + (1 - (v - yMin) / yRange) * (height - padding * 2);

  const points = validData.map((d) => `${xScale(d.x)},${yScale(d.y)}`);
  const linePath = `M${points.join("L")}`;

  const areaPath = `${linePath}L${xScale(validData[validData.length - 1].x)},${height}L${xScale(validData[0].x)},${height}Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      {showArea && (
        <path d={areaPath} fill={color} opacity={0.15} />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
