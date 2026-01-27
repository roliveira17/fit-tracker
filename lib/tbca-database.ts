/**
 * TBCA Database Client
 *
 * Busca alimentos na base TBCA (5.668 alimentos brasileiros) via Supabase
 * Usa busca fuzzy com pg_trgm para encontrar alimentos similares
 */

import { supabase } from "./supabase";

export interface TBCAFood {
  id: string;
  tbca_id: string;
  name: string;
  category: string;
  energy_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sodium_mg?: number | null;
  calcium_mg?: number | null;
  iron_mg?: number | null;
  vitamin_c_mg?: number | null;
  similarity?: number;
}

export interface TBCASearchResult {
  foods: TBCAFood[];
  query: string;
  source: "tbca";
}

/**
 * Remove acentos e normaliza texto para busca
 */
function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Busca alimentos na TBCA usando busca fuzzy
 *
 * @param query - Termo de busca (ex: "arroz", "feijão", "açaí")
 * @param limit - Número máximo de resultados (default: 5)
 * @returns Lista de alimentos encontrados ordenados por relevância
 *
 * @example
 * const results = await searchTBCA("arroz");
 * // [{ name: "Arroz, integral, cozido", energy_kcal: 124, ... }]
 */
export async function searchTBCA(
  query: string,
  limit: number = 5
): Promise<TBCASearchResult> {
  const normalizedQuery = normalizeSearchTerm(query);

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return { foods: [], query, source: "tbca" };
  }

  try {
    const { data, error } = await supabase.rpc("search_food", {
      search_term: normalizedQuery,
      limit_results: limit,
    });

    if (error) {
      console.error("Erro na busca TBCA:", error.message);
      return { foods: [], query, source: "tbca" };
    }

    const foods: TBCAFood[] = (data || []).map((item: Record<string, unknown>) => ({
      id: item.id as string,
      tbca_id: item.tbca_id as string,
      name: item.name as string,
      category: item.category as string,
      energy_kcal: item.energy_kcal as number | null,
      protein_g: item.protein_g as number | null,
      carbs_g: item.carbs_g as number | null,
      fat_g: item.fat_g as number | null,
      fiber_g: item.fiber_g as number | null,
      similarity: item.similarity as number,
    }));

    return { foods, query, source: "tbca" };
  } catch (error) {
    console.error("Erro na busca TBCA:", error);
    return { foods: [], query, source: "tbca" };
  }
}

/**
 * Busca alimento específico por ID da TBCA
 *
 * @param tbcaId - ID do alimento na TBCA (ex: "C0113T")
 * @returns Alimento com todos os nutrientes ou null
 */
export async function getTBCAFoodById(tbcaId: string): Promise<TBCAFood | null> {
  try {
    const { data, error } = await supabase
      .from("food_database")
      .select("*")
      .eq("tbca_id", tbcaId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      tbca_id: data.tbca_id,
      name: data.name,
      category: data.category,
      energy_kcal: data.energy_kcal,
      protein_g: data.protein_g,
      carbs_g: data.carbs_g,
      fat_g: data.fat_g,
      fiber_g: data.fiber_g,
      sodium_mg: data.sodium_mg,
      calcium_mg: data.calcium_mg,
      iron_mg: data.iron_mg,
      vitamin_c_mg: data.vitamin_c_mg,
    };
  } catch (error) {
    console.error("Erro ao buscar alimento TBCA:", error);
    return null;
  }
}

/**
 * Busca alimentos por categoria
 *
 * @param category - Categoria (ex: "Cereais e derivados", "Carnes e derivados")
 * @param limit - Número máximo de resultados
 * @returns Lista de alimentos da categoria
 */
export async function getTBCAByCategory(
  category: string,
  limit: number = 20
): Promise<TBCAFood[]> {
  try {
    const { data, error } = await supabase
      .from("food_database")
      .select("id, tbca_id, name, category, energy_kcal, protein_g, carbs_g, fat_g, fiber_g")
      .ilike("category", `%${category}%`)
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data as TBCAFood[];
  } catch (error) {
    console.error("Erro ao buscar categoria TBCA:", error);
    return [];
  }
}

/**
 * Retorna todas as categorias disponíveis na TBCA
 */
export async function getTBCACategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("food_database")
      .select("category")
      .order("category");

    if (error || !data) {
      return [];
    }

    // Unique categories
    const categories = [...new Set(data.map((d) => d.category as string))];
    return categories.filter(Boolean).sort();
  } catch (error) {
    console.error("Erro ao buscar categorias TBCA:", error);
    return [];
  }
}

/**
 * Converte alimento TBCA para formato do food-lookup
 */
export function tbcaToFoodItem(tbca: TBCAFood, grams: number = 100): {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  source: "tbca";
} {
  const multiplier = grams / 100;

  return {
    name: tbca.name,
    grams,
    calories: Math.round((tbca.energy_kcal || 0) * multiplier),
    protein: Math.round((tbca.protein_g || 0) * multiplier * 10) / 10,
    carbs: Math.round((tbca.carbs_g || 0) * multiplier * 10) / 10,
    fat: Math.round((tbca.fat_g || 0) * multiplier * 10) / 10,
    fiber: tbca.fiber_g ? Math.round(tbca.fiber_g * multiplier * 10) / 10 : undefined,
    source: "tbca",
  };
}
