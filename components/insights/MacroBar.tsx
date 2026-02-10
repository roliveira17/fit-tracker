"use client";

interface MacroBarProps {
  protein: number;
  carbs: number;
  fat: number;
}

export function MacroBar({ protein, carbs, fat }: MacroBarProps) {
  const totalCal = protein * 4 + carbs * 4 + fat * 9;
  if (totalCal === 0) return null;

  const protPct = (protein * 4) / totalCal * 100;
  const carbPct = (carbs * 4) / totalCal * 100;
  const fatPct = (fat * 9) / totalCal * 100;

  const segments = [
    { label: "P", value: Math.round(protein), pct: protPct, color: "#60a5fa" },
    { label: "C", value: Math.round(carbs), pct: carbPct, color: "#eab308" },
    { label: "G", value: Math.round(fat), pct: fatPct, color: "#ef4444" },
  ];

  return (
    <div className="space-y-2">
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-border-subtle/30">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="transition-all duration-500"
            style={{
              width: `${seg.pct}%`,
              backgroundColor: seg.color,
              minWidth: seg.pct > 0 ? "4px" : "0",
            }}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="flex justify-between">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-xs text-gray-500">
              {seg.label} {seg.value}g
            </span>
            <span className="text-xs text-gray-500 opacity-60">
              {Math.round(seg.pct)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
