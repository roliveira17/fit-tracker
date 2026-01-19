"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Representa um chip individual
 */
export interface Chip {
  /** Texto exibido no chip */
  label: string;
  /** Ícone opcional (componente React) */
  icon?: ReactNode;
  /** Valor retornado ao clicar (se diferente do label) */
  value?: string;
}

/**
 * Props do componente ChipGroup
 */
interface ChipGroupProps {
  /** Lista de chips a exibir */
  chips: Chip[];
  /** Callback quando um chip é clicado */
  onChipClick: (value: string) => void;
  /** Classes CSS adicionais */
  className?: string;
}

/**
 * ChipGroup - Grupo de sugestões rápidas clicáveis
 *
 * Exibe uma lista de "chips" (botõezinhos) que o usuário pode clicar
 * para executar ações rápidas, como preencher o input do chat.
 *
 * Estilo inspirado no NotebookLM do Google.
 *
 * @example
 * <ChipGroup
 *   chips={[
 *     { label: "Registrar refeição" },
 *     { label: "Como está meu déficit?" },
 *   ]}
 *   onChipClick={(value) => setMessage(value)}
 * />
 */
export function ChipGroup({ chips, onChipClick, className = "" }: ChipGroupProps) {
  if (chips.length === 0) return null;

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-1 hide-scrollbar", className)}>
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onChipClick(chip.value ?? chip.label)}
          className="
            inline-flex shrink-0 items-center gap-2
            rounded-full border border-white/5
            bg-surface-dark px-4 py-2
            text-sm font-medium text-text-floral
            transition-transform
            active:scale-95
          "
        >
          {chip.icon && <span className="h-4 w-4">{chip.icon}</span>}
          {chip.label}
        </button>
      ))}
    </div>
  );
}
