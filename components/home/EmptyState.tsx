"use client";

import { useRouter } from "next/navigation";
import { Check, Circle, Utensils, Scale, Dumbbell } from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  icon: React.ReactNode;
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
 * Exibido quando o usuário não tem dados suficientes
 * Cada item leva ao Chat com uma sugestão contextual
 */
export function EmptyState({ hasMeals, hasWeight, hasWorkout }: EmptyStateProps) {
  const router = useRouter();

  const items: ChecklistItem[] = [
    {
      id: "meal",
      label: "Registrar primeira refeição",
      icon: <Utensils className="h-4 w-4" />,
      completed: hasMeals,
      chatSuggestion: "Almocei arroz e frango",
    },
    {
      id: "weight",
      label: "Registrar peso",
      icon: <Scale className="h-4 w-4" />,
      completed: hasWeight,
      chatSuggestion: "Meu peso hoje é 75kg",
    },
    {
      id: "workout",
      label: "Registrar treino",
      icon: <Dumbbell className="h-4 w-4" />,
      completed: hasWorkout,
      chatSuggestion: "Treinei perna hoje",
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const allCompleted = completedCount === items.length;

  // Se tudo está completo, não mostra o EmptyState
  if (allCompleted) {
    return null;
  }

  const handleItemClick = (item: ChecklistItem) => {
    if (item.completed) return;
    // Navega para o Chat com a sugestão como query param
    router.push(`/chat?suggestion=${encodeURIComponent(item.chatSuggestion)}`);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">
          Vamos começar
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Complete os itens abaixo para ter uma visão completa do seu dia
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
                ? "bg-muted/30 cursor-default"
                : "bg-muted/50 hover:bg-muted cursor-pointer"
            }`}
          >
            {/* Ícone de status */}
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                item.completed
                  ? "bg-green-500/20 text-green-500"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {item.completed ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
            </div>

            {/* Ícone do tipo */}
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                item.completed
                  ? "bg-muted/50 text-muted-foreground"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {item.icon}
            </div>

            {/* Label */}
            <span
              className={`flex-1 text-sm ${
                item.completed
                  ? "text-muted-foreground line-through"
                  : "text-foreground"
              }`}
            >
              {item.label}
            </span>

            {/* Indicador de ação */}
            {!item.completed && (
              <span className="text-xs text-muted-foreground">
                Toque para registrar
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Progresso */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {completedCount} de {items.length} completos
          </span>
          <div className="flex gap-1">
            {items.map((item) => (
              <div
                key={item.id}
                className={`h-1.5 w-6 rounded-full ${
                  item.completed ? "bg-green-500" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
