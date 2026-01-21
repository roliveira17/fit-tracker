/**
 * Apple Health Mapper
 *
 * Converte dados parseados do Apple Health para entidades do Fit Track.
 *
 * Mapeamento:
 * - HKQuantityTypeIdentifierBodyMass → WeightLog
 * - HKQuantityTypeIdentifierBodyFatPercentage → BodyFatLog
 * - HKWorkoutActivityType* → Workout
 * - HKCategoryTypeIdentifierSleepAnalysis → SleepSession
 */

import type { WeightLog, BodyFatLog, Workout, WorkoutItem } from "../storage";
import type {
  ParsedAppleHealthData,
  AppleHealthRecord,
  AppleHealthWorkout,
  AppleHealthSleepEntry,
} from "./appleHealthParser";
import { SUPPORTED_RECORD_TYPES, SLEEP_VALUES, groupSleepByNight } from "./appleHealthParser";

// ============================================================================
// TIPOS DE SAÍDA
// ============================================================================

/**
 * Sessão de sono (não existe em storage.ts, definimos aqui)
 */
export interface SleepSession {
  id: string;
  date: string;              // YYYY-MM-DD (data da noite)
  startTime: string;         // ISO string
  endTime: string;           // ISO string
  totalMinutes: number;      // Duração total em minutos
  deepMinutes: number;       // Sono profundo
  remMinutes: number;        // Sono REM
  coreMinutes: number;       // Sono leve/core
  awakeMinutes: number;      // Tempo acordado
  source: string;            // Fonte (Apple Watch, etc.)
}

/**
 * Série temporal de frequência cardíaca
 */
export interface HeartRateSeries {
  timestamp: string;         // ISO string
  value: number;             // BPM
  source: string;
}

/**
 * Resultado do mapeamento completo
 */
export interface MappedAppleHealthData {
  weightLogs: Omit<WeightLog, "id" | "timestamp">[];
  bodyFatLogs: Omit<BodyFatLog, "id" | "timestamp">[];
  workouts: Omit<Workout, "id" | "timestamp">[];
  sleepSessions: Omit<SleepSession, "id">[];
  heartRateSeries: HeartRateSeries[];
  stats: {
    totalWeightLogs: number;
    totalBodyFatLogs: number;
    totalWorkouts: number;
    totalSleepSessions: number;
    totalHeartRateReadings: number;
  };
}

// ============================================================================
// CONSTANTES DE CONVERSÃO
// ============================================================================

/** Conversão de unidades de peso */
const WEIGHT_CONVERSIONS: Record<string, number> = {
  kg: 1,
  lb: 0.453592,
  lbs: 0.453592,
  g: 0.001,
};

/** Conversão de unidades de distância */
const DISTANCE_CONVERSIONS: Record<string, number> = {
  km: 1,
  mi: 1.60934,
  m: 0.001,
};

/** Mapeamento de tipos de workout do Apple Health para categorias do app */
const WORKOUT_TYPE_MAP: Record<string, string> = {
  HKWorkoutActivityTypeRunning: "Corrida",
  HKWorkoutActivityTypeWalking: "Caminhada",
  HKWorkoutActivityTypeCycling: "Ciclismo",
  HKWorkoutActivityTypeSwimming: "Natação",
  HKWorkoutActivityTypeYoga: "Yoga",
  HKWorkoutActivityTypePilates: "Pilates",
  HKWorkoutActivityTypeHiking: "Trilha",
  HKWorkoutActivityTypeFunctionalStrengthTraining: "Funcional",
  HKWorkoutActivityTypeTraditionalStrengthTraining: "Musculação",
  HKWorkoutActivityTypeCrossTraining: "CrossFit",
  HKWorkoutActivityTypeElliptical: "Elíptico",
  HKWorkoutActivityTypeRowing: "Remo",
  HKWorkoutActivityTypeStairClimbing: "Escada",
  HKWorkoutActivityTypeDance: "Dança",
  HKWorkoutActivityTypeMartialArts: "Artes Marciais",
  HKWorkoutActivityTypeTennis: "Tênis",
  HKWorkoutActivityTypeBasketball: "Basquete",
  HKWorkoutActivityTypeSoccer: "Futebol",
  HKWorkoutActivityTypeHighIntensityIntervalTraining: "HIIT",
  HKWorkoutActivityTypeCoreTraining: "Core",
  HKWorkoutActivityTypeFlexibility: "Alongamento",
  HKWorkoutActivityTypeMindAndBody: "Meditação",
  HKWorkoutActivityTypeOther: "Outro",
};

// ============================================================================
// MAPPER PRINCIPAL
// ============================================================================

/**
 * Converte dados parseados do Apple Health para entidades do Fit Track
 *
 * @param data - Dados parseados do XML
 * @returns Dados mapeados para as entidades do app
 */
export function mapAppleHealthToEntities(
  data: ParsedAppleHealthData
): MappedAppleHealthData {
  const weightLogs = mapWeightLogs(data.records);
  const bodyFatLogs = mapBodyFatLogs(data.records);
  const workouts = mapWorkouts(data.workouts);
  const sleepSessions = mapSleepSessions(data.sleepEntries);
  const heartRateSeries = mapHeartRateSeries(data.records);

  return {
    weightLogs,
    bodyFatLogs,
    workouts,
    sleepSessions,
    heartRateSeries,
    stats: {
      totalWeightLogs: weightLogs.length,
      totalBodyFatLogs: bodyFatLogs.length,
      totalWorkouts: workouts.length,
      totalSleepSessions: sleepSessions.length,
      totalHeartRateReadings: heartRateSeries.length,
    },
  };
}

// ============================================================================
// MAPPERS ESPECÍFICOS
// ============================================================================

/**
 * Mapeia registros de peso para WeightLog
 */
function mapWeightLogs(
  records: AppleHealthRecord[]
): Omit<WeightLog, "id" | "timestamp">[] {
  const weightRecords = records.filter(
    (r) => r.type === SUPPORTED_RECORD_TYPES.BODY_MASS
  );

  // Agrupa por data (mantém apenas o último registro de cada dia)
  const byDate = new Map<string, AppleHealthRecord>();

  for (const record of weightRecords) {
    const date = extractDate(record.startDate);
    if (!date) continue;

    const existing = byDate.get(date);
    // Mantém o mais recente
    if (!existing || record.startDate > existing.startDate) {
      byDate.set(date, record);
    }
  }

  return Array.from(byDate.values()).map((record) => ({
    weight: convertWeight(record.value, record.unit),
    date: extractDate(record.startDate) || "",
    rawText: `Importado do Apple Health (${record.sourceName || "iPhone"})`,
  }));
}

/**
 * Mapeia registros de body fat para BodyFatLog
 */
function mapBodyFatLogs(
  records: AppleHealthRecord[]
): Omit<BodyFatLog, "id" | "timestamp">[] {
  const bfRecords = records.filter(
    (r) => r.type === SUPPORTED_RECORD_TYPES.BODY_FAT
  );

  // Agrupa por data (mantém apenas o último registro de cada dia)
  const byDate = new Map<string, AppleHealthRecord>();

  for (const record of bfRecords) {
    const date = extractDate(record.startDate);
    if (!date) continue;

    const existing = byDate.get(date);
    if (!existing || record.startDate > existing.startDate) {
      byDate.set(date, record);
    }
  }

  return Array.from(byDate.values()).map((record) => ({
    percentage: convertBodyFat(record.value, record.unit),
    date: extractDate(record.startDate) || "",
    rawText: `Importado do Apple Health (${record.sourceName || "iPhone"})`,
  }));
}

/**
 * Mapeia workouts do Apple Health para Workout
 */
function mapWorkouts(
  workouts: AppleHealthWorkout[]
): Omit<Workout, "id" | "timestamp">[] {
  return workouts.map((workout) => {
    const workoutName = WORKOUT_TYPE_MAP[workout.activityType] || "Treino";
    const duration = convertDuration(workout.duration, workout.durationUnit);
    const distance = workout.totalDistance
      ? convertDistance(workout.totalDistance, workout.totalDistanceUnit || "km")
      : undefined;
    const calories = workout.totalEnergyBurned || undefined;

    // Cria um item de exercício representando o workout
    const exercise: WorkoutItem = {
      type: getWorkoutCategory(workout.activityType),
      name: workoutName,
      duration,
      caloriesBurned: calories,
    };

    return {
      exercises: [exercise],
      totalDuration: duration,
      totalCaloriesBurned: calories,
      date: extractDate(workout.startDate) || "",
      rawText: buildWorkoutDescription(workoutName, duration, distance, calories),
    };
  });
}

/**
 * Mapeia entradas de sono para SleepSession
 */
function mapSleepSessions(
  sleepEntries: AppleHealthSleepEntry[]
): Omit<SleepSession, "id">[] {
  // Agrupa por noite
  const nightsMap = groupSleepByNight(sleepEntries);
  const sessions: Omit<SleepSession, "id">[] = [];

  for (const [nightDate, entries] of nightsMap) {
    // Calcula duração de cada estágio
    let totalMinutes = 0;
    let deepMinutes = 0;
    let remMinutes = 0;
    let coreMinutes = 0;
    let awakeMinutes = 0;
    let startTime: Date | null = null;
    let endTime: Date | null = null;
    let source = "";

    for (const entry of entries) {
      const start = new Date(entry.startDate);
      const end = new Date(entry.endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

      const durationMs = end.getTime() - start.getTime();
      const durationMin = Math.round(durationMs / (1000 * 60));

      // Atualiza horários de início e fim
      if (!startTime || start < startTime) startTime = start;
      if (!endTime || end > endTime) endTime = end;

      // Atualiza fonte
      if (entry.sourceName && !source) source = entry.sourceName;

      // Categoriza por estágio
      switch (entry.value) {
        case SLEEP_VALUES.ASLEEP_DEEP:
          deepMinutes += durationMin;
          totalMinutes += durationMin;
          break;
        case SLEEP_VALUES.ASLEEP_REM:
          remMinutes += durationMin;
          totalMinutes += durationMin;
          break;
        case SLEEP_VALUES.ASLEEP_CORE:
        case SLEEP_VALUES.ASLEEP_UNSPECIFIED:
          coreMinutes += durationMin;
          totalMinutes += durationMin;
          break;
        case SLEEP_VALUES.AWAKE:
          awakeMinutes += durationMin;
          break;
        case SLEEP_VALUES.IN_BED:
          // "Na cama" não conta como sono
          break;
      }
    }

    // Só adiciona se tiver dados de sono válidos
    if (totalMinutes > 0 && startTime && endTime) {
      sessions.push({
        date: nightDate,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        totalMinutes,
        deepMinutes,
        remMinutes,
        coreMinutes,
        awakeMinutes,
        source: source || "Apple Health",
      });
    }
  }

  return sessions;
}

/**
 * Mapeia registros de frequência cardíaca para séries temporais
 * Limita aos últimos 30 dias por padrão para não sobrecarregar
 */
function mapHeartRateSeries(
  records: AppleHealthRecord[],
  daysLimit: number = 30
): HeartRateSeries[] {
  const hrRecords = records.filter(
    (r) => r.type === SUPPORTED_RECORD_TYPES.HEART_RATE
  );

  // Filtra pelos últimos N dias
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysLimit);

  return hrRecords
    .filter((r) => {
      const date = new Date(r.startDate);
      return !isNaN(date.getTime()) && date >= cutoffDate;
    })
    .map((record) => ({
      timestamp: record.startDate,
      value: Math.round(record.value),
      source: record.sourceName || "Apple Health",
    }));
}

// ============================================================================
// HELPERS DE CONVERSÃO
// ============================================================================

/**
 * Extrai data no formato YYYY-MM-DD de uma string de data
 */
function extractDate(dateString: string): string | null {
  if (!dateString) return null;

  // Tenta parsear a data
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;

  // Formata como YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Converte peso para kg
 */
function convertWeight(value: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase();
  const factor = WEIGHT_CONVERSIONS[normalizedUnit] || 1;
  const converted = value * factor;
  // Arredonda para 1 casa decimal
  return Math.round(converted * 10) / 10;
}

/**
 * Converte body fat para percentual (0-100)
 */
function convertBodyFat(value: number, unit: string): number {
  // Apple Health pode enviar como decimal (0.18) ou percentual (18)
  // Se o valor for menor que 1, assume que é decimal
  const percentage = value < 1 ? value * 100 : value;
  // Arredonda para 1 casa decimal
  return Math.round(percentage * 10) / 10;
}

/**
 * Converte duração para minutos
 */
function convertDuration(value: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase();
  switch (normalizedUnit) {
    case "s":
    case "sec":
    case "second":
    case "seconds":
      return Math.round(value / 60);
    case "h":
    case "hr":
    case "hour":
    case "hours":
      return Math.round(value * 60);
    case "min":
    case "minute":
    case "minutes":
    default:
      return Math.round(value);
  }
}

/**
 * Converte distância para km
 */
function convertDistance(value: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase();
  const factor = DISTANCE_CONVERSIONS[normalizedUnit] || 1;
  const converted = value * factor;
  // Arredonda para 2 casas decimais
  return Math.round(converted * 100) / 100;
}

/**
 * Retorna categoria do workout (cardio, força, etc.)
 */
function getWorkoutCategory(activityType: string): string {
  const cardioTypes = [
    "HKWorkoutActivityTypeRunning",
    "HKWorkoutActivityTypeWalking",
    "HKWorkoutActivityTypeCycling",
    "HKWorkoutActivityTypeSwimming",
    "HKWorkoutActivityTypeHiking",
    "HKWorkoutActivityTypeElliptical",
    "HKWorkoutActivityTypeRowing",
    "HKWorkoutActivityTypeStairClimbing",
  ];

  const strengthTypes = [
    "HKWorkoutActivityTypeFunctionalStrengthTraining",
    "HKWorkoutActivityTypeTraditionalStrengthTraining",
    "HKWorkoutActivityTypeCrossTraining",
    "HKWorkoutActivityTypeCoreTraining",
  ];

  if (cardioTypes.includes(activityType)) return "cardio";
  if (strengthTypes.includes(activityType)) return "strength";
  return "other";
}

/**
 * Constrói descrição textual do workout
 */
function buildWorkoutDescription(
  name: string,
  duration: number,
  distance?: number,
  calories?: number
): string {
  const parts = [name];

  if (duration > 0) {
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    if (hours > 0) {
      parts.push(`${hours}h${mins > 0 ? ` ${mins}min` : ""}`);
    } else {
      parts.push(`${mins}min`);
    }
  }

  if (distance && distance > 0) {
    parts.push(`${distance}km`);
  }

  if (calories && calories > 0) {
    parts.push(`${Math.round(calories)}kcal`);
  }

  return `Importado: ${parts.join(" - ")}`;
}

// ============================================================================
// EXPORTAÇÕES AUXILIARES
// ============================================================================

export { WORKOUT_TYPE_MAP };
