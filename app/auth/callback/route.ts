import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/home";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Se recebeu erro do OAuth provider, redireciona para login
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${error}&error_description=${encodeURIComponent(errorDescription || "Erro de autenticação")}`, requestUrl.origin)
    );
  }

  // Se temos o código, tenta trocar por sessão
  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: "pkce",
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        // Se o erro for "code already used", a sessão provavelmente já foi criada pelo cliente
        // Nesse caso, podemos simplesmente redirecionar para /home
        if (exchangeError.message?.includes("already") || exchangeError.message?.includes("expired")) {
          console.log("Code already used or expired, redirecting to home anyway");
          return NextResponse.redirect(new URL(next, requestUrl.origin));
        }

        console.error("Error exchanging code:", exchangeError);
        return NextResponse.redirect(
          new URL(`/login?error=exchange_error&error_description=${encodeURIComponent(exchangeError.message || "Falha ao autenticar")}`, requestUrl.origin)
        );
      }

      if (data.session) {
        // Sucesso! Redireciona para a página destino
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
    } catch (err) {
      console.error("Unexpected error in auth callback:", err);
    }
  }

  // Fallback: se não temos código nem erro, pode ser um reload
  // Redireciona para home (se o usuário já estiver logado, vai funcionar)
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
