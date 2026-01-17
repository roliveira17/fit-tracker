"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

/**
 * Header - Cabeçalho padrão para as telas do app
 *
 * Props:
 * - title: Texto do título (opcional)
 * - showBackButton: Mostra botão de voltar (default: false)
 * - onBack: Função chamada ao clicar em voltar
 * - rightAction: Elemento React para ação do lado direito (opcional)
 */
export function Header({
  title,
  showBackButton = false,
  onBack,
  rightAction,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "flex h-14 items-center justify-between",
        className
      )}
    >
      {/* Lado esquerdo: Botão voltar ou espaço vazio */}
      <div className="w-10">
        {showBackButton && (
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Centro: Título */}
      {title && (
        <h1 className="text-lg font-semibold text-foreground">
          {title}
        </h1>
      )}

      {/* Lado direito: Ação customizada ou espaço vazio */}
      <div className="w-10 flex justify-end">
        {rightAction}
      </div>
    </header>
  );
}
