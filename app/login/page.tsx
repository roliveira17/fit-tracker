"use client";

/**
 * Página de Login
 *
 * Permite login social com Google e Apple.
 * Após autenticação, redireciona para /home.
 */

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Se já autenticado, redireciona
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/home");
    }
  }, [status, router]);

  // Verifica erros da URL
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      switch (errorParam) {
        case "OAuthSignin":
        case "OAuthCallback":
          setError("Erro ao conectar com o provedor. Tente novamente.");
          break;
        case "OAuthCreateAccount":
          setError("Não foi possível criar a conta. Tente novamente.");
          break;
        case "Callback":
          setError("Erro durante autenticação. Tente novamente.");
          break;
        default:
          setError("Ocorreu um erro. Tente novamente.");
      }
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setIsLoading("google");
    setError(null);
    try {
      await signIn("google", { callbackUrl: "/home" });
    } catch {
      setError("Erro ao conectar com Google");
      setIsLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading("apple");
    setError(null);
    try {
      await signIn("apple", { callbackUrl: "/home" });
    } catch {
      setError("Erro ao conectar com Apple");
      setIsLoading(null);
    }
  };

  const handleContinueWithoutLogin = () => {
    router.push("/home");
  };

  // Loading inicial
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-surface-dark flex items-center justify-center">
        <div className="animate-pulse">
          <span className="material-symbols-outlined text-[48px] text-primary">
            fitness_center
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-dark flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <span className="material-symbols-outlined text-[64px] text-primary mb-4">
          fitness_center
        </span>
        <h1 className="text-2xl font-bold text-white">Fit Track</h1>
        <p className="text-text-secondary text-sm mt-2">
          Seu corpo, explicado por dados reais
        </p>
      </div>

      {/* Card de login */}
      <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-surface-card p-6">
        <h2 className="text-lg font-semibold text-white text-center mb-6">
          Entrar na sua conta
        </h2>

        {/* Erro */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20">
            <p className="text-sm text-error text-center">{error}</p>
          </div>
        )}

        {/* Botões de login */}
        <div className="space-y-3">
          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading !== null}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-gray-800 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading === "google" ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">
                progress_activity
              </span>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            )}
            <span>Continuar com Google</span>
          </button>

          {/* Apple */}
          <button
            onClick={handleAppleLogin}
            disabled={isLoading !== null}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-black text-white font-medium border border-gray-700 hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading === "apple" ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">
                progress_activity
              </span>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            )}
            <span>Continuar com Apple</span>
          </button>
        </div>

        {/* Divisor */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border-subtle" />
          <span className="text-xs text-text-secondary">ou</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        {/* Continuar sem login */}
        <button
          onClick={handleContinueWithoutLogin}
          className="w-full py-3 px-4 rounded-xl text-text-secondary hover:text-white hover:bg-surface-dark transition-colors text-sm"
        >
          Continuar sem conta
        </button>
      </div>

      {/* Info */}
      <p className="mt-6 text-xs text-text-secondary text-center max-w-sm">
        Ao entrar, seus dados ficam salvos apenas no seu dispositivo. Em breve,
        sincronização na nuvem.
      </p>
    </main>
  );
}

function LoginFallback() {
  return (
    <main className="min-h-screen bg-surface-dark flex items-center justify-center">
      <div className="animate-pulse">
        <span className="material-symbols-outlined text-[48px] text-primary">
          fitness_center
        </span>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
