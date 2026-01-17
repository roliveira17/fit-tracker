"use client";

import { Lightbulb, TrendingDown, TrendingUp, Target, Award } from "lucide-react";

interface InsightCardProps {
  calories: number;
  protein: number;
  bmr: number;
  hasWorkout: boolean;
  streak: number;
  weightTrend: "up" | "down" | "stable" | null; // tendência do peso nos últimos 7 dias
}

interface Insight {
  icon: React.ReactNode;
  headline: string;
  copy: string;
  type: "positive" | "neutral" | "warning";
}

/**
 * Componente InsightCard - Exibe insight diário baseado nos dados
 * Gera uma mensagem contextual motivacional ou informativa
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

  // Se não há insight para mostrar, não renderiza
  if (!insight) {
    return null;
  }

  const bgColor = {
    positive: "bg-green-500/10 border-green-500/20",
    neutral: "bg-primary/10 border-primary/20",
    warning: "bg-yellow-500/10 border-yellow-500/20",
  }[insight.type];

  const iconColor = {
    positive: "text-green-500",
    neutral: "text-primary",
    warning: "text-yellow-500",
  }[insight.type];

  return (
    <div className={`rounded-xl border p-4 ${bgColor}`}>
      <div className="flex gap-3">
        {/* Ícone */}
        <div className={`flex-shrink-0 ${iconColor}`}>
          {insight.icon}
        </div>

        {/* Conteúdo */}
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {insight.headline}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {insight.copy}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Gera insight baseado nos dados do usuário
 * Prioriza mensagens mais relevantes
 */
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

  // Prioridade 1: Streak alto (celebração)
  if (streak >= 7) {
    return {
      icon: <Award className="h-5 w-5" />,
      headline: streak >= 30 ? "Você é lendário!" : streak >= 14 ? "Duas semanas de dedicação!" : "Uma semana forte!",
      copy: `${streak} dias consecutivos registrando. Sua consistência é admirável!`,
      type: "positive",
    };
  }

  // Prioridade 2: Peso caindo (objetivo comum)
  if (weightTrend === "down") {
    return {
      icon: <TrendingDown className="h-5 w-5" />,
      headline: "Seu peso está diminuindo!",
      copy: "A tendência dos últimos 7 dias mostra progresso. Continue assim!",
      type: "positive",
    };
  }

  // Prioridade 3: Déficit saudável (entre 10-25%)
  if (calories > 0 && deficitPercent >= 10 && deficitPercent <= 25) {
    return {
      icon: <Target className="h-5 w-5" />,
      headline: "Déficit ideal!",
      copy: `Você está ${deficitPercent}% abaixo do seu gasto. Ritmo sustentável para perda de peso.`,
      type: "positive",
    };
  }

  // Prioridade 4: Treinou hoje
  if (hasWorkout) {
    return {
      icon: <Award className="h-5 w-5" />,
      headline: "Treino registrado!",
      copy: "Ótimo trabalho! O exercício acelera seus resultados.",
      type: "positive",
    };
  }

  // Prioridade 5: Déficit muito alto (aviso)
  if (calories > 0 && deficitPercent > 40) {
    return {
      icon: <Lightbulb className="h-5 w-5" />,
      headline: "Déficit muito agressivo",
      copy: "Comer muito pouco pode prejudicar seu metabolismo. Considere aumentar um pouco.",
      type: "warning",
    };
  }

  // Prioridade 6: Peso subindo (alerta gentil)
  if (weightTrend === "up") {
    return {
      icon: <TrendingUp className="h-5 w-5" />,
      headline: "Peso em tendência de alta",
      copy: "A tendência mostra aumento. Pode ser retenção de líquido ou hora de ajustar.",
      type: "neutral",
    };
  }

  // Prioridade 7: Superávit
  if (calories > 0 && deficit < 0) {
    return {
      icon: <Lightbulb className="h-5 w-5" />,
      headline: "Dia de superávit",
      copy: `Você consumiu ${Math.abs(deficit)} kcal acima do seu gasto. Amanhã é um novo dia!`,
      type: "neutral",
    };
  }

  // Prioridade 8: Proteína baixa
  if (calories > 0 && protein < 50) {
    return {
      icon: <Lightbulb className="h-5 w-5" />,
      headline: "Atenção à proteína",
      copy: "Sua ingestão de proteína está baixa. Tente incluir mais carnes, ovos ou leguminosas.",
      type: "warning",
    };
  }

  // Prioridade 9: Incentivo para começar streak
  if (streak === 0 && calories === 0) {
    return {
      icon: <Lightbulb className="h-5 w-5" />,
      headline: "Comece sua jornada!",
      copy: "Registre sua primeira refeição para iniciar seu streak.",
      type: "neutral",
    };
  }

  // Default: nenhum insight específico
  return null;
}
