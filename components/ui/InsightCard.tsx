"use client";

// ========================================
// INSIGHT CARD - Card de alerta laranja
// ========================================
// Card de destaque com fundo laranja
// Usado para insights importantes da IA

interface InsightCardProps {
  icon?: string;
  title: string;
  description: string;
  highlight?: string; // Texto que será destacado com underline
}

export function InsightCard({
  icon = "bolt",
  title,
  description,
  highlight,
}: InsightCardProps) {
  // Se houver highlight, substitui no description
  const renderDescription = () => {
    if (!highlight) {
      return description;
    }

    const parts = description.split(highlight);
    return parts.map((part, index) => (
      <span key={index}>
        {part}
        {index < parts.length - 1 && (
          <span className="font-bold underline decoration-white/50 underline-offset-2">
            {highlight}
          </span>
        )}
      </span>
    ));
  };

  return (
    <section className="rounded-xl bg-primary p-5 shadow-lg shadow-primary/20 flex gap-4 items-start">
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
        <span className="material-symbols-outlined">{icon}</span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1">
        <h4 className="text-base font-bold text-white">{title}</h4>
        <p className="text-sm text-white/90 font-medium leading-relaxed">
          {renderDescription()}
        </p>
      </div>
    </section>
  );
}
