"use client";

interface MealItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealCardProps {
  items: MealItem[];
  mealType?: string;
  timestamp?: string;
}

export function MealCard({ items, mealType }: MealCardProps) {
  const totalCalories = items.reduce((sum, i) => sum + i.calories, 0);
  const totalProtein = items.reduce((sum, i) => sum + i.protein, 0);
  const totalCarbs = items.reduce((sum, i) => sum + i.carbs, 0);
  const totalFat = items.reduce((sum, i) => sum + i.fat, 0);
  const totalMacros = totalProtein + totalCarbs + totalFat || 1;

  const proteinPct = Math.round((totalProtein / totalMacros) * 100);
  const carbsPct = Math.round((totalCarbs / totalMacros) * 100);
  const fatPct = 100 - proteinPct - carbsPct;

  const mealLabel =
    mealType === "breakfast"
      ? "Cafe da Manha"
      : mealType === "lunch"
        ? "Almoco"
        : mealType === "dinner"
          ? "Jantar"
          : mealType === "snack"
            ? "Lanche"
            : "Refeicao";

  // Dot color based on dominant macro of each item
  function getDotColor(item: MealItem) {
    if (item.protein >= item.carbs && item.protein >= item.fat)
      return "bg-[#44563C]";
    if (item.carbs >= item.protein && item.carbs >= item.fat)
      return "bg-[#E0A458]";
    return "bg-[#C7B299]";
  }

  return (
    <>
      {/* Header */}
      <div className="relative flex justify-between items-start mb-6">
        <div>
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 bg-gray-50 px-2 py-0.5 rounded-md">
            Diario Alimentar
          </span>
          <h2 className="text-[1.5rem] font-bold text-gray-900 leading-tight">
            {mealLabel} Registrado
          </h2>
        </div>
        <div className="bg-[#F3E7D5]/50 text-[#44563C] p-2 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">
            restaurant
          </span>
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-4 mb-7 relative z-10 pl-1">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-baseline text-[15px]">
            <div className="flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full ${getDotColor(item)} shadow-sm shrink-0`}
              />
              <span className="text-gray-800 font-medium text-[16px]">
                {item.name}
                <span className="text-gray-400 font-normal text-[14px] ml-1">
                  ({item.quantity}
                  {item.unit})
                </span>
              </span>
            </div>
            <span className="font-sans font-bold text-gray-700 text-[16px] tabular-nums shrink-0 ml-3">
              {item.calories}{" "}
              <span className="text-[11px] font-bold uppercase text-gray-400 ml-0.5">
                kcal
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Total + Macro bar */}
      <div className="bg-gray-50/80 rounded-3xl p-5 border border-gray-100 relative z-10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wide">
            Total Calorico
          </span>
          <span className="text-[1.75rem] font-bold text-[#44563C] tabular-nums leading-none">
            {totalCalories}
          </span>
        </div>

        <div className="relative h-3 w-full rounded-full bg-transparent overflow-hidden flex mb-4">
          <div
            className="h-full bg-[#44563C] rounded-l-full"
            style={{ width: `${proteinPct}%` }}
          />
          <div
            className="h-full bg-[#E0A458]"
            style={{ width: `${carbsPct}%` }}
          />
          <div
            className="h-full bg-[#C7B299] rounded-r-full opacity-60"
            style={{ width: `${fatPct}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] font-bold tracking-wider uppercase text-gray-400 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#44563C]" />
            <span>Proteina</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E0A458]" />
            <span>Carbs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C7B299]" />
            <span>Gordura</span>
          </div>
        </div>
      </div>
    </>
  );
}
