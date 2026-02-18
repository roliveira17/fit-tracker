"use client";

interface GlucoseDaySummary {
  date: string;
  avg: number;
  min: number;
  max: number;
  count: number;
}

interface GlucoseAnalysisCardProps {
  timeInRange: number | null;
  avgGlucose: number | null;
  avgFasting: number | null;
  avgPostMeal: number | null;
  minGlucose: number | null;
  maxGlucose: number | null;
  readingsCount: number;
  byDay: GlucoseDaySummary[];
  status: "good" | "warning" | "low";
  summary: string;
  recommendation: string;
}

export function GlucoseAnalysisCard({
  timeInRange,
  avgGlucose,
  avgFasting,
  avgPostMeal,
  minGlucose,
  maxGlucose,
  readingsCount,
  byDay,
  status,
  summary,
  recommendation,
}: GlucoseAnalysisCardProps) {
  const statusColor = status === "good"
    ? "text-green-500"
    : status === "warning"
      ? "text-orange-400"
      : "text-red-400";

  const statusBg = status === "good"
    ? "bg-green-50"
    : status === "warning"
      ? "bg-orange-50"
      : "bg-red-50";

  const statusIcon = status === "good"
    ? "check_circle"
    : status === "warning"
      ? "warning"
      : "error";

  // Empty state
  if (readingsCount === 0) {
    return (
      <>
        <h2 className="font-serif-display text-[1.75rem] text-gray-800 leading-tight mb-3">
          Glicemia
        </h2>
        <p className="text-[14px] text-gray-500 leading-relaxed mb-4">
          {summary}
        </p>
        <div className="bg-[#F8FCF9] rounded-xl p-3 border border-green-500/20">
          <p className="text-[14px] italic text-gray-600 leading-relaxed font-serif-display">
            &ldquo;{recommendation}&rdquo;
          </p>
        </div>
      </>
    );
  }

  // Chart dimensions
  const chartH = 64;
  const barMaxH = chartH - 8;

  // Normalize bars for daily trend
  const allAvgs = byDay.map((d) => d.avg);
  const chartMin = Math.min(...allAvgs, 70) - 10;
  const chartMax = Math.max(...allAvgs, 140) + 10;
  const chartRange = chartMax - chartMin || 1;

  return (
    <>
      {/* Title */}
      <div className="flex justify-between items-start mb-1">
        <h2 className="font-serif-display text-[1.75rem] text-gray-800 leading-tight">
          Glicemia
        </h2>
        <div className={`${statusBg} ${statusColor} rounded-full p-1.5 flex items-center justify-center`}>
          <span className="material-symbols-outlined text-[20px]">
            {statusIcon}
          </span>
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-[12px] text-[#816965] mb-5">
        Últimos 7 dias &middot; {readingsCount} leituras
      </p>

      {/* Main metric — Time in Range */}
      {timeInRange !== null && (
        <div className="flex items-center gap-4 mb-5">
          {/* Ring indicator */}
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="#f0eeeb"
                strokeWidth="3"
              />
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke={status === "good" ? "#22c55e" : status === "warning" ? "#fb923c" : "#ef4444"}
                strokeWidth="3"
                strokeDasharray={`${timeInRange * 0.942} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[13px] font-bold text-gray-800">
                {timeInRange}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-800 uppercase tracking-wide mb-0.5">
              Tempo no Alvo
            </p>
            <p className="text-[13px] text-[#816965] leading-snug">
              70–140 mg/dL
            </p>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {avgGlucose !== null && (
          <StatBox label="Média Geral" value={`${avgGlucose}`} unit="mg/dL" />
        )}
        {avgFasting !== null && (
          <StatBox label="Jejum" value={`${avgFasting}`} unit="mg/dL" />
        )}
        {avgPostMeal !== null && (
          <StatBox label="Pós-Refeição" value={`${avgPostMeal}`} unit="mg/dL" />
        )}
        {minGlucose !== null && maxGlucose !== null && (
          <StatBox label="Range" value={`${minGlucose}–${maxGlucose}`} unit="mg/dL" />
        )}
      </div>

      {/* Daily trend bars */}
      {byDay.length > 1 && (
        <div className="mb-5">
          <p className="text-[11px] font-bold text-gray-800 uppercase tracking-wide mb-2">
            Tendência Diária
          </p>
          <div className="flex items-end gap-1.5" style={{ height: chartH }}>
            {byDay.slice(-7).map((day) => {
              const h = Math.max(8, ((day.avg - chartMin) / chartRange) * barMaxH);
              const isInRange = day.avg >= 70 && day.avg <= 140;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-[#816965] font-medium">
                    {day.avg}
                  </span>
                  <div
                    className={`w-full rounded-t-md ${isInRange ? "bg-green-400/70" : "bg-orange-400/70"}`}
                    style={{ height: h }}
                  />
                  <span className="text-[9px] text-[#816965]">
                    {formatDayLabel(day.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-calma-primary/5 w-full mb-4" />

      {/* Summary */}
      <p className="text-[14px] text-gray-600 leading-relaxed mb-3">
        {summary}
      </p>

      {/* Recommendation */}
      <div className={`${statusBg} rounded-xl p-3 border ${
        status === "good" ? "border-green-500/20" : status === "warning" ? "border-orange-400/20" : "border-red-400/20"
      }`}>
        <p className="text-[14px] italic text-gray-600 leading-relaxed font-serif-display">
          &ldquo;{recommendation}&rdquo;
        </p>
      </div>
    </>
  );
}

function StatBox({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-gray-50/80 rounded-2xl p-3 border border-gray-100">
      <p className="text-[10px] font-bold text-[#816965] uppercase tracking-wide mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-gray-800">{value}</span>
        <span className="text-[11px] text-[#816965]">{unit}</span>
      </div>
    </div>
  );
}

function formatDayLabel(dateStr: string): string {
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const d = new Date(dateStr + "T12:00:00");
  return weekdays[d.getDay()];
}
