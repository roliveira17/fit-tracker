"use client";

import {
  MealCard,
  WorkoutCard,
  WeightCard,
  PhotoAnalysisCard,
  SleepCard,
  WeeklyAnalysisCard,
} from "@/components/chat/cards";
import { getWeightLogsLastDays } from "@/lib/storage";

interface ParsedData {
  type: string;
  data: Record<string, unknown>;
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  parsedData?: ParsedData;
}

/**
 * MessageBubble - Chat message bubble (Stitch design)
 *
 * - User: right-aligned, beige bubble (#E5DBCB)
 * - AI: left with spa avatar, white card or structured card
 */
export function MessageBubble({
  role,
  content,
  parsedData,
}: MessageBubbleProps) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex items-end justify-end animate-fade-in-up">
        <div className="flex flex-col gap-1 items-end max-w-[85%]">
          <div className="p-5 rounded-3xl rounded-tr-sm bg-[#E5DBCB] text-[#3E2723] shadow-sm">
            <p className="text-[17px] font-normal leading-relaxed">{content}</p>
          </div>
          <span className="text-xs font-medium text-[#3E2723]/40 pr-2">
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
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-[0_4px_20px_-2px_rgba(62,39,35,0.05)] border border-white/50">
          <span className="material-symbols-outlined text-green-500 text-[20px]">
            spa
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1 items-start">
        {parsedData ? (
          <div className="bg-white p-5 rounded-[1.75rem] rounded-tl-sm shadow-[0_4px_20px_-2px_rgba(62,39,35,0.08)] border border-white/40 overflow-hidden">
            <CardRenderer parsedData={parsedData} textContent={content} />
          </div>
        ) : (
          <div className="bg-white p-5 rounded-[1.75rem] rounded-tl-sm shadow-[0_4px_20px_-2px_rgba(62,39,35,0.08)] border border-white/40">
            <div className="text-[15px] leading-relaxed text-[#3E2723]/80">
              {content.split("\n").map((line, i) => (
                <span key={i}>
                  {formatLine(line)}
                  {i < content.split("\n").length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        )}
        <span className="text-xs font-medium text-[#3E2723]/40 pl-2">
          Assistente
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
}: {
  parsedData: ParsedData;
  textContent: string;
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
      const recentWeights = getWeightLogsLastDays(7);
      return (
        <WeightCard
          weight={Number(d.weight || 0)}
          weightChange={d.weightChange ? Number(d.weightChange) : undefined}
          recentWeights={recentWeights}
        />
      );
    }

    case "bodyfat": {
      const recentWeights = getWeightLogsLastDays(7);
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
      return (
        <PhotoAnalysisCard
          foods={foods || []}
          totalCalories={Number(totals?.calories || 0)}
          protein={Number(totals?.protein || 0)}
          carbs={Number(totals?.carbs || 0)}
          fat={Number(totals?.fat || 0)}
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

    default:
      return (
        <div className="text-[15px] leading-relaxed text-[#3E2723]/80">
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
