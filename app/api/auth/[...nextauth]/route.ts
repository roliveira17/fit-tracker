/**
 * API Routes do NextAuth.js
 *
 * Handlers para autenticação OAuth com Google e Apple.
 * Todas as rotas de auth são gerenciadas automaticamente pelo NextAuth.
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
