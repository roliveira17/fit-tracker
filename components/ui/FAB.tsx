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
  theme?: "dark" | "light";
}

export function FAB({
  label = "Fit AI",
  icon = "auto_awesome",
  onClick,
  theme = "dark",
}: FABProps) {
  const isLight = theme === "light";

  return (
    <div className="fixed bottom-24 right-4 z-50">
      <button
        onClick={onClick}
        className={`group flex items-center justify-center gap-2 rounded-full px-5 py-4 shadow-xl transition-all hover:scale-105 active:scale-95 ${
          isLight
            ? "bg-calma-primary text-white shadow-calma-primary/20"
            : "bg-white text-background-dark shadow-primary/20"
        }`}
      >
        <span className={`material-symbols-outlined group-hover:animate-pulse ${
          isLight ? "text-white" : "text-primary"
        }`}>
          {icon}
        </span>
        <span className="font-bold text-sm">{label}</span>
      </button>
    </div>
  );
}
