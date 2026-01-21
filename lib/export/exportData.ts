/**
 * Funções de exportação de dados
 * Permite exportar todos os dados do usuário em JSON ou CSV
 */

import JSZip from "jszip";
import {
  getUserProfile,
  getWeightLogs,
  getBodyFatLogs,
  getMeals,
  getWorkouts,
  getImportHistory,
  type UserProfile,
  type WeightLog,
  type BodyFatLog,
  type Meal,
  type Workout,
  type ImportRecord,
} from "@/lib/storage";

// ============================================
// TIPOS
// ============================================

export type ExportFormat = "json" | "csv";
export type ExportPeriod = "all" | "1m" | "3m" | "6m" | "1y";

export interface ExportOptions {
  format: ExportFormat;
  period: ExportPeriod;
}

export interface ExportData {
  exportedAt: string;
  version: string;
  period: ExportPeriod;
  profile: UserProfile | null;
  weightLogs: WeightLog[];
  bodyFatLogs: BodyFatLog[];
  meals: Meal[];
  workouts: Workout[];
  importHistory: ImportRecord[];
}

export interface ExportResult {
  success: boolean;
  filename: string;
  data: Blob;
  error?: string;
}

// ============================================
// HELPERS
// ============================================

/**
 * Calcula a data de corte baseada no período
 */
function getCutoffDate(period: ExportPeriod): Date | null {
  if (period === "all") return null;

  const now = new Date();
  const cutoff = new Date(now);

  switch (period) {
    case "1m":
      cutoff.setMonth(cutoff.getMonth() - 1);
      break;
    case "3m":
      cutoff.setMonth(cutoff.getMonth() - 3);
      break;
    case "6m":
      cutoff.setMonth(cutoff.getMonth() - 6);
      break;
    case "1y":
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      break;
  }

  return cutoff;
}

/**
 * Filtra array por data
 */
function filterByDate<T extends { date: string }>(
  items: T[],
  cutoff: Date | null
): T[] {
  if (!cutoff) return items;

  const cutoffStr = cutoff.toISOString().split("T")[0];
  return items.filter((item) => item.date >= cutoffStr);
}

/**
 * Gera nome do arquivo com data
 */
function generateFilename(format: ExportFormat): string {
  const date = new Date().toISOString().split("T")[0];
  const extension = format === "json" ? "json" : "zip";
  return `fittrack_export_${date}.${extension}`;
}

// ============================================
// EXPORTAÇÃO JSON
// ============================================

/**
 * Coleta todos os dados para exportação
 */
export function collectExportData(period: ExportPeriod): ExportData {
  const cutoff = getCutoffDate(period);

  return {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    period,
    profile: getUserProfile(),
    weightLogs: filterByDate(getWeightLogs(), cutoff),
    bodyFatLogs: filterByDate(getBodyFatLogs(), cutoff),
    meals: filterByDate(getMeals(), cutoff),
    workouts: filterByDate(getWorkouts(), cutoff),
    importHistory: getImportHistory(), // Histórico não filtra por período
  };
}

/**
 * Exporta dados em formato JSON
 */
export function exportToJSON(options: ExportOptions): ExportResult {
  try {
    const data = collectExportData(options.period);
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });

    return {
      success: true,
      filename: generateFilename("json"),
      data: blob,
    };
  } catch (error) {
    return {
      success: false,
      filename: "",
      data: new Blob(),
      error: error instanceof Error ? error.message : "Erro ao exportar JSON",
    };
  }
}

// ============================================
// EXPORTAÇÃO CSV
// ============================================

/**
 * Converte array de objetos para CSV
 */
function arrayToCSV<T extends object>(
  items: T[],
  columns: { key: keyof T; header: string }[]
): string {
  if (items.length === 0) {
    return columns.map((c) => c.header).join(",") + "\n";
  }

  // Header
  const header = columns.map((c) => c.header).join(",");

  // Rows
  const rows = items.map((item) =>
    columns
      .map((c) => {
        const value = item[c.key];
        // Escapa strings com vírgulas ou aspas
        if (typeof value === "string") {
          if (value.includes(",") || value.includes('"') || value.includes("\n")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }
        if (value === null || value === undefined) {
          return "";
        }
        if (typeof value === "object") {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return String(value);
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

/**
 * Gera CSV do perfil
 */
function profileToCSV(profile: UserProfile | null): string {
  if (!profile) return "campo,valor\n";

  const rows = [
    ["campo", "valor"],
    ["nome", profile.name],
    ["genero", profile.gender],
    ["data_nascimento", profile.birthDate],
    ["altura_cm", String(profile.height)],
    ["peso_kg", String(profile.weight)],
    ["bmr_kcal", String(profile.bmr)],
    ["criado_em", profile.createdAt],
  ];

  return rows.map((r) => r.join(",")).join("\n");
}

/**
 * Gera CSV de registros de peso
 */
function weightLogsToCSV(logs: WeightLog[]): string {
  return arrayToCSV(logs, [
    { key: "id", header: "id" },
    { key: "date", header: "data" },
    { key: "weight", header: "peso_kg" },
    { key: "timestamp", header: "timestamp" },
    { key: "rawText", header: "texto_original" },
  ]);
}

/**
 * Gera CSV de registros de body fat
 */
function bodyFatLogsToCSV(logs: BodyFatLog[]): string {
  return arrayToCSV(logs, [
    { key: "id", header: "id" },
    { key: "date", header: "data" },
    { key: "percentage", header: "percentual" },
    { key: "timestamp", header: "timestamp" },
    { key: "rawText", header: "texto_original" },
  ]);
}

/**
 * Gera CSV de refeições
 */
function mealsToCSV(meals: Meal[]): string {
  return arrayToCSV(meals, [
    { key: "id", header: "id" },
    { key: "date", header: "data" },
    { key: "type", header: "tipo" },
    { key: "totalCalories", header: "calorias" },
    { key: "totalProtein", header: "proteina_g" },
    { key: "totalCarbs", header: "carboidratos_g" },
    { key: "totalFat", header: "gordura_g" },
    { key: "items", header: "itens" },
    { key: "timestamp", header: "timestamp" },
    { key: "rawText", header: "texto_original" },
  ]);
}

/**
 * Gera CSV de treinos
 */
function workoutsToCSV(workouts: Workout[]): string {
  return arrayToCSV(workouts, [
    { key: "id", header: "id" },
    { key: "date", header: "data" },
    { key: "totalDuration", header: "duracao_min" },
    { key: "totalCaloriesBurned", header: "calorias_queimadas" },
    { key: "exercises", header: "exercicios" },
    { key: "timestamp", header: "timestamp" },
    { key: "rawText", header: "texto_original" },
  ]);
}

/**
 * Gera CSV do histórico de importações
 */
function importHistoryToCSV(records: ImportRecord[]): string {
  return arrayToCSV(records, [
    { key: "id", header: "id" },
    { key: "date", header: "data" },
    { key: "source", header: "fonte" },
    { key: "status", header: "status" },
    { key: "itemsImported", header: "itens_importados" },
  ]);
}

/**
 * Exporta dados em formato CSV (ZIP com múltiplos arquivos)
 */
export async function exportToCSV(options: ExportOptions): Promise<ExportResult> {
  try {
    const data = collectExportData(options.period);
    const zip = new JSZip();

    // Adiciona cada tipo de dado como arquivo CSV separado
    zip.file("profile.csv", profileToCSV(data.profile));
    zip.file("weight_logs.csv", weightLogsToCSV(data.weightLogs));
    zip.file("body_fat_logs.csv", bodyFatLogsToCSV(data.bodyFatLogs));
    zip.file("meals.csv", mealsToCSV(data.meals));
    zip.file("workouts.csv", workoutsToCSV(data.workouts));
    zip.file("import_history.csv", importHistoryToCSV(data.importHistory));

    // Adiciona metadata
    const metadata = {
      exportedAt: data.exportedAt,
      version: data.version,
      period: data.period,
      counts: {
        weightLogs: data.weightLogs.length,
        bodyFatLogs: data.bodyFatLogs.length,
        meals: data.meals.length,
        workouts: data.workouts.length,
        importHistory: data.importHistory.length,
      },
    };
    zip.file("metadata.json", JSON.stringify(metadata, null, 2));

    // Gera o ZIP
    const blob = await zip.generateAsync({ type: "blob" });

    return {
      success: true,
      filename: generateFilename("csv"),
      data: blob,
    };
  } catch (error) {
    return {
      success: false,
      filename: "",
      data: new Blob(),
      error: error instanceof Error ? error.message : "Erro ao exportar CSV",
    };
  }
}

// ============================================
// FUNÇÃO PRINCIPAL DE EXPORTAÇÃO
// ============================================

/**
 * Exporta dados no formato especificado
 */
export async function exportData(options: ExportOptions): Promise<ExportResult> {
  if (options.format === "json") {
    return exportToJSON(options);
  } else {
    return exportToCSV(options);
  }
}

// ============================================
// DOWNLOAD HELPER
// ============================================

/**
 * Dispara o download de um arquivo no navegador
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exporta e faz download automaticamente
 */
export async function exportAndDownload(options: ExportOptions): Promise<ExportResult> {
  const result = await exportData(options);

  if (result.success) {
    downloadFile(result.data, result.filename);
  }

  return result;
}
