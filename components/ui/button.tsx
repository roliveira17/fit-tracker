// ========================================
// COMPATIBILIDADE - Componente Button legado
// ========================================
// Este arquivo mantém compatibilidade com imports antigos
// que usam @/components/ui/button (minúsculo)
//
// TODO: Migrar todos os componentes para usar o novo
// design system e remover este arquivo

"use client";

import { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

// Variantes do botão usando class-variance-authority
// Mantém compatibilidade com o estilo shadcn/ui antigo
const buttonVariants = cva(
  // Classes base
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow hover:bg-primary/90",
        destructive:
          "bg-error text-white shadow-sm hover:bg-error/90",
        outline:
          "border border-border-subtle bg-transparent shadow-sm hover:bg-surface-dark hover:text-white",
        secondary:
          "bg-surface-dark text-white shadow-sm hover:bg-surface-dark/80",
        ghost: "hover:bg-white/10 hover:text-white",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

function Button({ className = "", variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={`${buttonVariants({ variant, size })} ${className}`}
      {...props}
    />
  );
}

export { Button, buttonVariants };
