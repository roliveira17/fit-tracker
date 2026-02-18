"use client";

interface FrequencyDotsProps {
  /** Array de 7 booleans (seg-dom), true = treinou */
  days: boolean[];
  labels?: string[];
}

const DEFAULT_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];

export function FrequencyDots({ days, labels = DEFAULT_LABELS }: FrequencyDotsProps) {
  return (
    <div className="flex items-center justify-between gap-1">
      {days.map((active, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              active
                ? "bg-blue-500/20 border-2 border-blue-500"
                : "border-2 border-gray-100"
            }`}
          >
            {active && (
              <span className="material-symbols-rounded text-blue-400 text-sm">
                check
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-500">
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
}
