interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
}

export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <section>
      <h3 className="font-serif-display text-lg text-gray-800 mb-3 ml-1">
        {title}
      </h3>
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        {children}
      </div>
    </section>
  );
}
