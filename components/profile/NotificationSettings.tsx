"use client";

import { useState, useEffect } from "react";
import {
  type NotificationConfig,
  type ReminderType,
  getNotificationConfig,
  saveNotificationConfig,
  requestNotificationPermission,
  getNotificationPermission,
  sendTestNotification,
  isNotificationSupported,
  startReminderLoop,
  stopReminderLoop,
  DAYS_OF_WEEK,
} from "@/lib/notifications";

// ============================================
// TIPOS
// ============================================

interface NotificationSettingsProps {
  onPermissionChange?: (granted: boolean) => void;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function NotificationSettings({ onPermissionChange }: NotificationSettingsProps) {
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isRequesting, setIsRequesting] = useState(false);
  const [testSent, setTestSent] = useState(false);

  // Carrega config inicial
  useEffect(() => {
    setConfig(getNotificationConfig());
    setPermission(getNotificationPermission());
  }, []);

  // Gerencia o loop de lembretes quando config muda
  useEffect(() => {
    if (config?.enabled && permission === "granted") {
      startReminderLoop();
    } else {
      stopReminderLoop();
    }

    return () => {
      // Cleanup não para o loop pois queremos que continue rodando
    };
  }, [config?.enabled, permission]);

  // Handlers
  const handleToggleMain = async () => {
    if (!config) return;

    // Se está ativando, precisa pedir permissão
    if (!config.enabled) {
      setIsRequesting(true);
      const granted = await requestNotificationPermission();
      setIsRequesting(false);
      setPermission(getNotificationPermission());

      if (!granted) {
        onPermissionChange?.(false);
        return;
      }

      onPermissionChange?.(true);
    }

    const updated = { ...config, enabled: !config.enabled };
    setConfig(updated);
    saveNotificationConfig(updated);
  };

  const handleToggleReminder = (type: ReminderType) => {
    if (!config) return;

    const updated = {
      ...config,
      [type]: { ...config[type], enabled: !config[type].enabled },
    };
    setConfig(updated);
    saveNotificationConfig(updated);
  };

  const handleTimeChange = (type: ReminderType, time: string) => {
    if (!config) return;

    const updated = {
      ...config,
      [type]: { ...config[type], time },
    };
    setConfig(updated);
    saveNotificationConfig(updated);
  };

  const handleDayChange = (day: number) => {
    if (!config) return;

    const updated = {
      ...config,
      weight: { ...config.weight, day },
    };
    setConfig(updated);
    saveNotificationConfig(updated);
  };

  const handleTestNotification = () => {
    sendTestNotification();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  // Loading state
  if (!config) {
    return (
      <section className="rounded-xl border border-border-subtle bg-surface-card p-4">
        <div className="animate-pulse h-32 bg-surface-dark rounded-lg" />
      </section>
    );
  }

  // Não suportado
  if (!isNotificationSupported()) {
    return (
      <section className="rounded-xl border border-border-subtle bg-surface-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-[18px] text-text-secondary">
            notifications_off
          </span>
          <h2 className="text-sm font-medium text-text-secondary">
            Lembretes
          </h2>
        </div>
        <p className="text-sm text-text-secondary">
          Seu navegador não suporta notificações.
        </p>
      </section>
    );
  }

  // Permissão negada
  if (permission === "denied") {
    return (
      <section className="rounded-xl border border-border-subtle bg-surface-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-[18px] text-error">
            notifications_off
          </span>
          <h2 className="text-sm font-medium text-text-secondary">
            Lembretes
          </h2>
        </div>
        <p className="text-sm text-text-secondary">
          Você bloqueou as notificações. Para ativar, altere as permissões do site nas configurações do navegador.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border-subtle bg-surface-card p-4">
      {/* Header com toggle principal */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-text-secondary">
            notifications
          </span>
          <h2 className="text-sm font-medium text-text-secondary">
            Lembretes
          </h2>
        </div>

        <button
          onClick={handleToggleMain}
          disabled={isRequesting}
          className={`
            relative w-12 h-6 rounded-full transition-colors
            ${config.enabled ? "bg-primary" : "bg-surface-dark"}
            ${isRequesting ? "opacity-50" : ""}
          `}
        >
          <span
            className={`
              absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
              ${config.enabled ? "left-7" : "left-1"}
            `}
          />
        </button>
      </div>

      {/* Descrição */}
      <p className="text-xs text-text-secondary mb-4">
        Receba lembretes para registrar suas refeições e acompanhar seu peso.
        {!config.enabled && " Ative para configurar os horários."}
      </p>

      {/* Configurações de lembretes (só mostra se ativo) */}
      {config.enabled && (
        <div className="space-y-4">
          {/* Café da manhã */}
          <ReminderRow
            icon="sunny"
            label="Café da manhã"
            enabled={config.breakfast.enabled}
            time={config.breakfast.time}
            onToggle={() => handleToggleReminder("breakfast")}
            onTimeChange={(time) => handleTimeChange("breakfast", time)}
          />

          {/* Almoço */}
          <ReminderRow
            icon="restaurant"
            label="Almoço"
            enabled={config.lunch.enabled}
            time={config.lunch.time}
            onToggle={() => handleToggleReminder("lunch")}
            onTimeChange={(time) => handleTimeChange("lunch", time)}
          />

          {/* Jantar */}
          <ReminderRow
            icon="nightlight"
            label="Jantar"
            enabled={config.dinner.enabled}
            time={config.dinner.time}
            onToggle={() => handleToggleReminder("dinner")}
            onTimeChange={(time) => handleTimeChange("dinner", time)}
          />

          {/* Divisor */}
          <div className="border-t border-border-subtle" />

          {/* Peso */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-text-secondary">
                monitor_weight
              </span>
              <div>
                <p className="text-sm text-white">Pesagem semanal</p>
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={config.weight.day}
                    onChange={(e) => handleDayChange(Number(e.target.value))}
                    disabled={!config.weight.enabled}
                    className="bg-surface-dark text-xs text-text-secondary rounded px-2 py-1 border border-border-subtle disabled:opacity-50"
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={config.weight.time}
                    onChange={(e) => handleTimeChange("weight", e.target.value)}
                    disabled={!config.weight.enabled}
                    className="bg-surface-dark text-xs text-text-secondary rounded px-2 py-1 border border-border-subtle disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => handleToggleReminder("weight")}
              className={`
                relative w-10 h-5 rounded-full transition-colors
                ${config.weight.enabled ? "bg-primary" : "bg-surface-dark"}
              `}
            >
              <span
                className={`
                  absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform
                  ${config.weight.enabled ? "left-5" : "left-0.5"}
                `}
              />
            </button>
          </div>

          {/* Botão de teste */}
          <div className="pt-2">
            <button
              onClick={handleTestNotification}
              disabled={testSent}
              className="text-xs text-primary hover:text-primary-hover disabled:text-text-secondary"
            >
              {testSent ? "✓ Notificação enviada!" : "Enviar notificação de teste"}
            </button>
          </div>

          {/* Aviso */}
          <p className="text-xs text-text-secondary/70 mt-2">
            Os lembretes funcionam enquanto o app estiver aberto no navegador.
          </p>
        </div>
      )}
    </section>
  );
}

// ============================================
// COMPONENTE DE LINHA DE LEMBRETE
// ============================================

interface ReminderRowProps {
  icon: string;
  label: string;
  enabled: boolean;
  time: string;
  onToggle: () => void;
  onTimeChange: (time: string) => void;
}

function ReminderRow({
  icon,
  label,
  enabled,
  time,
  onToggle,
  onTimeChange,
}: ReminderRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[20px] text-text-secondary">
          {icon}
        </span>
        <div>
          <p className="text-sm text-white">{label}</p>
          <input
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            disabled={!enabled}
            className="bg-surface-dark text-xs text-text-secondary rounded px-2 py-1 mt-1 border border-border-subtle disabled:opacity-50"
          />
        </div>
      </div>

      <button
        onClick={onToggle}
        className={`
          relative w-10 h-5 rounded-full transition-colors
          ${enabled ? "bg-primary" : "bg-surface-dark"}
        `}
      >
        <span
          className={`
            absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform
            ${enabled ? "left-5" : "left-0.5"}
          `}
        />
      </button>
    </div>
  );
}
