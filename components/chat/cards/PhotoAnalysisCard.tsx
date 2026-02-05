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
}

export function PhotoAnalysisCard({
  foods,
  totalCalories,
  protein,
  carbs,
  fat,
  imageUrl,
  onAddToDiary,
}: PhotoAnalysisCardProps) {
  return (
    <>
      {/* Title */}
      <div className="mb-5">
        <h2 className="text-[1.75rem] font-bold text-[#d46211] leading-tight">
          Análise da
          <br />
          Refeição
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
              restaurant
            </span>
          </div>
        )}

        {/* Macro stats */}
        <div className="flex flex-col justify-center gap-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-[#3E2723]">
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
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-gray-100 mb-5" />

      {/* Food list */}
      <div className="space-y-3 mb-6">
        {foods.map((food, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className="text-[#816965]">{food.name}</span>
            <span className="font-bold text-[#3E2723]">
              {food.quantity || `${food.calories} kcal`}
            </span>
          </div>
        ))}
      </div>

      {/* Action button */}
      {onAddToDiary && (
        <button
          onClick={onAddToDiary}
          className="w-full bg-[#d46211] hover:bg-[#b8550e] active:scale-[0.98] transition-all text-white font-bold py-3.5 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-[#d46211]/25"
        >
          <span className="material-symbols-outlined text-[20px]">
            add_circle
          </span>
          Adicionar ao Diário
        </button>
      )}
    </>
  );
}
