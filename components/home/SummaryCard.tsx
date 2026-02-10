"use client";

interface SummaryCardProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  deficit: number; // positivo = deficit, negativo = superavit
  hasWorkout: boolean;
  bmr: number;
}

export function SummaryCard({
  calories,
  protein,
  carbs,
  fat,
  deficit,
  hasWorkout,
  bmr,
}: SummaryCardProps) {
  const progress = bmr > 0 ? Math.min((calories / bmr) * 100, 100) : 0;
  const remaining = bmr > 0 ? Math.max(bmr - calories, 0) : 0;
  const isDeficit = deficit >= 0;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-soft">
      <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-calma-accent/20 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Resumo diario</h3>
          <button className="text-gray-400 transition-colors hover:text-gray-600">
            <span className="material-symbols-outlined text-xl">more_horiz</span>
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative size-28 shrink-0">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="text-calma-primary drop-shadow-[0_0_4px_rgba(79,99,58,0.4)]"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${progress}, 100`}
                strokeLinecap="round"
                strokeWidth="3"
              />
            </svg>
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
              <span className="text-xs font-medium text-gray-500">Restam</span>
              <span className="text-lg font-bold text-gray-800">{remaining}</span>
              <span className="text-[10px] text-gray-400">kcal</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Consumo calorico
              </p>
              <div className="flex items-end gap-1.5">
                <span className="text-3xl font-bold tracking-tight text-gray-800">
                  {calories}
                </span>
                <span className="mb-1.5 text-sm font-medium text-gray-400">
                  / {bmr} kcal
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Proteina", icon: "egg_alt", grams: protein, calPerGram: 4 },
                { label: "Carbos", icon: "grain", grams: carbs, calPerGram: 4 },
                { label: "Gordura", icon: "water_drop", grams: fat, calPerGram: 9 },
              ].map((macro) => {
                const pct = calories > 0 ? Math.round((macro.grams * macro.calPerGram / calories) * 100) : 0;
                return (
                  <div key={macro.label} className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 px-2 py-2">
                    <span className="material-symbols-outlined text-[16px] text-calma-primary">
                      {macro.icon}
                    </span>
                    <span className="text-[10px] text-gray-500">{macro.label}</span>
                    <span className="text-sm font-semibold text-gray-800">{macro.grams}g</span>
                    <span className="text-[10px] text-gray-400">{pct}%</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-calma-primary">
                  fitness_center
                </span>
                <span className="text-xs text-gray-500">Treino</span>
              </div>
              <span
                className={`text-sm font-semibold ${
                  hasWorkout ? "text-success" : "text-gray-500"
                }`}
              >
                {hasWorkout ? "Registrado" : "Pendente"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Deficit do dia</span>
              <span
                className={`font-semibold ${
                  isDeficit ? "text-success" : "text-error"
                }`}
              >
                {isDeficit ? `-${deficit}` : `+${Math.abs(deficit)}`} kcal
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
