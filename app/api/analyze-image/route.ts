import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * API Route: Análise de Imagem de Refeição
 *
 * Recebe uma imagem de refeição e usa GPT-4 Vision para:
 * 1. Identificar os alimentos
 * 2. Estimar porções
 * 3. Calcular macros aproximados
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Prompt do sistema para análise de refeições
const SYSTEM_PROMPT = `Você é um nutricionista especializado em análise visual de refeições.
Sua tarefa é analisar fotos de refeições e identificar:

1. ALIMENTOS: Liste cada alimento visível na foto
2. PORÇÕES: Estime a quantidade de cada alimento (em gramas ou unidades)
3. MACROS: Estime calorias, proteínas, carboidratos e gorduras

REGRAS:
- Seja preciso mas realista nas estimativas
- Se não conseguir identificar algo, diga "não identificado"
- Use medidas brasileiras comuns (colher de sopa, xícara, etc.)
- Arredonde valores para facilitar o registro
- Se a imagem não for de comida, diga educadamente

FORMATO DE RESPOSTA (JSON):
{
  "isFood": true/false,
  "description": "Descrição geral da refeição",
  "items": [
    {
      "name": "Nome do alimento",
      "portion": "100g",
      "calories": 150,
      "protein": 10,
      "carbs": 15,
      "fat": 5
    }
  ],
  "totals": {
    "calories": 500,
    "protein": 30,
    "carbs": 45,
    "fat": 20
  },
  "confidence": "alta/média/baixa",
  "notes": "Observações adicionais (opcional)"
}`;

// Interface para o resultado da análise
export interface FoodAnalysisResult {
  isFood: boolean;
  description: string;
  items: Array<{
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  confidence: "alta" | "média" | "baixa";
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verifica se a API key está configurada
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "API key não configurada" },
        { status: 500 }
      );
    }

    // Recebe a imagem como base64 no body
    const body = await request.json();
    const { image, mimeType = "image/jpeg" } = body;

    if (!image) {
      return NextResponse.json(
        { error: "Imagem não fornecida" },
        { status: 400 }
      );
    }

    // Valida o formato da imagem
    const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validMimeTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: "Formato de imagem não suportado" },
        { status: 400 }
      );
    }

    // Chama a API de visão do GPT-4
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // GPT-4 com visão
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analise esta foto de refeição e retorne os dados no formato JSON especificado.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${image}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    // Extrai a resposta
    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Não foi possível analisar a imagem" },
        { status: 500 }
      );
    }

    // Parseia o JSON da resposta
    let analysis: FoodAnalysisResult;
    try {
      analysis = JSON.parse(content);
    } catch {
      // Se não conseguir parsear, retorna erro genérico
      return NextResponse.json(
        { error: "Erro ao processar resposta da análise" },
        { status: 500 }
      );
    }

    // Valida campos mínimos
    if (typeof analysis.isFood !== "boolean") {
      analysis.isFood = true;
    }
    if (!analysis.items) {
      analysis.items = [];
    }
    if (!analysis.totals) {
      analysis.totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Erro na análise de imagem:", error);

    // Trata erros específicos da OpenAI
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Limite de requisições excedido. Tente novamente em alguns segundos." },
          { status: 429 }
        );
      }
      if (error.status === 401) {
        return NextResponse.json(
          { error: "Erro de autenticação com a API" },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: "Erro ao analisar imagem. Tente novamente." },
      { status: 500 }
    );
  }
}
