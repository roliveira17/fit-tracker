"use client";

interface InsightCardProps {
  calories: number;
  protein: number;
  bmr: number;
  hasWorkout: boolean;
  streak: number;
  weightTrend: "up" | "down" | "stable" | null;
}

interface Insight {
  icon: string;
  headline: string;
  copy: string;
  type: "positive" | "neutral" | "warning";
}

/**
 * Componente InsightCard - Exibe insight diario baseado nos dados
 */
export function InsightCard({
  calories,
  protein,
  bmr,
  hasWorkout,
  streak,
  weightTrend,
}: InsightCardProps) {
  const insight = generateInsight({
    calories,
    protein,
    bmr,
    hasWorkout,
    streak,
    weightTrend,
  });

  if (!insight) return null;

  if (insight.type === "warning") {
    return (
      <section className="flex items-start gap-4 rounded-xl bg-calma-primary p-5 shadow-soft">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
          <span className="material-symbols-outlined">{insight.icon}</span>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-base font-bold text-white">{insight.headline}</h4>
          <p className="text-sm font-medium leading-relaxed text-white/90">
            {insight.copy}
          </p>
        </div>
      </section>
    );
  }

  const accentClass =
    insight.type === "positive" ? "bg-success" : "bg-calma-primary";
  const iconClass =
    insight.type === "positive" ? "text-success" : "text-calma-primary";

  return (
    <div className="group relative overflow-hidden rounded-xl bg-gray-50 p-4">
      <div className="flex items-start gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconClass} bg-calma-primary/10`}
        >
          <span className="material-symbols-outlined">{insight.icon}</span>
        </div>
        <div className="flex flex-1 flex-col">
          <h3 className="text-sm font-bold text-gray-800">{insight.headline}</h3>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            {insight.copy}
          </p>
        </div>
        <span className="material-symbols-outlined text-[20px] text-gray-400">
          chevron_right
        </span>
      </div>
      <div className={`absolute left-0 top-0 h-full w-1 ${accentClass}`} />
    </div>
  );
}

function generateInsight(data: {
  calories: number;
  protein: number;
  bmr: number;
  hasWorkout: boolean;
  streak: number;
  weightTrend: "up" | "down" | "stable" | null;
}): Insight | null {
  const { calories, protein, bmr, hasWorkout, streak, weightTrend } = data;
  const deficit = bmr - calories;
  const deficitPercent = bmr > 0 ? Math.round((deficit / bmr) * 100) : 0;

  if (streak >= 7) {
    return {
      icon: "local_fire_department",
      headline:
        streak >= 30
          ? "Voce e lendario!"
          : streak >= 14
          ? "Duas semanas de dedicacao!"
          : "Uma semana forte!",
      copy: `${streak} dias consecutivos registrando. Sua consistencia e admiravel!`,
      type: "positive",
    };
  }

  if (weightTrend === "down") {
    return {
      icon: "trending_down",
      headline: "Seu peso esta diminuindo!",
      copy: "A tendencia dos ultimos 7 dias mostra progresso. Continue assim!",
      type: "positive",
    };
  }

  if (calories > 0 && deficitPercent >= 10 && deficitPercent <= 25) {
    return {
      icon: "check_circle",
      headline: "Deficit ideal!",
      copy: `Voce esta ${deficitPercent}% abaixo do seu gasto. Ritmo sustentavel para perda de peso.`,
      type: "positive",
    };
  }

  if (hasWorkout) {
    return {
      icon: "fitness_center",
      headline: "Treino registrado!",
      copy: "Otimo trabalho! O exercicio acelera seus resultados.",
      type: "positive",
    };
  }

  if (calories > 0 && deficitPercent > 40) {
    return {
      icon: "warning",
      headline: "Deficit muito agressivo",
      copy: "Comer muito pouco pode prejudicar seu metabolismo. Considere aumentar um pouco.",
      type: "warning",
    };
  }

  if (weightTrend === "up") {
    return {
      icon: "trending_up",
      headline: "Peso em tendencia de alta",
      copy: "A tendencia mostra aumento. Pode ser retencao de liquido ou hora de ajustar.",
      type: "neutral",
    };
  }

  if (calories > 0 && deficit < 0) {
    return {
      icon: "bolt",
      headline: "Dia de superavit",
      copy: `Voce consumiu ${Math.abs(deficit)} kcal acima do seu gasto. Amanhã e um novo dia!`,
      type: "neutral",
    };
  }

  if (calories > 0 && protein < 50) {
    return {
      icon: "egg_alt",
      headline: "Atencao a proteina",
      copy: "Sua ingestao de proteina esta baixa. Tente incluir mais ovos ou frango.",
      type: "warning",
    };
  }

  if (streak === 0 && calories === 0) {
    return {
      icon: "bolt",
      headline: "Comece sua jornada!",
      copy: "Registre sua primeira refeicao para iniciar seu streak.",
      type: "neutral",
    };
  }

  return null;
}
