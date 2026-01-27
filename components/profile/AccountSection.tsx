"use client";

/**
 * Seção de Conta no Profile
 *
 * Mostra informações do usuário autenticado ou botão para login.
 * Permite fazer logout.
 */

import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

export function AccountSection() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogin = () => {
    router.push("/login");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    setIsLoggingOut(false);
  };

  // Loading
  if (isLoading) {
    return (
      <section className="rounded-xl border border-border-subtle bg-surface-card p-4">
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-dark" />
          <div className="flex-1">
            <div className="h-4 bg-surface-dark rounded w-32 mb-2" />
            <div className="h-3 bg-surface-dark rounded w-48" />
          </div>
        </div>
      </section>
    );
  }

  // Não autenticado
  if (!user) {
    return (
      <section className="rounded-xl border border-border-subtle bg-surface-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-surface-dark flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px] text-text-secondary">
                person
              </span>
            </div>
            <div>
              <p className="text-sm text-white">Conta não vinculada</p>
              <p className="text-xs text-text-secondary">
                Entre para sincronizar seus dados
              </p>
            </div>
          </div>

          <button
            onClick={handleLogin}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Entrar
          </button>
        </div>
      </section>
    );
  }

  // Autenticado
  return (
    <section className="rounded-xl border border-border-subtle bg-surface-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {user.user_metadata?.avatar_url && user.user_metadata.avatar_url.startsWith("http") ? (
            <Image
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata?.full_name || "Avatar"}
              width={48}
              height={48}
              className="rounded-full"
              unoptimized={!user.user_metadata.avatar_url.includes("googleusercontent.com")}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <span className="text-lg font-semibold text-white">
                {user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
          )}

          {/* Info */}
          <div>
            <p className="text-sm text-white font-medium">
              {user.user_metadata?.full_name || "Usuário"}
            </p>
            <p className="text-xs text-text-secondary">
              {user.email || ""}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-error hover:bg-error/10 transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">
              progress_activity
            </span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">
              logout
            </span>
          )}
          <span>Sair</span>
        </button>
      </div>

      {/* Info sobre sincronização */}
      <div className="mt-4 pt-4 border-t border-border-subtle">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-[16px] text-text-secondary mt-0.5">
            info
          </span>
          <p className="text-xs text-text-secondary">
            Seus dados ainda estão salvos apenas neste dispositivo. Em breve,
            sincronização automática na nuvem.
          </p>
        </div>
      </div>
    </section>
  );
}
