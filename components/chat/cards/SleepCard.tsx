"use client";

interface SleepStage {
  name: string;
  duration: string;
  changePercent?: number;
}

interface SleepCardProps {
  totalDuration: string;
  score?: number;
  stages?: SleepStage[];
  insight?: string;
  timestamp?: string;
}

/** Map stage name to a Material Symbols icon */
function stageIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("profundo") || lower.includes("deep")) return "waves";
  if (lower.includes("rem")) return "psychology";
  if (lower.includes("leve") || lower.includes("light")) return "bedtime";
  return "bedtime";
}

/** Parse "7h 20min", "7h20m", "7 horas 20 minutos", etc. into { hours, minutes } */
function parseDuration(raw: string): { hours: string; minutes: string } {
  const hMatch = raw.match(/(\d+)\s*h/i);
  const mMatch = raw.match(/(\d+)\s*m/i);
  return {
    hours: hMatch?.[1] ?? "0",
    minutes: mMatch?.[1] ?? "0",
  };
}

export function SleepCard({
  totalDuration,
  score,
  stages,
  insight,
  timestamp,
}: SleepCardProps) {
  const { hours, minutes } = parseDuration(totalDuration);

  return (
    <>
      {/* Badge header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[#d46211] bg-[#d46211]/10 px-3 py-1 rounded-full">
          <span className="material-symbols-outlined text-[18px]">
            bedtime
          </span>
          <span className="text-xs font-bold uppercase tracking-wider">
            Morning Insight
          </span>
        </div>
        {timestamp && (
          <span className="text-[#816965]/60 text-xs">{timestamp}</span>
        )}
      </div>

      {/* Title */}
      <h2 className="font-serif-display text-2xl text-[#3E2723] mb-6 leading-tight">
        Seu Sono e
        <br />
        Recuperação
      </h2>

      {/* Main metric — large duration */}
      <div className="flex items-baseline gap-1 mb-2">
        <span className="font-serif-display text-6xl font-medium tracking-tight text-[#3E2723]">
          {hours}
          <span className="text-4xl">h</span> {minutes}
          <span className="text-4xl">min</span>
        </span>
      </div>

      {/* Score bar */}
      {score !== undefined && (
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-2 bg-[#f3ece7] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#d46211] rounded-full"
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
          <span className="text-[#d46211] font-bold text-lg whitespace-nowrap">
            {score}
            <span className="text-sm font-normal text-[#816965]">/100</span>
          </span>
        </div>
      )}

      {/* Stages grid */}
      {stages && stages.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stages.map((stage, i) => (
            <div
              key={i}
              className="bg-[#f9f5f2] p-4 rounded-2xl border border-[#e7d9cf]/30"
            >
              <div className="flex items-center gap-1.5 text-[#816965] mb-1">
                <span className="material-symbols-outlined text-[16px]">
                  {stageIcon(stage.name)}
                </span>
                <span className="text-xs font-medium uppercase">
                  {stage.name}
                </span>
              </div>
              <p className="text-xl font-bold text-[#3E2723]">
                {stage.duration}
              </p>
              {stage.changePercent !== undefined &&
                stage.changePercent !== 0 && (
                  <p
                    className={`text-xs font-medium mt-1 ${
                      stage.changePercent > 0
                        ? "text-green-600"
                        : "text-[#E65100]"
                    }`}
                  >
                    {stage.changePercent > 0 ? "+" : ""}
                    {stage.changePercent}% vs média
                  </p>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Insight footer */}
      {insight && (
        <div className="bg-[#d46211]/5 p-4 rounded-2xl flex gap-3 items-start border border-[#d46211]/10">
          <div className="bg-white p-2 rounded-full shadow-sm text-[#d46211] shrink-0">
            <span className="material-symbols-outlined text-[20px] block">
              bolt
            </span>
          </div>
          <p className="text-[#3E2723] text-base italic leading-snug font-serif-display">
            &ldquo;{insight}&rdquo;
          </p>
        </div>
      )}
    </>
  );
}
