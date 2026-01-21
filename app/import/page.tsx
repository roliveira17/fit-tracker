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
import { parseHevyCSV } from "@/lib/parsers/hevy";
import { extractAppleHealthXml } from "@/lib/import/appleHealth";
import { parseAppleHealthXml } from "@/lib/import/appleHealthParser";
import { mapAppleHealthToEntities } from "@/lib/import/appleHealthMapper";

type ImportStatus = "idle" | "processing" | "success" | "partial" | "error";

interface ImportStats {
  workouts: number;
  weightLogs: number;
  bodyFatLogs: number;
  sleepSessions: number;
  duplicatesSkipped: number;
  errors: string[];
}

/**
 * Página de Importação de Dados
 */
export default function ImportPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const [importStats, setImportStats] = useState<ImportStats>({
    workouts: 0,
    weightLogs: 0,
    bodyFatLogs: 0,
    sleepSessions: 0,
    duplicatesSkipped: 0,
    errors: [],
  });
  const [history, setHistory] = useState<ImportRecord[]>([]);

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
      const addedWeightLogs = newWeightLogs.length > 0
        ? saveWeightLogsBatch(newWeightLogs)
        : 0;
      const addedBodyFatLogs = newBodyFatLogs.length > 0
        ? saveBodyFatLogsBatch(newBodyFatLogs)
        : 0;
      const addedWorkouts = newWorkouts.length > 0
        ? saveWorkoutsBatch(newWorkouts)
        : 0;

      const totalImported = addedWeightLogs + addedBodyFatLogs + addedWorkouts;
      const hasWarnings = duplicatesSkipped > 0 || parsedData.errors.length > 0;

      // 6. Atualiza estado
      setImportStats({
        workouts: addedWorkouts,
        weightLogs: addedWeightLogs,
        bodyFatLogs: addedBodyFatLogs,
        sleepSessions: mappedData.sleepSessions.length, // TODO: salvar quando tivermos storage
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
        duplicatesSkipped: 0,
        errors: ["Erro ao processar arquivo. Verifique se é um ZIP válido do Apple Health."],
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
          const added = saveWorkoutsBatch(result.workouts);

          const hasWarnings =
            result.errors.length > 0 || result.duplicatesSkipped > 0;

          setImportStats({
            workouts: added,
            weightLogs: 0,
            bodyFatLogs: 0,
            sleepSessions: 0,
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
      } else {
        setImportStats({
          workouts: 0,
          weightLogs: 0,
          bodyFatLogs: 0,
          sleepSessions: 0,
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
      duplicatesSkipped: 0,
      errors: [],
    });
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
              acceptedFormats={[".csv", ".zip"]}
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

          {/* Histórico */}
          <ImportHistory records={history} />
        </div>
      </div>
    </ScreenContainer>
  );
}

