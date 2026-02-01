/**
 * Apple Health XML Parser
 *
 * Converte o XML exportado do Apple Health para estruturas JavaScript.
 *
 * Estrutura do XML Apple Health:
 * <HealthData locale="pt_BR">
 *   <ExportDate value="2024-01-15 10:30:00 -0300"/>
 *   <Me ... />
 *   <Record type="HKQuantityTypeIdentifierBodyMass" ... />
 *   <Record type="HKQuantityTypeIdentifierHeartRate" ... />
 *   <Workout workoutActivityType="HKWorkoutActivityTypeRunning" ... />
 *   ...
 * </HealthData>
 */

import { XMLParser } from "fast-xml-parser";

// ============================================================================
// TIPOS DO APPLE HEALTH (entrada)
// ============================================================================

/**
 * Record genérico do Apple Health
 * Representa medições como peso, frequência cardíaca, body fat, etc.
 */
export interface AppleHealthRecord {
  /** Tipo do registro (ex: HKQuantityTypeIdentifierBodyMass) */
  type: string;
  /** Valor numérico da medição */
  value: number;
  /** Unidade de medida (ex: kg, %, count/min) */
  unit: string;
  /** Data/hora de início */
  startDate: string;
  /** Data/hora de fim */
  endDate: string;
  /** Nome da fonte (ex: "iPhone de João", "Apple Watch") */
  sourceName?: string;
  /** Versão do dispositivo */
  sourceVersion?: string;
  /** Data de criação no Apple Health */
  creationDate?: string;
}

/**
 * Workout do Apple Health
 * Representa sessões de exercício (corrida, musculação, etc.)
 */
export interface AppleHealthWorkout {
  /** Tipo de atividade (ex: HKWorkoutActivityTypeRunning) */
  activityType: string;
  /** Duração em minutos */
  duration: number;
  /** Unidade de duração (geralmente "min") */
  durationUnit: string;
  /** Distância total (se aplicável) */
  totalDistance?: number;
  /** Unidade de distância (ex: km, mi) */
  totalDistanceUnit?: string;
  /** Energia queimada em kcal */
  totalEnergyBurned?: number;
  /** Unidade de energia (geralmente "kcal") */
  totalEnergyBurnedUnit?: string;
  /** Data/hora de início */
  startDate: string;
  /** Data/hora de fim */
  endDate: string;
  /** Nome da fonte */
  sourceName?: string;
}

/**
 * Entrada de sono do Apple Health
 * Cada entrada representa um período (na cama, sono leve, profundo, REM, acordado)
 */
export interface AppleHealthSleepEntry {
  /** Valor do estágio de sono */
  value: string;
  /** Data/hora de início */
  startDate: string;
  /** Data/hora de fim */
  endDate: string;
  /** Nome da fonte */
  sourceName?: string;
}

// ============================================================================
// TIPOS PARSEADOS (saída)
// ============================================================================

/**
 * Registro de glicemia do Apple Health
 */
export interface AppleHealthGlucoseEntry {
  /** Valor em mg/dL */
  value: number;
  /** Data/hora da medição */
  startDate: string;
  /** Nome da fonte (ex: FreeStyle Libre) */
  sourceName?: string;
}

/**
 * Resultado do parsing do XML
 */
export interface ParsedAppleHealthData {
  /** Registros de medições (peso, body fat, frequência cardíaca, etc.) */
  records: AppleHealthRecord[];
  /** Sessões de treino */
  workouts: AppleHealthWorkout[];
  /** Entradas de sono */
  sleepEntries: AppleHealthSleepEntry[];
  /** Entradas de glicemia */
  glucoseEntries: AppleHealthGlucoseEntry[];
  /** Metadados da exportação */
  metadata: {
    /** Data da exportação */
    exportDate: string | null;
    /** Locale do dispositivo */
    locale: string | null;
    /** Total de registros encontrados */
    totalRecords: number;
    /** Total de workouts encontrados */
    totalWorkouts: number;
    /** Total de entradas de sono */
    totalSleepEntries: number;
    /** Total de entradas de glicemia */
    totalGlucoseEntries: number;
  };
  /** Erros encontrados durante o parsing */
  errors: string[];
}

/**
 * Contagem de registros por tipo
 */
export interface RecordTypeCounts {
  [type: string]: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/** Tipos de registro que queremos extrair */
export const SUPPORTED_RECORD_TYPES = {
  // Métricas corporais
  BODY_MASS: "HKQuantityTypeIdentifierBodyMass",
  BODY_FAT: "HKQuantityTypeIdentifierBodyFatPercentage",
  LEAN_BODY_MASS: "HKQuantityTypeIdentifierLeanBodyMass",
  HEIGHT: "HKQuantityTypeIdentifierHeight",

  // Atividade cardíaca
  HEART_RATE: "HKQuantityTypeIdentifierHeartRate",
  RESTING_HEART_RATE: "HKQuantityTypeIdentifierRestingHeartRate",

  // Atividade física
  STEP_COUNT: "HKQuantityTypeIdentifierStepCount",
  DISTANCE_WALKING_RUNNING: "HKQuantityTypeIdentifierDistanceWalkingRunning",
  ACTIVE_ENERGY_BURNED: "HKQuantityTypeIdentifierActiveEnergyBurned",

  // Sono
  SLEEP_ANALYSIS: "HKCategoryTypeIdentifierSleepAnalysis",

  // Glicemia (NOVO)
  BLOOD_GLUCOSE: "HKQuantityTypeIdentifierBloodGlucose",
} as const;

/** Valores de estágio de sono */
export const SLEEP_VALUES = {
  IN_BED: "HKCategoryValueSleepAnalysisInBed",
  ASLEEP_UNSPECIFIED: "HKCategoryValueSleepAnalysisAsleepUnspecified",
  ASLEEP_CORE: "HKCategoryValueSleepAnalysisAsleepCore",
  ASLEEP_DEEP: "HKCategoryValueSleepAnalysisAsleepDeep",
  ASLEEP_REM: "HKCategoryValueSleepAnalysisAsleepREM",
  AWAKE: "HKCategoryValueSleepAnalysisAwake",
} as const;

// ============================================================================
// PARSER PRINCIPAL
// ============================================================================

/**
 * Parseia o XML do Apple Health e extrai os dados relevantes
 *
 * @param xmlContent - Conteúdo XML como string
 * @returns Dados parseados com registros, workouts e sono
 *
 * @example
 * ```typescript
 * const result = parseAppleHealthXml(xmlContent);
 * console.log(`Encontrados ${result.records.length} registros`);
 * ```
 */
export function parseAppleHealthXml(xmlContent: string): ParsedAppleHealthData {
  const errors: string[] = [];
  const records: AppleHealthRecord[] = [];
  const workouts: AppleHealthWorkout[] = [];
  const sleepEntries: AppleHealthSleepEntry[] = [];
  const glucoseEntries: AppleHealthGlucoseEntry[] = [];

  try {
    // Configura o parser
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      // Trata valores numéricos
      parseTagValue: true,
      parseAttributeValue: true,
      // Preserva arrays mesmo com um único elemento
      isArray: (name) => {
        return name === "Record" || name === "Workout";
      },
    });

    // Parseia o XML
    const parsed = parser.parse(xmlContent);

    // Extrai o nó principal
    const healthData = parsed.HealthData;

    if (!healthData) {
      errors.push("Estrutura XML inválida: nó HealthData não encontrado");
      return createEmptyResult(errors);
    }

    // Extrai metadados
    const exportDate = healthData.ExportDate?.value || null;
    const locale = healthData.locale || null;

    // Processa Records
    const xmlRecords = healthData.Record || [];
    const recordsArray = Array.isArray(xmlRecords) ? xmlRecords : [xmlRecords];

    for (const record of recordsArray) {
      if (!record || !record.type) continue;

      // Filtra apenas tipos suportados
      const supportedTypes = Object.values(SUPPORTED_RECORD_TYPES);
      if (!supportedTypes.includes(record.type)) continue;

      // Trata sono separadamente
      if (record.type === SUPPORTED_RECORD_TYPES.SLEEP_ANALYSIS) {
        sleepEntries.push({
          value: record.value || "",
          startDate: record.startDate || "",
          endDate: record.endDate || "",
          sourceName: record.sourceName,
        });
        continue;
      }

      // Trata glicemia separadamente
      if (record.type === SUPPORTED_RECORD_TYPES.BLOOD_GLUCOSE) {
        // Converte para mg/dL se necessário (pode vir em mmol/L)
        let glucoseValue = parseFloat(record.value) || 0;
        const unit = record.unit || "";
        if (unit.toLowerCase().includes("mmol")) {
          // Converte mmol/L para mg/dL (multiplicar por 18)
          glucoseValue = Math.round(glucoseValue * 18);
        }
        glucoseEntries.push({
          value: glucoseValue,
          startDate: record.startDate || "",
          sourceName: record.sourceName,
        });
        continue;
      }

      // Adiciona registro normal
      records.push({
        type: record.type,
        value: parseFloat(record.value) || 0,
        unit: record.unit || "",
        startDate: record.startDate || "",
        endDate: record.endDate || "",
        sourceName: record.sourceName,
        sourceVersion: record.sourceVersion,
        creationDate: record.creationDate,
      });
    }

    // Processa Workouts
    const xmlWorkouts = healthData.Workout || [];
    const workoutsArray = Array.isArray(xmlWorkouts) ? xmlWorkouts : [xmlWorkouts];

    for (const workout of workoutsArray) {
      if (!workout || !workout.workoutActivityType) continue;

      workouts.push({
        activityType: workout.workoutActivityType,
        duration: parseFloat(workout.duration) || 0,
        durationUnit: workout.durationUnit || "min",
        totalDistance: workout.totalDistance ? parseFloat(workout.totalDistance) : undefined,
        totalDistanceUnit: workout.totalDistanceUnit,
        totalEnergyBurned: workout.totalEnergyBurned ? parseFloat(workout.totalEnergyBurned) : undefined,
        totalEnergyBurnedUnit: workout.totalEnergyBurnedUnit,
        startDate: workout.startDate || "",
        endDate: workout.endDate || "",
        sourceName: workout.sourceName,
      });
    }

    return {
      records,
      workouts,
      sleepEntries,
      glucoseEntries,
      metadata: {
        exportDate,
        locale,
        totalRecords: records.length,
        totalWorkouts: workouts.length,
        totalSleepEntries: sleepEntries.length,
        totalGlucoseEntries: glucoseEntries.length,
      },
      errors,
    };
  } catch (error) {
    errors.push(
      `Erro ao parsear XML: ${error instanceof Error ? error.message : "Erro desconhecido"}`
    );
    return createEmptyResult(errors);
  }
}

/**
 * Conta registros por tipo no XML
 * Útil para mostrar preview antes de importar
 *
 * @param xmlContent - Conteúdo XML como string
 * @returns Contagem de registros por tipo
 */
export function countRecordsByType(xmlContent: string): RecordTypeCounts {
  const counts: RecordTypeCounts = {};

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      isArray: (name) => name === "Record" || name === "Workout",
    });

    const parsed = parser.parse(xmlContent);
    const healthData = parsed.HealthData;

    if (!healthData) return counts;

    // Conta Records
    const records = healthData.Record || [];
    const recordsArray = Array.isArray(records) ? records : [records];

    for (const record of recordsArray) {
      if (!record || !record.type) continue;
      counts[record.type] = (counts[record.type] || 0) + 1;
    }

    // Conta Workouts
    const workouts = healthData.Workout || [];
    const workoutsArray = Array.isArray(workouts) ? workouts : [workouts];

    for (const workout of workoutsArray) {
      if (!workout || !workout.workoutActivityType) continue;
      const type = `Workout:${workout.workoutActivityType}`;
      counts[type] = (counts[type] || 0) + 1;
    }

    return counts;
  } catch {
    return counts;
  }
}

/**
 * Extrai período dos dados (data mais antiga e mais recente)
 *
 * @param data - Dados parseados do Apple Health
 * @returns Objeto com datas de início e fim
 */
export function getDataPeriod(data: ParsedAppleHealthData): {
  startDate: Date | null;
  endDate: Date | null;
} {
  const allDates: Date[] = [];

  // Coleta datas dos records
  for (const record of data.records) {
    if (record.startDate) {
      const date = new Date(record.startDate);
      if (!isNaN(date.getTime())) {
        allDates.push(date);
      }
    }
  }

  // Coleta datas dos workouts
  for (const workout of data.workouts) {
    if (workout.startDate) {
      const date = new Date(workout.startDate);
      if (!isNaN(date.getTime())) {
        allDates.push(date);
      }
    }
  }

  // Coleta datas do sono
  for (const sleep of data.sleepEntries) {
    if (sleep.startDate) {
      const date = new Date(sleep.startDate);
      if (!isNaN(date.getTime())) {
        allDates.push(date);
      }
    }
  }

  if (allDates.length === 0) {
    return { startDate: null, endDate: null };
  }

  // Ordena e retorna primeiro e último
  allDates.sort((a, b) => a.getTime() - b.getTime());

  return {
    startDate: allDates[0],
    endDate: allDates[allDates.length - 1],
  };
}

/**
 * Filtra registros por tipo
 *
 * @param records - Lista de registros
 * @param type - Tipo a filtrar (usar constantes SUPPORTED_RECORD_TYPES)
 * @returns Registros filtrados
 */
export function filterRecordsByType(
  records: AppleHealthRecord[],
  type: string
): AppleHealthRecord[] {
  return records.filter((record) => record.type === type);
}

/**
 * Agrupa entradas de sono por noite
 * Uma "noite" é definida como período entre 18h de um dia e 18h do próximo
 *
 * @param sleepEntries - Entradas de sono
 * @returns Mapa de data (YYYY-MM-DD) para entradas daquela noite
 */
export function groupSleepByNight(
  sleepEntries: AppleHealthSleepEntry[]
): Map<string, AppleHealthSleepEntry[]> {
  const nightsMap = new Map<string, AppleHealthSleepEntry[]>();

  for (const entry of sleepEntries) {
    if (!entry.startDate) continue;

    const startDate = new Date(entry.startDate);
    if (isNaN(startDate.getTime())) continue;

    // Se começou antes das 18h, considera a noite do dia anterior
    // Se começou depois das 18h, considera a noite desse dia
    const nightDate = new Date(startDate);
    if (startDate.getHours() < 18) {
      nightDate.setDate(nightDate.getDate() - 1);
    }

    const nightKey = nightDate.toISOString().split("T")[0];

    if (!nightsMap.has(nightKey)) {
      nightsMap.set(nightKey, []);
    }
    nightsMap.get(nightKey)!.push(entry);
  }

  return nightsMap;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Cria resultado vazio com erros
 */
function createEmptyResult(errors: string[]): ParsedAppleHealthData {
  return {
    records: [],
    workouts: [],
    sleepEntries: [],
    glucoseEntries: [],
    metadata: {
      exportDate: null,
      locale: null,
      totalRecords: 0,
      totalWorkouts: 0,
      totalSleepEntries: 0,
      totalGlucoseEntries: 0,
    },
    errors,
  };
}
