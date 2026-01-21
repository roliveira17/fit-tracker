/**
 * Configuração do NextAuth.js
 *
 * Implementa autenticação social com Google e Apple.
 * Para MVP, apenas gerencia sessão - dados permanecem no localStorage.
 */

import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";

/**
 * Opções de configuração do NextAuth
 */
export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    // Apple Sign-In (opcional - requer Apple Developer Account)
    ...(process.env.APPLE_ID
      ? [
          AppleProvider({
            clientId: process.env.APPLE_ID,
            clientSecret: process.env.APPLE_SECRET ?? "",
          }),
        ]
      : []),
  ],

  // Páginas customizadas
  pages: {
    signIn: "/login",
    error: "/login", // Redireciona erros para login
  },

  // Callbacks
  callbacks: {
    // Adiciona ID do usuário ao token JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // Adiciona ID do usuário à sessão
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },

    // Callback após login bem-sucedido
    async signIn({ user, account }) {
      // Log para debug
      console.log(`Login: ${user.email} via ${account?.provider}`);
      return true;
    },

    // Redireciona após login
    async redirect({ url, baseUrl }) {
      // Se a URL é relativa, adiciona baseUrl
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Se é do mesmo domínio, permite
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Caso contrário, vai para home
      return `${baseUrl}/home`;
    },
  },

  // Sessão via JWT (não precisa de database)
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  // Secret para criptografia
  secret: process.env.NEXTAUTH_SECRET,

  // Debug em desenvolvimento
  debug: process.env.NODE_ENV === "development",
};

/**
 * Tipo estendido para sessão com ID do usuário
 */
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
