/**
 * Serviço de busca unificada de alimentos
 *
 * Fluxo de decisão:
 * 1. Busca no cache do usuário (padrões pessoais)
 * 2. Busca na tabela padrão (food-database)
 * 3. Retorna necessidade de consultar IA
 */

import {
  FoodItem,
  findFood,
  calculateNutrition,
  normalizeText,
} from "./food-database";
import {
  CachedFood,
  getFromCache,
  saveToCache,
  incrementUsage,
  updateDefaultGrams,
} from "./food-cache";
import { Meal } from "./storage";
import { searchTBCA, tbcaToFoodItem, type TBCAFood } from "./tbca-database";

export interface LookupResult {
  found: boolean;
  source: "cache" | "database" | "tbca" | "ai";
  food: NutritionInfo | null;
  needsQuestion: boolean; // true se o alimento é ambíguo
  question?: string; // pergunta a fazer se ambíguo
  options?: string[]; // opções para alimento ambíguo
}

export interface NutritionInfo {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ParsedFoodItem {
  name: string;
  quantity?: number; // em gramas, se especificado
  unit?: string; // "g", "unidade", etc.
}

/**
 * Extrai quantidade numérica de uma string
 * Ex: "200g" -> 200, "2 ovos" -> 2
 */
function extractQuantity(text: string): { value: number; unit: string } | null {
  // Padrões comuns: "200g", "200 g", "200 gramas"
  const gramsPattern = /(\d+(?:[.,]\d+)?)\s*(?:g|gramas?)/i;
  const gramsMatch = text.match(gramsPattern);
  if (gramsMatch) {
    return {
      value: parseFloat(gramsMatch[1].replace(",", ".")),
      unit: "g",
    };
  }

  // Padrões com unidades: "2 ovos", "1 fatia", "3 colheres"
  const unitPattern = /(\d+(?:[.,]\d+)?)\s*(unidades?|fatias?|colheres?|pedaços?|copos?|xícaras?|xicaras?)/i;
  const unitMatch = text.match(unitPattern);
  if (unitMatch) {
    return {
      value: parseFloat(unitMatch[1].replace(",", ".")),
      unit: unitMatch[2].toLowerCase(),
    };
  }

  // Apenas número no início: "2 ovos" sem a palavra unidade
  const simplePattern = /^(\d+(?:[.,]\d+)?)\s+/;
  const simpleMatch = text.match(simplePattern);
  if (simpleMatch) {
    return {
      value: parseFloat(simpleMatch[1].replace(",", ".")),
      unit: "unidade",
    };
  }

  return null;
}

/**
 * Busca um alimento usando a hierarquia cache -> database -> IA
 * @param foodText Texto descrevendo o alimento (ex: "200g de frango")
 * @param userHistory Histórico de refeições do usuário (opcional)
 * @returns Resultado da busca
 */
export function lookupFood(
  foodText: string,
  userHistory?: Meal[]
): LookupResult {
  const normalized = normalizeText(foodText);

  // Extrai quantidade se especificada
  const quantityInfo = extractQuantity(foodText);

  // Remove quantidade do texto para buscar o nome do alimento
  let foodName = foodText
    .replace(/\d+(?:[.,]\d+)?\s*(?:g|gramas?|unidades?|fatias?|colheres?|pedaços?|copos?|xícaras?|xicaras?)/gi, "")
    .replace(/^\d+\s+/, "") // remove número no início
    .replace(/^de\s+/i, "") // remove "de" após quantidade
    .trim();

  // Se só sobrou texto vazio, usa o original
  if (!foodName) {
    foodName = foodText;
  }

  // 1. BUSCAR NO CACHE DO USUÁRIO
  const cached = getFromCache(foodName, 2);
  if (cached) {
    // Se tem quantidade especificada, usa ela; senão usa do cache
    const grams = quantityInfo?.unit === "g"
      ? quantityInfo.value
      : quantityInfo?.unit === "unidade"
        ? quantityInfo.value * (cached.grams / cached.usageCount || cached.grams)
        : cached.grams;

    // Atualiza uso
    incrementUsage(foodName);
    if (quantityInfo?.unit === "g") {
      updateDefaultGrams(foodName, quantityInfo.value);
    }

    return {
      found: true,
      source: "cache",
      food: {
        name: cached.name,
        grams,
        calories: Math.round((cached.calories / cached.grams) * grams),
        protein: Math.round(((cached.protein / cached.grams) * grams) * 10) / 10,
        carbs: Math.round(((cached.carbs / cached.grams) * grams) * 10) / 10,
        fat: Math.round(((cached.fat / cached.grams) * grams) * 10) / 10,
      },
      needsQuestion: false,
    };
  }

  // 2. BUSCAR NA TABELA PADRÃO
  const dbFood = findFood(foodName);
  if (dbFood) {
    // Verifica se é ambíguo
    if (dbFood.isAmbiguous) {
      return {
        found: true,
        source: "database",
        food: null,
        needsQuestion: true,
        question: `Qual tipo de ${dbFood.name}?`,
        options: dbFood.ambiguousOptions,
      };
    }

    // Calcula gramas
    let grams: number;
    if (quantityInfo?.unit === "g") {
      grams = quantityInfo.value;
    } else if (quantityInfo?.unit === "unidade") {
      grams = quantityInfo.value * dbFood.defaultGrams;
    } else {
      grams = dbFood.defaultGrams;
    }

    const nutrition = calculateNutrition(dbFood, grams);

    // Salva no cache para próxima vez
    saveToCache({
      name: dbFood.name,
      grams,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      source: "database",
    });

    return {
      found: true,
      source: "database",
      food: nutrition,
      needsQuestion: false,
    };
  }

  // 3. NÃO ENCONTRADO LOCALMENTE - RETORNA PARA CONSULTA EXTERNA (TBCA ou IA)
  // A busca TBCA é assíncrona, então retornamos indicando necessidade de consulta
  return {
    found: false,
    source: "ai",
    food: null,
    needsQuestion: false,
  };
}

/**
 * Busca um alimento usando a hierarquia COMPLETA: cache -> database -> TBCA -> IA
 * Versão assíncrona que inclui busca na TBCA (Supabase)
 *
 * @param foodText Texto descrevendo o alimento (ex: "200g de frango")
 * @param userHistory Histórico de refeições do usuário (opcional)
 * @returns Resultado da busca
 */
export async function lookupFoodAsync(
  foodText: string,
  userHistory?: Meal[]
): Promise<LookupResult> {
  // Primeiro tenta busca síncrona (cache + database local)
  const syncResult = lookupFood(foodText, userHistory);

  // Se encontrou, retorna
  if (syncResult.found) {
    return syncResult;
  }

  // Extrai quantidade se especificada
  const quantityInfo = extractQuantity(foodText);

  // Remove quantidade do texto para buscar o nome do alimento
  let foodName = foodText
    .replace(/\d+(?:[.,]\d+)?\s*(?:g|gramas?|unidades?|fatias?|colheres?|pedaços?|copos?|xícaras?|xicaras?)/gi, "")
    .replace(/^\d+\s+/, "")
    .replace(/^de\s+/i, "")
    .trim();

  if (!foodName) {
    foodName = foodText;
  }

  // 3. BUSCAR NA TBCA (Supabase - 5.668 alimentos brasileiros)
  try {
    const tbcaResult = await searchTBCA(foodName, 1);

    if (tbcaResult.foods.length > 0) {
      const tbcaFood = tbcaResult.foods[0];

      // Verifica se a similaridade é alta o suficiente (> 0.3)
      if (tbcaFood.similarity && tbcaFood.similarity > 0.3) {
        // Calcula gramas
        let grams: number;
        if (quantityInfo?.unit === "g") {
          grams = quantityInfo.value;
        } else {
          grams = 100; // TBCA usa 100g como padrão
        }

        const nutrition = tbcaToFoodItem(tbcaFood, grams);

        // Salva no cache para próxima vez
        saveToCache({
          name: tbcaFood.name,
          grams,
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
          source: "tbca",
        });

        return {
          found: true,
          source: "tbca",
          food: {
            name: tbcaFood.name,
            grams,
            calories: nutrition.calories,
            protein: nutrition.protein,
            carbs: nutrition.carbs,
            fat: nutrition.fat,
          },
          needsQuestion: false,
        };
      }
    }
  } catch (error) {
    console.error("Erro na busca TBCA:", error);
    // Continua para IA se TBCA falhar
  }

  // 4. NÃO ENCONTRADO - PRECISA CONSULTAR IA
  return {
    found: false,
    source: "ai",
    food: null,
    needsQuestion: false,
  };
}

/**
 * Processa múltiplos alimentos de uma mensagem
 * @param message Mensagem do usuário
 * @param userHistory Histórico de refeições
 * @returns Array de resultados + alimentos que precisam de IA
 */
export function lookupMultipleFoods(
  message: string,
  userHistory?: Meal[]
): {
  results: LookupResult[];
  needsAI: string[];
  hasQuestions: { food: string; question: string; options: string[] }[];
} {
  // Extrai alimentos da mensagem
  const foods = extractFoodsFromMessage(message);

  const results: LookupResult[] = [];
  const needsAI: string[] = [];
  const hasQuestions: { food: string; question: string; options: string[] }[] =
    [];

  for (const food of foods) {
    const result = lookupFood(food, userHistory);
    results.push(result);

    if (result.needsQuestion && result.question && result.options) {
      hasQuestions.push({
        food,
        question: result.question,
        options: result.options,
      });
    } else if (!result.found) {
      needsAI.push(food);
    }
  }

  return { results, needsAI, hasQuestions };
}

/**
 * Versão assíncrona que inclui busca na TBCA
 */
export async function lookupMultipleFoodsAsync(
  message: string,
  userHistory?: Meal[]
): Promise<{
  results: LookupResult[];
  needsAI: string[];
  hasQuestions: { food: string; question: string; options: string[] }[];
}> {
  const foods = extractFoodsFromMessage(message);

  const results: LookupResult[] = [];
  const needsAI: string[] = [];
  const hasQuestions: { food: string; question: string; options: string[] }[] = [];

  // Processa em paralelo para melhor performance
  const lookupPromises = foods.map((food) => lookupFoodAsync(food, userHistory));
  const lookupResults = await Promise.all(lookupPromises);

  for (let i = 0; i < foods.length; i++) {
    const result = lookupResults[i];
    results.push(result);

    if (result.needsQuestion && result.question && result.options) {
      hasQuestions.push({
        food: foods[i],
        question: result.question,
        options: result.options,
      });
    } else if (!result.found) {
      needsAI.push(foods[i]);
    }
  }

  return { results, needsAI, hasQuestions };
}

/**
 * Extrai nomes de alimentos de uma mensagem
 * Esta é uma extração simples - alimentos complexos serão processados pela IA
 */
export function extractFoodsFromMessage(message: string): string[] {
  const normalized = message.toLowerCase();

  // Remove palavras comuns que não são alimentos
  const stopWords = [
    "comi",
    "almocei",
    "jantei",
    "tomei",
    "bebi",
    "café da manhã",
    "cafe da manha",
    "lanche",
    "almoço",
    "almoco",
    "jantar",
    "no",
    "na",
    "com",
    "e",
    "de",
    "um",
    "uma",
    "uns",
    "umas",
    "o",
    "a",
    "os",
    "as",
    "hoje",
    "ontem",
    "agora",
    "mais",
    "menos",
    "muito",
    "pouco",
    "bastante",
  ];

  // Separa por vírgulas, "e", "com" mantendo as quantidades
  const parts = normalized
    .split(/[,]|\s+e\s+|\s+com\s+/g)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const foods: string[] = [];

  for (let part of parts) {
    // Remove stopwords do início
    for (const word of stopWords) {
      const regex = new RegExp(`^${word}\\s+`, "i");
      part = part.replace(regex, "");
    }

    // Remove stopwords do final
    for (const word of stopWords) {
      const regex = new RegExp(`\\s+${word}$`, "i");
      part = part.replace(regex, "");
    }

    part = part.trim();

    // Adiciona se sobrou algo significativo
    if (part.length > 1 && !stopWords.includes(part)) {
      foods.push(part);
    }
  }

  return foods;
}

/**
 * Salva resultado da IA no cache
 */
export function cacheAIResult(nutrition: NutritionInfo): void {
  saveToCache({
    ...nutrition,
    source: "ai",
  });
}

/**
 * Gera um resumo do contexto do usuário para a IA
 * Inclui alimentos mais usados e padrões detectados
 */
export function generateUserContext(userHistory: Meal[]): string {
  if (!userHistory || userHistory.length === 0) {
    return "";
  }

  // Coleta alimentos e quantidades mais usados
  const foodCounts: Record<string, { count: number; avgGrams: number }> = {};

  for (const meal of userHistory) {
    for (const item of meal.items) {
      const name = normalizeText(item.name);
      if (!foodCounts[name]) {
        foodCounts[name] = { count: 0, avgGrams: 0 };
      }
      foodCounts[name].count++;
      foodCounts[name].avgGrams =
        (foodCounts[name].avgGrams * (foodCounts[name].count - 1) +
          (item.quantity || 100)) /
        foodCounts[name].count;
    }
  }

  // Top 10 alimentos mais frequentes
  const topFoods = Object.entries(foodCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(
      ([name, data]) =>
        `- ${name}: ${data.count}x (média ${Math.round(data.avgGrams)}g)`
    )
    .join("\n");

  if (!topFoods) return "";

  return `
CONTEXTO DO USUÁRIO (últimas ${userHistory.length} refeições):
Alimentos mais frequentes:
${topFoods}

Use estas quantidades como referência quando o usuário não especificar.
`;
}
