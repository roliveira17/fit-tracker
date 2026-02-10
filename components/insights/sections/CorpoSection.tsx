"use client";

import type { DomainScore } from "@/lib/insights-score";
import type { Recommendation } from "@/lib/insights-recommendations";
import { DomainSection } from "@/components/insights/DomainSection";
import { Sparkline } from "@/components/insights/Sparkline";

interface CorpoSectionProps {
  domain: DomainScore;
  weightData: { date: string; value: number | null }[];
  bodyFatData: { date: string; value: number | null }[];
  recommendation: Recommendation | null;
}

export function CorpoSection({ domain, weightData, bodyFatData, recommendation }: CorpoSectionProps) {
  const validWeights = weightData.filter((d) => d.value !== null);
  const currentWeight = validWeights.length > 0 ? validWeights[validWeights.length - 1].value as number : null;
  const firstWeight = validWeights.length > 0 ? validWeights[0].value as number : null;

  const weightDiff = currentWeight !== null && firstWeight !== null ? currentWeight - firstWeight : null;
  const weeklyRate = weightDiff !== null && validWeights.length >= 2
    ? weightDiff / (validWeights.length / 7)
    : null;

  const weightSparkline = weightData.map((d) => d.value);

  const validBF = bodyFatData.filter((d) => d.value !== null);
  const currentBF = validBF.length > 0 ? validBF[validBF.length - 1].value as number : null;
  const bfSparkline = bodyFatData.map((d) => d.value);

  return (
    <DomainSection domain={domain}>
      {/* Current stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-gray-100 p-3">
          <p className="text-xs text-gray-500">Peso atual</p>
          <p className="text-2xl font-bold text-gray-800">
            {currentWeight !== null ? `${currentWeight.toFixed(1)}` : "—"}
            <span className="text-sm font-normal text-gray-500 ml-1">kg</span>
          </p>
          {weightDiff !== null && (
            <p className={`text-xs mt-1 ${weightDiff <= 0 ? "text-green-400" : "text-yellow-400"}`}>
              {weightDiff > 0 ? "+" : ""}{weightDiff.toFixed(1)}kg no periodo
            </p>
          )}
        </div>

        {currentBF !== null ? (
          <div className="rounded-lg bg-gray-100 p-3">
            <p className="text-xs text-gray-500">Gordura corporal</p>
            <p className="text-2xl font-bold text-gray-800">
              {currentBF.toFixed(1)}
              <span className="text-sm font-normal text-gray-500 ml-1">%</span>
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-gray-100 p-3">
            <p className="text-xs text-gray-500">Ritmo</p>
            <p className="text-lg font-bold text-gray-800">
              {weeklyRate !== null ? `${weeklyRate > 0 ? "+" : ""}${weeklyRate.toFixed(2)}` : "—"}
              <span className="text-xs font-normal text-gray-500 ml-1">kg/sem</span>
            </p>
          </div>
        )}
      </div>

      {/* Weight sparkline */}
      {validWeights.length >= 3 && (
        <div>
          <h4 className="text-xs text-gray-500 mb-1">Evolucao do peso</h4>
          <Sparkline data={weightSparkline} color="#eab308" height={40} />
        </div>
      )}

      {/* BF sparkline */}
      {validBF.length >= 3 && (
        <div>
          <h4 className="text-xs text-gray-500 mb-1">Evolucao gordura corporal</h4>
          <Sparkline data={bfSparkline} color="#f97316" height={36} />
        </div>
      )}

      {/* Insight */}
      {recommendation && <InsightBanner recommendation={recommendation} />}
    </DomainSection>
  );
}

function InsightBanner({ recommendation }: { recommendation: Recommendation }) {
  const colors = {
    positive: "border-green-500/30 bg-green-500/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
    info: "border-blue-500/30 bg-blue-500/5",
    neutral: "border-gray-100 bg-gray-100",
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[recommendation.type]}`}>
      <p className="text-xs text-gray-500">{recommendation.observation}</p>
      <p className="text-xs font-medium text-gray-800 mt-1">{recommendation.action}</p>
    </div>
  );
}
