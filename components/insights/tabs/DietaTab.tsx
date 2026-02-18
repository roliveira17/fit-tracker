"use client";

import { BarChart } from "@/components/insights/BarChart";
import { DonutChart } from "@/components/insights/DonutChart";
import { StatCard } from "@/components/insights/StatCard";

interface DietaTabProps {
  caloriesData: { date: string; value: number }[];
  proteinData: { date: string; value: number }[];
  carbsData: { date: string; value: number }[];
  fatData: { date: string; value: number }[];
  caloriesBurnedData: { date: string; value: number }[];
  bmr: number;
  mealsByType: { meal_type: string; count: number; avg_calories: number }[];
  topFoods: { food_name: string; times_eaten: number; avg_calories: number }[];
}

const mealLabels: Record<string, string> = {
  breakfast: "Café",
  lunch: "Almoço",
  dinner: "Janta",
  snack: "Lanche",
};

const mealColors: Record<string, string> = {
  breakfast: "#eab308",
  lunch: "#22c55e",
  dinner: "#60a5fa",
  snack: "#a1a1aa",
};

export function DietaTab({
  caloriesData,
  proteinData,
  carbsData,
  fatData,
  caloriesBurnedData,
  bmr,
  mealsByType,
  topFoods,
}: DietaTabProps) {
  const hasCalories = caloriesData.some((d) => d.value > 0);
  const hasProtein = proteinData.some((d) => d.value > 0);
  const daysWithData = caloriesData.filter((d) => d.value > 0).length;

  const avgProtein = daysWithData > 0
    ? proteinData.filter((d) => d.value > 0).reduce((s, d) => s + d.value, 0) / daysWithData
    : 0;
  const avgCarbs = daysWithData > 0
    ? carbsData.filter((d) => d.value > 0).reduce((s, d) => s + d.value, 0) / daysWithData
    : 0;
  const avgFat = daysWithData > 0
    ? fatData.filter((d) => d.value > 0).reduce((s, d) => s + d.value, 0) / daysWithData
    : 0;
  const avgCalories = daysWithData > 0
    ? caloriesData.filter((d) => d.value > 0).reduce((s, d) => s + d.value, 0) / daysWithData
    : 0;
  const hasMacros = avgProtein > 0 || avgCarbs > 0 || avgFat > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Calorias por dia */}
      {hasCalories && (
        <BarChart
          data={caloriesData}
          label="Calorias por Dia"
          unit="kcal"
          target={bmr}
          color="orange"
          invertColors={true}
        />
      )}

      {/* Balanço energético */}
      {caloriesBurnedData.length > 0 && hasCalories && (() => {
        const daysIn = caloriesData.filter((d) => d.value > 0);
        const avgIn = daysIn.length > 0
          ? daysIn.reduce((s, d) => s + d.value, 0) / daysIn.length
          : 0;
        const avgOut = caloriesBurnedData.length > 0
          ? caloriesBurnedData.reduce((s, d) => s + d.value, 0) / caloriesBurnedData.length
          : 0;
        const balance = Math.round(avgIn - avgOut);

        return (
          <>
            <BarChart
              data={caloriesBurnedData}
              label="Calorias Queimadas por Dia"
              unit="kcal"
              color="blue"
            />
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Média IN" value={Math.round(avgIn)} unit="kcal" icon="restaurant" color="orange" />
              <StatCard label="Média OUT" value={Math.round(avgOut)} unit="kcal" icon="local_fire_department" color="blue" />
              <StatCard
                label="Saldo"
                value={balance > 0 ? `+${balance}` : balance}
                unit="kcal"
                icon="balance"
                color={balance <= 0 ? "green" : "red"}
              />
            </div>
          </>
        );
      })()}

      {/* Proteína por dia */}
      {hasProtein && (
        <BarChart
          data={proteinData}
          label="Proteína por Dia"
          unit="g"
          target={100}
          color="blue"
          invertColors={false}
        />
      )}

      {/* Distribuição de macros */}
      {hasMacros && (
        <>
          <DonutChart
            segments={[
              { label: "Proteína", value: avgProtein, color: "#60a5fa" },
              { label: "Carboidratos", value: avgCarbs, color: "#eab308" },
              { label: "Gordura", value: avgFat, color: "#ef4444" },
            ]}
            label="Distribuição de Macros"
            centerText={`${Math.round(avgCalories)}`}
            centerSubtext="kcal/dia"
          />
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Proteína" value={Math.round(avgProtein)} unit="g/dia" color="blue" />
            <StatCard label="Carbs" value={Math.round(avgCarbs)} unit="g/dia" color="orange" />
            <StatCard label="Gordura" value={Math.round(avgFat)} unit="g/dia" color="red" />
          </div>
        </>
      )}

      {/* Refeições por tipo */}
      {mealsByType.length > 0 && (
        <DonutChart
          segments={mealsByType.map((m) => ({
            label: mealLabels[m.meal_type] || m.meal_type,
            value: m.count,
            color: mealColors[m.meal_type] || "#a1a1aa",
          }))}
          label="Refeições por Tipo"
          centerText={`${mealsByType.reduce((s, m) => s + m.count, 0)}`}
          centerSubtext="refeições"
          unit="x"
        />
      )}

      {/* Top alimentos */}
      {topFoods.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Top Alimentos</h3>
          <div className="flex flex-col gap-2">
            {topFoods.map((food, i) => (
              <div key={food.food_name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-primary w-5 shrink-0">#{i + 1}</span>
                  <span className="text-sm text-gray-800 truncate">{food.food_name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-xs text-gray-500">{food.times_eaten}x</span>
                  <span className="text-xs text-gray-500">{food.avg_calories} kcal</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
