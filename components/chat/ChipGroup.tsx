"use client";

import { type ReactNode } from "react";

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
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onChipClick(chip.value ?? chip.label)}
          className="
            inline-flex items-center gap-1.5
            rounded-full border border-border
            bg-background px-3 py-1.5
            text-xs text-muted-foreground
            transition-colors duration-150
            hover:bg-accent hover:text-accent-foreground
            hover:border-accent
            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
            active:scale-95
          "
        >
          {chip.icon && <span className="h-3.5 w-3.5">{chip.icon}</span>}
          {chip.label}
        </button>
      ))}
    </div>
  );
}
