/**
 * Serviço de armazenamento local (localStorage)
 * Centraliza toda a persistência de dados do app
 */

import { getLocalDateString } from "@/lib/date-utils";

// Chaves do localStorage
const STORAGE_KEYS = {
  USER_PROFILE: "fittrack_user_profile",
  ONBOARDING_COMPLETE: "fittrack_onboarding_complete",
  CHAT_MESSAGES: "fittrack_chat_messages",
  MEALS: "fittrack_meals",
  WORKOUTS: "fittrack_workouts",
  WEIGHT_LOGS: "fittrack_weight_logs",
  BODYFAT_LOGS: "fittrack_bodyfat_logs",
  IMPORT_HISTORY: "fittrack_import_history",
} as const;

/**
 * Tipos de dados armazenados
 */
export interface UserProfile {
  name: string;
  gender: "masculino" | "feminino" | "outro";
  birthDate: string;
  height: number; // em cm
  weight: number; // em kg
  bmr: number; // kcal/dia
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  parsedData?: {
    type: "food" | "exercise" | "weight" | "bodyfat" | "glucose" | "photo_analysis" | "nutrition_label" | "recipe" | "sleep" | "weekly_analysis";
    data: Record<string, unknown>;
  };
}

// ============================================
// ENTIDADES DE REGISTRO
// ============================================

/**
 * Item de uma refeição
 */
export interface MealItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Refeição registrada
 */
export interface Meal {
  id: string;
  type: "breakfast" | "lunch" | "dinner" | "snack" | "other";
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  date: string;       // YYYY-MM-DD
  timestamp: string;  // ISO string
  rawText: string;    // Texto original do usuário
}

/**
 * Item de exercício
 */
export interface WorkoutItem {
  type: string;
  name: string;
  duration?: number;
  sets?: number;
  reps?: number;
  caloriesBurned?: number;
}

/**
 * Treino registrado
 */
export interface Workout {
  id: string;
  exercises: WorkoutItem[];
  totalDuration?: number;
  totalCaloriesBurned?: number;
  date: string;
  timestamp: string;
  rawText: string;
}

/**
 * Registro de peso
 */
export interface WeightLog {
  id: string;
  weight: number;     // em kg
  date: string;
  timestamp: string;
  rawText: string;
}

/**
 * Registro de body fat
 */
export interface BodyFatLog {
  id: string;
  percentage: number;
  date: string;
  timestamp: string;
  rawText: string;
}

/**
 * Verifica se o código está rodando no navegador
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Salva o perfil do usuário
 */
export function saveUserProfile(profile: UserProfile): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

/**
 * Recupera o perfil do usuário
 */
export function getUserProfile(): UserProfile | null {
  if (!isBrowser()) return null;
  const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  if (!data) return null;
  try {
    return JSON.parse(data) as UserProfile;
  } catch {
    return null;
  }
}

/**
 * Marca o onboarding como completo
 */
export function setOnboardingComplete(complete: boolean): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, String(complete));
}

/**
 * Verifica se o onboarding foi completado
 */
export function isOnboardingComplete(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === "true";
}

/**
 * Limpa todos os dados do app (para testes/debug)
 */
export function clearAllData(): void {
  if (!isBrowser()) return;
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

/**
 * Salva as mensagens do chat
 */
export function saveChatMessages(messages: ChatMessage[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
}

/**
 * Recupera as mensagens do chat
 */
export function getChatMessages(): ChatMessage[] {
  if (!isBrowser()) return [];
  const data = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
  if (!data) return [];
  try {
    return JSON.parse(data) as ChatMessage[];
  } catch {
    return [];
  }
}

/**
 * Limpa apenas as mensagens do chat
 */
export function clearChatMessages(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEYS.CHAT_MESSAGES);
}

// ============================================
// FUNÇÕES DE REGISTRO - MEALS
// ============================================

/**
 * Gera ID único para registros
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Retorna a data atual no formato YYYY-MM-DD
 */
function getCurrentDate(): string {
  return getLocalDateString();
}

/**
 * Salva uma nova refeição
 */
export function saveMeal(meal: Omit<Meal, "id" | "date" | "timestamp">): Meal {
  const meals = getMeals();
  const newMeal: Meal = {
    ...meal,
    id: generateId("meal"),
    date: getCurrentDate(),
    timestamp: new Date().toISOString(),
  };
  meals.push(newMeal);
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(meals));
  }
  return newMeal;
}

/**
 * Recupera todas as refeições
 */
export function getMeals(): Meal[] {
  if (!isBrowser()) return [];
  const data = localStorage.getItem(STORAGE_KEYS.MEALS);
  if (!data) return [];
  try {
    return JSON.parse(data) as Meal[];
  } catch {
    return [];
  }
}

/**
 * Recupera refeições de uma data específica
 */
export function getMealsByDate(date: string): Meal[] {
  return getMeals().filter((m) => m.date === date);
}

/**
 * Recupera refeições de hoje
 */
export function getTodayMeals(): Meal[] {
  return getMealsByDate(getCurrentDate());
}

/**
 * Calcula totais do dia
 */
export function getTodayTotals(): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const meals = getTodayMeals();
  return {
    calories: meals.reduce((sum, m) => sum + m.totalCalories, 0),
    protein: meals.reduce((sum, m) => sum + m.totalProtein, 0),
    carbs: meals.reduce((sum, m) => sum + m.totalCarbs, 0),
    fat: meals.reduce((sum, m) => sum + m.totalFat, 0),
  };
}

// ============================================
// FUNÇÕES DE REGISTRO - WORKOUTS
// ============================================

/**
 * Salva um novo treino
 */
export function saveWorkout(workout: Omit<Workout, "id" | "date" | "timestamp">): Workout {
  const workouts = getWorkouts();
  const newWorkout: Workout = {
    ...workout,
    id: generateId("workout"),
    date: getCurrentDate(),
    timestamp: new Date().toISOString(),
  };
  workouts.push(newWorkout);
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
  }
  return newWorkout;
}

/**
 * Recupera todos os treinos
 */
export function getWorkouts(): Workout[] {
  if (!isBrowser()) return [];
  const data = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
  if (!data) return [];
  try {
    return JSON.parse(data) as Workout[];
  } catch {
    return [];
  }
}

/**
 * Recupera treinos de hoje
 */
export function getTodayWorkouts(): Workout[] {
  return getWorkouts().filter((w) => w.date === getCurrentDate());
}

// ============================================
// FUNÇÕES DE REGISTRO - WEIGHT
// ============================================

/**
 * Salva registro de peso
 */
export function saveWeightLog(weight: number, rawText: string): WeightLog {
  const logs = getWeightLogs();
  const newLog: WeightLog = {
    id: generateId("weight"),
    weight,
    date: getCurrentDate(),
    timestamp: new Date().toISOString(),
    rawText,
  };
  logs.push(newLog);
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(logs));
  }
  return newLog;
}

/**
 * Recupera todos os registros de peso
 */
export function getWeightLogs(): WeightLog[] {
  if (!isBrowser()) return [];
  const data = localStorage.getItem(STORAGE_KEYS.WEIGHT_LOGS);
  if (!data) return [];
  try {
    return JSON.parse(data) as WeightLog[];
  } catch {
    return [];
  }
}

/**
 * Recupera o último registro de peso
 */
export function getLatestWeight(): WeightLog | null {
  const logs = getWeightLogs();
  return logs.length > 0 ? logs[logs.length - 1] : null;
}

/**
 * Recupera registros de peso dos últimos N dias
 * Retorna um array com a data e o peso (ou null se não houver registro)
 */
export function getWeightLogsLastDays(days: number = 7): Array<{ date: string; weight: number | null }> {
  const logs = getWeightLogs();
  const result: Array<{ date: string; weight: number | null }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = getLocalDateString(date);

    // Encontra o registro mais recente do dia (pode haver múltiplos)
    const dayLogs = logs.filter((l) => l.date === dateKey);
    const lastLog = dayLogs.length > 0 ? dayLogs[dayLogs.length - 1] : null;

    result.push({
      date: dateKey,
      weight: lastLog?.weight ?? null,
    });
  }

  return result;
}

// ============================================
// FUNÇÕES DE REGISTRO - BODY FAT
// ============================================

/**
 * Salva registro de body fat
 */
export function saveBodyFatLog(percentage: number, rawText: string): BodyFatLog {
  const logs = getBodyFatLogs();
  const newLog: BodyFatLog = {
    id: generateId("bf"),
    percentage,
    date: getCurrentDate(),
    timestamp: new Date().toISOString(),
    rawText,
  };
  logs.push(newLog);
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.BODYFAT_LOGS, JSON.stringify(logs));
  }
  return newLog;
}

/**
 * Recupera todos os registros de body fat
 */
export function getBodyFatLogs(): BodyFatLog[] {
  if (!isBrowser()) return [];
  const data = localStorage.getItem(STORAGE_KEYS.BODYFAT_LOGS);
  if (!data) return [];
  try {
    return JSON.parse(data) as BodyFatLog[];
  } catch {
    return [];
  }
}

/**
 * Recupera o último registro de body fat
 */
export function getLatestBodyFat(): BodyFatLog | null {
  const logs = getBodyFatLogs();
  return logs.length > 0 ? logs[logs.length - 1] : null;
}

// ============================================
// FUNÇÕES DE STREAK
// ============================================

/**
 * Retorna todas as datas únicas com pelo menos 1 registro
 * (refeição, treino, peso ou BF)
 */
function getAllActiveDates(): Set<string> {
  const dates = new Set<string>();

  // Adiciona datas de refeições
  getMeals().forEach((m) => dates.add(m.date));

  // Adiciona datas de treinos
  getWorkouts().forEach((w) => dates.add(w.date));

  // Adiciona datas de peso
  getWeightLogs().forEach((w) => dates.add(w.date));

  // Adiciona datas de BF
  getBodyFatLogs().forEach((b) => dates.add(b.date));

  return dates;
}

/**
 * Calcula o streak atual (dias consecutivos com registro)
 * Retorna { streak: number, lastActiveDate: string | null }
 */
export function calculateStreak(): { streak: number; lastActiveDate: string | null } {
  const activeDates = getAllActiveDates();

  if (activeDates.size === 0) {
    return { streak: 0, lastActiveDate: null };
  }

  // Ordena as datas (mais recente primeiro)
  const sortedDates = Array.from(activeDates).sort().reverse();

  const today = getCurrentDate();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  // Verifica se o streak ainda está ativo (hoje ou ontem tem registro)
  const mostRecentDate = sortedDates[0];
  if (mostRecentDate !== today && mostRecentDate !== yesterdayStr) {
    // Streak quebrado - retorna 0
    return { streak: 0, lastActiveDate: mostRecentDate };
  }

  // Conta dias consecutivos a partir da data mais recente
  let streak = 0;
  let currentDate = new Date(mostRecentDate + "T12:00:00");

  for (const dateStr of sortedDates) {
    const expectedDate = getLocalDateString(currentDate);

    if (dateStr === expectedDate) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (dateStr < expectedDate) {
      // Há um gap, streak termina aqui
      break;
    }
    // Se dateStr > expectedDate, pula (pode haver duplicatas ou datas futuras)
  }

  return { streak, lastActiveDate: mostRecentDate };
}

// ============================================
// FUNÇÕES DE LIMPEZA DE DADOS
// ============================================

/**
 * Limpa todos os dados de registro (refeições, treinos, peso, BF)
 * Preserva: perfil do usuário, onboarding status, mensagens do chat
 */
export function clearAllRegistrations(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEYS.MEALS);
  localStorage.removeItem(STORAGE_KEYS.WORKOUTS);
  localStorage.removeItem(STORAGE_KEYS.WEIGHT_LOGS);
  localStorage.removeItem(STORAGE_KEYS.BODYFAT_LOGS);
}

/**
 * Limpa TUDO e reseta o app (volta ao estado inicial)
 */
export function resetApp(): void {
  if (!isBrowser()) return;
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

// ============================================
// FUNÇÕES DE HISTÓRICO DE IMPORTAÇÃO
// ============================================

/**
 * Registro de importação
 */
export interface ImportRecord {
  id: string;
  date: string;
  source: "hevy" | "apple_health" | "cgm";
  status: "success" | "partial" | "error";
  itemsImported: number;
}

/**
 * Salva um registro de importação
 */
export function saveImportRecord(record: Omit<ImportRecord, "id" | "date">): ImportRecord {
  const records = getImportHistory();
  const newRecord: ImportRecord = {
    ...record,
    id: generateId("import"),
    date: new Date().toISOString(),
  };
  records.unshift(newRecord); // Adiciona no início (mais recente primeiro)
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.IMPORT_HISTORY, JSON.stringify(records.slice(0, 20))); // Mantém últimos 20
  }
  return newRecord;
}

/**
 * Recupera histórico de importações
 */
export function getImportHistory(): ImportRecord[] {
  if (!isBrowser()) return [];
  const data = localStorage.getItem(STORAGE_KEYS.IMPORT_HISTORY);
  if (!data) return [];
  try {
    return JSON.parse(data) as ImportRecord[];
  } catch {
    return [];
  }
}

/**
 * Salva múltiplos workouts de uma vez (para importação)
 */
export function saveWorkoutsBatch(workouts: Omit<Workout, "id" | "timestamp">[]): number {
  const existingWorkouts = getWorkouts();
  let added = 0;

  workouts.forEach((workout) => {
    const newWorkout: Workout = {
      ...workout,
      id: generateId("workout"),
      timestamp: new Date().toISOString(),
    };
    existingWorkouts.push(newWorkout);
    added++;
  });

  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(existingWorkouts));
  }

  return added;
}

/**
 * Salva múltiplos registros de peso de uma vez (para importação)
 * @param weightLogs - Array de registros de peso (sem id e timestamp)
 * @returns Número de registros adicionados
 */
export function saveWeightLogsBatch(
  weightLogs: Omit<WeightLog, "id" | "timestamp">[]
): number {
  const existingLogs = getWeightLogs();
  let added = 0;

  weightLogs.forEach((log) => {
    const newLog: WeightLog = {
      ...log,
      id: generateId("weight"),
      timestamp: new Date().toISOString(),
    };
    existingLogs.push(newLog);
    added++;
  });

  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(existingLogs));
  }

  return added;
}

/**
 * Salva múltiplos registros de body fat de uma vez (para importação)
 * @param bodyFatLogs - Array de registros de body fat (sem id e timestamp)
 * @returns Número de registros adicionados
 */
export function saveBodyFatLogsBatch(
  bodyFatLogs: Omit<BodyFatLog, "id" | "timestamp">[]
): number {
  const existingLogs = getBodyFatLogs();
  let added = 0;

  bodyFatLogs.forEach((log) => {
    const newLog: BodyFatLog = {
      ...log,
      id: generateId("bf"),
      timestamp: new Date().toISOString(),
    };
    existingLogs.push(newLog);
    added++;
  });

  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.BODYFAT_LOGS, JSON.stringify(existingLogs));
  }

  return added;
}
