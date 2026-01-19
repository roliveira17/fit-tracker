"use client";

// ========================================
// TOGGLE ITEM - Switch com label
// ========================================
// Item de configuração com toggle on/off
// Inclui título e descrição opcional

interface ToggleItemProps {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ToggleItem({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleItemProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white">{title}</span>
        {description && (
          <span className="text-xs text-gray-400">{description}</span>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={`
            w-11 h-6 rounded-full
            bg-gray-700
            peer-checked:bg-primary
            peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
            after:content-[''] after:absolute after:top-[2px] after:start-[2px]
            after:bg-white after:border-gray-300 after:border after:rounded-full
            after:h-5 after:w-5 after:transition-all
            peer-checked:after:translate-x-full peer-checked:after:border-white
          `}
        />
      </label>
    </div>
  );
}
