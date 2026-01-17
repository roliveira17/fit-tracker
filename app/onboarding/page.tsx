"use client";

import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/button";

/**
 * Tela de Boas-vindas / Login
 * Primeira tela do onboarding - apresenta o app e opções de entrada
 */
export default function WelcomePage() {
  const router = useRouter();

  // Por enquanto, Apple e Google mostram alerts - integração real virá depois
  const handleAppleLogin = () => {
    alert("Apple Sign-In será implementado em breve!");
    // Após implementação, também irá para o tour
    router.push("/onboarding/tour");
  };

  const handleGoogleLogin = () => {
    alert("Google Sign-In será implementado em breve!");
    // Após implementação, também irá para o tour
    router.push("/onboarding/tour");
  };

  const handleLocalMode = () => {
    // Navegar para Feature Tour
    router.push("/onboarding/tour");
  };

  return (
    <ScreenContainer className="justify-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        {/* Logo e Branding */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Fit Track
          </h1>
        </div>

        {/* Headlines */}
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-2xl font-semibold text-foreground">
            Seu corpo, explicado por dados reais
          </h2>
          <p className="text-muted-foreground">
            Treino, sono e alimentação em um só lugar, com AI.
          </p>
        </div>

        {/* Espaçador flexível */}
        <div className="flex-1" />

        {/* Botões de Login */}
        <div className="flex w-full flex-col gap-3">
          {/* Botão Apple */}
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2 h-12"
            onClick={handleAppleLogin}
          >
            <AppleIcon className="h-5 w-5" />
            Continuar com Apple
          </Button>

          {/* Botão Google */}
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2 h-12"
            onClick={handleGoogleLogin}
          >
            <GoogleIcon className="h-5 w-5" />
            Continuar com Google
          </Button>

          {/* Link para modo local */}
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={handleLocalMode}
          >
            Continuar sem login →
          </Button>
        </div>
      </div>
    </ScreenContainer>
  );
}

/**
 * Ícone da Apple (SVG simples)
 */
function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

/**
 * Ícone do Google (SVG colorido)
 */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
