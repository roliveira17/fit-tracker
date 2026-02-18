"use client";

interface CalorieRingProps {
  consumed: number;
  target: number;
  label?: string;
}

export function CalorieRing({ consumed, target, label = "Calorias" }: CalorieRingProps) {
  const size = 100;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 38;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;

  const ratio = target > 0 ? consumed / target : 0;
  const clampedRatio = Math.min(ratio, 1.2);
  const filled = clampedRatio * circumference;

  // Color based on how close to target
  let color = "#22c55e"; // green — on target
  if (ratio > 1.15) color = "#ef4444"; // red — over 115%
  else if (ratio > 1.0) color = "#f97316"; // orange — slightly over
  else if (ratio < 0.7) color = "#eab308"; // yellow — too low

  const remaining = target - consumed;
  const displayText = remaining > 0
    ? `${Math.round(remaining)}`
    : `+${Math.abs(Math.round(remaining))}`;
  const subText = remaining > 0 ? "restam" : "acima";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          {/* Background */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-border-subtle"
            opacity={0.2}
          />
          {/* Filled */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-800">{displayText}</span>
          <span className="text-[10px] text-gray-500">{subText}</span>
        </div>
      </div>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </div>
  );
}
