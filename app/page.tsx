"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isOnboardingComplete } from "@/lib/storage";

/**
 * Página inicial - Redireciona automaticamente
 *
 * - Se onboarding completo → vai para /chat
 * - Se não completou → vai para /onboarding
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isOnboardingComplete()) {
      router.replace("/chat");
    } else {
      router.replace("/onboarding");
    }
  }, [router]);

  // Tela de loading enquanto redireciona
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h1 className="text-2xl font-bold text-foreground">Fit Track</h1>
      <p className="mt-2 text-muted-foreground">Carregando...</p>
    </main>
  );
}
