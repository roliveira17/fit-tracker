"use client";

import { useEffect } from "react";
import {
  getNotificationConfig,
  getNotificationPermission,
  startReminderLoop,
} from "@/lib/notifications";

/**
 * Provider que inicializa o sistema de notificações.
 * Coloque este componente no layout para garantir que
 * os lembretes funcionem em todas as páginas.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Verifica se deve iniciar o loop de lembretes
    const config = getNotificationConfig();
    const permission = getNotificationPermission();

    if (config.enabled && permission === "granted") {
      startReminderLoop();
    }
  }, []);

  return <>{children}</>;
}
