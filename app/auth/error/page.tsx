"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const error = searchParams.get("error") || "unknown_error";
  const errorDescription = searchParams.get("error_description") || "Ocorreu um erro durante a autenticação.";

  return (
    <main className="min-h-screen bg-surface-dark flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        {/* Ícone de erro */}
        <div className="mb-6">
          <span className="material-symbols-outlined text-[64px] text-error">
            error
          </span>
        </div>

        {/* Mensagem */}
        <h1 className="text-xl font-bold text-white mb-2">Erro de Autenticação</h1>
        <p className="text-text-secondary text-sm mb-6">{errorDescription}</p>

        {/* Código do erro (para debug) */}
        <p className="text-xs text-text-muted mb-8">Código: {error}</p>

        {/* Botões */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/login")}
            className="w-full py-3 px-4 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Tentar novamente
          </button>

          <button
            onClick={() => router.push("/home")}
            className="w-full py-3 px-4 rounded-xl text-text-secondary hover:text-white hover:bg-surface-card transition-colors text-sm"
          >
            Continuar sem conta
          </button>
        </div>
      </div>
    </main>
  );
}

function AuthErrorFallback() {
  return (
    <main className="min-h-screen bg-surface-dark flex items-center justify-center">
      <div className="animate-pulse">
        <span className="material-symbols-outlined text-[48px] text-error">
          error
        </span>
      </div>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<AuthErrorFallback />}>
      <AuthErrorContent />
    </Suspense>
  );
}
