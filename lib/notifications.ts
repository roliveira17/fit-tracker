/**
 * Sistema de Notificações/Lembretes
 *
 * Implementa lembretes usando a Notification API do navegador.
 * Para MVP, usa verificação periódica quando o app está aberto.
 */

// ============================================
// TIPOS
// ============================================

export type ReminderType = "breakfast" | "lunch" | "dinner" | "weight";

export interface ReminderConfig {
  enabled: boolean;
  time: string; // "HH:MM"
  day?: number; // 0-6 (dom-sab) - apenas para peso
}

export interface NotificationConfig {
  enabled: boolean;
  breakfast: ReminderConfig;
  lunch: ReminderConfig;
  dinner: ReminderConfig;
  weight: ReminderConfig;
  lastChecked?: string; // ISO date do último check
}

export interface ReminderMessage {
  title: string;
  body: string;
  icon: string;
  tag: string;
}

// ============================================
// CONSTANTES
// ============================================

const STORAGE_KEY = "fittrack_notifications";
const CHECK_INTERVAL = 60 * 1000; // 1 minuto

const DEFAULT_CONFIG: NotificationConfig = {
  enabled: false,
  breakfast: { enabled: true, time: "08:00" },
  lunch: { enabled: true, time: "12:30" },
  dinner: { enabled: true, time: "19:30" },
  weight: { enabled: true, time: "07:00", day: 1 }, // Segunda-feira
};

const REMINDER_MESSAGES: Record<ReminderType, ReminderMessage> = {
  breakfast: {
    title: "Bom dia! ☀️",
    body: "O que você comeu no café da manhã?",
    icon: "/icons/icon-192.png",
    tag: "breakfast-reminder",
  },
  lunch: {
    title: "Hora do almoço! 🍽️",
    body: "Registre sua refeição para acompanhar suas calorias",
    icon: "/icons/icon-192.png",
    tag: "lunch-reminder",
  },
  dinner: {
    title: "Boa noite! 🌙",
    body: "Como foi o jantar? Registre para fechar o dia",
    icon: "/icons/icon-192.png",
    tag: "dinner-reminder",
  },
  weight: {
    title: "Nova semana! ⚖️",
    body: "Que tal pesar hoje para acompanhar seu progresso?",
    icon: "/icons/icon-192.png",
    tag: "weight-reminder",
  },
};

// ============================================
// STORAGE
// ============================================

/**
 * Obtém a configuração de notificações do localStorage
 */
export function getNotificationConfig(): NotificationConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Erro ao ler config de notificações:", error);
  }

  return DEFAULT_CONFIG;
}

/**
 * Salva a configuração de notificações no localStorage
 */
export function saveNotificationConfig(config: NotificationConfig): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Erro ao salvar config de notificações:", error);
  }
}

/**
 * Atualiza parcialmente a configuração
 */
export function updateNotificationConfig(
  updates: Partial<NotificationConfig>
): NotificationConfig {
  const current = getNotificationConfig();
  const updated = { ...current, ...updates };
  saveNotificationConfig(updated);
  return updated;
}

// ============================================
// PERMISSÕES
// ============================================

/**
 * Verifica se o navegador suporta notificações
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Verifica o status atual da permissão
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Solicita permissão para enviar notificações
 * @returns true se permitido, false se negado/bloqueado
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    console.warn("Notificações não suportadas neste navegador");
    return false;
  }

  // Se já tem permissão, retorna true
  if (Notification.permission === "granted") {
    return true;
  }

  // Se já foi negado, não pode pedir de novo
  if (Notification.permission === "denied") {
    console.warn("Permissão de notificações foi negada pelo usuário");
    return false;
  }

  // Solicita permissão
  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Erro ao solicitar permissão:", error);
    return false;
  }
}

// ============================================
// ENVIO DE NOTIFICAÇÕES
// ============================================

/**
 * Envia uma notificação imediatamente
 */
export function sendNotification(
  type: ReminderType,
  options?: Partial<ReminderMessage>
): Notification | null {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== "granted") return null;

  const message = { ...REMINDER_MESSAGES[type], ...options };

  try {
    const notification = new Notification(message.title, {
      body: message.body,
      icon: message.icon,
      tag: message.tag,
      requireInteraction: false,
    });

    // Ao clicar, abre/foca o app no chat
    notification.onclick = () => {
      window.focus();
      window.location.href = "/chat";
      notification.close();
    };

    // Auto-fecha após 10 segundos
    setTimeout(() => notification.close(), 10000);

    return notification;
  } catch (error) {
    console.error("Erro ao enviar notificação:", error);
    return null;
  }
}

/**
 * Envia notificação de teste
 */
export function sendTestNotification(): Notification | null {
  return sendNotification("breakfast", {
    title: "Teste de Notificação",
    body: "As notificações estão funcionando corretamente!",
    tag: "test-notification",
  });
}

// ============================================
// VERIFICAÇÃO DE HORÁRIOS
// ============================================

/**
 * Converte string "HH:MM" para minutos desde meia-noite
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Obtém os minutos atuais desde meia-noite
 */
function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Verifica se um lembrete deve ser disparado
 */
function shouldTriggerReminder(
  type: ReminderType,
  config: ReminderConfig,
  lastCheckedMinutes: number,
  currentMinutes: number
): boolean {
  if (!config.enabled) return false;

  const targetMinutes = timeToMinutes(config.time);

  // Para peso, verifica também o dia da semana
  if (type === "weight" && config.day !== undefined) {
    const today = new Date().getDay();
    if (today !== config.day) return false;
  }

  // Verifica se o horário alvo está entre o último check e agora
  // Considera também virada de dia (lastChecked > current)
  if (lastCheckedMinutes <= currentMinutes) {
    // Mesmo dia
    return targetMinutes > lastCheckedMinutes && targetMinutes <= currentMinutes;
  } else {
    // Virada de dia
    return targetMinutes > lastCheckedMinutes || targetMinutes <= currentMinutes;
  }
}

/**
 * Verifica todos os lembretes e dispara os que estão no horário
 */
export function checkAndTriggerReminders(): ReminderType[] {
  const config = getNotificationConfig();

  if (!config.enabled) return [];
  if (Notification.permission !== "granted") return [];

  const now = new Date();
  const currentMinutes = getCurrentMinutes();

  // Calcula minutos do último check
  let lastCheckedMinutes = 0;
  if (config.lastChecked) {
    const lastDate = new Date(config.lastChecked);
    // Se foi no mesmo dia, usa o horário
    if (lastDate.toDateString() === now.toDateString()) {
      lastCheckedMinutes = lastDate.getHours() * 60 + lastDate.getMinutes();
    }
    // Se foi ontem ou antes, começa do início do dia
  }

  const triggered: ReminderType[] = [];

  // Verifica cada tipo de lembrete
  const reminderTypes: ReminderType[] = ["breakfast", "lunch", "dinner", "weight"];

  for (const type of reminderTypes) {
    const reminderConfig = config[type];
    if (shouldTriggerReminder(type, reminderConfig, lastCheckedMinutes, currentMinutes)) {
      sendNotification(type);
      triggered.push(type);
    }
  }

  // Atualiza último check
  updateNotificationConfig({ lastChecked: now.toISOString() });

  return triggered;
}

// ============================================
// LOOP DE VERIFICAÇÃO
// ============================================

let checkInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Inicia o loop de verificação de lembretes
 */
export function startReminderLoop(): void {
  if (checkInterval) return; // Já está rodando

  // Faz check inicial
  checkAndTriggerReminders();

  // Inicia loop
  checkInterval = setInterval(() => {
    checkAndTriggerReminders();
  }, CHECK_INTERVAL);

  console.log("Loop de lembretes iniciado");
}

/**
 * Para o loop de verificação
 */
export function stopReminderLoop(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    console.log("Loop de lembretes parado");
  }
}

/**
 * Verifica se o loop está ativo
 */
export function isReminderLoopActive(): boolean {
  return checkInterval !== null;
}

// ============================================
// HELPERS
// ============================================

/**
 * Formata dia da semana
 */
export function formatDayOfWeek(day: number): string {
  const days = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];
  return days[day] || "";
}

/**
 * Lista de dias da semana para select
 */
export const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];
