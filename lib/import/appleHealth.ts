/**
 * Apple Health Import - Extração de ZIP
 *
 * Este módulo lida com a descompactação de arquivos ZIP exportados
 * do Apple Health no iPhone.
 *
 * Fluxo:
 * 1. Usuário exporta dados do Apple Health (Ajustes → Saúde → Exportar)
 * 2. iPhone gera um arquivo ZIP contendo export.xml
 * 3. Esta função descompacta o ZIP e extrai o XML
 *
 * Para arquivos grandes (>100MB), usa streaming para evitar "Invalid string length"
 */

import JSZip from "jszip";
import {
  type AppleHealthRecord,
  type AppleHealthWorkout,
  type AppleHealthSleepEntry,
  type ParsedAppleHealthData,
  SUPPORTED_RECORD_TYPES,
} from "./appleHealthParser";

/**
 * Resultado da extração do ZIP do Apple Health
 */
export interface AppleHealthZipResult {
  /** Se a extração foi bem-sucedida */
  success: boolean;
  /** Conteúdo do arquivo XML (se sucesso) - null para streaming */
  xmlContent: string | null;
  /** Mensagem de erro (se falha) */
  error: string | null;
  /** Nome do arquivo XML encontrado */
  fileName: string | null;
  /** Tamanho do XML em bytes */
  xmlSize: number | null;
  /** Dados parseados diretamente (quando usa streaming) */
  parsedData?: ParsedAppleHealthData;
  /** Se usou modo streaming */
  usedStreaming?: boolean;
}

/** Limite de tamanho para usar método direto (100MB) */
const DIRECT_METHOD_SIZE_LIMIT = 100 * 1024 * 1024;

/**
 * Extrai o arquivo export.xml de um ZIP do Apple Health
 *
 * Usa fallback inteligente:
 * - Arquivos < 100MB: método direto (carrega XML como string)
 * - Arquivos >= 100MB: streaming (processa em chunks com regex)
 *
 * @param zipFile - Arquivo ZIP enviado pelo usuário
 * @param onProgress - Callback opcional para progresso (0-100)
 * @returns Resultado da extração com o conteúdo XML ou dados parseados
 *
 * @example
 * ```typescript
 * const result = await extractAppleHealthXml(file);
 * if (result.success) {
 *   if (result.usedStreaming && result.parsedData) {
 *     console.log("Dados:", result.parsedData.records.length, "registros");
 *   } else {
 *     console.log("XML extraído:", result.xmlContent);
 *   }
 * }
 * ```
 */
export async function extractAppleHealthXml(
  zipFile: File,
  onProgress?: (percent: number) => void
): Promise<AppleHealthZipResult> {
  try {
    // Valida se é um arquivo
    if (!zipFile || !(zipFile instanceof File)) {
      return {
        success: false,
        xmlContent: null,
        error: "Arquivo inválido. Por favor, selecione um arquivo ZIP.",
        fileName: null,
        xmlSize: null,
      };
    }

    // Valida extensão
    if (!zipFile.name.toLowerCase().endsWith(".zip")) {
      return {
        success: false,
        xmlContent: null,
        error: "O arquivo deve ter extensão .zip",
        fileName: null,
        xmlSize: null,
      };
    }

    // Carrega o ZIP
    const zip = await JSZip.loadAsync(zipFile);

    // Verifica se export.xml existe
    const exportXmlFile = findExportXmlInZip(zip);

    if (!exportXmlFile) {
      // Lista arquivos para ajudar no debug
      const fileList = Object.keys(zip.files).slice(0, 10);
      const hasMoreFiles = Object.keys(zip.files).length > 10;

      return {
        success: false,
        xmlContent: null,
        error: `Arquivo export.xml não encontrado no ZIP. Este não parece ser um arquivo de exportação do Apple Health. Arquivos encontrados: ${fileList.join(", ")}${hasMoreFiles ? "..." : ""}`,
        fileName: null,
        xmlSize: null,
      };
    }

    // Verifica o tamanho do XML para decidir qual método usar
    const xmlSize = await getXmlSizeFromZip(zip);

    // Se o arquivo é grande, usa streaming
    if (xmlSize > DIRECT_METHOD_SIZE_LIMIT) {
      console.log(`Arquivo grande detectado (${formatFileSize(xmlSize)}), usando streaming...`);
      return extractAppleHealthXmlStreaming(zipFile, onProgress);
    }

    // Método direto para arquivos menores
    try {
      const xmlContent = await exportXmlFile.async("string");

      // Valida se o conteúdo parece ser XML do Apple Health
      if (!xmlContent.includes("<HealthData") && !xmlContent.includes("<Record")) {
        return {
          success: false,
          xmlContent: null,
          error:
            "O arquivo export.xml não contém dados válidos do Apple Health.",
          fileName: exportXmlFile.name,
          xmlSize: null,
        };
      }

      return {
        success: true,
        xmlContent,
        error: null,
        fileName: exportXmlFile.name,
        xmlSize: xmlContent.length,
        usedStreaming: false,
      };
    } catch (stringError) {
      // Se falhar ao converter para string (arquivo muito grande), tenta streaming
      if (stringError instanceof Error && stringError.message.includes("Invalid string length")) {
        console.log("Fallback para streaming devido a tamanho do arquivo...");
        return extractAppleHealthXmlStreaming(zipFile, onProgress);
      }
      throw stringError;
    }
  } catch (error) {
    // Trata erros específicos do JSZip
    if (error instanceof Error) {
      if (error.message.includes("not a valid zip file")) {
        return {
          success: false,
          xmlContent: null,
          error:
            "O arquivo não é um ZIP válido. Certifique-se de enviar o arquivo correto.",
          fileName: null,
          xmlSize: null,
        };
      }

      // Se falhar com "Invalid string length", tenta streaming como último recurso
      if (error.message.includes("Invalid string length")) {
        console.log("Tentando streaming como fallback final...");
        return extractAppleHealthXmlStreaming(zipFile, onProgress);
      }

      if (error.message.includes("out of memory")) {
        return {
          success: false,
          xmlContent: null,
          error:
            "O arquivo é muito grande para processar no navegador. Tente um arquivo menor.",
          fileName: null,
          xmlSize: null,
        };
      }

      return {
        success: false,
        xmlContent: null,
        error: `Erro ao descompactar ZIP: ${error.message}`,
        fileName: null,
        xmlSize: null,
      };
    }

    return {
      success: false,
      xmlContent: null,
      error: "Erro desconhecido ao processar o arquivo.",
      fileName: null,
      xmlSize: null,
    };
  }
}

/**
 * Formata o tamanho do arquivo para exibição
 *
 * @param bytes - Tamanho em bytes
 * @returns String formatada (ex: "15.2 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// ============================================================================
// STREAMING PARA ARQUIVOS GRANDES
// ============================================================================

/**
 * Extrai atributo de uma string XML usando regex
 */
function extractAttribute(xmlString: string, attrName: string): string | undefined {
  const regex = new RegExp(`${attrName}="([^"]*)"`, "i");
  const match = xmlString.match(regex);
  return match ? match[1] : undefined;
}

/**
 * Parseia um <Record> individual de uma string XML
 */
function parseRecordFromXmlString(xmlString: string): AppleHealthRecord | null {
  const type = extractAttribute(xmlString, "type");
  if (!type) return null;

  // Filtra apenas tipos suportados
  const supportedTypes = Object.values(SUPPORTED_RECORD_TYPES) as string[];
  if (!supportedTypes.includes(type)) return null;

  // Sono é tratado separadamente
  if (type === SUPPORTED_RECORD_TYPES.SLEEP_ANALYSIS) return null;

  const valueStr = extractAttribute(xmlString, "value");

  return {
    type,
    value: valueStr ? parseFloat(valueStr) : 0,
    unit: extractAttribute(xmlString, "unit") || "",
    startDate: extractAttribute(xmlString, "startDate") || "",
    endDate: extractAttribute(xmlString, "endDate") || "",
    sourceName: extractAttribute(xmlString, "sourceName"),
    sourceVersion: extractAttribute(xmlString, "sourceVersion"),
    creationDate: extractAttribute(xmlString, "creationDate"),
  };
}

/**
 * Parseia uma entrada de sono de uma string XML
 */
function parseSleepFromXmlString(xmlString: string): AppleHealthSleepEntry | null {
  const type = extractAttribute(xmlString, "type");
  if (type !== SUPPORTED_RECORD_TYPES.SLEEP_ANALYSIS) return null;

  return {
    value: extractAttribute(xmlString, "value") || "",
    startDate: extractAttribute(xmlString, "startDate") || "",
    endDate: extractAttribute(xmlString, "endDate") || "",
    sourceName: extractAttribute(xmlString, "sourceName"),
  };
}

/**
 * Parseia um <Workout> de uma string XML
 */
function parseWorkoutFromXmlString(xmlString: string): AppleHealthWorkout | null {
  const activityType = extractAttribute(xmlString, "workoutActivityType");
  if (!activityType) return null;

  const durationStr = extractAttribute(xmlString, "duration");

  return {
    activityType,
    duration: durationStr ? parseFloat(durationStr) : 0,
    durationUnit: extractAttribute(xmlString, "durationUnit") || "min",
    totalDistance: extractAttribute(xmlString, "totalDistance")
      ? parseFloat(extractAttribute(xmlString, "totalDistance")!)
      : undefined,
    totalDistanceUnit: extractAttribute(xmlString, "totalDistanceUnit"),
    totalEnergyBurned: extractAttribute(xmlString, "totalEnergyBurned")
      ? parseFloat(extractAttribute(xmlString, "totalEnergyBurned")!)
      : undefined,
    totalEnergyBurnedUnit: extractAttribute(xmlString, "totalEnergyBurnedUnit"),
    startDate: extractAttribute(xmlString, "startDate") || "",
    endDate: extractAttribute(xmlString, "endDate") || "",
    sourceName: extractAttribute(xmlString, "sourceName"),
  };
}

/**
 * Processa um chunk de texto e extrai records/workouts
 * Suporta tanto tags self-closing quanto tags com child elements
 */
function processChunk(
  text: string,
  records: AppleHealthRecord[],
  workouts: AppleHealthWorkout[],
  sleepEntries: AppleHealthSleepEntry[]
): string {
  // Regex para Records (sempre self-closing no Apple Health)
  const recordRegex = /<Record[^>]*\/>/g;

  // Regex para Workouts - captura AMBOS os formatos:
  // 1. Self-closing: <Workout ... />
  // 2. Com child elements: <Workout ...>...</Workout>
  const workoutSelfClosingRegex = /<Workout[^>]*\/>/g;
  const workoutWithChildrenRegex = /<Workout[^>]*>[\s\S]*?<\/Workout>/g;

  // Processa Records
  let match;
  while ((match = recordRegex.exec(text)) !== null) {
    const xmlString = match[0];

    // Verifica se é sono
    const sleepEntry = parseSleepFromXmlString(xmlString);
    if (sleepEntry) {
      sleepEntries.push(sleepEntry);
      continue;
    }

    // Tenta parsear como record normal
    const record = parseRecordFromXmlString(xmlString);
    if (record) {
      records.push(record);
    }
  }

  // Processa Workouts self-closing
  while ((match = workoutSelfClosingRegex.exec(text)) !== null) {
    const workout = parseWorkoutFromXmlString(match[0]);
    if (workout) {
      workouts.push(workout);
    }
  }

  // Processa Workouts com child elements
  while ((match = workoutWithChildrenRegex.exec(text)) !== null) {
    const workout = parseWorkoutFromXmlString(match[0]);
    if (workout) {
      workouts.push(workout);
    }
  }

  // Encontra a posição segura para cortar o buffer
  // Precisamos manter qualquer tag incompleta para o próximo chunk
  const safePosition = findSafeBufferPosition(text);
  if (safePosition > 0 && safePosition < text.length) {
    return text.substring(safePosition);
  }

  return "";
}

/**
 * Encontra a posição segura para cortar o buffer sem perder tags incompletas
 * Retorna a posição após o último elemento completo
 */
function findSafeBufferPosition(text: string): number {
  // Procura a última tag de fechamento completa
  const lastSelfClose = text.lastIndexOf("/>");
  const lastWorkoutClose = text.lastIndexOf("</Workout>");

  // Calcula posição após cada tipo de fechamento
  const afterSelfClose = lastSelfClose !== -1 ? lastSelfClose + 2 : -1;
  const afterWorkoutClose = lastWorkoutClose !== -1 ? lastWorkoutClose + 10 : -1;

  // Usa a posição mais avançada (mais dados processados)
  const bestPosition = Math.max(afterSelfClose, afterWorkoutClose);

  // Verifica se não há tags abertas após essa posição
  if (bestPosition > 0) {
    const remaining = text.substring(bestPosition);
    // Se há início de <Record ou <Workout sem fechamento, mantém no buffer
    const hasOpenRecord = remaining.includes("<Record") && !remaining.includes("/>");
    const hasOpenWorkout = remaining.includes("<Workout") &&
      !remaining.includes("/>") && !remaining.includes("</Workout>");

    if (!hasOpenRecord && !hasOpenWorkout) {
      return bestPosition;
    }

    // Tem tags abertas, recua para posição anterior
    const lastCompleteBeforeOpen = Math.min(
      remaining.indexOf("<Record") !== -1 ? bestPosition + remaining.indexOf("<Record") : Infinity,
      remaining.indexOf("<Workout") !== -1 ? bestPosition + remaining.indexOf("<Workout") : Infinity
    );

    if (lastCompleteBeforeOpen < Infinity) {
      return lastCompleteBeforeOpen;
    }
  }

  return bestPosition > 0 ? bestPosition : 0;
}

/**
 * Encontra o arquivo export.xml no ZIP
 */
function findExportXmlInZip(zip: JSZip): JSZip.JSZipObject | null {
  const possiblePaths = [
    "export.xml",
    "apple_health_export/export.xml",
    "Export.xml",
    "apple_health_export/Export.xml",
  ];

  for (const path of possiblePaths) {
    const file = zip.file(path);
    if (file) return file;
  }

  // Se não encontrou, procura por qualquer export.xml
  const allFiles = zip.file(/export\.xml$/i);
  return allFiles.length > 0 ? allFiles[0] : null;
}

/**
 * Extrai dados do Apple Health usando streaming
 * Para arquivos grandes que não cabem na memória como string
 */
async function extractAppleHealthXmlStreaming(
  zipFile: File,
  onProgress?: (percent: number) => void
): Promise<AppleHealthZipResult> {
  try {
    const zip = await JSZip.loadAsync(zipFile);
    const exportXmlFile = findExportXmlInZip(zip);

    if (!exportXmlFile) {
      return {
        success: false,
        xmlContent: null,
        error: "Arquivo export.xml não encontrado no ZIP",
        fileName: null,
        xmlSize: null,
      };
    }

    // Obtém o tamanho total para calcular progresso
    const uncompressedSize = (exportXmlFile as JSZip.JSZipObject & { _data?: { uncompressedSize?: number } })._data?.uncompressedSize || 0;

    const records: AppleHealthRecord[] = [];
    const workouts: AppleHealthWorkout[] = [];
    const sleepEntries: AppleHealthSleepEntry[] = [];
    let buffer = "";
    let processedBytes = 0;

    // Usa o método de blob para ler em chunks
    const blob = await exportXmlFile.async("blob");
    const reader = blob.stream().getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Processa qualquer texto restante no buffer
        if (buffer.length > 0) {
          processChunk(buffer, records, workouts, sleepEntries);
        }
        break;
      }

      // Decodifica o chunk
      const text = decoder.decode(value, { stream: true });
      buffer += text;

      // Atualiza progresso
      processedBytes += value.length;
      if (onProgress && uncompressedSize > 0) {
        onProgress(Math.min(100, Math.round((processedBytes / uncompressedSize) * 100)));
      }

      // Processa o buffer se tiver tamanho suficiente (1MB)
      if (buffer.length > 1024 * 1024) {
        buffer = processChunk(buffer, records, workouts, sleepEntries);
      }
    }

    return {
      success: true,
      xmlContent: null, // Não retorna XML pois foi processado em streaming
      error: null,
      fileName: exportXmlFile.name,
      xmlSize: processedBytes,
      usedStreaming: true,
      parsedData: {
        records,
        workouts,
        sleepEntries,
        glucoseEntries: [], // Glicemia não é processada via streaming ainda
        metadata: {
          exportDate: null,
          locale: null,
          totalRecords: records.length,
          totalWorkouts: workouts.length,
          totalSleepEntries: sleepEntries.length,
          totalGlucoseEntries: 0,
        },
        errors: [],
      },
    };
  } catch (error) {
    return {
      success: false,
      xmlContent: null,
      error: `Erro ao processar arquivo grande: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      fileName: null,
      xmlSize: null,
    };
  }
}

/**
 * Obtém o tamanho do XML dentro do ZIP sem extrair
 */
async function getXmlSizeFromZip(zip: JSZip): Promise<number> {
  const exportXmlFile = findExportXmlInZip(zip);
  if (!exportXmlFile) return 0;

  // Tenta obter o tamanho descomprimido dos metadados
  const fileData = exportXmlFile as JSZip.JSZipObject & { _data?: { uncompressedSize?: number } };
  return fileData._data?.uncompressedSize || 0;
}
