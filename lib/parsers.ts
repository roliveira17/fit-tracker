import OpenAI from "openai";
import {
  lookupMultipleFoods,
  cacheAIResult,
  generateUserContext,
  NutritionInfo,
} from "./food-lookup";
import { Meal } from "./storage";
import { OPENAI_MODEL } from "./ai";

/**
 * Parsers para extrair dados estruturados das mensagens do usuário
 *
 * Fluxo de parsing de alimentos:
 * 1. Extrai alimentos da mensagem
 * 2. Busca no cache do usuário (padrões pessoais)
 * 3. Busca na tabela padrão (food-database)
 * 4. Se não encontrar, consulta IA e salva no cache
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
  grams?: number;         // Quantidade em gramas (para compatibilidade com storage)
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
  needsQuestion?: boolean; // true se precisa perguntar algo
  question?: string;       // Pergunta a fazer
  options?: string[];      // Opções para a pergunta
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

/**
 * Tipo de medição de glicemia
 */
export type GlucoseMeasurementType = "fasting" | "pre_meal" | "post_meal" | "bedtime" | "random" | "cgm";

/**
 * Resultado do parser de glicemia
 */
export interface GlucoseParseResult {
  glucose: number;        // Glicemia em mg/dL
  measurementType: GlucoseMeasurementType;
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
 * Parser de alimentação com sistema inteligente de lookup
 *
 * Fluxo:
 * 1. Busca no cache do usuário (padrões pessoais)
 * 2. Busca na tabela padrão (food-database)
 * 3. Se não encontrar, consulta IA e salva no cache
 *
 * @param message Mensagem do usuário
 * @param userHistory Histórico de refeições (opcional, para contexto)
 */
export async function parseFood(
  message: string,
  userHistory?: Meal[]
): Promise<FoodParseResult> {
  // 1. Tenta lookup local primeiro (cache + database)
  const lookup = lookupMultipleFoods(message, userHistory);

  // 2. Converte resultados encontrados para FoodItem
  const foundItems: FoodItem[] = lookup.results
    .filter((r) => r.found && r.food)
    .map((r) => ({
      name: r.food!.name,
      quantity: r.food!.grams,
      unit: "g",
      calories: r.food!.calories,
      protein: r.food!.protein,
      carbs: r.food!.carbs,
      fat: r.food!.fat,
    }));

  // Itens ambíguos vão para IA ao invés de bloquear tudo
  const aiQueue = [...lookup.needsAI];
  if (lookup.hasQuestions.length > 0) {
    for (const q of lookup.hasQuestions) {
      aiQueue.push(q.food);
    }
  }

  // 3. Se tem alimentos que precisam de IA, consulta uma única vez
  if (aiQueue.length > 0) {
    const aiItems = await parseUnknownFoodsWithAI(
      aiQueue,
      message,
      userHistory
    );
    foundItems.push(...aiItems);

    // Salva no cache para próxima vez
    for (const item of aiItems) {
      cacheAIResult({
        name: item.name,
        grams: item.quantity,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      });
    }
  }

  return {
    mealType: inferMealTypeFromMessage(message),
    items: foundItems,
    totalCalories: foundItems.reduce((sum, i) => sum + i.calories, 0),
    totalProtein: foundItems.reduce((sum, i) => sum + i.protein, 0),
    totalCarbs: foundItems.reduce((sum, i) => sum + i.carbs, 0),
    totalFat: foundItems.reduce((sum, i) => sum + i.fat, 0),
    rawText: message,
  };
}

/**
 * Infere o tipo de refeição a partir da mensagem
 */
function inferMealTypeFromMessage(
  message: string
): "breakfast" | "lunch" | "dinner" | "snack" | "other" {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("café da manhã") ||
    normalized.includes("cafe da manha") ||
    normalized.includes("tomei café") ||
    normalized.includes("tomei cafe")
  ) {
    return "breakfast";
  }
  if (
    normalized.includes("almocei") ||
    normalized.includes("almoço") ||
    normalized.includes("almoco")
  ) {
    return "lunch";
  }
  if (
    normalized.includes("jantei") ||
    normalized.includes("jantar") ||
    normalized.includes("janta")
  ) {
    return "dinner";
  }
  if (
    normalized.includes("lanche") ||
    normalized.includes("merenda") ||
    normalized.includes("snack")
  ) {
    return "snack";
  }

  // Se não especificou, infere pelo horário
  return inferMealType();
}

/**
 * Consulta IA para alimentos desconhecidos
 * Faz uma única chamada para todos os alimentos não encontrados
 */
async function parseUnknownFoodsWithAI(
  unknownFoods: string[],
  originalMessage: string,
  userHistory?: Meal[]
): Promise<FoodItem[]> {
  const client = getOpenAIClient();

  // Gera contexto do usuário se tiver histórico
  const userContext = userHistory
    ? generateUserContext(userHistory)
    : "";

  const prompt = `Você é um parser de alimentos. Analise os alimentos abaixo e retorne informações nutricionais.
Retorne APENAS um JSON válido (sem markdown, sem explicação).

ALIMENTOS PARA ANALISAR:
${unknownFoods.map((f, i) => `${i + 1}. ${f}`).join("\n")}

CONTEXTO DA MENSAGEM ORIGINAL: "${originalMessage}"
${userContext}

REGRAS:
- Use valores nutricionais médios brasileiros
- Se o alimento não especifica quantidade, use porção padrão brasileira
- Sempre retorne números, nunca texto para valores numéricos

Responda com JSON no formato:
{
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
}`;

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return (parsed.items || []).map((item: FoodItem) => ({
        name: item.name || "Alimento",
        quantity: Number(item.quantity) || 100,
        unit: item.unit || "g",
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fat: Number(item.fat) || 0,
      }));
    }
  } catch (error) {
    console.error("Erro no parser de alimentação (IA):", error);
  }

  return [];
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
      model: OPENAI_MODEL,
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
      model: OPENAI_MODEL,
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
      model: OPENAI_MODEL,
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

/**
 * Infere o tipo de medição de glicemia pelo contexto
 */
function inferGlucoseMeasurementType(message: string): GlucoseMeasurementType {
  const lowerMessage = message.toLowerCase();

  // Jejum
  if (lowerMessage.includes("jejum") ||
      lowerMessage.includes("manhã") ||
      lowerMessage.includes("acordei") ||
      lowerMessage.includes("fasting")) {
    return "fasting";
  }

  // Pós-refeição
  if (lowerMessage.includes("pós") ||
      lowerMessage.includes("depois") ||
      lowerMessage.includes("após") ||
      lowerMessage.includes("comi") ||
      lowerMessage.includes("almoc") ||
      lowerMessage.includes("jant")) {
    return "post_meal";
  }

  // Pré-refeição
  if (lowerMessage.includes("antes") ||
      lowerMessage.includes("pré")) {
    return "pre_meal";
  }

  // Antes de dormir
  if (lowerMessage.includes("dormir") ||
      lowerMessage.includes("noite") ||
      lowerMessage.includes("deitar")) {
    return "bedtime";
  }

  // Default: random
  return "random";
}

/**
 * Parser de glicemia
 * Extrai valor de glicemia de uma mensagem
 */
export async function parseGlucose(message: string): Promise<GlucoseParseResult | null> {
  // Regex para casos comuns (glicemia em mg/dL)
  const patterns = [
    /glicemia\s*(?:de\s*)?(\d+)\s*(?:mg\/dl)?/i,
    /glicose\s*(?:de\s*)?(\d+)\s*(?:mg\/dl)?/i,
    /açúcar\s*(?:de\s*)?(\d+)\s*(?:mg\/dl)?/i,
    /acucar\s*(?:de\s*)?(\d+)\s*(?:mg\/dl)?/i,
    /glucose\s*(\d+)/i,
    /(\d+)\s*mg\/dl/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const glucose = parseInt(match[1], 10);
      // Valores válidos de glicemia: 20-600 mg/dL
      if (glucose >= 20 && glucose <= 600) {
        return {
          glucose,
          measurementType: inferGlucoseMeasurementType(message),
          rawText: message,
        };
      }
    }
  }

  // AI fallback
  const client = getOpenAIClient();
  const prompt = `Extraia o valor de glicemia (açúcar no sangue) da mensagem.
Retorne APENAS JSON: {"glucose": numero_em_mg_dl, "type": "fasting|pre_meal|post_meal|bedtime|random"}

Tipos:
- fasting: em jejum, manhã
- pre_meal: antes de comer
- post_meal: após refeição
- bedtime: antes de dormir
- random: outro momento

Se não encontrar glicemia, retorne {"glucose": null}

Mensagem: "${message}"`;

  try {
    const response = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 50,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.glucose && typeof parsed.glucose === "number" && parsed.glucose >= 20 && parsed.glucose <= 600) {
        return {
          glucose: parsed.glucose,
          measurementType: (parsed.type as GlucoseMeasurementType) || "random",
          rawText: message,
        };
      }
    }
  } catch (error) {
    console.error("Erro no parser de glicemia:", error);
  }

  return null;
}
