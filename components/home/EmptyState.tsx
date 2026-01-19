"use client";

import { useRouter } from "next/navigation";

interface ChecklistItem {
  id: string;
  label: string;
  icon: string;
  completed: boolean;
  chatSuggestion: string;
}

interface EmptyStateProps {
  hasMeals: boolean;
  hasWeight: boolean;
  hasWorkout: boolean;
}

/**
 * Componente EmptyState - Checklist guiado
 */
export function EmptyState({ hasMeals, hasWeight, hasWorkout }: EmptyStateProps) {
  const router = useRouter();

  const items: ChecklistItem[] = [
    {
      id: "meal",
      label: "Registrar primeira refeicao",
      icon: "restaurant",
      completed: hasMeals,
      chatSuggestion: "Almocei arroz e frango",
    },
    {
      id: "weight",
      label: "Registrar peso",
      icon: "monitor_weight",
      completed: hasWeight,
      chatSuggestion: "Meu peso hoje e 75kg",
    },
    {
      id: "workout",
      label: "Registrar treino",
      icon: "fitness_center",
      completed: hasWorkout,
      chatSuggestion: "Treinei perna hoje",
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const allCompleted = completedCount === items.length;

  if (allCompleted) return null;

  const handleItemClick = (item: ChecklistItem) => {
    if (item.completed) return;
    router.push(`/chat?suggestion=${encodeURIComponent(item.chatSuggestion)}`);
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
      <div className="mb-4">
        <h2 className="text-base font-bold text-white">Vamos comecar</h2>
        <p className="mt-1 text-xs text-text-secondary">
          Complete os itens abaixo para ter uma visao completa do seu dia
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            disabled={item.completed}
            className={`flex items-center gap-3 rounded-lg p-3 text-left transition-colors ${
              item.completed
                ? "cursor-default bg-white/5"
                : "bg-icon-bg/60 hover:bg-icon-bg"
            }`}
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                item.completed
                  ? "bg-success/20 text-success"
                  : "bg-white/5 text-text-secondary"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {item.completed ? "check_circle" : "radio_button_unchecked"}
              </span>
            </div>

            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                item.completed
                  ? "bg-white/5 text-text-secondary"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {item.icon}
              </span>
            </div>

            <span
              className={`flex-1 text-sm ${
                item.completed ? "text-text-secondary line-through" : "text-white"
              }`}
            >
              {item.label}
            </span>

            {!item.completed && (
              <span className="text-xs text-text-secondary">
                Toque para registrar
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 border-t border-border-subtle pt-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary">
            {completedCount} de {items.length} completos
          </span>
          <div className="flex gap-1">
            {items.map((item) => (
              <div
                key={item.id}
                className={`h-1.5 w-6 rounded-full ${
                  item.completed ? "bg-success" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
