"use client";

/**
 * Seção Hero do Profile — Design Stitch (Light/Calma)
 *
 * Mostra avatar grande, nome, email e badge.
 * Estados: loading, não-autenticado (CTA login), autenticado (hero).
 */

import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function AccountSection() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center gap-5 animate-pulse">
        <div className="w-20 h-20 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-md">
            <span className="material-symbols-outlined text-[32px] text-gray-400">
              person
            </span>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="font-serif-display text-xl text-gray-800 leading-tight">
            Visitante
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Entre para sincronizar seus dados
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-2 px-4 py-1.5 rounded-full bg-calma-primary text-white text-xs font-semibold hover:bg-calma-primary/90 transition-colors"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  const displayName = user.user_metadata?.full_name || "Usuário";
  const email = user.email || "";
  const avatarUrl = user.user_metadata?.avatar_url;
  const initial =
    displayName.charAt(0).toUpperCase() ||
    email.charAt(0).toUpperCase() ||
    "U";

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-2 border-white shadow-md overflow-hidden bg-gray-100">
          {avatarUrl && avatarUrl.startsWith("http") ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={80}
              height={80}
              className="w-full h-full object-cover"
              unoptimized={!avatarUrl.includes("googleusercontent.com")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-calma-primary">
              <span className="text-2xl font-semibold text-white">
                {initial}
              </span>
            </div>
          )}
        </div>
        <button className="absolute bottom-0 right-0 w-7 h-7 bg-calma-primary text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
          <span className="material-symbols-outlined text-[12px]">edit</span>
        </button>
      </div>

      <div>
        <h2 className="font-serif-display text-xl text-gray-800 leading-tight">
          {displayName}
        </h2>
        <p className="text-sm text-gray-500 mt-1">{email}</p>
        <div className="flex items-center mt-2 gap-2">
          <span className="bg-calma-accent/20 text-calma-primary text-xs px-2 py-0.5 rounded-full font-semibold">
            Fit Track
          </span>
        </div>
      </div>
    </div>
  );
}
