"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/button";
import { Database, TrendingUp, MessageSquare, Shield } from "lucide-react";

/**
 * Dados das 4 telas do Feature Tour
 * Conforme especificado no PRD 10_onboarding.md
 */
const tourSteps = [
  {
    icon: Database,
    title: "Todos os seus dados, sem ruído",
    description:
      "Importamos Apple Health, sono e cardio completos, incluindo séries temporais. Nada de médias enganosas.",
  },
  {
    icon: TrendingUp,
    title: "Veja o progresso que realmente importa",
    description:
      "Evolução mensal de cardio, sono, peso e balanço energético com alertas inteligentes.",
  },
  {
    icon: MessageSquare,
    title: "Um coach direto, baseado em dados",
    description:
      "Fale com o Fit Track por texto ou áudio. Ele registra, analisa e recomenda com base no seu histórico.",
  },
  {
    icon: Shield,
    title: "Você no controle",
    description:
      "Importação manual quando quiser. Seus dados permanecem privados.",
  },
];

/**
 * Feature Tour - 4 telas obrigatórias de apresentação do app
 * Não pode ser pulado, exibido apenas na primeira sessão
 */
export default function FeatureTourPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const isLastStep = currentStep === tourSteps.length - 1;
  const currentTour = tourSteps[currentStep];
  const IconComponent = currentTour.icon;

  const handleNext = () => {
    if (isLastStep) {
      // Navegar para o Perfil Básico
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
      <div className="flex flex-1 flex-col items-center justify-between py-8">
        {/* Conteúdo principal */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          {/* Ícone */}
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <IconComponent className="h-12 w-12 text-primary" />
          </div>

          {/* Título */}
          <h1 className="text-2xl font-semibold text-foreground">
            {currentTour.title}
          </h1>

          {/* Descrição */}
          <p className="text-muted-foreground leading-relaxed">
            {currentTour.description}
          </p>
        </div>

        {/* Indicadores de página (bolinhas) */}
        <div className="flex gap-2 py-8">
          {tourSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentStep
                  ? "w-6 bg-primary"
                  : "bg-muted-foreground/30"
              }`}
              aria-label={`Ir para página ${index + 1}`}
            />
          ))}
        </div>

        {/* Botões de navegação */}
        <div className="flex w-full flex-col gap-3">
          <Button size="lg" className="w-full h-12" onClick={handleNext}>
            {isLastStep ? "Começar" : "Continuar"}
          </Button>

          {currentStep > 0 && (
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={handleBack}
            >
              Voltar
            </Button>
          )}
        </div>
      </div>
    </ScreenContainer>
  );
}
