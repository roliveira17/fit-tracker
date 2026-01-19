"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { StepIndicator, FeatureCard } from "@/components/ui/Onboarding";

// ========================================
// FEATURE TOUR - Tour de funcionalidades
// ========================================
// 4 telas apresentando as principais features do app

const tourSteps = [
  {
    icon: "upload_file",
    title: "Todos os seus dados, sem ruído",
    description:
      "Importamos Apple Health, sono e cardio completos, incluindo séries temporais. Nada de médias enganosas.",
  },
  {
    icon: "trending_up",
    title: "Veja o progresso que realmente importa",
    description:
      "Evolução mensal de cardio, sono, peso e balanço energético com alertas inteligentes.",
  },
  {
    icon: "smart_toy",
    title: "Um coach direto, baseado em dados",
    description:
      "Fale com o Fit Track por texto ou áudio. Ele registra, analisa e recomenda com base no seu histórico.",
  },
  {
    icon: "shield",
    title: "Você no controle",
    description:
      "Importação manual quando quiser. Seus dados permanecem privados.",
  },
];

export default function FeatureTourPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const isLastStep = currentStep === tourSteps.length - 1;
  const currentTour = tourSteps[currentStep];

  const handleNext = () => {
    if (isLastStep) {
      router.push("/onboarding/profile");
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <ScreenContainer>
      <div className="flex flex-1 flex-col py-8">
        {/* Feature Content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <FeatureCard
            icon={currentTour.icon}
            title={currentTour.title}
            description={currentTour.description}
          />
        </div>

        {/* Step Indicator */}
        <div className="py-8">
          <StepIndicator
            totalSteps={tourSteps.length}
            currentStep={currentStep}
            variant="dots"
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col gap-3">
          {/* Primary Button */}
          <button
            onClick={handleNext}
            className="w-full h-14 rounded-xl bg-primary text-white font-semibold text-base transition-all hover:bg-primary/90 active:scale-[0.98] shadow-primary"
          >
            {isLastStep ? "Começar" : "Continuar"}
          </button>

          {/* Back Button */}
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="w-full py-3 text-text-secondary text-sm font-medium hover:text-white transition-colors"
            >
              Voltar
            </button>
          )}
        </div>
      </div>
    </ScreenContainer>
  );
}
