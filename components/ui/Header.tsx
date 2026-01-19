"use client";

import { useRouter } from "next/navigation";

// ========================================
// HEADER - Componente de cabeçalho
// ========================================
// 3 variantes:
// 1. DateNav - Navegação de data (Home)
// 2. Simple - Botão voltar + título
// 3. WithAction - Botão voltar + título + ação à direita

interface HeaderProps {
  variant: "date-nav" | "simple" | "with-action";
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  action?: React.ReactNode;
}

export function Header({
  variant,
  title,
  subtitle,
  onBack,
  onPrevious,
  onNext,
  action,
}: HeaderProps) {
  const router = useRouter();

  // Função padrão para voltar
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Botão circular padrão (usado em todas as variantes)
  const IconButton = ({
    onClick,
    children,
    className = "",
  }: {
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      className={`flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors ${className}`}
    >
      {children}
    </button>
  );

  // ========================================
  // VARIANTE 1: DateNav (navegação de data)
  // ========================================
  if (variant === "date-nav") {
    return (
      <header className="sticky top-0 z-20 flex items-center justify-between p-4 bg-background-dark/80 backdrop-blur-md">
        <IconButton onClick={onPrevious}>
          <span className="material-symbols-outlined text-white">
            chevron_left
          </span>
        </IconButton>

        <div className="flex flex-col items-center">
          <h2 className="text-lg font-bold leading-tight tracking-tight text-white">
            {title || "Hoje"}
          </h2>
          {subtitle && (
            <span className="text-xs font-medium text-text-secondary">
              {subtitle}
            </span>
          )}
        </div>

        <IconButton onClick={onNext}>
          <span className="material-symbols-outlined text-white">
            chevron_right
          </span>
        </IconButton>
      </header>
    );
  }

  // ========================================
  // VARIANTE 2: Simple (voltar + título)
  // ========================================
  if (variant === "simple") {
    return (
      <header className="sticky top-0 z-20 flex items-center px-4 h-16 bg-background-dark/95 backdrop-blur-md border-b border-white/5">
        <IconButton onClick={handleBack}>
          <span className="material-symbols-outlined text-[24px] text-white">
            arrow_back_ios_new
          </span>
        </IconButton>

        <h1 className="text-lg font-bold tracking-tight flex-1 text-center pr-10 text-white">
          {title}
        </h1>
      </header>
    );
  }

  // ========================================
  // VARIANTE 3: WithAction (voltar + título + ação)
  // ========================================
  if (variant === "with-action") {
    return (
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-background-dark/95 backdrop-blur-md border-b border-white/10">
        <IconButton onClick={handleBack}>
          <span className="material-symbols-outlined text-[24px] text-white">
            arrow_back_ios_new
          </span>
        </IconButton>

        <h1 className="text-lg font-bold tracking-tight text-white">{title}</h1>

        {action || <div className="w-10" />}
      </header>
    );
  }

  return null;
}

// ========================================
// COMPONENTES AUXILIARES EXPORTADOS
// ========================================

// Botão de ação para o header (usado na variante with-action)
export function HeaderActionButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-10 items-center gap-2 rounded-full bg-primary/20 px-4 text-primary hover:bg-primary/30 transition-colors"
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}
