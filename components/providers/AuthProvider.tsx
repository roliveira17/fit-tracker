"use client";

/**
 * Provider de Autenticação
 *
 * Wrapper do SessionProvider do NextAuth.js para toda a aplicação.
 * Permite usar useSession() em qualquer componente cliente.
 */

import { SessionProvider } from "next-auth/react";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
