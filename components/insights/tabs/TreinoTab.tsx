"use client";

import { useState, useEffect } from "react";
import { LineChart } from "@/components/insights/LineChart";
import { BarChart } from "@/components/insights/BarChart";
import { StatCard } from "@/components/insights/StatCard";
import type { WorkoutProgressionData } from "@/lib/supabase";

interface TreinoTabProps {
  workout: WorkoutProgressionData;
}

export function TreinoTab({ workout }: TreinoTabProps) {
  const [selectedExercise, setSelectedExercise] = useState("");

  useEffect(() => {
    if (workout.top_exercises.length > 0 && !selectedExercise) {
      setSelectedExercise(workout.top_exercises[0].exercise_name);
    }
  }, [workout.top_exercises, selectedExercise]);

  const exercise = workout.top_exercises.find(
    (ex) => ex.exercise_name === selectedExercise
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Seletor de exercício */}
      {workout.top_exercises.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 hide-scrollbar">
          {workout.top_exercises.slice(0, 5).map((ex) => (
            <button
              key={ex.exercise_name}
              onClick={() => setSelectedExercise(ex.exercise_name)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedExercise === ex.exercise_name
                  ? "bg-primary text-white"
                  : "bg-surface-card border border-border-subtle text-text-secondary"
              }`}
            >
              {ex.exercise_name}
            </button>
          ))}
        </div>
      )}

      {/* Progressão de carga */}
      {exercise && exercise.progression.length >= 2 && (
        <LineChart
          data={exercise.progression.map((p) => ({
            date: p.date,
            value: p.max_weight,
          }))}
          label={`Progressão: ${exercise.exercise_name}`}
          unit="kg"
          color="primary"
        />
      )}

      {/* Volume por treino */}
      {workout.volume_by_day.length > 0 && (
        <BarChart
          data={workout.volume_by_day.map((d) => ({
            date: d.date,
            value: d.volume,
          }))}
          label="Volume por Treino"
          unit="kg"
          color="orange"
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total treinos"
          value={workout.total_workouts}
          unit="no período"
          icon="fitness_center"
        />
        <StatCard
          label="Volume total"
          value={
            workout.total_volume >= 1000
              ? `${(workout.total_volume / 1000).toFixed(1)}k`
              : workout.total_volume
          }
          unit="kg"
          icon="monitoring"
        />
        {workout.avg_duration_min && (
          <StatCard
            label="Duração média"
            value={Math.round(workout.avg_duration_min)}
            unit="min"
            icon="timer"
          />
        )}
        {workout.top_exercises.length > 0 && (
          <StatCard
            label="Melhor carga"
            value={workout.top_exercises[0].best_weight}
            unit="kg"
            icon="emoji_events"
            subtitle={workout.top_exercises[0].exercise_name}
            color="orange"
          />
        )}
      </div>
    </div>
  );
}
