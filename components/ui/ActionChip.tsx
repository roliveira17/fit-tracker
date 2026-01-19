"use client";

// ========================================
// ACTION CHIP - Chip de ação rápida
// ========================================
// Botões de sugestão usados no chat
// Podem ter ícone + texto

interface ActionChipProps {
  icon?: string;
  label: string;
  onClick?: () => void;
}

export function ActionChip({ icon, label, onClick }: ActionChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex shrink-0 items-center justify-center gap-2
        rounded-full bg-surface-dark border border-white/5
        py-2 px-4
        active:scale-95 transition-transform
      `}
    >
      {icon && (
        <span className="material-symbols-outlined text-primary text-[18px]">
          {icon}
        </span>
      )}
      <span className="text-sm font-medium text-text-floral">{label}</span>
    </button>
  );
}

// ========================================
// ACTION CHIPS CONTAINER
// ========================================
// Container com scroll horizontal para os chips

interface ActionChipsProps {
  children: React.ReactNode;
}

export function ActionChips({ children }: ActionChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
      {children}
    </div>
  );
}
