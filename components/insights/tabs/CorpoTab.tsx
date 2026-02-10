"use client";

import { LineChart } from "@/components/insights/LineChart";

interface CorpoTabProps {
  weightData: { date: string; value: number | null }[];
  bodyFatData: { date: string; value: number | null }[];
}

export function CorpoTab({ weightData, bodyFatData }: CorpoTabProps) {
  const hasWeight = weightData.some((d) => d.value !== null);
  const hasBodyFat = bodyFatData.some((d) => d.value !== null);

  return (
    <div className="flex flex-col gap-4">
      {hasWeight && (
        <LineChart
          data={weightData}
          label="Evolução do Peso"
          unit="kg"
          color="blue"
        />
      )}

      {hasBodyFat && (
        <LineChart
          data={bodyFatData}
          label="Evolução do Body Fat"
          unit="%"
          color="green"
        />
      )}

      {!hasWeight && !hasBodyFat && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="material-symbols-outlined text-[32px] text-gray-500 mb-2">
            scale
          </span>
          <p className="text-sm text-gray-500">
            Registre seu peso no Chat para ver a evolução aqui.
          </p>
        </div>
      )}
    </div>
  );
}
