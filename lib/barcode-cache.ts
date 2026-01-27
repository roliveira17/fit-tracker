/**
 * Barcode Cache - Supabase
 *
 * Cache compartilhado de produtos escaneados via Open Food Facts
 * Evita chamadas repetidas à API externa
 */

import { supabase } from "./supabase";
import {
  fetchProductByBarcode,
  type NormalizedProduct,
} from "./openfoodfacts";

export interface CachedBarcode {
  id: string;
  barcode: string;
  productName: string | null;
  brand: string | null;
  quantity: string | null;
  energyKcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  sodiumMg: number | null;
  sugarG: number | null;
  nutriscore: string | null;
  novaGroup: number | null;
  imageUrl: string | null;
  hitCount: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Busca produto no cache do Supabase
 */
export async function getFromBarcodeCache(
  barcode: string
): Promise<NormalizedProduct | null> {
  try {
    const { data, error } = await supabase
      .from("barcode_cache")
      .select("*")
      .eq("barcode", barcode)
      .single();

    if (error || !data) {
      return null;
    }

    // Incrementa hit count
    await supabase
      .from("barcode_cache")
      .update({
        hit_count: (data.hit_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("barcode", barcode);

    // Converte para NormalizedProduct
    return {
      barcode: data.barcode,
      productName: data.product_name || "Produto sem nome",
      brand: data.brand,
      quantity: data.quantity,
      imageUrl: data.image_url,
      energyKcal: data.energy_kcal,
      proteinG: data.protein_g,
      carbsG: data.carbs_g,
      fatG: data.fat_g,
      fiberG: data.fiber_g,
      sodiumMg: data.sodium_mg,
      sugarG: data.sugar_g,
      nutriscore: data.nutriscore,
      novaGroup: data.nova_group,
      source: "openfoodfacts",
    };
  } catch (error) {
    console.error("Erro ao buscar do cache de barcodes:", error);
    return null;
  }
}

/**
 * Salva produto no cache do Supabase
 */
export async function saveToBarcodeCache(
  product: NormalizedProduct
): Promise<boolean> {
  try {
    const { error } = await supabase.from("barcode_cache").upsert(
      {
        barcode: product.barcode,
        product_name: product.productName,
        brand: product.brand,
        quantity: product.quantity,
        energy_kcal: product.energyKcal,
        protein_g: product.proteinG,
        carbs_g: product.carbsG,
        fat_g: product.fatG,
        fiber_g: product.fiberG,
        sodium_mg: product.sodiumMg,
        sugar_g: product.sugarG,
        nutriscore: product.nutriscore,
        nova_group: product.novaGroup,
        image_url: product.imageUrl,
        source: "openfoodfacts",
        hit_count: 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "barcode" }
    );

    if (error) {
      console.error("Erro ao salvar no cache de barcodes:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro ao salvar no cache de barcodes:", error);
    return false;
  }
}

/**
 * Busca produto por barcode com cache inteligente
 *
 * Fluxo:
 * 1. Tenta cache Supabase (rápido, compartilhado)
 * 2. Se não encontrou, busca no Open Food Facts
 * 3. Salva no cache para próximas buscas
 *
 * @param barcode - Código de barras
 * @returns Produto normalizado ou null
 */
export async function lookupBarcode(
  barcode: string
): Promise<{ product: NormalizedProduct | null; source: "cache" | "api" | null }> {
  // 1. Tenta cache primeiro
  const cached = await getFromBarcodeCache(barcode);
  if (cached) {
    console.log(`[Barcode] Cache hit: ${barcode}`);
    return { product: cached, source: "cache" };
  }

  // 2. Busca na API do Open Food Facts
  console.log(`[Barcode] Cache miss, buscando na API: ${barcode}`);
  const product = await fetchProductByBarcode(barcode);

  if (!product) {
    return { product: null, source: null };
  }

  // 3. Salva no cache
  await saveToBarcodeCache(product);
  console.log(`[Barcode] Salvo no cache: ${barcode}`);

  return { product, source: "api" };
}

/**
 * Retorna estatísticas do cache de barcodes
 */
export async function getBarcodesCacheStats(): Promise<{
  totalProducts: number;
  totalHits: number;
  topProducts: { name: string; hits: number }[];
}> {
  try {
    const { data, error } = await supabase
      .from("barcode_cache")
      .select("product_name, hit_count")
      .order("hit_count", { ascending: false })
      .limit(10);

    if (error || !data) {
      return { totalProducts: 0, totalHits: 0, topProducts: [] };
    }

    const totalHits = data.reduce((sum, p) => sum + (p.hit_count || 0), 0);

    return {
      totalProducts: data.length,
      totalHits,
      topProducts: data.map((p) => ({
        name: p.product_name || "Desconhecido",
        hits: p.hit_count || 0,
      })),
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return { totalProducts: 0, totalHits: 0, topProducts: [] };
  }
}
