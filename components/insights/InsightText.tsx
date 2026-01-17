"use client";

import { Lightbulb, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface InsightTextProps {
  type: "info" | "positive" | "warning" | "neutral";
  title: string;
  description: string;
}

/**
 * Componente InsightText - Card de insight textual
 * Exibe observações baseadas nos dados
 */
export function InsightText({ type, title, description }: InsightTextProps) {
  const config = {
    info: {
      icon: Info,
      bg: "bg-blue-500/10 border-blue-500/20",
      iconColor: "text-blue-500",
    },
    positive: {
      icon: CheckCircle,
      bg: "bg-green-500/10 border-green-500/20",
      iconColor: "text-green-500",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-yellow-500/10 border-yellow-500/20",
      iconColor: "text-yellow-500",
    },
    neutral: {
      icon: Lightbulb,
      bg: "bg-muted/50 border-border",
      iconColor: "text-muted-foreground",
    },
  };

  const { icon: Icon, bg, iconColor } = config[type];

  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 ${iconColor}`} />
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}
