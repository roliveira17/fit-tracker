"use client";

import React, { useEffect, useState } from "react";
import {
  getNotificationConfig,
  getNotificationPermission,
  startReminderLoop,
  stopReminderLoop,
  isReminderLoopActive,
} from "@/lib/notifications";

/**
 * Hook para gerenciar o loop de notificações globalmente.
 * Deve ser usado no layout principal do app para garantir
 * que os lembretes funcionem em qualquer página.
 */
export function useNotifications() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Verifica se deve iniciar o loop
    const config = getNotificationConfig();
    const permission = getNotificationPermission();

    if (config.enabled && permission === "granted") {
      startReminderLoop();
      setIsActive(true);
    }

    // Atualiza estado se já estiver rodando
    setIsActive(isReminderLoopActive());

    // Cleanup ao desmontar
    return () => {
      // Não para o loop aqui pois queremos que continue rodando
      // mesmo ao navegar entre páginas
    };
  }, []);

  return { isActive };
}

/**
 * Componente wrapper que inicializa as notificações.
 * Use no layout para garantir que rode em todas as páginas.
 */
export function NotificationInitializer({ children }: { children: React.ReactNode }) {
  useNotifications();
  return <>{children}</>;
}
