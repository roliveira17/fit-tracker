/**
 * Open Food Facts API Client
 *
 * API gratuita com 31.500+ produtos brasileiros
 * Rate limit: 10 req/min
 * Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
 */

const OFF_API_BASE = "https://world.openfoodfacts.org/api/v2";
const OFF_API_BR = "https://br.openfoodfacts.org/api/v2";

/**
 * Fetch com retry e exponential backoff
 * Retenta apenas em erros de rede/timeout, nao em 404
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(5000),
      });
      return res;
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      const delay = 500 * Math.pow(2, attempt);
      console.log(`[OFF] Retry ${attempt + 1}/${maxRetries} apos ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

export interface OFFProduct {
  code: string;
  product_name: string;
  brands?: string;
  quantity?: string;
  image_url?: string;
  image_front_url?: string;

  // Nutrição por 100g
  nutriments?: {
    "energy-kcal_100g"?: number;
    "energy-kcal"?: number;
    proteins_100g?: number;
    proteins?: number;
    carbohydrates_100g?: number;
    carbohydrates?: number;
    fat_100g?: number;
    fat?: number;
    fiber_100g?: number;
    fiber?: number;
    sodium_100g?: number;
    sodium?: number;
    sugars_100g?: number;
    sugars?: number;
    "saturated-fat_100g"?: number;
    "saturated-fat"?: number;
  };

  // Classificações
  nutriscore_grade?: string; // a, b, c, d, e
  nova_group?: number; // 1, 2, 3, 4

  // Ingredientes
  ingredients_text?: string;
  allergens_tags?: string[];

  // Categorias
  categories?: string;
  categories_tags?: string[];
}

export interface OFFResponse {
  code: string;
  status: number;
  status_verbose: string;
  product?: OFFProduct;
}

export interface NormalizedProduct {
  barcode: string;
  productName: string;
  brand: string | null;
  quantity: string | null;
  imageUrl: string | null;

  // Nutrição por 100g
  energyKcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  sodiumMg: number | null;
  sugarG: number | null;

  // Classificações
  nutriscore: string | null;
  novaGroup: number | null;

  source: "openfoodfacts";
}

/**
 * Busca produto por código de barras no Open Food Facts
 *
 * @param barcode - Código de barras (EAN-13, UPC, etc)
 * @returns Produto normalizado ou null se não encontrado
 *
 * @example
 * const product = await fetchProductByBarcode("7891000100103");
 * // { productName: "Nescau", brand: "Nestlé", energyKcal: 377, ... }
 */
export async function fetchProductByBarcode(
  barcode: string
): Promise<NormalizedProduct | null> {
  // Limpa o barcode (remove espaços, traços)
  const cleanBarcode = barcode.replace(/[\s-]/g, "");

  if (!cleanBarcode || cleanBarcode.length < 8) {
    console.error("Barcode inválido:", barcode);
    return null;
  }

  try {
    // Tenta primeiro na API brasileira, depois na global
    const urls = [
      `${OFF_API_BR}/product/${cleanBarcode}.json`,
      `${OFF_API_BASE}/product/${cleanBarcode}.json`,
    ];

    for (const url of urls) {
      try {
        const response = await fetchWithRetry(url, {
          headers: {
            "User-Agent": "FitTrack/1.0 (https://fittrack.app)",
          },
        });

        if (!response.ok) {
          continue;
        }

        const data: OFFResponse = await response.json();

        if (data.status === 1 && data.product) {
          return normalizeProduct(cleanBarcode, data.product);
        }
      } catch {
        // Retry esgotado para esta URL, tenta a proxima
        continue;
      }
    }

    console.log("Produto não encontrado no Open Food Facts:", cleanBarcode);
    return null;
  } catch (error) {
    console.error("Erro ao buscar produto no Open Food Facts:", error);
    return null;
  }
}

/**
 * Normaliza produto do formato OFF para nosso formato interno
 */
function normalizeProduct(
  barcode: string,
  product: OFFProduct
): NormalizedProduct {
  const nutriments = product.nutriments || {};

  return {
    barcode,
    productName: product.product_name || "Produto sem nome",
    brand: product.brands || null,
    quantity: product.quantity || null,
    imageUrl: product.image_front_url || product.image_url || null,

    // Nutrição - tenta _100g primeiro, depois valor absoluto
    energyKcal:
      nutriments["energy-kcal_100g"] ?? nutriments["energy-kcal"] ?? null,
    proteinG: nutriments.proteins_100g ?? nutriments.proteins ?? null,
    carbsG: nutriments.carbohydrates_100g ?? nutriments.carbohydrates ?? null,
    fatG: nutriments.fat_100g ?? nutriments.fat ?? null,
    fiberG: nutriments.fiber_100g ?? nutriments.fiber ?? null,
    sodiumMg: nutriments.sodium_100g
      ? nutriments.sodium_100g * 1000 // converte g para mg
      : nutriments.sodium
        ? nutriments.sodium * 1000
        : null,
    sugarG: nutriments.sugars_100g ?? nutriments.sugars ?? null,

    // Classificações
    nutriscore: product.nutriscore_grade?.toUpperCase() || null,
    novaGroup: product.nova_group || null,

    source: "openfoodfacts",
  };
}

/**
 * Busca produtos por nome/termo de busca
 * (útil para autocomplete, mas tem rate limit mais restritivo)
 *
 * @param query - Termo de busca
 * @param limit - Número máximo de resultados
 */
export async function searchProducts(
  query: string,
  limit: number = 5
): Promise<NormalizedProduct[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const url = `${OFF_API_BR}/search?search_terms=${encodeURIComponent(query)}&page_size=${limit}&json=true`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "FitTrack/1.0 (https://fittrack.app)",
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!data.products || !Array.isArray(data.products)) {
      return [];
    }

    return data.products
      .filter((p: OFFProduct) => p.product_name)
      .map((p: OFFProduct) => normalizeProduct(p.code, p));
  } catch (error) {
    console.error("Erro na busca Open Food Facts:", error);
    return [];
  }
}

/**
 * Verifica se um barcode parece válido
 */
export function isValidBarcode(barcode: string): boolean {
  const clean = barcode.replace(/[\s-]/g, "");
  // EAN-13, EAN-8, UPC-A, UPC-E
  return /^\d{8,14}$/.test(clean);
}

/**
 * Detecta se um produto é líquido com base no campo quantity
 */
export function isLiquidProduct(product: NormalizedProduct): boolean {
  const qty = (product.quantity || "").toLowerCase();
  return /\d\s*(ml|cl|l|liter|litro)\b/.test(qty);
}

/**
 * Converte produto OFF para formato de item de refeição
 */
export function offProductToMealItem(
  product: NormalizedProduct,
  grams: number = 100
): {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: "openfoodfacts";
} {
  const multiplier = grams / 100;

  const displayName = product.brand
    ? `${product.productName} (${product.brand})`
    : product.productName;

  return {
    name: displayName,
    grams,
    calories: Math.round((product.energyKcal || 0) * multiplier),
    protein: Math.round((product.proteinG || 0) * multiplier * 10) / 10,
    carbs: Math.round((product.carbsG || 0) * multiplier * 10) / 10,
    fat: Math.round((product.fatG || 0) * multiplier * 10) / 10,
    source: "openfoodfacts",
  };
}
