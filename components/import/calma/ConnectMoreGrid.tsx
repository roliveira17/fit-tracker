"use client";

interface PlaceholderCardProps {
  icon: string;
  label: string;
  gradientFrom: string;
}

function PlaceholderCard({ icon, label, gradientFrom }: PlaceholderCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-calma-surface-alt p-4 flex flex-col items-center justify-center text-center gap-3 border border-transparent cursor-default h-32">
      <div className="w-10 h-10 bg-calma-surface rounded-full flex items-center justify-center shadow-sm z-10">
        <span className="material-symbols-outlined text-calma-text-muted">
          {icon}
        </span>
      </div>
      <span className="text-sm font-medium text-calma-text-secondary z-10">
        {label}
      </span>
      <div
        className={`absolute inset-0 ${gradientFrom} opacity-50`}
      />
    </div>
  );
}

export function ConnectMoreGrid() {
  return (
    <section>
      <h2 className="text-lg font-semibold text-calma-text mb-4">
        Conectar mais
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <PlaceholderCard
          icon="restaurant"
          label="MyFitnessPal"
          gradientFrom="bg-gradient-to-tr from-blue-50/50 to-transparent"
        />
        <PlaceholderCard
          icon="ring_volume"
          label="Oura Ring"
          gradientFrom="bg-gradient-to-tr from-gray-100/50 to-transparent"
        />
      </div>
    </section>
  );
}
