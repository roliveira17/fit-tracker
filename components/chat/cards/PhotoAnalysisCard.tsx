"use client";

interface DetectedFood {
  name: string;
  quantity: string;
  calories: number;
}

interface PhotoAnalysisCardProps {
  foods: DetectedFood[];
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
  onAddToDiary?: () => void;
  title?: string;
  icon?: string;
}

export function PhotoAnalysisCard({
  foods,
  totalCalories,
  protein,
  carbs,
  fat,
  imageUrl,
  onAddToDiary,
  title = "Análise da\nRefeição",
  icon = "restaurant",
}: PhotoAnalysisCardProps) {
  const totalMacros = protein + carbs + fat || 1;
  const proteinPct = Math.round((protein / totalMacros) * 100);
  const carbsPct = Math.round((carbs / totalMacros) * 100);
  const fatPct = 100 - proteinPct - carbsPct;

  return (
    <>
      {/* Title */}
      <div className="mb-5">
        <h2 className="font-serif-display text-[1.75rem] text-[#d46211] leading-tight">
          {title.split("\n").map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </h2>
      </div>

      {/* Summary: thumbnail + macros */}
      <div className="grid grid-cols-[auto_1fr] gap-4 mb-6">
        {/* Thumbnail */}
        {imageUrl ? (
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
            <img
              src={imageUrl}
              alt="Foto da refeição"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8B6E5A] to-[#C49B6E] flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-white/80 text-[28px]">
              {icon}
            </span>
          </div>
        )}

        {/* Macro stats */}
        <div className="flex flex-col justify-center gap-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-800">
              {totalCalories}
            </span>
            <span className="text-sm font-medium text-[#816965]">kcal</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-medium text-[#816965]">
            {protein > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#d46211]" />
                {protein}g Prot
              </span>
            )}
            {fat > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#E0A458]" />
                {fat}g Gord
              </span>
            )}
            {carbs > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#C7B299]" />
                {carbs}g Carb
              </span>
            )}
          </div>
          {/* Macro % */}
          <div className="flex gap-3 text-[11px] font-bold mt-1">
            <span className="text-[#d46211]">p ({proteinPct}%)</span>
            <span className="text-[#E0A458]">c ({carbsPct}%)</span>
            <span className="text-[#C7B299]">g ({fatPct}%)</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-gray-100 mb-5" />

      {/* Food list */}
      <div className="space-y-3 mb-6">
        {foods.map((food, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className="text-[#816965]">{food.name}</span>
            <span className="font-bold text-gray-800">
              {food.quantity || `${food.calories} kcal`}
            </span>
          </div>
        ))}
      </div>

      {/* Action button */}
      <button
        onClick={onAddToDiary}
        disabled={!onAddToDiary}
        className="w-full bg-[#d46211] hover:bg-[#b8550e] active:scale-[0.98] transition-all text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-[#d46211]/25 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-[20px]">
          add_circle
        </span>
        Adicionar ao Diário
      </button>
    </>
  );
}
