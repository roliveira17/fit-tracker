"use client";

interface ExerciseItem {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  caloriesBurned?: number;
}

interface WorkoutCardProps {
  exercises: ExerciseItem[];
  totalDuration?: number;
  totalCaloriesBurned?: number;
  workoutTitle?: string;
  timestamp?: string;
}

export function WorkoutCard({
  exercises,
  totalDuration,
  totalCaloriesBurned,
  workoutTitle,
}: WorkoutCardProps) {
  return (
    <>
      {/* Hero banner — negative margins to fill wrapper edge-to-edge */}
      <div className="-mx-6 -mt-6 h-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#8B6E5A] via-[#A67B5B] to-[#C49B6E]" />
        <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent opacity-90" />
        <div className="absolute bottom-3 left-5">
          <div className="w-10 h-10 rounded-full bg-calma-primary text-white flex items-center justify-center">
            <span className="material-symbols-outlined">fitness_center</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-4 flex flex-col gap-4">
        <div>
          <h2 className="text-gray-800 font-serif-display text-[1.875rem] leading-tight">
            Treino Registrado
          </h2>
          {workoutTitle && (
            <p className="text-[#816965] text-sm mt-1 font-medium tracking-wide uppercase opacity-80">
              {workoutTitle}
            </p>
          )}
        </div>

        {/* Stats row */}
        {(totalDuration || totalCaloriesBurned) && (
          <div className="flex items-center gap-4 py-2 border-b border-gray-200">
            {totalDuration !== undefined && totalDuration > 0 && (
              <div className="flex items-center gap-2 text-gray-800">
                <span className="material-symbols-outlined text-[20px]">schedule</span>
                <span className="text-base font-semibold">{totalDuration} min</span>
              </div>
            )}
            {totalDuration !== undefined && totalDuration > 0 &&
              totalCaloriesBurned !== undefined && totalCaloriesBurned > 0 && (
                <div className="w-px h-4 bg-calma-primary/20" />
              )}
            {totalCaloriesBurned !== undefined && totalCaloriesBurned > 0 && (
              <div className="flex items-center gap-2 text-gray-800">
                <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
                <span className="text-base font-semibold">{totalCaloriesBurned} kcal</span>
              </div>
            )}
          </div>
        )}

        {/* Exercises as chips */}
        {exercises.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-gray-800 font-medium text-base">Exercícios:</p>
            <div className="flex flex-wrap gap-2">
              {exercises.map((exercise, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-gray-800 text-sm font-medium border ${
                    i === 0
                      ? "bg-calma-primary/5 border-gray-200"
                      : "bg-gray-50 border-gray-100"
                  }`}
                >
                  {i === 0 && "• "}{exercise.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Edit button */}
        <button className="mt-2 w-full py-3 rounded-xl bg-calma-primary/5 text-gray-800 text-sm font-medium hover:bg-calma-primary/10 transition-colors flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]">edit</span>
          Editar Detalhes
        </button>
      </div>
    </>
  );
}
