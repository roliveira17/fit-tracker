"use client";

// ========================================
// STAT CARD - Mini card de estatística
// ========================================
// Card compacto para exibir uma métrica
// Usado para água, sono, etc.

type StatColor = "blue" | "purple" | "orange" | "green";

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  badge?: string;
  color?: StatColor;
}

export function StatCard({
  icon,
  value,
  label,
  badge,
  color = "blue",
}: StatCardProps) {
  const colorClasses: Record<StatColor, { icon: string; badge: string }> = {
    blue: {
      icon: "text-blue-400",
      badge: "text-blue-400 bg-blue-400/10",
    },
    purple: {
      icon: "text-purple-400",
      badge: "text-purple-400 bg-purple-400/10",
    },
    orange: {
      icon: "text-primary",
      badge: "text-primary bg-primary/10",
    },
    green: {
      icon: "text-green-400",
      badge: "text-green-400 bg-green-400/10",
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="rounded-xl border border-border-subtle bg-background-dark p-4 flex flex-col justify-between gap-3">
      {/* Top row */}
      <div className="flex justify-between items-start">
        <span className={`material-symbols-outlined ${colors.icon}`}>
          {icon}
        </span>
        {badge && (
          <span
            className={`text-[10px] font-bold ${colors.badge} px-1.5 py-0.5 rounded`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Bottom row */}
      <div>
        <p className="text-white text-lg font-bold">{value}</p>
        <p className="text-text-secondary text-xs">{label}</p>
      </div>
    </div>
  );
}
