"use client";

// ========================================
// ONBOARDING - Componentes de onboarding
// ========================================
// Coleção de componentes para fluxo de onboarding

// ========================================
// STEP INDICATOR - Indicador de passos
// ========================================
// Mostra progresso entre etapas do onboarding

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
  variant?: "dots" | "bar";
}

export function StepIndicator({
  totalSteps,
  currentStep,
  variant = "dots",
}: StepIndicatorProps) {
  if (variant === "bar") {
    const progress = ((currentStep) / (totalSteps - 1)) * 100;
    return (
      <div className="w-full max-w-[200px] mx-auto">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  // Dots variant
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`
            rounded-full transition-all duration-300
            ${
              index === currentStep
                ? "w-6 h-2 bg-primary"
                : index < currentStep
                ? "w-2 h-2 bg-primary/50"
                : "w-2 h-2 bg-white/20"
            }
          `}
        />
      ))}
    </div>
  );
}

// ========================================
// FEATURE ICON - Ícone de feature
// ========================================
// Ícone grande para cards de feature no onboarding

interface FeatureIconProps {
  icon: string;
  size?: "md" | "lg" | "xl";
  color?: "primary" | "white";
}

export function FeatureIcon({
  icon,
  size = "lg",
  color = "primary",
}: FeatureIconProps) {
  const sizeClasses = {
    md: "size-16 text-[32px]",
    lg: "size-24 text-[48px]",
    xl: "size-32 text-[64px]",
  };

  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    white: "bg-white/10 text-white",
  };

  return (
    <div
      className={`
        flex items-center justify-center rounded-3xl
        ${sizeClasses[size]} ${colorClasses[color]}
      `}
    >
      <span className="material-symbols-outlined fill-1" style={{ fontSize: "inherit" }}>
        {icon}
      </span>
    </div>
  );
}

// ========================================
// WELCOME HERO - Seção hero de boas-vindas
// ========================================
// Seção principal da tela de welcome

interface WelcomeHeroProps {
  title: string;
  subtitle?: string;
  logoUrl?: string;
  children?: React.ReactNode;
}

export function WelcomeHero({
  title,
  subtitle,
  logoUrl,
  children,
}: WelcomeHeroProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-12">
      {/* Logo */}
      {logoUrl ? (
        <div
          className="w-24 h-24 bg-center bg-no-repeat bg-contain mb-8"
          style={{ backgroundImage: `url('${logoUrl}')` }}
        />
      ) : (
        <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mb-8">
          <span className="material-symbols-outlined text-primary text-[48px] fill-1">
            fitness_center
          </span>
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl font-extrabold text-white mb-3">{title}</h1>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-text-secondary text-base max-w-[280px]">{subtitle}</p>
      )}

      {/* Extra content (badges, etc) */}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

// ========================================
// PROFILE HEADER - Header do perfil
// ========================================
// Header com avatar e info do usuário

interface ProfileHeaderProps {
  name: string;
  email?: string;
  avatarUrl?: string;
  onEditClick?: () => void;
}

export function ProfileHeader({
  name,
  email,
  avatarUrl,
  onEditClick,
}: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-4 p-5 bg-surface-dark rounded-xl border border-white/5">
      {/* Avatar */}
      <div
        className={`
          relative w-16 h-16 rounded-full overflow-hidden shrink-0
          ${!avatarUrl ? "bg-primary/10 flex items-center justify-center" : ""}
        `}
      >
        {avatarUrl ? (
          <div
            className="w-full h-full bg-center bg-cover bg-no-repeat"
            style={{ backgroundImage: `url('${avatarUrl}')` }}
          />
        ) : (
          <span className="material-symbols-outlined text-primary text-[32px]">
            person
          </span>
        )}

        {/* Edit overlay */}
        {onEditClick && (
          <button
            onClick={onEditClick}
            className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-white text-[20px]">
              edit
            </span>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-bold text-white truncate">{name}</h2>
        {email && (
          <p className="text-sm text-text-secondary truncate">{email}</p>
        )}
      </div>

      {/* Edit button */}
      {onEditClick && (
        <button
          onClick={onEditClick}
          className="shrink-0 p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <span className="material-symbols-outlined text-text-secondary text-[20px]">
            edit
          </span>
        </button>
      )}
    </div>
  );
}

// ========================================
// FEATURE CARD - Card de feature
// ========================================
// Card para exibir features no onboarding

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-8">
      {/* Icon */}
      <FeatureIcon icon={icon} size="xl" />

      {/* Title */}
      <h2 className="text-2xl font-bold text-white mt-8 mb-3">{title}</h2>

      {/* Description */}
      <p className="text-text-secondary text-base max-w-[280px] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
