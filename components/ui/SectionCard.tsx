"use client";

// ========================================
// SECTION CARD - Card de seção
// ========================================
// Card para agrupar campos relacionados
// Usado na tela de Profile

interface SectionCardProps {
  icon?: string;
  title: string;
  children: React.ReactNode;
}

export function SectionCard({ icon, title, children }: SectionCardProps) {
  return (
    <section className="bg-surface-dark rounded-xl p-5 border border-white/5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        {icon && (
          <span className="material-symbols-outlined text-primary text-[20px]">
            {icon}
          </span>
        )}
        <h3 className="text-base font-bold text-white">{title}</h3>
      </div>

      {/* Content */}
      <div className="space-y-4">{children}</div>
    </section>
  );
}
