"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isOnboardingComplete,
  getWorkouts,
  getWeightLogs,
  getBodyFatLogs,
  saveWorkoutsBatch,
  saveWeightLogsBatch,
  saveBodyFatLogsBatch,
  saveImportRecord,
  getImportHistory,
  type ImportRecord,
} from "@/lib/storage";
import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import {
  importAppleHealth,
  importHevy,
  importGlucoseReadings,
} from "@/lib/supabase";
import { parseHevyCSV } from "@/lib/parsers/hevy";
import { parseCGMXlsx, cgmReadingsToSupabaseFormat } from "@/lib/parsers/cgm";
import { extractAppleHealthXml } from "@/lib/import/appleHealth";
import { parseAppleHealthXml } from "@/lib/import/appleHealthParser";
import { mapAppleHealthToEntities } from "@/lib/import/appleHealthMapper";
import { type NormalizedProduct, offProductToMealItem } from "@/lib/openfoodfacts";
import { saveMeal } from "@/lib/storage";
import { logMeal, type Meal as SupabaseMeal } from "@/lib/supabase";

export type ImportStatus = "idle" | "processing" | "success" | "partial" | "error";

export type SourceType = "apple_health" | "hevy" | "cgm" | "barcode";

export interface ImportStats {
  workouts: number;
  weightLogs: number;
  bodyFatLogs: number;
  sleepSessions: number;
  glucoseReadings: number;
  duplicatesSkipped: number;
  errors: string[];
  savedTo?: "supabase" | "local";
}

const EMPTY_STATS: ImportStats = {
  workouts: 0,
  weightLogs: 0,
  bodyFatLogs: 0,
  sleepSessions: 0,
  glucoseReadings: 0,
  duplicatesSkipped: 0,
  errors: [],
};

export function useImportLogic() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const [importStats, setImportStats] = useState<ImportStats>({ ...EMPTY_STATS });
  const [history, setHistory] = useState<ImportRecord[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<NormalizedProduct | null>(null);
  const [expandedSource, setExpandedSource] = useState<SourceType | null>(null);

  useEffect(() => {
    if (!isOnboardingComplete()) {
      router.push("/onboarding");
      return;
    }

    const records = getImportHistory();
    setHistory(records);
    setIsLoading(false);
  }, [router]);

  /**
   * Processa importação do Apple Health (ZIP)
   */
  const handleAppleHealthImport = async (file: File) => {
    try {
      const zipResult = await extractAppleHealthXml(file);

      if (!zipResult.success) {
        setImportStats({
          ...EMPTY_STATS,
          errors: [zipResult.error || "Erro ao extrair ZIP"],
        });
        setImportStatus("error");
        return;
      }

      let parsedData;
      if (zipResult.usedStreaming && zipResult.parsedData) {
        parsedData = zipResult.parsedData;
        console.log(`Streaming: ${parsedData.records.length} records, ${parsedData.workouts.length} workouts`);
      } else if (zipResult.xmlContent) {
        parsedData = parseAppleHealthXml(zipResult.xmlContent);
      } else {
        setImportStats({
          ...EMPTY_STATS,
          errors: ["Nenhum dado encontrado no arquivo"],
        });
        setImportStatus("error");
        return;
      }

      if (parsedData.errors.length > 0 && parsedData.records.length === 0) {
        setImportStats({
          ...EMPTY_STATS,
          errors: parsedData.errors,
        });
        setImportStatus("error");
        return;
      }

      const mappedData = mapAppleHealthToEntities(parsedData);

      // Debug: verifica dados mapeados
      console.log(`[Import] Dados mapeados:`, {
        weights: mappedData.weightLogs.length,
        bodyFat: mappedData.bodyFatLogs.length,
        workouts: mappedData.workouts.length,
        sleep: mappedData.sleepSessions.length,
        heartRate: mappedData.heartRateSeries.length
      });

      let addedWeightLogs = 0;
      let addedBodyFatLogs = 0;
      let addedWorkouts = 0;
      let duplicatesSkipped = 0;
      let savedTo: "supabase" | "local" = "local";

      if (user) {
        // Usuário logado: envia TUDO ao Supabase (server-side lida com duplicatas via UNIQUE constraint)
        const supabaseResult = await importAppleHealth({
          weights: mappedData.weightLogs.map(w => ({ weight: w.weight, date: w.date })),
          body_fat: mappedData.bodyFatLogs.map(b => ({ body_fat: b.percentage, date: b.date })),
          workouts: mappedData.workouts.map(w => ({
            type: w.exercises[0]?.type || "cardio",
            date: w.date,
            duration: w.totalDuration || 0,
            calories: w.totalCaloriesBurned || 0
          })),
          sleep: mappedData.sleepSessions.map(s => ({
            date: s.date,
            start: s.startTime,
            end: s.endTime,
            stages: [
              { stage: "deep", duration: s.deepMinutes, pct: s.totalMinutes > 0 ? Math.round((s.deepMinutes / s.totalMinutes) * 100) : 0 },
              { stage: "rem", duration: s.remMinutes, pct: s.totalMinutes > 0 ? Math.round((s.remMinutes / s.totalMinutes) * 100) : 0 },
              { stage: "light", duration: s.coreMinutes, pct: s.totalMinutes > 0 ? Math.round((s.coreMinutes / s.totalMinutes) * 100) : 0 },
              { stage: "awake", duration: s.awakeMinutes, pct: s.totalMinutes > 0 ? Math.round((s.awakeMinutes / s.totalMinutes) * 100) : 0 },
            ].filter(st => st.duration > 0)
          }))
        });

        addedWeightLogs = supabaseResult.imported > 0 ? mappedData.weightLogs.length : 0;
        addedBodyFatLogs = supabaseResult.imported > 0 ? mappedData.bodyFatLogs.length : 0;
        addedWorkouts = supabaseResult.imported > 0 ? mappedData.workouts.length : 0;
        duplicatesSkipped = supabaseResult.duplicates_skipped;
        savedTo = "supabase";

        console.log(`✓ Dados salvos no Supabase: ${supabaseResult.imported} registros, ${supabaseResult.duplicates_skipped} duplicatas`);
      } else {
        // Sem usuário: dedup contra localStorage e salva localmente
        const existingWeightDates = new Set(getWeightLogs().map((w) => w.date));
        const existingBodyFatDates = new Set(getBodyFatLogs().map((b) => b.date));
        const existingWorkoutDates = new Set(getWorkouts().map((w) => w.date));

        const newWeightLogs = mappedData.weightLogs.filter(
          (w) => !existingWeightDates.has(w.date)
        );
        const newBodyFatLogs = mappedData.bodyFatLogs.filter(
          (b) => !existingBodyFatDates.has(b.date)
        );
        const newWorkouts = mappedData.workouts.filter(
          (w) => !existingWorkoutDates.has(w.date)
        );

        duplicatesSkipped =
          (mappedData.weightLogs.length - newWeightLogs.length) +
          (mappedData.bodyFatLogs.length - newBodyFatLogs.length) +
          (mappedData.workouts.length - newWorkouts.length);

        addedWeightLogs = newWeightLogs.length > 0
          ? saveWeightLogsBatch(newWeightLogs)
          : 0;
        addedBodyFatLogs = newBodyFatLogs.length > 0
          ? saveBodyFatLogsBatch(newBodyFatLogs)
          : 0;
        addedWorkouts = newWorkouts.length > 0
          ? saveWorkoutsBatch(newWorkouts)
          : 0;
        savedTo = "local";

        console.log("⚠️ Dados salvos em localStorage (modo offline)");
      }

      const totalImported = addedWeightLogs + addedBodyFatLogs + addedWorkouts;
      const hasWarnings = duplicatesSkipped > 0 || parsedData.errors.length > 0;

      setImportStats({
        workouts: addedWorkouts,
        weightLogs: addedWeightLogs,
        bodyFatLogs: addedBodyFatLogs,
        sleepSessions: mappedData.sleepSessions.length,
        glucoseReadings: 0,
        duplicatesSkipped,
        errors: parsedData.errors,
        savedTo,
      });

      if (totalImported === 0 && duplicatesSkipped > 0) {
        setImportStatus("partial");
      } else if (totalImported > 0) {
        setImportStatus(hasWarnings ? "partial" : "success");
      } else {
        setImportStatus("error");
        setImportStats((prev) => ({
          ...prev,
          errors: [...prev.errors, "Nenhum dado novo encontrado no arquivo"],
        }));
      }

      saveImportRecord({
        source: "apple_health",
        status: totalImported > 0 ? (hasWarnings ? "partial" : "success") : "error",
        itemsImported: totalImported,
      });

      setHistory(getImportHistory());
    } catch (err) {
      console.error("Erro ao importar Apple Health:", err);

      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      const isSupabaseError = errorMessage.includes("Falha ao importar no Supabase");

      setImportStats({
        ...EMPTY_STATS,
        errors: [
          isSupabaseError
            ? `Erro ao salvar no servidor: ${errorMessage}`
            : "Erro ao processar arquivo. Verifique se é um ZIP válido do Apple Health.",
          isSupabaseError
            ? "Seus dados NÃO foram salvos. Tente novamente ou entre em contato com suporte."
            : ""
        ].filter(msg => msg.length > 0),
      });
      setImportStatus("error");
    }
  };

  /**
   * Processa importação de CGM (XLSX)
   */
  const handleCGMImport = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const result = parseCGMXlsx(buffer, file.name);

      if (result.errors.length > 0 && result.readings.length === 0) {
        setImportStats({
          ...EMPTY_STATS,
          errors: result.errors,
        });
        setImportStatus("error");
        return;
      }

      let addedReadings = 0;

      if (user) {
        try {
          const supabaseData = cgmReadingsToSupabaseFormat(result.readings);

          addedReadings = await importGlucoseReadings(
            supabaseData.map(reading => ({
              glucose_mg_dl: reading.glucose,
              date: reading.date,
              time: reading.time,
              measurement_type: reading.type as "cgm" | "fasting" | "post_meal" | "random",
              notes: reading.notes,
              source: "import_csv",
            }))
          );
        } catch (error) {
          console.error("Erro ao importar CGM no Supabase:", error);
          setImportStats({
            ...EMPTY_STATS,
            errors: [`Erro ao salvar no servidor: ${error instanceof Error ? error.message : "Erro desconhecido"}`],
          });
          setImportStatus("error");
          return;
        }
      } else {
        setImportStats({
          ...EMPTY_STATS,
          errors: ["Faça login para importar dados de glicemia"],
        });
        setImportStatus("error");
        return;
      }

      const hasWarnings = result.errors.length > 0;

      setImportStats({
        ...EMPTY_STATS,
        glucoseReadings: addedReadings,
        errors: result.errors,
      });
      setImportStatus(hasWarnings ? "partial" : "success");

      saveImportRecord({
        source: "cgm",
        status: hasWarnings ? "partial" : "success",
        itemsImported: addedReadings,
      });

      setHistory(getImportHistory());
    } catch (err) {
      console.error("Erro ao importar CGM:", err);
      setImportStats({
        ...EMPTY_STATS,
        errors: ["Erro ao processar arquivo XLSX de glicemia."],
      });
      setImportStatus("error");
    }
  };

  const handleFileSelect = async (file: File) => {
    setImportStatus("processing");

    try {
      const content = await file.text();
      const existingWorkouts = getWorkouts();

      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".csv")) {
        const result = parseHevyCSV(content, existingWorkouts);

        if (result.workouts.length === 0 && result.errors.length > 0) {
          setImportStats({
            ...EMPTY_STATS,
            duplicatesSkipped: result.duplicatesSkipped,
            errors: result.errors,
          });
          setImportStatus("error");

          saveImportRecord({
            source: "hevy",
            status: "error",
            itemsImported: 0,
          });
        } else if (result.workouts.length > 0) {
          let added = 0;

          if (user) {
            try {
              const hevyWorkouts = result.workouts.map(w => ({
                date: w.date,
                name: w.exercises.map(e => e.name).join(", "),
                exercises: w.exercises.map(e => ({
                  name: e.name,
                  sets: Array.from({ length: e.sets || 1 }, () => ({
                    weight: 0,
                    reps: e.reps || 0
                  }))
                }))
              }));
              const supabaseResult = await importHevy(hevyWorkouts);
              if (supabaseResult) {
                added = result.workouts.length;
              }
            } catch (error) {
              console.error("Erro ao importar Hevy no Supabase:", error);
            }
          } else {
            added = saveWorkoutsBatch(result.workouts);
          }

          const hasWarnings =
            result.errors.length > 0 || result.duplicatesSkipped > 0;

          setImportStats({
            ...EMPTY_STATS,
            workouts: added,
            duplicatesSkipped: result.duplicatesSkipped,
            errors: result.errors,
          });
          setImportStatus(hasWarnings ? "partial" : "success");

          saveImportRecord({
            source: "hevy",
            status: hasWarnings ? "partial" : "success",
            itemsImported: added,
          });
        } else {
          setImportStats({
            ...EMPTY_STATS,
            duplicatesSkipped: result.duplicatesSkipped,
            errors: ["Nenhum treino novo encontrado no arquivo"],
          });
          setImportStatus("partial");

          saveImportRecord({
            source: "hevy",
            status: "partial",
            itemsImported: 0,
          });
        }

        setHistory(getImportHistory());
      } else if (fileName.endsWith(".zip")) {
        await handleAppleHealthImport(file);
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        await handleCGMImport(file);
      } else {
        setImportStats({
          ...EMPTY_STATS,
          errors: ["Formato de arquivo não reconhecido"],
        });
        setImportStatus("error");
      }
    } catch (err) {
      console.error("Erro ao processar arquivo:", err);
      setImportStats({
        ...EMPTY_STATS,
        errors: ["Erro ao ler o arquivo. Verifique se é um arquivo válido."],
      });
      setImportStatus("error");
    }
  };

  const handleDismissResult = () => {
    setImportStatus("idle");
    setImportStats({ ...EMPTY_STATS });
  };

  const handleProductScanned = (product: NormalizedProduct) => {
    setShowScanner(false);
    setScannedProduct(product);
  };

  const handleAddScannedProduct = async (grams: number) => {
    if (!scannedProduct) return;

    const mealItem = offProductToMealItem(scannedProduct, grams);

    saveMeal({
      type: "snack",
      items: [
        {
          name: mealItem.name,
          quantity: mealItem.grams,
          unit: "g",
          calories: mealItem.calories,
          protein: mealItem.protein,
          carbs: mealItem.carbs,
          fat: mealItem.fat,
        },
      ],
      totalCalories: mealItem.calories,
      totalProtein: mealItem.protein,
      totalCarbs: mealItem.carbs,
      totalFat: mealItem.fat,
      rawText: `${grams}g ${mealItem.name} (barcode)`,
    });

    if (user) {
      await logMeal("snack" as SupabaseMeal["meal_type"], [
        {
          food_name: mealItem.name,
          quantity_g: mealItem.grams,
          calories: mealItem.calories,
          protein_g: mealItem.protein,
          carbs_g: mealItem.carbs,
          fat_g: mealItem.fat,
        },
      ], `${grams}g ${mealItem.name} (barcode)`);
    }

    setScannedProduct(null);
    alert(`${mealItem.name} adicionado!`);
  };

  return {
    isLoading: isLoading || authLoading,
    importStatus,
    importStats,
    history,
    showScanner,
    scannedProduct,
    expandedSource,
    setExpandedSource,
    setShowScanner,
    setScannedProduct,
    handleFileSelect,
    handleDismissResult,
    handleProductScanned,
    handleAddScannedProduct,
  };
}
