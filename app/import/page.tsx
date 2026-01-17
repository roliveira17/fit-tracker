"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { FileDropzone } from "@/components/import/FileDropzone";
import { ImportResult } from "@/components/import/ImportResult";
import { ImportHistory } from "@/components/import/ImportHistory";
import {
  isOnboardingComplete,
  getWorkouts,
  saveWorkoutsBatch,
  saveImportRecord,
  getImportHistory,
  type ImportRecord,
} from "@/lib/storage";
import { parseHevyCSV } from "@/lib/parsers/hevy";
import { Upload, FileSpreadsheet, Apple } from "lucide-react";

type ImportStatus = "idle" | "processing" | "success" | "partial" | "error";

interface ImportStats {
  workouts: number;
  weightLogs: number;
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
        // Apple Health - não implementado ainda
        setImportStats({
          workouts: 0,
          weightLogs: 0,
          duplicatesSkipped: 0,
          errors: ["Apple Health ainda não suportado. Use arquivos CSV do Hevy."],
        });
        setImportStatus("error");
      } else {
        setImportStats({
          workouts: 0,
          weightLogs: 0,
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
        duplicatesSkipped: 0,
        errors: ["Erro ao ler o arquivo. Verifique se é um CSV válido."],
      });
      setImportStatus("error");
    }
  };

  const handleDismissResult = () => {
    setImportStatus("idle");
    setImportStats({
      workouts: 0,
      weightLogs: 0,
      duplicatesSkipped: 0,
      errors: [],
    });
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <div className="flex flex-1 flex-col pb-4">
        {/* Header */}
        <div className="py-4">
          <h1 className="text-xl font-bold text-foreground">Importar Dados</h1>
          <p className="text-sm text-muted-foreground">
            Importe treinos de outros apps
          </p>
        </div>

        <div className="flex flex-col gap-4">
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
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Fontes Suportadas
            </h3>

            <div className="flex flex-col gap-3">
              {/* Hevy */}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                  <FileSpreadsheet className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Hevy</p>
                  <p className="text-xs text-muted-foreground">
                    Exporte seus treinos em CSV pelo app
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs">
                    Disponível
                  </span>
                </div>
              </div>

              {/* Apple Health */}
              <div className="flex items-start gap-3 opacity-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <Apple className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Apple Health
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Peso, cardio e sono
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                    Em breve
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Como exportar do Hevy */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Como exportar do Hevy
            </h3>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-2">
              <li>Abra o Hevy e vá em Settings</li>
              <li>Toque em "Export Data"</li>
              <li>Escolha "Export as CSV"</li>
              <li>Salve o arquivo e importe aqui</li>
            </ol>
          </div>

          {/* Histórico */}
          <ImportHistory records={history} />
        </div>
      </div>
    </ScreenContainer>
  );
}
