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
    <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-surface-dark p-6 shadow-lg">
      <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Resumo diario</h3>
          <button className="text-white/60 transition-colors hover:text-white">
            <span className="material-symbols-outlined text-xl">more_horiz</span>
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative size-28 shrink-0">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="text-primary drop-shadow-[0_0_4px_rgba(235,96,40,0.5)]"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${progress}, 100`}
                strokeLinecap="round"
                strokeWidth="3"
              />
            </svg>
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
              <span className="text-xs font-medium text-white/60">Restam</span>
              <span className="text-lg font-bold text-white">{remaining}</span>
              <span className="text-[10px] text-white/40">kcal</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <div>
              <p className="text-sm font-medium text-white/60">
                Consumo calorico
              </p>
              <div className="flex items-end gap-1.5">
                <span className="text-3xl font-bold tracking-tight text-white">
                  {calories}
                </span>
                <span className="mb-1.5 text-sm font-medium text-white/50">
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
                  <div key={macro.label} className="flex flex-col items-center gap-1 rounded-xl border border-white/5 bg-surface-card px-2 py-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      {macro.icon}
                    </span>
                    <span className="text-[10px] text-text-secondary">{macro.label}</span>
                    <span className="text-sm font-semibold text-white">{macro.grams}g</span>
                    <span className="text-[10px] text-white/40">{pct}%</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-surface-card px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  fitness_center
                </span>
                <span className="text-xs text-text-secondary">Treino</span>
              </div>
              <span
                className={`text-sm font-semibold ${
                  hasWorkout ? "text-success" : "text-text-secondary"
                }`}
              >
                {hasWorkout ? "Registrado" : "Pendente"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">Deficit do dia</span>
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
