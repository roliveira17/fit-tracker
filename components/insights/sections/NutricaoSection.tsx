"use client";

import type { DomainScore } from "@/lib/insights-score";
import type { Recommendation } from "@/lib/insights-recommendations";
import { DomainSection } from "@/components/insights/DomainSection";
import { CalorieRing } from "@/components/insights/CalorieRing";
import { MacroBar } from "@/components/insights/MacroBar";

interface NutricaoSectionProps {
  domain: DomainScore;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  tdee: number;
  daysTracked: number;
  topFoods: { food_name: string; times_eaten: number }[];
  recommendation: Recommendation | null;
}

export function NutricaoSection({
  domain,
  avgCalories,
  avgProtein,
  avgCarbs,
  avgFat,
  tdee,
  daysTracked,
  topFoods,
  recommendation,
}: NutricaoSectionProps) {
  return (
    <DomainSection domain={domain}>
      {/* Ring + stats */}
      <div className="flex items-center gap-5">
        <CalorieRing consumed={avgCalories} target={tdee} />

        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Consumo medio</span>
            <span className="text-sm font-medium text-gray-800">{Math.round(avgCalories)} kcal</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Meta (TDEE)</span>
            <span className="text-sm font-medium text-gray-500">{Math.round(tdee)} kcal</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Dias rastreados</span>
            <span className="text-sm font-medium text-gray-500">{daysTracked}</span>
          </div>
        </div>
      </div>

      {/* Macro split */}
      <div>
        <h4 className="text-xs text-gray-500 mb-2">Macros (media diaria)</h4>
        <MacroBar protein={avgProtein} carbs={avgCarbs} fat={avgFat} />
      </div>

      {/* Top foods */}
      {topFoods.length > 0 && (
        <div>
          <h4 className="text-xs text-gray-500 mb-2">Alimentos mais frequentes</h4>
          <div className="flex flex-wrap gap-1.5">
            {topFoods.slice(0, 5).map((food) => (
              <span
                key={food.food_name}
                className="text-xs rounded-full bg-gray-100 px-2.5 py-1 text-gray-500"
              >
                {food.food_name} ({food.times_eaten}x)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Insight */}
      {recommendation && (
        <InsightBanner recommendation={recommendation} />
      )}
    </DomainSection>
  );
}

function InsightBanner({ recommendation }: { recommendation: Recommendation }) {
  const colors = {
    positive: "border-green-500/30 bg-green-500/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
    info: "border-blue-500/30 bg-blue-500/5",
    neutral: "border-gray-100 bg-gray-100",
  };

  return (
    <div className={`rounded-lg border p-3 ${colors[recommendation.type]}`}>
      <p className="text-xs text-gray-500">{recommendation.observation}</p>
      <p className="text-xs font-medium text-gray-800 mt-1">{recommendation.action}</p>
    </div>
  );
}
