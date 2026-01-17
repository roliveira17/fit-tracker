"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DateNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

/**
 * Formata a data para exibição
 * Hoje → "Hoje, 17 Jan"
 * Ontem → "Ontem, 16 Jan"
 * Outros → "Seg, 15 Jan"
 */
function formatDisplayDate(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const day = date.getDate();
  const month = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);

  if (target.getTime() === today.getTime()) {
    return `Hoje, ${day} ${monthCapitalized}`;
  }

  if (target.getTime() === yesterday.getTime()) {
    return `Ontem, ${day} ${monthCapitalized}`;
  }

  const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
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

/**
 * Componente de navegação temporal
 * Permite navegar entre dias com setas ◀ ▶
 * Bloqueia navegação para datas futuras
 */
export function DateNavigator({ selectedDate, onDateChange }: DateNavigatorProps) {
  const canGoForward = !isToday(selectedDate);

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const goToNextDay = () => {
    if (!canGoForward) return;
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  return (
    <div className="flex items-center justify-between py-4">
      {/* Botão voltar */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPreviousDay}
        className="h-10 w-10"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {/* Data atual */}
      <h1 className="text-lg font-semibold text-foreground">
        {formatDisplayDate(selectedDate)}
      </h1>

      {/* Botão avançar (desabilitado se for hoje) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={goToNextDay}
        disabled={!canGoForward}
        className="h-10 w-10"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
