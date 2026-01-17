"use client";

import { Flame, Calendar } from "lucide-react";

interface ProgressCardProps {
  streak: number;          // Dias consecutivos
  lastActiveDate: string | null;  // Última data com registro
}

/**
 * Componente ProgressCard - Mostra streak de dias consecutivos
 * Streak = dias seguidos com pelo menos 1 registro (refeição, peso ou treino)
 */
export function ProgressCard({ streak, lastActiveDate }: ProgressCardProps) {
  // Se não tem streak, mostra mensagem de incentivo
  if (streak === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Flame className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Comece sua sequência!
            </p>
            <p className="text-xs text-muted-foreground">
              Registre algo hoje para iniciar
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Determina a cor baseada no streak
  const getStreakColor = () => {
    if (streak >= 30) return "text-purple-500 bg-purple-500/10";
    if (streak >= 14) return "text-orange-500 bg-orange-500/10";
    if (streak >= 7) return "text-yellow-500 bg-yellow-500/10";
    return "text-primary bg-primary/10";
  };

  const colorClass = getStreakColor();
  const [textColor, bgColor] = colorClass.split(" ");

  // Mensagem motivacional baseada no streak
  const getMessage = () => {
    if (streak >= 30) return "Lendário! 🏆";
    if (streak >= 14) return "Imparável! 🔥";
    if (streak >= 7) return "Uma semana forte!";
    if (streak >= 3) return "Está pegando ritmo!";
    return "Continue assim!";
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Ícone com cor dinâmica */}
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${bgColor}`}>
            <Flame className={`h-6 w-6 ${textColor}`} />
          </div>

          {/* Contador de streak */}
          <div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${textColor}`}>
                {streak}
              </span>
              <span className="text-sm text-muted-foreground">
                {streak === 1 ? "dia" : "dias"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {getMessage()}
            </p>
          </div>
        </div>

        {/* Indicador visual de progresso para a próxima "conquista" */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Sequência</span>
          </div>
          {/* Mini barra de progresso para próximo marco */}
          {streak < 30 && (
            <div className="w-16">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${bgColor.replace("/10", "")}`}
                  style={{
                    width: `${getProgressToNextMilestone(streak)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Calcula progresso até o próximo marco (7, 14, 30 dias)
 */
function getProgressToNextMilestone(streak: number): number {
  if (streak < 7) {
    return (streak / 7) * 100;
  }
  if (streak < 14) {
    return ((streak - 7) / 7) * 100;
  }
  if (streak < 30) {
    return ((streak - 14) / 16) * 100;
  }
  return 100;
}
