"use client";

import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";

interface ImportRecord {
  id: string;
  date: string;
  source: "hevy" | "apple_health";
  status: "success" | "partial" | "error";
  itemsImported: number;
}

interface ImportHistoryProps {
  records: ImportRecord[];
}

/**
 * Formata data para exibição
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

/**
 * Componente ImportHistory - Lista de importações anteriores
 */
export function ImportHistory({ records }: ImportHistoryProps) {
  if (records.length === 0) {
    return null;
  }

  const statusIcons = {
    success: { icon: CheckCircle, color: "text-green-500" },
    partial: { icon: AlertTriangle, color: "text-yellow-500" },
    error: { icon: XCircle, color: "text-red-500" },
  };

  const sourceLabels = {
    hevy: "Hevy",
    apple_health: "Apple Health",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          Histórico de Importações
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        {records.map((record) => {
          const { icon: StatusIcon, color } = statusIcons[record.status];

          return (
            <div
              key={record.id}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-3">
                <StatusIcon className={`h-4 w-4 ${color}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {sourceLabels[record.source]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(record.date)}
                  </p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                {record.itemsImported} itens
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
