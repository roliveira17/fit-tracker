"use client";

import { Flame, Zap, Dumbbell, TrendingDown, TrendingUp } from "lucide-react";

interface SummaryCardProps {
  calories: number;
  protein: number;
  deficit: number;       // positivo = déficit, negativo = superávit
  hasWorkout: boolean;
  bmr: number;
}

/**
 * Card de resumo diário
 * Exibe as 4 métricas principais: calorias, déficit/superávit, proteína e treino
 */
export function SummaryCard({
  calories,
  protein,
  deficit,
  hasWorkout,
  bmr,
}: SummaryCardProps) {
  const isDeficit = deficit >= 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">
        Resumo do Dia
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Calorias consumidas */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{calories}</p>
            <p className="text-xs text-muted-foreground">kcal consumidas</p>
          </div>
        </div>

        {/* Déficit/Superávit */}
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              isDeficit ? "bg-green-500/10" : "bg-red-500/10"
            }`}
          >
            {isDeficit ? (
              <TrendingDown className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingUp className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div>
            <p
              className={`text-2xl font-bold ${
                isDeficit ? "text-green-500" : "text-red-500"
              }`}
            >
              {isDeficit ? `-${deficit}` : `+${Math.abs(deficit)}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {isDeficit ? "déficit" : "superávit"}
            </p>
          </div>
        </div>

        {/* Proteína */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Zap className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{protein}g</p>
            <p className="text-xs text-muted-foreground">proteína</p>
          </div>
        </div>

        {/* Treino */}
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              hasWorkout ? "bg-purple-500/10" : "bg-muted/50"
            }`}
          >
            <Dumbbell
              className={`h-5 w-5 ${
                hasWorkout ? "text-purple-500" : "text-muted-foreground"
              }`}
            />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {hasWorkout ? "Sim" : "Não"}
            </p>
            <p className="text-xs text-muted-foreground">treino</p>
          </div>
        </div>
      </div>

      {/* Barra de progresso de calorias */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {calories} / {bmr} kcal
          </span>
          <span className="text-xs text-muted-foreground">
            {bmr > 0 ? Math.round((calories / bmr) * 100) : 0}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              calories <= bmr ? "bg-green-500" : "bg-red-500"
            }`}
            style={{
              width: `${Math.min((calories / bmr) * 100, 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
