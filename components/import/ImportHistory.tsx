"use client";

interface ImportRecord {
  id: string;
  date: string;
  source: "hevy" | "apple_health" | "cgm";
  status: "success" | "partial" | "error";
  itemsImported: number;
}

interface ImportHistoryProps {
  records: ImportRecord[];
}

/**
 * Formata data para exibicao
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ImportHistory({ records }: ImportHistoryProps) {
  if (records.length === 0) return null;

  const statusLabel = {
    success: "Sucesso",
    partial: "Parcial",
    error: "Erro",
  };

  const statusStyles = {
    success: "bg-success/10 text-success border-success/20",
    partial: "bg-warning/10 text-warning border-warning/20",
    error: "bg-error/10 text-error border-error/20",
  };

  const statusDot = {
    success: "bg-success",
    partial: "bg-warning",
    error: "bg-error",
  };

  const sourceIcon = {
    hevy: "description",
    apple_health: "folder_zip",
    cgm: "monitoring",
  };

  const sourceLabel = {
    hevy: "Hevy",
    apple_health: "Apple Health",
    cgm: "CGM (Glicemia)",
  };

  return (
    <div className="flex flex-col gap-3">
      {records.map((record) => (
        <div
          key={record.id}
          className="group flex items-center gap-4 rounded-xl border border-white/5 bg-surface-dark p-4 transition-all hover:border-primary/30"
        >
          <div className="flex size-12 items-center justify-center rounded-lg bg-icon-bg text-primary">
            <span className="material-symbols-outlined text-[24px]">
              {sourceIcon[record.source]}
            </span>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            <p className="text-base font-semibold text-white">
              {sourceLabel[record.source]}
            </p>
            <p className="text-xs text-text-secondary">
              {formatDate(record.date)} - {record.itemsImported} itens
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${statusStyles[record.status]}`}
          >
            <span className={`size-1.5 rounded-full ${statusDot[record.status]}`} />
            {statusLabel[record.status]}
          </span>
        </div>
      ))}
    </div>
  );
}
