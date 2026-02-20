import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { fetchProductByBarcode, offProductToMealItem } from "@/lib/openfoodfacts";

/**
 * API Route: Análise de Imagem de Refeição ou Código de Barras
 *
 * Recebe uma imagem e usa GPT-4 Vision para:
 * 1. Detectar se é um código de barras ou foto de comida
 * 2. Se barcode: extrair o número e buscar no Open Food Facts
 * 3. Se comida: identificar alimentos e calcular macros
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Prompt do sistema para análise de refeições E códigos de barras
const SYSTEM_PROMPT = `Você é um assistente especializado em análise de imagens para um app de nutrição.
Sua tarefa é analisar a imagem e identificar se é:
1. Um CÓDIGO DE BARRAS de produto alimentício
2. Uma FOTO DE REFEIÇÃO/ALIMENTO
3. Um RÓTULO NUTRICIONAL (tabela nutricional, informações nutricionais de embalagem)
4. Uma RECEITA (foto de receita, página de livro de receitas, screenshot de receita)

## SE FOR CÓDIGO DE BARRAS:
- Identifique que é um código de barras
- Leia os NÚMEROS que aparecem ABAIXO do código de barras (geralmente 8-13 dígitos)
- O número geralmente está impresso logo abaixo das barras
- Retorne no formato especial para barcode

## SE FOR FOTO DE COMIDA:
- Liste cada alimento visível
- Estime porções em gramas
- Calcule macros aproximados

## SE FOR RÓTULO NUTRICIONAL:
- Identifique o nome do produto se visível
- Extraia os valores nutricionais por porção (calorias, proteína, carboidratos, gordura)
- Retorne como um item no array items (o produto) com os macros extraídos
- Use os valores exatos do rótulo, não estimativas

## SE FOR RECEITA:
- Liste os ingredientes com quantidades estimadas
- Estime os macros totais da receita completa
- Cada ingrediente vai como um item no array items
- Os totais devem refletir a soma estimada de todos ingredientes

## REGRAS:
- Seja preciso na leitura de números de barcode
- Se for barcode mas não conseguir ler os números claramente, tente mesmo assim
- Use medidas brasileiras comuns
- Arredonde valores para facilitar o registro

## FORMATO DE RESPOSTA (JSON):

### Se for CÓDIGO DE BARRAS:
{
  "type": "barcode",
  "barcode": "7891000100103",
  "confidence": "alta",
  "notes": "Código de barras lido com sucesso"
}

### Se for FOTO DE COMIDA:
{
  "type": "food",
  "isFood": true,
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
  "confidence": "alta",
  "notes": "Observações adicionais"
}

### Se for RÓTULO NUTRICIONAL:
{
  "type": "nutrition_label",
  "isFood": true,
  "description": "Nome do produto - rótulo nutricional",
  "items": [
    {
      "name": "Nome do produto",
      "portion": "porção indicada no rótulo (ex: 30g)",
      "calories": 150,
      "protein": 10,
      "carbs": 15,
      "fat": 5
    }
  ],
  "totals": {
    "calories": 150,
    "protein": 10,
    "carbs": 15,
    "fat": 5
  },
  "confidence": "alta",
  "notes": "Valores extraídos do rótulo nutricional"
}

### Se for RECEITA:
{
  "type": "recipe",
  "isFood": true,
  "description": "Nome da receita",
  "items": [
    {
      "name": "Ingrediente 1",
      "portion": "quantidade estimada",
      "calories": 100,
      "protein": 5,
      "carbs": 10,
      "fat": 3
    }
  ],
  "totals": {
    "calories": 500,
    "protein": 30,
    "carbs": 45,
    "fat": 20
  },
  "confidence": "media",
  "notes": "Macros estimados com base nos ingredientes visíveis"
}

### Se NÃO for comida nem barcode:
{
  "type": "unknown",
  "isFood": false,
  "description": "Descrição do que foi identificado",
  "notes": "Esta imagem não parece ser de alimento ou código de barras"
}`;

// Interface para o resultado da análise de comida
export interface FoodAnalysisResult {
  type?: "food" | "barcode" | "nutrition_label" | "recipe" | "unknown";
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
  // Campos para barcode
  barcode?: string;
  product?: {
    name: string;
    brand: string | null;
    imageUrl: string | null;
  };
}

// Interface para resposta do GPT
interface GPTResponse {
  type: "food" | "barcode" | "nutrition_label" | "recipe" | "unknown";
  barcode?: string;
  isFood?: boolean;
  description?: string;
  items?: Array<{
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  totals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  confidence?: "alta" | "média" | "baixa";
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
              text: "Analise esta imagem. Se for um código de barras, leia o número. Se for comida, identifique os alimentos. Se for um rótulo nutricional, extraia os valores. Se for uma receita, liste os ingredientes e estime os macros. Retorne no formato JSON especificado.",
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
    let gptResponse: GPTResponse;
    try {
      gptResponse = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "Erro ao processar resposta da análise" },
        { status: 500 }
      );
    }

    // Se for código de barras, buscar no Open Food Facts
    if (gptResponse.type === "barcode" && gptResponse.barcode) {
      const barcode = gptResponse.barcode.replace(/\D/g, ""); // Remove não-dígitos

      if (barcode.length >= 8) {
        const product = await fetchProductByBarcode(barcode);

        if (product) {
          // Converte para formato de item de refeição
          const mealItem = offProductToMealItem(product, 100);

          const analysis: FoodAnalysisResult = {
            type: "barcode",
            isFood: true,
            description: product.brand
              ? `${product.productName} (${product.brand})`
              : product.productName,
            items: [
              {
                name: mealItem.name,
                portion: "100g",
                calories: mealItem.calories,
                protein: mealItem.protein,
                carbs: mealItem.carbs,
                fat: mealItem.fat,
              },
            ],
            totals: {
              calories: mealItem.calories,
              protein: mealItem.protein,
              carbs: mealItem.carbs,
              fat: mealItem.fat,
            },
            confidence: gptResponse.confidence || "alta",
            notes: `Produto encontrado via código de barras ${barcode}`,
            barcode: barcode,
            product: {
              name: product.productName,
              brand: product.brand,
              imageUrl: product.imageUrl,
            },
          };

          return NextResponse.json({
            success: true,
            analysis,
          });
        } else {
          // Barcode lido mas produto não encontrado
          return NextResponse.json({
            success: true,
            analysis: {
              type: "barcode",
              isFood: false,
              description: `Código de barras: ${barcode}`,
              items: [],
              totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
              confidence: gptResponse.confidence || "alta",
              notes: `Código de barras lido (${barcode}), mas produto não encontrado no banco de dados. Tente digitar o nome do produto.`,
              barcode: barcode,
            } as FoodAnalysisResult,
          });
        }
      } else {
        // Barcode inválido
        return NextResponse.json({
          success: true,
          analysis: {
            type: "barcode",
            isFood: false,
            description: "Código de barras não reconhecido",
            items: [],
            totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
            confidence: "baixa",
            notes: "Não consegui ler o código de barras claramente. Tente tirar uma foto mais nítida ou com melhor iluminação.",
          } as FoodAnalysisResult,
        });
      }
    }

    // Se for rótulo nutricional
    if (gptResponse.type === "nutrition_label") {
      const analysis: FoodAnalysisResult = {
        type: "nutrition_label",
        isFood: true,
        description: gptResponse.description || "Rótulo nutricional",
        items: gptResponse.items || [],
        totals: gptResponse.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 },
        confidence: gptResponse.confidence || "alta",
        notes: gptResponse.notes,
      };
      return NextResponse.json({ success: true, analysis });
    }

    // Se for receita
    if (gptResponse.type === "recipe") {
      const analysis: FoodAnalysisResult = {
        type: "recipe",
        isFood: true,
        description: gptResponse.description || "Receita identificada",
        items: gptResponse.items || [],
        totals: gptResponse.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 },
        confidence: gptResponse.confidence || "média",
        notes: gptResponse.notes,
      };
      return NextResponse.json({ success: true, analysis });
    }

    // Se for comida, retorna análise normal
    if (gptResponse.type === "food" || gptResponse.isFood) {
      const analysis: FoodAnalysisResult = {
        type: "food",
        isFood: true,
        description: gptResponse.description || "Refeição identificada",
        items: gptResponse.items || [],
        totals: gptResponse.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 },
        confidence: gptResponse.confidence || "média",
        notes: gptResponse.notes,
      };

      return NextResponse.json({
        success: true,
        analysis,
      });
    }

    // Se não for nem comida nem barcode
    const analysis: FoodAnalysisResult = {
      type: "unknown",
      isFood: false,
      description: gptResponse.description || "Imagem não reconhecida",
      items: [],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      confidence: gptResponse.confidence || "baixa",
      notes: gptResponse.notes || "Não consegui identificar alimentos ou código de barras nesta imagem.",
    };

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
