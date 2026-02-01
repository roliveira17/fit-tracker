/**
 * Parser para arquivos XLSX de CGM (Continuous Glucose Monitor)
 *
 * Suporta:
 * - SiSensing CGM (formato de nome: SiSensingCGM-*.xlsx)
 * - FreeStyle Libre (a ser adicionado)
 *
 * Formato típico do SiSensing CGM:
 * - Coluna de data/hora
 * - Coluna de valor de glicose (mg/dL ou mmol/L)
 * - Possivelmente outras colunas como tipo de medição, notas, etc.
 */

import * as XLSX from "xlsx";

export interface CGMReading {
  /** Valor em mg/dL */
  glucose: number;
  /** Data no formato YYYY-MM-DD */
  date: string;
  /** Hora no formato HH:mm:ss */
  time: string;
  /** Tipo de medição (geralmente 'cgm' para leituras contínuas) */
  measurementType: "cgm" | "fasting" | "post_meal" | "random";
  /** Dispositivo/fonte */
  device?: string;
  /** Notas adicionais */
  notes?: string;
}

export interface ParseCGMResult {
  readings: CGMReading[];
  errors: string[];
  metadata: {
    fileName?: string;
    device?: string;
    dateRange?: { start: string; end: string };
    totalReadings: number;
  };
}

/**
 * Detecta automaticamente o formato do CGM baseado no nome do arquivo
 */
type CGMFormat = "sisensing" | "freestyle" | "unknown";

function detectCGMFormat(fileName: string): CGMFormat {
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes("sisensing") || lowerName.includes("si_sensing")) {
    return "sisensing";
  }
  if (lowerName.includes("freestyle") || lowerName.includes("libre")) {
    return "freestyle";
  }
  return "unknown";
}

/**
 * Converte mmol/L para mg/dL se necessário
 * mmol/L * 18 = mg/dL
 */
function toMgDl(value: number, unit?: string): number {
  if (!unit) {
    // Se valor < 30, provavelmente é mmol/L
    return value < 30 ? Math.round(value * 18) : Math.round(value);
  }
  const lowerUnit = unit.toLowerCase();
  if (lowerUnit.includes("mmol")) {
    return Math.round(value * 18);
  }
  return Math.round(value);
}

/**
 * Parseia data/hora de diferentes formatos
 */
function parseDateTime(value: unknown): { date: string; time: string } | null {
  if (!value) return null;

  // Se for um número (Excel serial date)
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const dateStr = `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
      const timeStr = `${String(date.H || 0).padStart(2, "0")}:${String(date.M || 0).padStart(2, "0")}:${String(Math.floor(date.S || 0)).padStart(2, "0")}`;
      return { date: dateStr, time: timeStr };
    }
  }

  // Se for string
  if (typeof value === "string") {
    // Tenta ISO format (2026-01-12T08:30:00)
    const isoMatch = value.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):?(\d{2})?/);
    if (isoMatch) {
      const [, year, month, day, hour, minute, second = "00"] = isoMatch;
      return {
        date: `${year}-${month}-${day}`,
        time: `${hour}:${minute}:${second}`,
      };
    }

    // Tenta formato SiSensing: DD-MM-YYYY HH:mm GMT-3
    const sisensingMatch = value.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})(?:\s+GMT[+-]?\d+)?/);
    if (sisensingMatch) {
      const [, day, month, year, hour, minute] = sisensingMatch;
      return {
        date: `${year}-${month}-${day}`,
        time: `${hour}:${minute}:00`,
      };
    }

    // Tenta formato DD/MM/YYYY HH:mm
    const brMatch = value.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):?(\d{2})?/);
    if (brMatch) {
      const [, day, month, year, hour, minute, second = "00"] = brMatch;
      return {
        date: `${year}-${month}-${day}`,
        time: `${hour}:${minute}:${second}`,
      };
    }

    // Tenta formato MM/DD/YYYY HH:mm (US)
    const usMatch = value.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):?(\d{2})?/);
    if (usMatch) {
      const [, month, day, year, hour, minute, second = "00"] = usMatch;
      return {
        date: `${year}-${month}-${day}`,
        time: `${hour}:${minute}:${second}`,
      };
    }
  }

  return null;
}

/**
 * Parseia arquivo XLSX de CGM SiSensing
 */
function parseSiSensingCGM(workbook: XLSX.WorkBook): ParseCGMResult {
  const errors: string[] = [];
  const readings: CGMReading[] = [];

  // Pega a primeira planilha
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return {
      readings: [],
      errors: ["Planilha vazia"],
      metadata: { totalReadings: 0 },
    };
  }

  // Converte para array de arrays
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  });

  if (data.length < 2) {
    return {
      readings: [],
      errors: ["Dados insuficientes"],
      metadata: { totalReadings: 0 },
    };
  }

  // Tenta detectar colunas
  const firstRow = data[0] as unknown[];
  const headers = firstRow.map((h) =>
    String(h || "").toLowerCase().trim()
  );

  // Procura colunas de data/hora e glicose
  let dateTimeCol = -1;
  let glucoseCol = -1;
  let unitCol = -1;

  headers.forEach((h, i) => {
    if (
      h.includes("date") ||
      h.includes("data") ||
      h.includes("time") ||
      h.includes("hora") ||
      h.includes("timestamp")
    ) {
      if (dateTimeCol === -1) dateTimeCol = i;
    }
    if (
      h.includes("glucose") ||
      h.includes("glicose") ||
      h.includes("glicemia") ||
      h.includes("value") ||
      h.includes("valor") ||
      h.includes("mg") ||
      h.includes("mmol")
    ) {
      if (glucoseCol === -1) glucoseCol = i;
    }
    if (h.includes("unit") || h.includes("unidade")) {
      unitCol = i;
    }
  });

  // Se não encontrou, tenta heurística: primeira coluna = data, segunda = glicose
  if (dateTimeCol === -1) dateTimeCol = 0;
  if (glucoseCol === -1) glucoseCol = 1;

  // Processa linhas de dados
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as unknown[];
    if (!row || row.length === 0) continue;

    const dateTimeValue = row[dateTimeCol];
    const glucoseValue = row[glucoseCol];
    const unitValue = unitCol >= 0 ? row[unitCol] : undefined;

    // Parseia data/hora
    const parsed = parseDateTime(dateTimeValue);
    if (!parsed) {
      errors.push(`Linha ${i + 1}: Data/hora inválida`);
      continue;
    }

    // Parseia glicose
    const glucoseNum = parseFloat(String(glucoseValue));
    if (isNaN(glucoseNum) || glucoseNum <= 0) {
      continue; // Linha sem valor de glicose válido
    }

    const glucose = toMgDl(glucoseNum, String(unitValue || ""));

    // Valida range (20-600 mg/dL é range válido)
    if (glucose < 20 || glucose > 600) {
      errors.push(`Linha ${i + 1}: Valor de glicose fora do range (${glucose})`);
      continue;
    }

    readings.push({
      glucose,
      date: parsed.date,
      time: parsed.time,
      measurementType: "cgm",
      device: "SiSensing CGM",
    });
  }

  // Calcula metadata
  const dates = readings.map((r) => r.date).sort();
  const dateRange =
    dates.length > 0
      ? { start: dates[0], end: dates[dates.length - 1] }
      : undefined;

  return {
    readings,
    errors,
    metadata: {
      device: "SiSensing CGM",
      dateRange,
      totalReadings: readings.length,
    },
  };
}

/**
 * Parser genérico para formatos desconhecidos
 * Tenta detectar automaticamente colunas de data/hora e glicose
 */
function parseGenericCGM(workbook: XLSX.WorkBook): ParseCGMResult {
  // Por enquanto, usa a mesma lógica do SiSensing
  return parseSiSensingCGM(workbook);
}

/**
 * Parseia arquivo XLSX de CGM
 *
 * @param buffer - Buffer do arquivo XLSX
 * @param fileName - Nome do arquivo (para detectar formato)
 * @returns Resultado do parse com leituras e erros
 */
export function parseCGMXlsx(
  buffer: ArrayBuffer,
  fileName: string = ""
): ParseCGMResult {
  try {
    const workbook = XLSX.read(buffer, { type: "array" });
    const format = detectCGMFormat(fileName);

    let result: ParseCGMResult;

    switch (format) {
      case "sisensing":
        result = parseSiSensingCGM(workbook);
        break;
      case "freestyle":
        // TODO: Implementar parser específico do FreeStyle Libre
        result = parseGenericCGM(workbook);
        break;
      default:
        result = parseGenericCGM(workbook);
    }

    result.metadata.fileName = fileName;
    return result;
  } catch (error) {
    return {
      readings: [],
      errors: [
        `Erro ao ler arquivo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      ],
      metadata: { fileName, totalReadings: 0 },
    };
  }
}

/**
 * Converte leituras de CGM para formato compatível com import_apple_health
 */
export function cgmReadingsToSupabaseFormat(
  readings: CGMReading[]
): Array<{
  glucose: number;
  date: string;
  time: string;
  type: string;
  notes?: string;
  device?: string;
}> {
  return readings.map((r) => ({
    glucose: r.glucose,
    date: r.date,
    time: r.time,
    type: r.measurementType,
    notes: r.notes,
    device: r.device,
  }));
}
