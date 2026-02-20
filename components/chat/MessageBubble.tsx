"use client";

import {
  MealCard,
  WorkoutCard,
  WeightCard,
  PhotoAnalysisCard,
  SleepCard,
  WeeklyAnalysisCard,
  GlucoseAnalysisCard,
} from "@/components/chat/cards";
import { getWeightLogsLastDays } from "@/lib/storage";

interface ParsedData {
  type: string;
  data: Record<string, unknown>;
}

interface EditMealData {
  foods: Array<{ name: string; quantity: string; calories: number; protein: number; carbs: number; fat: number }>;
  totals: { calories: number; protein: number; carbs: number; fat: number };
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  parsedData?: ParsedData;
  onEditMeal?: (data: EditMealData) => void;
}

/**
 * MessageBubble - Chat message bubble (Stitch design)
 *
 * - User: right-aligned, green bubble (calma-primary)
 * - AI: left with spa avatar, white card or structured card
 */
export function MessageBubble({
  role,
  content,
  parsedData,
  onEditMeal,
}: MessageBubbleProps) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex items-end justify-end animate-fade-in-up">
        <div className="flex flex-col gap-1 items-end max-w-[85%]">
          <div className="p-5 rounded-3xl rounded-tr-sm bg-calma-primary text-white shadow-sm">
            <p className="text-[17px] font-normal leading-relaxed">{content}</p>
          </div>
          <span className="text-xs font-medium text-gray-400 pr-2">
            Me
          </span>
        </div>
      </div>
    );
  }

  // AI message
  return (
    <div className="flex items-start gap-3 animate-fade-in-up">
      {/* Avatar */}
      <div className="shrink-0 mt-1">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-soft border border-white/50">
          <span className="material-symbols-outlined text-green-500 text-[20px]">
            spa
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1 items-start">
        {parsedData ? (
          <div className="bg-white p-6 rounded-[1.75rem] rounded-tl-sm shadow-soft border border-gray-100 overflow-hidden">
            <CardRenderer parsedData={parsedData} textContent={content} onEditMeal={onEditMeal} />
          </div>
        ) : (
          <div className="bg-white p-6 rounded-[1.75rem] rounded-tl-sm shadow-soft border border-gray-100">
            <div className="text-[15px] leading-relaxed text-gray-800">
              {content.split("\n").map((line, i) => (
                <span key={i}>
                  {formatLine(line)}
                  {i < content.split("\n").length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        )}
        <span className="text-xs font-medium text-gray-400 pl-2">
          Fit AI
        </span>
      </div>
    </div>
  );
}

/**
 * Formats a single line of text, handling basic markdown bold
 */
function formatLine(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

/**
 * Renders the appropriate card based on parsedData type
 */
function CardRenderer({
  parsedData,
  textContent,
  onEditMeal,
}: {
  parsedData: ParsedData;
  textContent: string;
  onEditMeal?: (data: EditMealData) => void;
}) {
  const d = parsedData.data;

  switch (parsedData.type) {
    case "food": {
      const items = (d.items as Array<Record<string, unknown>>)?.map(
        (item) => ({
          name: String(item.name || ""),
          quantity: Number(item.grams || item.quantity || 100),
          unit: "g",
          calories: Number(item.calories || 0),
          protein: Number(item.protein || 0),
          carbs: Number(item.carbs || 0),
          fat: Number(item.fat || 0),
        })
      );
      return (
        <MealCard
          items={items || []}
          mealType={String(d.mealType || "")}
        />
      );
    }

    case "exercise": {
      const exercises = (
        d.exercises as Array<Record<string, unknown>>
      )?.map((ex) => ({
        name: String(ex.name || ""),
        sets: Number(ex.sets || 0),
        reps: Number(ex.reps || 0),
        weight: ex.weight ? Number(ex.weight) : undefined,
        caloriesBurned: ex.caloriesBurned
          ? Number(ex.caloriesBurned)
          : undefined,
      }));
      return (
        <WorkoutCard
          exercises={exercises || []}
          totalDuration={d.totalDuration ? Number(d.totalDuration) : undefined}
          totalCaloriesBurned={
            d.totalCaloriesBurned ? Number(d.totalCaloriesBurned) : undefined
          }
          workoutTitle={d.workoutTitle ? String(d.workoutTitle) : undefined}
        />
      );
    }

    case "weight": {
      // Prefer Supabase history (from enriched parsedData), fall back to localStorage
      const recentWeights = Array.isArray(d.recentWeights)
        ? (d.recentWeights as Array<{ date: string; weight: number }>)
        : getWeightLogsLastDays(7);
      return (
        <WeightCard
          weight={Number(d.weight || 0)}
          weightChange={d.weightChange ? Number(d.weightChange) : undefined}
          recentWeights={recentWeights}
        />
      );
    }

    case "bodyfat": {
      const recentWeights = Array.isArray(d.recentWeights)
        ? (d.recentWeights as Array<{ date: string; weight: number }>)
        : getWeightLogsLastDays(7);
      return (
        <WeightCard
          weight={0}
          bodyFat={Number(d.percentage || 0)}
          bodyFatChange={
            d.bodyFatChange ? Number(d.bodyFatChange) : undefined
          }
          recentWeights={recentWeights}
        />
      );
    }

    case "photo_analysis": {
      const foods = (d.items as Array<Record<string, unknown>>)?.map(
        (item) => ({
          name: String(item.name || ""),
          quantity: String(item.portion || ""),
          calories: Number(item.calories || 0),
        })
      );
      const totals = d.totals as Record<string, number> | undefined;
      const prot = Number(totals?.protein || 0);
      const crb = Number(totals?.carbs || 0);
      const ft = Number(totals?.fat || 0);
      const cal = Number(totals?.calories || 0);

      const handleAddToDiary = onEditMeal
        ? () => {
            const fullFoods = (d.items as Array<Record<string, unknown>>)?.map(
              (item) => ({
                name: String(item.name || ""),
                quantity: String(item.portion || ""),
                calories: Number(item.calories || 0),
                protein: Number(item.protein || 0),
                carbs: Number(item.carbs || 0),
                fat: Number(item.fat || 0),
              })
            );
            onEditMeal({
              foods: fullFoods || [],
              totals: { calories: cal, protein: prot, carbs: crb, fat: ft },
            });
          }
        : undefined;

      return (
        <PhotoAnalysisCard
          foods={foods || []}
          totalCalories={cal}
          protein={prot}
          carbs={crb}
          fat={ft}
          onAddToDiary={handleAddToDiary}
        />
      );
    }

    case "nutrition_label": {
      const foods = (d.items as Array<Record<string, unknown>>)?.map(
        (item) => ({
          name: String(item.name || ""),
          quantity: String(item.portion || ""),
          calories: Number(item.calories || 0),
        })
      );
      const totals = d.totals as Record<string, number> | undefined;
      const prot = Number(totals?.protein || 0);
      const crb = Number(totals?.carbs || 0);
      const ft = Number(totals?.fat || 0);
      const cal = Number(totals?.calories || 0);

      const handleAddToDiary = onEditMeal
        ? () => {
            const fullFoods = (d.items as Array<Record<string, unknown>>)?.map(
              (item) => ({
                name: String(item.name || ""),
                quantity: String(item.portion || ""),
                calories: Number(item.calories || 0),
                protein: Number(item.protein || 0),
                carbs: Number(item.carbs || 0),
                fat: Number(item.fat || 0),
              })
            );
            onEditMeal({
              foods: fullFoods || [],
              totals: { calories: cal, protein: prot, carbs: crb, fat: ft },
            });
          }
        : undefined;

      return (
        <PhotoAnalysisCard
          foods={foods || []}
          totalCalories={cal}
          protein={prot}
          carbs={crb}
          fat={ft}
          onAddToDiary={handleAddToDiary}
          title={"Rótulo\nNutricional"}
          icon="label"
        />
      );
    }

    case "recipe": {
      const foods = (d.items as Array<Record<string, unknown>>)?.map(
        (item) => ({
          name: String(item.name || ""),
          quantity: String(item.portion || ""),
          calories: Number(item.calories || 0),
        })
      );
      const totals = d.totals as Record<string, number> | undefined;
      const prot = Number(totals?.protein || 0);
      const crb = Number(totals?.carbs || 0);
      const ft = Number(totals?.fat || 0);
      const cal = Number(totals?.calories || 0);

      const handleAddToDiary = onEditMeal
        ? () => {
            const fullFoods = (d.items as Array<Record<string, unknown>>)?.map(
              (item) => ({
                name: String(item.name || ""),
                quantity: String(item.portion || ""),
                calories: Number(item.calories || 0),
                protein: Number(item.protein || 0),
                carbs: Number(item.carbs || 0),
                fat: Number(item.fat || 0),
              })
            );
            onEditMeal({
              foods: fullFoods || [],
              totals: { calories: cal, protein: prot, carbs: crb, fat: ft },
            });
          }
        : undefined;

      return (
        <PhotoAnalysisCard
          foods={foods || []}
          totalCalories={cal}
          protein={prot}
          carbs={crb}
          fat={ft}
          onAddToDiary={handleAddToDiary}
          title="Receita"
          icon="menu_book"
        />
      );
    }

    case "sleep": {
      const stages = (d.stages as Array<Record<string, unknown>>)?.map(
        (stage) => ({
          name: String(stage.name || ""),
          duration: String(stage.duration || ""),
          changePercent: stage.changePercent
            ? Number(stage.changePercent)
            : undefined,
        })
      );
      return (
        <SleepCard
          totalDuration={String(d.totalDuration || "")}
          score={d.score ? Number(d.score) : undefined}
          stages={stages}
          insight={d.insight ? String(d.insight) : undefined}
          timestamp={d.timestamp ? String(d.timestamp) : undefined}
        />
      );
    }

    case "weekly_analysis": {
      const metrics = (d.metrics as Array<Record<string, unknown>>)?.map(
        (m) => ({
          label: String(m.label || ""),
          value: String(m.value || ""),
          status: (m.status as "good" | "warning" | "low") || "good",
          detail: m.detail ? String(m.detail) : undefined,
        })
      );
      const recommendations = (
        d.recommendations as Array<Record<string, unknown>>
      )?.map((r) => ({
        text: String(r.text || ""),
      }));
      return (
        <WeeklyAnalysisCard
          metrics={metrics}
          recommendations={recommendations}
          summary={d.summary ? String(d.summary) : undefined}
        />
      );
    }

    case "glucose_analysis": {
      const byDay = (d.byDay as Array<Record<string, unknown>>)?.map((day) => ({
        date: String(day.date || ""),
        avg: Number(day.avg || 0),
        min: Number(day.min || 0),
        max: Number(day.max || 0),
        count: Number(day.count || 0),
      }));
      return (
        <GlucoseAnalysisCard
          timeInRange={d.timeInRange != null ? Number(d.timeInRange) : null}
          avgGlucose={d.avgGlucose != null ? Number(d.avgGlucose) : null}
          avgFasting={d.avgFasting != null ? Number(d.avgFasting) : null}
          avgPostMeal={d.avgPostMeal != null ? Number(d.avgPostMeal) : null}
          minGlucose={d.minGlucose != null ? Number(d.minGlucose) : null}
          maxGlucose={d.maxGlucose != null ? Number(d.maxGlucose) : null}
          readingsCount={Number(d.readingsCount || 0)}
          byDay={byDay || []}
          status={(d.status as "good" | "warning" | "low") || "good"}
          summary={String(d.summary || "")}
          recommendation={String(d.recommendation || "")}
        />
      );
    }

    default:
      return (
        <div className="text-[15px] leading-relaxed text-gray-800">
          {textContent.split("\n").map((line, i) => (
            <span key={i}>
              {formatLine(line)}
              {i < textContent.split("\n").length - 1 && <br />}
            </span>
          ))}
        </div>
      );
  }
}
