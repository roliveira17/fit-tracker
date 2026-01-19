"use client";

import { Header } from "@/components/ui/Header";

// ========================================
// DATE NAVIGATOR - Navegação temporal
// ========================================
// Componente wrapper que usa o Header com variant="date-nav"
// Permite navegar entre dias com setas ◀ ▶
// Bloqueia navegação para datas futuras

interface DateNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

/**
 * Formata a data para exibição
 * Hoje → "Hoje"
 * Ontem → "Ontem"
 * Outros → "Seg, 15 Jan"
 */
function formatTitle(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) {
    return "Hoje";
  }

  if (target.getTime() === yesterday.getTime()) {
    return "Ontem";
  }

  const weekday = date
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "");
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

/**
 * Formata o subtítulo (dia e mês)
 */
function formatSubtitle(date: Date): string {
  const day = date.getDate();
  const month = date
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
  const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);

  const weekday = date
    .toLocaleDateString("pt-BR", { weekday: "long" })
    .replace(".", "");
  const weekdayCapitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);

  return `${weekdayCapitalized}, ${day} ${monthCapitalized}`;
}

/**
 * Verifica se a data é hoje
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function DateNavigator({
  selectedDate,
  onDateChange,
}: DateNavigatorProps) {
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const goToNextDay = () => {
    if (isToday(selectedDate)) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  return (
    <Header
      variant="date-nav"
      title={formatTitle(selectedDate)}
      subtitle={formatSubtitle(selectedDate)}
      onPrevious={goToPreviousDay}
      onNext={isToday(selectedDate) ? undefined : goToNextDay}
    />
  );
}
