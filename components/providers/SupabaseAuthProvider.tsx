"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  signInWithApple: (redirectPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obtém sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Escuta mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Se acabou de fazer login, redireciona apropriadamente
      if (event === "SIGNED_IN" && session) {
        const currentPath = window.location.pathname;
        // Se está no callback, deixa a página de callback fazer o redirect
        if (currentPath.startsWith("/auth/callback")) return;
        // Se está na página de login, redireciona para home
        if (currentPath === "/login") {
          window.location.href = "/home";
        }
        // Se está no onboarding inicial, redireciona para completar o perfil
        else if (currentPath === "/onboarding") {
          window.location.href = "/onboarding/profile";
        }
        // Se está na página de erro de auth, redireciona para home
        else if (currentPath.startsWith("/auth/error")) {
          window.location.href = "/home";
        }
        // Se está no callback, deixa o callback handler fazer o redirect
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async (redirectPath?: string) => {
    // Se não especificado, usa a página atual ou /home
    const nextPath = redirectPath || (window.location.pathname.startsWith("/onboarding") ? "/onboarding/profile" : "/home");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    if (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signInWithApple = async (redirectPath?: string) => {
    // Se não especificado, usa a página atual ou /home
    const nextPath = redirectPath || (window.location.pathname.startsWith("/onboarding") ? "/onboarding/profile" : "/home");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    if (error) {
      console.error("Error signing in with Apple:", error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signInWithGoogle,
        signInWithApple,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a SupabaseAuthProvider");
  }
  return context;
}
