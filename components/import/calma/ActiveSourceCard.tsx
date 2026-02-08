"use client";

import type { ImportStatus, ImportStats, SourceType } from "@/hooks/useImportLogic";
import { InlineDropzone } from "./InlineDropzone";
import { ImportResultCalma } from "./ImportResultCalma";

interface ActiveSourceCardProps {
  source: SourceType;
  isExpanded: boolean;
  onToggle: () => void;
  importStatus: ImportStatus;
  importStats: ImportStats;
  onFileSelect: (file: File) => void;
  onDismissResult: () => void;
  onScannerOpen?: () => void;
  isProcessing?: boolean;
}

const SOURCE_CONFIG: Record<
  SourceType,
  {
    icon: string;
    label: string;
    subtitle: string;
    iconColor: string;
    iconBg: string;
    acceptedFormats: string[];
  }
> = {
  apple_health: {
    icon: "favorite",
    label: "Apple Health",
    subtitle: "Peso, body fat, treinos e sono",
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    acceptedFormats: [".zip"],
  },
  hevy: {
    icon: "fitness_center",
    label: "Hevy",
    subtitle: "Treinos & Medidas",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    acceptedFormats: [".csv"],
  },
  cgm: {
    icon: "monitoring",
    label: "CGM (Glicemia)",
    subtitle: "SiSensing, FreeStyle Libre",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    acceptedFormats: [".xlsx", ".xls"],
  },
  barcode: {
    icon: "barcode_scanner",
    label: "Scanner de Barras",
    subtitle: "31K+ produtos brasileiros",
    iconColor: "text-calma-primary",
    iconBg: "bg-calma-accent-10",
    acceptedFormats: [],
  },
};

export function ActiveSourceCard({
  source,
  isExpanded,
  onToggle,
  importStatus,
  importStats,
  onFileSelect,
  onDismissResult,
  onScannerOpen,
  isProcessing = false,
}: ActiveSourceCardProps) {
  const config = SOURCE_CONFIG[source];
  const isBarcode = source === "barcode";
  const showResult =
    importStatus === "success" ||
    importStatus === "partial" ||
    importStatus === "error";
  const disabled = isProcessing && !isExpanded;

  const handleClick = () => {
    if (disabled) return;
    if (isBarcode && onScannerOpen) {
      onScannerOpen();
      return;
    }
    onToggle();
  };

  return (
    <div
      className={`
        rounded-xl bg-calma-surface border shadow-sm transition-all duration-300
        ${isExpanded ? "border-calma-primary/20 shadow-md" : "border-calma-border hover:shadow-md"}
        ${disabled ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      {/* Card header */}
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${config.iconBg}`}
        >
          <span className={`material-symbols-outlined text-2xl ${config.iconColor}`}>
            {config.icon}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-calma-text">{config.label}</h3>
          <p className="text-xs text-calma-text-muted">{config.subtitle}</p>
        </div>

        {/* Right side indicator */}
        {isBarcode ? (
          <div className="flex items-center gap-1 bg-calma-accent-10 px-3 py-1.5 rounded-full">
            <span className="text-xs font-medium text-calma-primary">
              Escanear
            </span>
          </div>
        ) : source === "apple_health" && !isExpanded ? (
          <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-calma-pulse" />
            <span className="text-xs font-medium text-green-700">
              Syncing
            </span>
          </div>
        ) : source === "hevy" && !isExpanded ? (
          <div className="w-10 h-6 bg-calma-primary rounded-full relative">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
          </div>
        ) : !isExpanded ? (
          <span className="material-symbols-outlined text-calma-text-muted text-xl">
            chevron_right
          </span>
        ) : (
          <span className="material-symbols-outlined text-calma-primary text-xl">
            expand_less
          </span>
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && !isBarcode && (
        <div className="animate-calma-slide-down border-t border-calma-border px-5 pb-5 pt-4">
          {showResult ? (
            <ImportResultCalma
              status={importStatus as "success" | "partial" | "error"}
              stats={importStats}
              onDismiss={onDismissResult}
            />
          ) : (
            <div className="space-y-3">
              <InlineDropzone
                onFileSelect={onFileSelect}
                acceptedFormats={config.acceptedFormats}
                isLoading={importStatus === "processing"}
              />
              {source === "apple_health" && (
                <HelpText
                  steps={[
                    "No iPhone, abra o app Saude",
                    'Toque na sua foto de perfil',
                    'Role ate "Exportar Dados de Saude"',
                    "Confirme e envie o ZIP",
                  ]}
                />
              )}
              {source === "hevy" && (
                <HelpText
                  steps={[
                    "Abra o Hevy e va em Settings",
                    'Toque em "Export Data"',
                    'Escolha "Export as CSV"',
                    "Salve e importe o arquivo aqui",
                  ]}
                />
              )}
              {source === "cgm" && (
                <HelpText
                  steps={[
                    "Abra o app do seu CGM",
                    "Procure a opcao de exportar dados",
                    "Exporte como XLSX ou Excel",
                    "Importe o arquivo aqui",
                  ]}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HelpText({ steps }: { steps: string[] }) {
  return (
    <div className="rounded-lg bg-calma-surface-alt p-3">
      <p className="text-xs font-medium text-calma-text-secondary mb-2">
        Como exportar:
      </p>
      <ol className="text-xs text-calma-text-muted list-decimal list-inside space-y-1">
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
