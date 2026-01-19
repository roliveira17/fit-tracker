"use client";

// ========================================
// FILE HISTORY ITEM - Item de histórico
// ========================================
// Item de lista para histórico de arquivos importados
// Mostra ícone, nome, data e status

type FileStatus = "success" | "error" | "processing";

interface FileHistoryItemProps {
  fileName: string;
  dateTime: string;
  size?: string;
  status: FileStatus;
  onClick?: () => void;
}

export function FileHistoryItem({
  fileName,
  dateTime,
  size,
  status,
  onClick,
}: FileHistoryItemProps) {
  const statusConfig: Record<
    FileStatus,
    { label: string; colorClass: string; dotClass: string; animate?: boolean }
  > = {
    success: {
      label: "Sucesso",
      colorClass: "bg-green-500/10 text-green-400 border-green-500/20",
      dotClass: "bg-green-500",
    },
    error: {
      label: "Erro",
      colorClass: "bg-red-500/10 text-red-400 border-red-500/20",
      dotClass: "bg-red-500",
    },
    processing: {
      label: "Processando",
      colorClass: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      dotClass: "bg-yellow-500",
      animate: true,
    },
  };

  const config = statusConfig[status];

  // Determina o ícone baseado na extensão do arquivo
  const getFileIcon = (name: string) => {
    if (name.endsWith(".zip")) return "folder_zip";
    if (name.endsWith(".csv")) return "description";
    return "insert_drive_file";
  };

  return (
    <div
      onClick={onClick}
      className={`
        group flex items-center gap-4 bg-surface-dark p-4 rounded-xl
        border border-white/5 hover:border-primary/30 transition-all
        ${onClick ? "cursor-pointer" : ""}
      `}
    >
      {/* Icon */}
      <div className="flex items-center justify-center rounded-lg bg-icon-bg shrink-0 size-12 group-hover:bg-primary/10 transition-colors">
        <span className="material-symbols-outlined text-gray-300 group-hover:text-primary text-[24px]">
          {getFileIcon(fileName)}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col justify-center flex-1 min-w-0">
        <p className="text-base font-semibold leading-normal truncate mb-0.5 text-white">
          {fileName}
        </p>
        <p className="text-text-secondary text-xs">
          {dateTime}
          {size && ` • ${size}`}
        </p>
      </div>

      {/* Status Badge */}
      <div className="shrink-0">
        <span
          className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
            text-[11px] font-bold uppercase tracking-wider
            border ${config.colorClass}
          `}
        >
          <span
            className={`size-1.5 rounded-full ${config.dotClass} ${
              config.animate ? "animate-pulse" : ""
            }`}
          />
          {config.label}
        </span>
      </div>
    </div>
  );
}
