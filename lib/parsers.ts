import OpenAI from "openai";

/**
 * Parsers para extrair dados estruturados das mensagens do usuário
 */

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// ============================================
// TIPOS
// ============================================

/**
 * Item de alimentação parseado
 */
export interface FoodItem {
  name: string;           // Nome do alimento
  quantity: number;       // Quantidade numérica
  unit: string;           // Unidade (g, ml, unidade, fatia, etc)
  calories: number;       // Calorias estimadas
  protein: number;        // Proteína em gramas
  carbs: number;          // Carboidratos em gramas
  fat: number;            // Gordura em gramas
}

/**
 * Resultado do parser de alimentação
 */
export interface FoodParseResult {
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | "other";
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  rawText: string;        // Texto original
}

/**
 * Exercício parseado
 */
export interface ExerciseItem {
  type: string;           // Tipo de exercício (musculação, cardio, etc)
  name: string;           // Nome específico (supino, corrida, etc)
  duration?: number;      // Duração em minutos (se aplicável)
  sets?: number;          // Séries (se aplicável)
  reps?: number;          // Repetições (se aplicável)
  caloriesBurned?: number;// Estimativa de calorias queimadas
}

/**
 * Resultado do parser de exercício
 */
export interface ExerciseParseResult {
  exercises: ExerciseItem[];
  totalDuration?: number;
  totalCaloriesBurned?: number;
  rawText: string;
}

/**
 * Resultado do parser de peso
 */
export interface WeightParseResult {
  weight: number;         // Peso em kg
  rawText: string;
}

/**
 * Resultado do parser de body fat
 */
export interface BodyFatParseResult {
  percentage: number;     // Percentual de gordura
  rawText: string;
}

// ============================================
// PARSERS
// ============================================

/**
 * Infere o tipo de refeição baseado no horário atual
 */
function inferMealType(): "breakfast" | "lunch" | "dinner" | "snack" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 18 && hour < 22) return "dinner";
  return "snack";
}

/**
 * Parser de alimentação
 * Extrai itens de comida de uma mensagem do usuário
 */
export async function parseFood(message: string): Promise<FoodParseResult> {
  const client = getOpenAIClient();

  const prompt = `Você é um parser de alimentos. Analise a mensagem e extraia os alimentos mencionados.
Retorne APENAS um JSON válido (sem markdown, sem explicação).

REGRAS:
- Estime quantidades se não especificadas (porção típica brasileira)
- Use valores nutricionais médios por 100g e ajuste pela quantidade
- Se não conseguir identificar, use valores aproximados
- Sempre retorne números, nunca texto para valores numéricos

MENSAGEM: "${message}"

Responda com JSON no formato:
{
  "mealType": "breakfast|lunch|dinner|snack|other",
  "items": [
    {
      "name": "nome do alimento",
      "quantity": 100,
      "unit": "g",
      "calories": 150,
      "protein": 10,
      "carbs": 20,
      "fat": 5
    }
  ]
}

Se houver indicação de refeição (almocei, jantei, café da manhã), use o mealType correspondente.
Se não houver, infira pelo contexto ou use "snack".`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const items: FoodItem[] = (parsed.items || []).map((item: FoodItem) => ({
        name: item.name || "Alimento",
        quantity: Number(item.quantity) || 100,
        unit: item.unit || "g",
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fat: Number(item.fat) || 0,
      }));

      return {
        mealType: parsed.mealType || inferMealType(),
        items,
        totalCalories: items.reduce((sum, i) => sum + i.calories, 0),
        totalProtein: items.reduce((sum, i) => sum + i.protein, 0),
        totalCarbs: items.reduce((sum, i) => sum + i.carbs, 0),
        totalFat: items.reduce((sum, i) => sum + i.fat, 0),
        rawText: message,
      };
    }
  } catch (error) {
    console.error("Erro no parser de alimentação:", error);
  }

  // Fallback
  return {
    mealType: inferMealType(),
    items: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    rawText: message,
  };
}

/**
 * Parser de exercício
 * Extrai informações de treino de uma mensagem
 */
export async function parseExercise(message: string): Promise<ExerciseParseResult> {
  const client = getOpenAIClient();

  const prompt = `Você é um parser de exercícios. Analise a mensagem e extraia os exercícios mencionados.
Retorne APENAS um JSON válido (sem markdown, sem explicação).

REGRAS:
- Identifique o tipo de exercício (musculação, cardio, funcional, etc)
- Estime calorias queimadas baseado no tipo e duração
- Se não tiver duração, estime baseado no contexto

MENSAGEM: "${message}"

Responda com JSON no formato:
{
  "exercises": [
    {
      "type": "musculação|cardio|funcional|esporte|outro",
      "name": "nome específico do exercício",
      "duration": 30,
      "sets": 3,
      "reps": 12,
      "caloriesBurned": 150
    }
  ]
}

duration é em minutos. sets e reps são opcionais (para musculação).`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const exercises: ExerciseItem[] = (parsed.exercises || []).map((ex: ExerciseItem) => ({
        type: ex.type || "outro",
        name: ex.name || "Exercício",
        duration: ex.duration ? Number(ex.duration) : undefined,
        sets: ex.sets ? Number(ex.sets) : undefined,
        reps: ex.reps ? Number(ex.reps) : undefined,
        caloriesBurned: ex.caloriesBurned ? Number(ex.caloriesBurned) : undefined,
      }));

      return {
        exercises,
        totalDuration: exercises.reduce((sum, e) => sum + (e.duration || 0), 0) || undefined,
        totalCaloriesBurned: exercises.reduce((sum, e) => sum + (e.caloriesBurned || 0), 0) || undefined,
        rawText: message,
      };
    }
  } catch (error) {
    console.error("Erro no parser de exercício:", error);
  }

  return {
    exercises: [],
    rawText: message,
  };
}

/**
 * Parser de peso
 * Extrai valor de peso de uma mensagem
 */
export async function parseWeight(message: string): Promise<WeightParseResult | null> {
  // Primeiro tenta regex simples para casos óbvios
  const patterns = [
    /peso\s*(?:de\s*)?(\d+[.,]?\d*)\s*(?:kg)?/i,
    /(\d+[.,]?\d*)\s*kg/i,
    /estou\s*(?:com\s*)?(\d+[.,]?\d*)/i,
    /(\d{2,3}[.,]\d{1,2})/,  // 77.5 ou 77,5
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const weight = parseFloat(match[1].replace(",", "."));
      if (weight >= 30 && weight <= 300) {
        return { weight, rawText: message };
      }
    }
  }

  // Se não encontrou por regex, tenta com AI
  const client = getOpenAIClient();
  const prompt = `Extraia o peso corporal da mensagem. Retorne APENAS JSON: {"weight": numero_em_kg}
Se não encontrar peso, retorne {"weight": null}

Mensagem: "${message}"`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 50,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.weight && typeof parsed.weight === "number") {
        return { weight: parsed.weight, rawText: message };
      }
    }
  } catch (error) {
    console.error("Erro no parser de peso:", error);
  }

  return null;
}

/**
 * Parser de body fat
 * Extrai percentual de gordura de uma mensagem
 */
export async function parseBodyFat(message: string): Promise<BodyFatParseResult | null> {
  // Regex para casos comuns
  const patterns = [
    /bf\s*(?:de\s*)?(\d+[.,]?\d*)\s*%?/i,
    /body\s*fat\s*(?:de\s*)?(\d+[.,]?\d*)\s*%?/i,
    /gordura\s*(?:corporal\s*)?(?:de\s*)?(\d+[.,]?\d*)\s*%?/i,
    /(\d+[.,]?\d*)\s*%\s*(?:de\s*)?(?:gordura|bf)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const percentage = parseFloat(match[1].replace(",", "."));
      if (percentage >= 3 && percentage <= 60) {
        return { percentage, rawText: message };
      }
    }
  }

  // AI fallback
  const client = getOpenAIClient();
  const prompt = `Extraia o percentual de gordura corporal da mensagem. Retorne APENAS JSON: {"percentage": numero}
Se não encontrar, retorne {"percentage": null}

Mensagem: "${message}"`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 50,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.percentage && typeof parsed.percentage === "number") {
        return { percentage: parsed.percentage, rawText: message };
      }
    }
  } catch (error) {
    console.error("Erro no parser de BF:", error);
  }

  return null;
}
