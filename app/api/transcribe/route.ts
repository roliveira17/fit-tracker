import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// ========================================
// API de Transcrição de Áudio
// ========================================
// Recebe um arquivo de áudio e retorna o texto transcrito
// Usa a API Whisper da OpenAI

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tamanho máximo do arquivo: 25MB (limite do Whisper)
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Formatos de áudio suportados pelo Whisper
const SUPPORTED_FORMATS = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/flac",
  "audio/m4a",
];

export async function POST(request: NextRequest) {
  try {
    // Verifica se a API key está configurada
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "API key não configurada" },
        { status: 500 }
      );
    }

    // Obtém o FormData da requisição
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    // Valida se o arquivo foi enviado
    if (!audioFile) {
      return NextResponse.json(
        { error: "Nenhum arquivo de áudio enviado" },
        { status: 400 }
      );
    }

    // Valida o tamanho do arquivo
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo: 25MB" },
        { status: 400 }
      );
    }

    // Valida o formato do arquivo
    const mimeType = audioFile.type;
    if (!SUPPORTED_FORMATS.some((format) => mimeType.startsWith(format.split("/")[0]))) {
      return NextResponse.json(
        { error: `Formato não suportado: ${mimeType}` },
        { status: 400 }
      );
    }

    // Converte o File para um formato que a API aceita
    // O Whisper aceita File diretamente no Node.js
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "pt", // Português brasileiro
      response_format: "json",
      prompt: "Transcrição de registro de alimentação, treino ou peso. Contexto: fitness, nutrição, saúde.",
    });

    // Retorna o texto transcrito
    return NextResponse.json({
      text: transcription.text,
      success: true,
    });
  } catch (error) {
    console.error("Erro na transcrição:", error);

    // Tratamento de erros específicos da OpenAI
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: "API key inválida" },
          { status: 401 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Limite de requisições excedido. Tente novamente em alguns segundos." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erro ao transcrever áudio" },
      { status: 500 }
    );
  }
}
