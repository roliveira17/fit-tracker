"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

/**
 * Tipos de toast disponíveis
 */
export type ToastType = "success" | "error" | "info";

/**
 * Props do componente Toast
 */
interface ToastProps {
  /** Mensagem a ser exibida */
  message: string;
  /** Tipo do toast (afeta cor e ícone) */
  type?: ToastType;
  /** Duração em ms antes de fechar automaticamente (0 = não fecha) */
  duration?: number;
  /** Callback quando o toast é fechado */
  onClose: () => void;
  /** Se o toast está visível */
  isVisible: boolean;
}

/**
 * Configurações visuais por tipo de toast
 */
const TOAST_CONFIG: Record<ToastType, { icon: typeof CheckCircle; className: string }> = {
  success: {
    icon: CheckCircle,
    className: "bg-green-900/90 border-green-700 text-green-100",
  },
  error: {
    icon: AlertCircle,
    className: "bg-red-900/90 border-red-700 text-red-100",
  },
  info: {
    icon: Info,
    className: "bg-blue-900/90 border-blue-700 text-blue-100",
  },
};

/**
 * Toast - Feedback temporário
 *
 * Exibe uma mensagem temporária no canto da tela.
 * Usado para confirmar ações como registro de refeições, peso, etc.
 *
 * @example
 * <Toast
 *   message="Refeição registrada!"
 *   type="success"
 *   isVisible={showToast}
 *   onClose={() => setShowToast(false)}
 * />
 */
export function Toast({
  message,
  type = "success",
  duration = 3000,
  onClose,
  isVisible,
}: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Controla animação de entrada/saída
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  // Auto-fecha após duração
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible && !isAnimating) return null;

  const config = TOAST_CONFIG[type];
  const Icon = config.icon;

  return (
    <div
      className={`
        fixed bottom-20 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-2 px-4 py-3 rounded-lg border
        shadow-lg backdrop-blur-sm
        transition-all duration-300 ease-out
        ${config.className}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
      onTransitionEnd={() => {
        if (!isVisible) setIsAnimating(false);
      }}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-0.5 rounded hover:bg-white/10 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
