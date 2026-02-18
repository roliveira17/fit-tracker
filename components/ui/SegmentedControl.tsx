"use client";

// ========================================
// SEGMENTED CONTROL - Seletor de período
// ========================================
// Usado para alternar entre períodos (7/14/30 dias)
// Estilo pill com item ativo destacado — tema light

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
    <div className="flex h-10 w-full items-center rounded-lg bg-gray-200/60 p-1">
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
                  ? "bg-white text-calma-primary shadow-sm font-bold"
                  : "text-gray-500 hover:text-gray-800"
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
