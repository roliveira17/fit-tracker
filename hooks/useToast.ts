"use client";

import { useState, useCallback } from "react";
import { type ToastType } from "@/components/feedback/Toast";

/**
 * Estado do toast
 */
interface ToastState {
  isVisible: boolean;
  message: string;
  type: ToastType;
}

/**
 * Hook para gerenciar toasts
 *
 * Fornece funções para mostrar e esconder toasts de forma simples.
 *
 * @example
 * const { toast, showToast, hideToast } = useToast();
 *
 * // Mostrar toast de sucesso
 * showToast("Refeição registrada!", "success");
 *
 * // No JSX
 * <Toast {...toast} onClose={hideToast} />
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: "",
    type: "success",
  });

  /**
   * Mostra um toast
   */
  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToast({
      isVisible: true,
      message,
      type,
    });
  }, []);

  /**
   * Esconde o toast atual
   */
  const hideToast = useCallback(() => {
    setToast((prev) => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
}
