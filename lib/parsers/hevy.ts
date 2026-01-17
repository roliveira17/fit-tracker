/**
 * Parser para arquivos CSV do Hevy (app de musculação)
 *
 * Formato esperado do CSV:
 * title,start_time,end_time,description,exercise_title,superset_id,set_index,set_type,weight_kg,reps,distance_km,duration_seconds,rpe
 */

import type { Workout, WorkoutItem } from "@/lib/storage";

interface HevyRow {
  title: string;
  start_time: string;
  end_time: string;
  description: string;
  exercise_title: string;
  superset_id: string;
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

      // Extrai data do startTime
      const date = startTime.split(" ")[0] || startTime.split("T")[0];
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
      try {
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);
        totalDuration = Math.round((end.getTime() - start.getTime()) / 60000);
      } catch {
        // Ignora erro de parse de data
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
