"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exchangeAttempted = useRef(false);

  useEffect(() => {
    if (exchangeAttempted.current) return;
    exchangeAttempted.current = true;

    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/home";
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      console.error("OAuth error:", error, errorDescription);
      router.replace(
        `/login?error=${error}&error_description=${encodeURIComponent(
          errorDescription || "Erro de autenticação"
        )}`
      );
      return;
    }

    if (!code) {
      router.replace(next);
      return;
    }

    const timeout = setTimeout(() => {
      console.error("Auth callback timed out after 15s");
      router.replace(
        `/login?error=timeout&error_description=${encodeURIComponent(
          "Autenticação demorou demais. Tente novamente."
        )}`
      );
    }, 15000);

    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error: exchangeError }) => {
        clearTimeout(timeout);

        if (exchangeError) {
          if (
            exchangeError.message?.includes("already") ||
            exchangeError.message?.includes("expired")
          ) {
            router.replace(next);
            return;
          }

          console.error("Error exchanging code:", exchangeError);
          router.replace(
            `/login?error=exchange_error&error_description=${encodeURIComponent(
              exchangeError.message || "Falha ao autenticar"
            )}`
          );
          return;
        }

        router.replace(next);
      })
      .catch((err) => {
        clearTimeout(timeout);
        console.error("Unexpected error in auth callback:", err);
        router.replace(
          `/login?error=unexpected&error_description=${encodeURIComponent(
            "Erro inesperado durante autenticação"
          )}`
        );
      });
  }, [searchParams, router]);

  return (
    <main className="min-h-screen bg-surface-dark flex flex-col items-center justify-center p-6">
      <div className="animate-pulse mb-4">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" stroke="#eb6028" strokeWidth="2" />
          <path
            d="M12 6v6l4 2"
            stroke="#eb6028"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="text-text-secondary text-sm">Autenticando...</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-surface-dark flex items-center justify-center">
          <div className="animate-pulse">
            <p className="text-text-secondary text-sm">Carregando...</p>
          </div>
        </main>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
