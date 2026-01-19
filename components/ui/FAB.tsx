"use client";

// ========================================
// FAB - Floating Action Button
// ========================================
// Botão flutuante usado na tela Home para
// acessar o chat com a IA

interface FABProps {
  label?: string;
  icon?: string;
  onClick?: () => void;
}

export function FAB({
  label = "Fit AI",
  icon = "auto_awesome",
  onClick,
}: FABProps) {
  return (
    <div className="fixed bottom-24 right-4 z-50">
      <button
        onClick={onClick}
        className="group flex items-center justify-center gap-2 rounded-full bg-white px-5 py-4 text-background-dark shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
      >
        <span className="material-symbols-outlined text-primary group-hover:animate-pulse">
          {icon}
        </span>
        <span className="font-bold text-sm">{label}</span>
      </button>
    </div>
  );
}
