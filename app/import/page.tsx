"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Header } from "@/components/ui/Header";
import { FileDropzone } from "@/components/import/FileDropzone";
import { ImportResult } from "@/components/import/ImportResult";
import { ImportHistory } from "@/components/import/ImportHistory";
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
import {
  BarcodeScanner,
  ScannedProductCard,
} from "@/components/import/BarcodeScanner";
import { type NormalizedProduct, offProductToMealItem } from "@/lib/openfoodfacts";
import { saveMeal } from "@/lib/storage";
import { logMeal, type Meal as SupabaseMeal } from "@/lib/supabase";

type ImportStatus = "idle" | "processing" | "success" | "partial" | "error";

interface ImportStats {
  workouts: number;
  weightLogs: number;
  bodyFatLogs: number;
  sleepSessions: number;
  glucoseReadings: number;
  duplicatesSkipped: number;
  errors: string[];
}

/**
 * Página de Importação de Dados
 */
export default function ImportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const [importStats, setImportStats] = useState<ImportStats>({
    workouts: 0,
    weightLogs: 0,
    bodyFatLogs: 0,
    sleepSessions: 0,
    glucoseReadings: 0,
    duplicatesSkipped: 0,
    errors: [],
  });
  const [history, setHistory] = useState<ImportRecord[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<NormalizedProduct | null>(null);

  useEffect(() => {
    if (!isOnboardingComplete()) {
      router.push("/onboarding");
      return;
    }

    // Carrega histórico
    const records = getImportHistory();
    setHistory(records);

    setIsLoading(false);
  }, [router]);

  /**
   * Processa importação do Apple Health (ZIP)
   */
  const handleAppleHealthImport = async (file: File) => {
    try {
      // 1. Extrai XML do ZIP (pode usar streaming para arquivos grandes)
      const zipResult = await extractAppleHealthXml(file);

      if (!zipResult.success) {
        setImportStats({
          workouts: 0,
          weightLogs: 0,
          bodyFatLogs: 0,
          sleepSessions: 0,
          glucoseReadings: 0,
          duplicatesSkipped: 0,
          errors: [zipResult.error || "Erro ao extrair ZIP"],
        });
        setImportStatus("error");
        return;
      }

      // 2. Obtém dados parseados
      // Se usou streaming, já vem parseado; caso contrário, parseia o XML
      let parsedData;
      if (zipResult.usedStreaming && zipResult.parsedData) {
        // Streaming já retorna dados parseados
        parsedData = zipResult.parsedData;
        console.log(`Streaming: ${parsedData.records.length} records, ${parsedData.workouts.length} workouts`);
      } else if (zipResult.xmlContent) {
        // Método direto: precisa parsear XML
        parsedData = parseAppleHealthXml(zipResult.xmlContent);
      } else {
        setImportStats({
          workouts: 0,
          weightLogs: 0,
          bodyFatLogs: 0,
          sleepSessions: 0,
          glucoseReadings: 0,
          duplicatesSkipped: 0,
          errors: ["Nenhum dado encontrado no arquivo"],
        });
        setImportStatus("error");
        return;
      }

      if (parsedData.errors.length > 0 && parsedData.records.length === 0) {
        setImportStats({
          workouts: 0,
          weightLogs: 0,
          bodyFatLogs: 0,
          sleepSessions: 0,
          glucoseReadings: 0,
          duplicatesSkipped: 0,
          errors: parsedData.errors,
        });
        setImportStatus("error");
        return;
      }

      // 3. Mapeia para entidades do app
      const mappedData = mapAppleHealthToEntities(parsedData);

      // 4. Detecta duplicatas
      const existingWeightLogs = getWeightLogs();
      const existingBodyFatLogs = getBodyFatLogs();
      const existingWorkouts = getWorkouts();

      const existingWeightDates = new Set(existingWeightLogs.map((w) => w.date));
      const existingBodyFatDates = new Set(existingBodyFatLogs.map((b) => b.date));
      const existingWorkoutDates = new Set(existingWorkouts.map((w) => w.date));

      // Filtra duplicatas
      const newWeightLogs = mappedData.weightLogs.filter(
        (w) => !existingWeightDates.has(w.date)
      );
      const newBodyFatLogs = mappedData.bodyFatLogs.filter(
        (b) => !existingBodyFatDates.has(b.date)
      );
      const newWorkouts = mappedData.workouts.filter(
        (w) => !existingWorkoutDates.has(w.date)
      );

      const duplicatesSkipped =
        (mappedData.weightLogs.length - newWeightLogs.length) +
        (mappedData.bodyFatLogs.length - newBodyFatLogs.length) +
        (mappedData.workouts.length - newWorkouts.length);

      // 5. Salva dados
      let addedWeightLogs = 0;
      let addedBodyFatLogs = 0;
      let addedWorkouts = 0;

      // Se usuário logado, salva no Supabase
      if (user) {
        try {
          const supabaseResult = await importAppleHealth({
            weights: newWeightLogs.map(w => ({ weight: w.weight, date: w.date })),
            body_fat: newBodyFatLogs.map(b => ({ body_fat: b.percentage, date: b.date })),
            workouts: newWorkouts.map(w => ({
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
          if (supabaseResult) {
            addedWeightLogs = newWeightLogs.length;
            addedBodyFatLogs = newBodyFatLogs.length;
            addedWorkouts = newWorkouts.length;
          }
        } catch (error) {
          console.error("Erro ao importar no Supabase:", error);
        }
      }

      // Sempre salva no localStorage como fallback
      addedWeightLogs = newWeightLogs.length > 0
        ? saveWeightLogsBatch(newWeightLogs)
        : addedWeightLogs;
      addedBodyFatLogs = newBodyFatLogs.length > 0
        ? saveBodyFatLogsBatch(newBodyFatLogs)
        : addedBodyFatLogs;
      addedWorkouts = newWorkouts.length > 0
        ? saveWorkoutsBatch(newWorkouts)
        : addedWorkouts;

      const totalImported = addedWeightLogs + addedBodyFatLogs + addedWorkouts;
      const hasWarnings = duplicatesSkipped > 0 || parsedData.errors.length > 0;

      // 6. Atualiza estado
      setImportStats({
        workouts: addedWorkouts,
        weightLogs: addedWeightLogs,
        bodyFatLogs: addedBodyFatLogs,
        sleepSessions: mappedData.sleepSessions.length,
        glucoseReadings: 0,
        duplicatesSkipped,
        errors: parsedData.errors,
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

      // 7. Registra importação
      saveImportRecord({
        source: "apple_health",
        status: totalImported > 0 ? (hasWarnings ? "partial" : "success") : "error",
        itemsImported: totalImported,
      });

      // 8. Atualiza histórico
      setHistory(getImportHistory());
    } catch (err) {
      console.error("Erro ao importar Apple Health:", err);
      setImportStats({
        workouts: 0,
        weightLogs: 0,
        bodyFatLogs: 0,
        sleepSessions: 0,
        glucoseReadings: 0,
        duplicatesSkipped: 0,
        errors: ["Erro ao processar arquivo. Verifique se é um ZIP válido do Apple Health."],
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
          workouts: 0,
          weightLogs: 0,
          bodyFatLogs: 0,
          sleepSessions: 0,
          glucoseReadings: 0,
          duplicatesSkipped: 0,
          errors: result.errors,
        });
        setImportStatus("error");
        return;
      }

      let addedReadings = 0;

      // Se usuário logado, salva no Supabase
      if (user) {
        try {
          const supabaseData = cgmReadingsToSupabaseFormat(result.readings);

          // Salva leituras em batch no Supabase
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
          // Continua para mostrar resultado parcial
        }
      } else {
        // Sem login, não salva CGM (precisa de Supabase para glicemia)
        setImportStats({
          workouts: 0,
          weightLogs: 0,
          bodyFatLogs: 0,
          sleepSessions: 0,
          glucoseReadings: 0,
          duplicatesSkipped: 0,
          errors: ["Faça login para importar dados de glicemia"],
        });
        setImportStatus("error");
        return;
      }

      const hasWarnings = result.errors.length > 0;

      setImportStats({
        workouts: 0,
        weightLogs: 0,
        bodyFatLogs: 0,
        sleepSessions: 0,
        glucoseReadings: addedReadings,
        duplicatesSkipped: 0,
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
        workouts: 0,
        weightLogs: 0,
        bodyFatLogs: 0,
        sleepSessions: 0,
        glucoseReadings: 0,
        duplicatesSkipped: 0,
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

      // Detecta tipo de arquivo
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".csv")) {
        // Tenta parser do Hevy
        const result = parseHevyCSV(content, existingWorkouts);

        if (result.workouts.length === 0 && result.errors.length > 0) {
          // Erro total
          setImportStats({
            workouts: 0,
            weightLogs: 0,
            bodyFatLogs: 0,
            sleepSessions: 0,
            glucoseReadings: 0,
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
          // Salva workouts
          let added = 0;

          // Se usuário logado, salva no Supabase
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
          }

          // Sempre salva no localStorage como fallback
          added = saveWorkoutsBatch(result.workouts);

          const hasWarnings =
            result.errors.length > 0 || result.duplicatesSkipped > 0;

          setImportStats({
            workouts: added,
            weightLogs: 0,
            bodyFatLogs: 0,
            sleepSessions: 0,
            glucoseReadings: 0,
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
          // Nenhum workout mas sem erros críticos
          setImportStats({
            workouts: 0,
            weightLogs: 0,
            bodyFatLogs: 0,
            sleepSessions: 0,
            glucoseReadings: 0,
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

        // Atualiza histórico
        setHistory(getImportHistory());
      } else if (fileName.endsWith(".zip")) {
        // Apple Health
        await handleAppleHealthImport(file);
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        // CGM (glicemia)
        await handleCGMImport(file);
      } else {
        setImportStats({
          workouts: 0,
          weightLogs: 0,
          bodyFatLogs: 0,
          sleepSessions: 0,
          glucoseReadings: 0,
          duplicatesSkipped: 0,
          errors: ["Formato de arquivo não reconhecido"],
        });
        setImportStatus("error");
      }
    } catch (err) {
      console.error("Erro ao processar arquivo:", err);
      setImportStats({
        workouts: 0,
        weightLogs: 0,
        bodyFatLogs: 0,
        sleepSessions: 0,
        glucoseReadings: 0,
        duplicatesSkipped: 0,
        errors: ["Erro ao ler o arquivo. Verifique se é um arquivo válido."],
      });
      setImportStatus("error");
    }
  };

  const handleDismissResult = () => {
    setImportStatus("idle");
    setImportStats({
      workouts: 0,
      weightLogs: 0,
      bodyFatLogs: 0,
      sleepSessions: 0,
      glucoseReadings: 0,
      duplicatesSkipped: 0,
      errors: [],
    });
  };

  // Handlers do Barcode Scanner
  const handleProductScanned = (product: NormalizedProduct) => {
    setShowScanner(false);
    setScannedProduct(product);
  };

  const handleAddScannedProduct = async (grams: number) => {
    if (!scannedProduct) return;

    const mealItem = offProductToMealItem(scannedProduct, grams);

    // Salva no localStorage
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

    // Se logado, salva também no Supabase
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

  if (isLoading) {
    return (
      <ScreenContainer className="bg-background-dark text-white">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background-dark text-white">
      <div className="flex flex-1 flex-col pb-4">
        <div className="-mx-6">
          <Header variant="simple" title="Importar dados" />
        </div>
        <p className="text-xs text-text-secondary">
          Importe treinos de outros apps
        </p>

        <div className="flex flex-col gap-6 pt-4">
          {/* Resultado da importação */}
          {(importStatus === "success" ||
            importStatus === "partial" ||
            importStatus === "error") && (
            <ImportResult
              status={importStatus}
              stats={importStats}
              onDismiss={handleDismissResult}
            />
          )}

          {/* Área de upload */}
          {importStatus === "idle" || importStatus === "processing" ? (
            <FileDropzone
              onFileSelect={handleFileSelect}
              acceptedFormats={[".csv", ".zip", ".xlsx", ".xls"]}
              isLoading={importStatus === "processing"}
            />
          ) : null}

          {/* Fontes suportadas */}
          <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
            <h3 className="mb-4 text-sm font-medium text-text-secondary">
              Fontes suportadas
            </h3>

            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[20px]">
                    description
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Hevy</p>
                  <p className="text-xs text-text-secondary">
                    Exporte seus treinos em CSV pelo app
                  </p>
                  <span className="mt-1 inline-block rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-success">
                    Disponivel
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error/10 text-error">
                  <span className="material-symbols-outlined text-[20px]">
                    favorite
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Apple Health</p>
                  <p className="text-xs text-text-secondary">
                    Peso, body fat, treinos e sono
                  </p>
                  <span className="mt-1 inline-block rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-success">
                    Disponível
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                  <span className="material-symbols-outlined text-[20px]">
                    monitoring
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">CGM (Glicemia)</p>
                  <p className="text-xs text-text-secondary">
                    SiSensing, FreeStyle Libre e outros
                  </p>
                  <span className="mt-1 inline-block rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-success">
                    Disponível
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Barcode Scanner */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <span className="material-symbols-outlined text-[24px]">
                  barcode_scanner
                </span>
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-white">Scanner de Código de Barras</p>
                <p className="text-xs text-text-secondary">
                  31K+ produtos brasileiros via Open Food Facts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black hover:bg-primary/90"
              >
                Escanear
              </button>
            </div>
          </div>

          {/* Como exportar */}
          <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
            <h3 className="text-sm font-medium text-text-secondary mb-3">
              Como exportar do Hevy
            </h3>
            <ol className="text-sm text-text-secondary list-decimal list-inside space-y-2">
              <li>Abra o Hevy e vá em Settings</li>
              <li>Toque em "Export Data"</li>
              <li>Escolha "Export as CSV"</li>
              <li>Salve o arquivo e importe aqui</li>
            </ol>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
            <h3 className="text-sm font-medium text-text-secondary mb-3">
              Como exportar do Apple Health
            </h3>
            <ol className="text-sm text-text-secondary list-decimal list-inside space-y-2">
              <li>No iPhone, abra o app Saúde</li>
              <li>Toque na sua foto de perfil</li>
              <li>Role até "Exportar Dados de Saúde"</li>
              <li>Confirme e aguarde a exportação</li>
              <li>Envie o ZIP para este dispositivo</li>
            </ol>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
            <h3 className="text-sm font-medium text-text-secondary mb-3">
              Como exportar dados de glicemia (CGM)
            </h3>
            <ol className="text-sm text-text-secondary list-decimal list-inside space-y-2">
              <li>Abra o app do seu CGM (SiSensing, Libre, etc.)</li>
              <li>Procure a opção de exportar dados</li>
              <li>Exporte como XLSX ou Excel</li>
              <li>Importe o arquivo aqui</li>
            </ol>
            <p className="mt-2 text-xs text-text-tertiary">
              Requer login para salvar dados de glicemia.
            </p>
          </div>

          {/* Histórico */}
          <ImportHistory records={history} />
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onProductScanned={handleProductScanned}
          onError={(error) => console.error("Scanner error:", error)}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Scanned Product Card */}
      {scannedProduct && (
        <ScannedProductCard
          product={scannedProduct}
          onAddToMeal={handleAddScannedProduct}
          onScanAnother={() => {
            setScannedProduct(null);
            setShowScanner(true);
          }}
          onClose={() => setScannedProduct(null)}
        />
      )}
    </ScreenContainer>
  );
}

