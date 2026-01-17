"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BottomNav } from "./BottomNav";

interface ScreenContainerProps {
  children: React.ReactNode;
  className?: string;
  hideNav?: boolean;
}

/**
 * ScreenContainer - Wrapper padrão para todas as telas do app
 *
 * Garante:
 * - Altura mínima de tela cheia
 * - Padding consistente nas laterais
 * - Fundo com cor do tema (dark-first)
 * - Conteúdo centralizado com largura máxima
 * - Navegação inferior (exceto onboarding)
 */
export function ScreenContainer({ children, className, hideNav }: ScreenContainerProps) {
  const pathname = usePathname();

  // Esconde nav no onboarding
  const showNav = !hideNav && !pathname?.startsWith("/onboarding");

  return (
    <div
      className={cn(
        "min-h-screen w-full bg-background text-foreground",
        "flex flex-col",
        className
      )}
    >
      <div className={cn(
        "mx-auto w-full max-w-md flex-1 px-6 py-4",
        showNav && "pb-24" // Espaço para a nav inferior
      )}>
        {children}
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}
