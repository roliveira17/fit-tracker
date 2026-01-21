"use client";

import { useState } from "react";
import {
  exportAndDownload,
  type ExportFormat,
  type ExportPeriod,
} from "@/lib/export/exportData";

interface ExportSectionProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const PERIOD_OPTIONS: { value: ExportPeriod; label: string }[] = [
  { value: "all", label: "Todos os dados" },
  { value: "1m", label: "Último mês" },
  { value: "3m", label: "Últimos 3 meses" },
  { value: "6m", label: "Últimos 6 meses" },
  { value: "1y", label: "Último ano" },
];

export function ExportSection({ onSuccess, onError }: ExportSectionProps) {
  const [format, setFormat] = useState<ExportFormat>("json");
  const [period, setPeriod] = useState<ExportPeriod>("all");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const result = await exportAndDownload({ format, period });

      if (result.success) {
        onSuccess?.();
      } else {
        onError?.(result.error || "Erro ao exportar dados");
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="rounded-xl border border-border-subtle bg-surface-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[18px] text-text-secondary">
          download
        </span>
        <h2 className="text-sm font-medium text-text-secondary">
          Exportar Dados
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {/* Seletor de formato */}
        <div>
          <label className="text-xs text-text-secondary mb-2 block">
            Formato
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setFormat("json")}
              disabled={isExporting}
              className={`
                flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all
                ${
                  format === "json"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border-subtle text-text-secondary hover:bg-surface-dark"
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  code
                </span>
                <span>JSON</span>
              </div>
            </button>

            <button
              onClick={() => setFormat("csv")}
              disabled={isExporting}
              className={`
                flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all
                ${
                  format === "csv"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border-subtle text-text-secondary hover:bg-surface-dark"
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  table_chart
                </span>
                <span>CSV</span>
              </div>
            </button>
          </div>
        </div>

        {/* Seletor de período */}
        <div>
          <label className="text-xs text-text-secondary mb-2 block">
            Período
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as ExportPeriod)}
            disabled={isExporting}
            className="w-full rounded-lg border border-border-subtle bg-surface-input px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Descrição do formato */}
        <p className="text-xs text-text-secondary">
          {format === "json"
            ? "Arquivo único com todos os dados estruturados. Ideal para backup ou migração."
            : "Múltiplos arquivos CSV em um ZIP. Ideal para análise em planilhas."}
        </p>

        {/* Botão de exportação */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <svg
                className="animate-spin size-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Exportando...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">
                download
              </span>
              <span>Exportar</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
