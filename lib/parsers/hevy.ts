/**
 * Parser para arquivos CSV do Hevy (app de musculação)
 *
 * Formato esperado do CSV (formato real exportado do Hevy):
 * "title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"
 *
 * Exemplo de linha:
 * "2","12 Jan 2026, 12:17","12 Jan 2026, 13:07","","Triceps Pushdown",,"",0,"normal",60,8,,,
 *
 * Nota: O formato de data é "DD MMM YYYY, HH:mm" (ex: "12 Jan 2026, 12:17")
 */

import type { Workout, WorkoutItem } from "@/lib/storage";

interface HevyRow {
  title: string;
  start_time: string;
  end_time: string;
  description: string;
  exercise_title: string;
  superset_id: string;
  exercise_notes: string;
  set_index: string;
  set_type: string;
  weight_kg: string;
  reps: string;
  distance_km: string;
  duration_seconds: string;
  rpe: string;
}

interface ParseResult {
  workouts: Omit<Workout, "id" | "timestamp">[];
  errors: string[];
  duplicatesSkipped: number;
}

/**
 * Faz parse de uma linha CSV
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

/**
 * Parseia data no formato Hevy: "12 Jan 2026, 12:17"
 * Retorna Date object ou null se inválido
 */
function parseHevyDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Formato: "DD MMM YYYY, HH:mm" (ex: "12 Jan 2026, 12:17")
  const match = dateStr.match(/^(\d{1,2})\s+(\w+)\s+(\d{4}),?\s*(\d{1,2}):(\d{2})$/);
  if (match) {
    const [, day, monthStr, year, hour, minute] = match;
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const month = months[monthStr.toLowerCase()];
    if (month !== undefined) {
      return new Date(parseInt(year), month, parseInt(day), parseInt(hour), parseInt(minute));
    }
  }

  // Fallback: tenta parse nativo
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Extrai data no formato YYYY-MM-DD de uma string de data Hevy
 */
function extractDateFromHevyTime(dateStr: string): string {
  const date = parseHevyDate(dateStr);
  if (date) {
    return date.toISOString().split("T")[0];
  }

  // Fallback: tenta extrair manualmente do formato "DD MMM YYYY, HH:mm"
  const match = dateStr.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const [, day, monthStr, year] = match;
    const months: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
    };
    const month = months[monthStr.toLowerCase()] || "01";
    return `${year}-${month}-${day.padStart(2, "0")}`;
  }

  return dateStr.split(" ")[0] || dateStr.split("T")[0] || "";
}

/**
 * Converte CSV do Hevy para workouts
 */
export function parseHevyCSV(
  csvContent: string,
  existingWorkouts: Workout[]
): ParseResult {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  const errors: string[] = [];
  let duplicatesSkipped = 0;

  if (lines.length < 2) {
    return { workouts: [], errors: ["Arquivo vazio ou inválido"], duplicatesSkipped: 0 };
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const expectedHeaders = [
    "title",
    "start_time",
    "end_time",
    "exercise_title",
    "weight_kg",
    "reps",
  ];

  // Verifica se tem as colunas necessárias
  const hasRequiredColumns = expectedHeaders.every((h) =>
    headers.some((header) => header.toLowerCase().includes(h.toLowerCase()))
  );

  if (!hasRequiredColumns) {
    return {
      workouts: [],
      errors: ["Formato de CSV não reconhecido como Hevy"],
      duplicatesSkipped: 0,
    };
  }

  // Mapeia índices das colunas
  const colIndex: Record<string, number> = {};
  headers.forEach((h, i) => {
    colIndex[h.toLowerCase().replace(/\s/g, "_")] = i;
  });

  // Agrupa exercícios por sessão (título + data)
  const sessionsMap = new Map<
    string,
    {
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      exercises: Map<string, { sets: number; reps: number[]; weight: number[] }>;
    }
  >();

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      if (values.length < 4) continue;

      const title = values[colIndex["title"]] || "";
      const startTime = values[colIndex["start_time"]] || "";
      const exerciseTitle = values[colIndex["exercise_title"]] || "";
      const weightKg = parseFloat(values[colIndex["weight_kg"]] || "0");
      const reps = parseInt(values[colIndex["reps"]] || "0");

      if (!title || !startTime || !exerciseTitle) continue;

      // Extrai data do startTime usando parser específico do Hevy
      const date = extractDateFromHevyTime(startTime);
      if (!date) continue;
      const sessionKey = `${title}_${date}`;

      if (!sessionsMap.has(sessionKey)) {
        sessionsMap.set(sessionKey, {
          title,
          date,
          startTime,
          endTime: values[colIndex["end_time"]] || "",
          exercises: new Map(),
        });
      }

      const session = sessionsMap.get(sessionKey)!;

      if (!session.exercises.has(exerciseTitle)) {
        session.exercises.set(exerciseTitle, { sets: 0, reps: [], weight: [] });
      }

      const exercise = session.exercises.get(exerciseTitle)!;
      exercise.sets++;
      exercise.reps.push(reps);
      exercise.weight.push(weightKg);
    } catch (err) {
      errors.push(`Erro na linha ${i + 1}`);
    }
  }

  // Converte sessões em workouts
  const workouts: Omit<Workout, "id" | "timestamp">[] = [];
  const existingDates = new Set(existingWorkouts.map((w) => w.date));

  sessionsMap.forEach((session) => {
    // Verifica duplicata por data
    if (existingDates.has(session.date)) {
      duplicatesSkipped++;
      return;
    }

    const exercises: WorkoutItem[] = [];
    let totalDuration = 0;

    // Calcula duração se tiver start/end time
    if (session.startTime && session.endTime) {
      const start = parseHevyDate(session.startTime);
      const end = parseHevyDate(session.endTime);
      if (start && end) {
        totalDuration = Math.round((end.getTime() - start.getTime()) / 60000);
      }
    }

    session.exercises.forEach((data, name) => {
      const avgWeight =
        data.weight.reduce((a, b) => a + b, 0) / data.weight.length;
      const avgReps = Math.round(
        data.reps.reduce((a, b) => a + b, 0) / data.reps.length
      );

      exercises.push({
        type: "strength",
        name,
        sets: data.sets,
        reps: avgReps,
        // Estima calorias: ~0.5 kcal por rep por kg (aproximação)
        caloriesBurned: Math.round(data.sets * avgReps * avgWeight * 0.05),
      });
    });

    workouts.push({
      exercises,
      totalDuration: totalDuration > 0 ? totalDuration : undefined,
      totalCaloriesBurned: exercises.reduce(
        (sum, e) => sum + (e.caloriesBurned || 0),
        0
      ),
      date: session.date,
      rawText: `Importado do Hevy: ${session.title}`,
    });
  });

  return { workouts, errors, duplicatesSkipped };
}
