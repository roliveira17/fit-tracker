"use client";

// ========================================
// SEGMENTED CONTROL - Seletor de período
// ========================================
// Usado para alternar entre períodos (7/14/30 dias)
// Estilo pill com item ativo destacado

interface SegmentOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({
  options,
  value,
  onChange,
}: SegmentedControlProps) {
  return (
    <div className="flex h-10 w-full items-center rounded-lg bg-icon-bg/50 p-1">
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              flex h-full flex-1 items-center justify-center rounded-md
              text-sm font-medium transition-all
              ${
                isActive
                  ? "bg-[#4A3B32] text-primary shadow-sm font-bold"
                  : "text-text-secondary hover:text-white"
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
