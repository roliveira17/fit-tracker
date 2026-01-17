import { NextRequest, NextResponse } from "next/server";
import { sendMessage, type ChatMessage } from "@/lib/ai";
import { type UserProfile } from "@/lib/storage";

/**
 * API Route para o Chat
 * POST /api/chat
 *
 * Body:
 * - message: string (mensagem do usuário)
 * - history: ChatMessage[] (histórico de mensagens)
 * - profile: UserProfile (perfil do usuário)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history, profile } = body as {
      message: string;
      history: ChatMessage[];
      profile: UserProfile;
    };

    // Validações básicas
    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Mensagem é obrigatória" },
        { status: 400 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil do usuário é obrigatório" },
        { status: 400 }
      );
    }

    // Verifica se a API key está configurada
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY não configurada. Adicione no arquivo .env.local" },
        { status: 500 }
      );
    }

    // Envia para a AI (agora retorna objeto com response e classification)
    const result = await sendMessage(message, history || [], profile);

    return NextResponse.json({
      response: result.response,
      classification: result.classification,
      parsedData: result.parsedData,
    });
  } catch (error) {
    console.error("Erro no chat:", error);

    // Erro específico da OpenAI
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "API key inválida ou não configurada" },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erro ao processar mensagem" },
      { status: 500 }
    );
  }
}
