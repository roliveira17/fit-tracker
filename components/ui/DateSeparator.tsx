"use client";

// ========================================
// DATE SEPARATOR - Separador de data
// ========================================
// Usado no chat para separar mensagens por dia
// Exibe "Hoje", "Ontem" ou a data formatada

interface DateSeparatorProps {
  date: Date | string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const formatDate = (d: Date | string): string => {
    const dateObj = typeof d === "string" ? new Date(d) : d;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const target = new Date(dateObj);
    target.setHours(0, 0, 0, 0);

    if (target.getTime() === today.getTime()) {
      return "Hoje";
    }

    if (target.getTime() === yesterday.getTime()) {
      return "Ontem";
    }

    // Formata como "15 Jan"
    const day = dateObj.getDate();
    const month = dateObj
      .toLocaleDateString("pt-BR", { month: "short" })
      .replace(".", "");
    const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);

    return `${day} ${monthCapitalized}`;
  };

  return (
    <div className="flex justify-center">
      <span className="text-xs font-medium text-neutral-500 py-1 px-3 bg-white/5 rounded-full">
        {formatDate(date)}
      </span>
    </div>
  );
}
