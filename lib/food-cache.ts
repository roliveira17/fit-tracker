/**
 * Sistema de cache para alimentos do usuário
 *
 * Armazena alimentos já calculados/registrados pelo usuário
 * para evitar chamadas repetidas à IA para os mesmos alimentos.
 */

const STORAGE_KEY = "fittrack_food_cache";
const MAX_CACHE_SIZE = 200; // máximo de alimentos no cache

export interface CachedFood {
  name: string;           // nome original usado pelo usuário
  normalizedName: string; // nome normalizado para busca
  grams: number;          // quantidade que o usuário costuma usar
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  usageCount: number;     // quantas vezes usou este alimento
  lastUsed: string;       // data ISO da última vez que usou
  source: "ai" | "database" | "tbca"; // de onde veio a informação
}

/**
 * Normaliza texto para busca (remove acentos, lowercase)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Carrega o cache do localStorage
 */
export function loadCache(): CachedFood[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    console.error("Erro ao carregar cache de alimentos");
    return [];
  }
}

/**
 * Salva o cache no localStorage
 */
function saveCache(cache: CachedFood[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    console.error("Erro ao salvar cache de alimentos");
  }
}

/**
 * Busca um alimento no cache do usuário
 * @param searchTerm Nome do alimento
 * @param minUsageCount Mínimo de usos para confiar no cache (default: 2)
 * @returns CachedFood ou null se não encontrado
 */
export function getFromCache(
  searchTerm: string,
  minUsageCount: number = 2
): CachedFood | null {
  const cache = loadCache();
  const normalized = normalizeText(searchTerm);

  // Busca exata
  const exactMatch = cache.find(
    (item) =>
      item.normalizedName === normalized && item.usageCount >= minUsageCount
  );
  if (exactMatch) return exactMatch;

  // Busca parcial (o termo contém o nome ou vice-versa)
  const partialMatch = cache.find(
    (item) =>
      (item.normalizedName.includes(normalized) ||
        normalized.includes(item.normalizedName)) &&
      item.usageCount >= minUsageCount
  );

  return partialMatch || null;
}

/**
 * Salva ou atualiza um alimento no cache
 */
export function saveToCache(food: Omit<CachedFood, "normalizedName" | "usageCount" | "lastUsed">): void {
  const cache = loadCache();
  const normalizedName = normalizeText(food.name);
  const now = new Date().toISOString();

  // Verifica se já existe
  const existingIndex = cache.findIndex(
    (item) => item.normalizedName === normalizedName
  );

  if (existingIndex >= 0) {
    // Atualiza existente
    cache[existingIndex] = {
      ...cache[existingIndex],
      ...food,
      normalizedName,
      usageCount: cache[existingIndex].usageCount + 1,
      lastUsed: now,
    };
  } else {
    // Adiciona novo
    cache.push({
      ...food,
      normalizedName,
      usageCount: 1,
      lastUsed: now,
    });

    // Remove itens antigos se exceder o tamanho máximo
    if (cache.length > MAX_CACHE_SIZE) {
      // Ordena por última utilização e remove os mais antigos
      cache.sort(
        (a, b) =>
          new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
      );
      cache.splice(MAX_CACHE_SIZE);
    }
  }

  saveCache(cache);
}

/**
 * Incrementa o contador de uso de um alimento
 */
export function incrementUsage(name: string): void {
  const cache = loadCache();
  const normalizedName = normalizeText(name);

  const index = cache.findIndex(
    (item) => item.normalizedName === normalizedName
  );

  if (index >= 0) {
    cache[index].usageCount++;
    cache[index].lastUsed = new Date().toISOString();
    saveCache(cache);
  }
}

/**
 * Atualiza a gramatura padrão de um alimento baseado no histórico
 * Considera a média das últimas vezes que o usuário usou
 */
export function updateDefaultGrams(name: string, grams: number): void {
  const cache = loadCache();
  const normalizedName = normalizeText(name);

  const index = cache.findIndex(
    (item) => item.normalizedName === normalizedName
  );

  if (index >= 0) {
    // Calcula média móvel (peso maior para o novo valor)
    const oldGrams = cache[index].grams;
    const usageCount = cache[index].usageCount;

    // Média ponderada: novo valor tem peso 2, histórico tem peso baseado no uso
    const newGrams = Math.round(
      (grams * 2 + oldGrams * Math.min(usageCount, 5)) /
        (2 + Math.min(usageCount, 5))
    );

    cache[index].grams = newGrams;
    cache[index].lastUsed = new Date().toISOString();
    saveCache(cache);
  }
}

/**
 * Retorna os alimentos mais usados pelo usuário
 * @param limit Número máximo de alimentos
 */
export function getMostUsedFoods(limit: number = 10): CachedFood[] {
  const cache = loadCache();

  return cache
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
}

/**
 * Retorna alimentos usados recentemente
 * @param limit Número máximo de alimentos
 */
export function getRecentFoods(limit: number = 10): CachedFood[] {
  const cache = loadCache();

  return cache
    .sort(
      (a, b) =>
        new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    )
    .slice(0, limit);
}

/**
 * Limpa todo o cache
 */
export function clearCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Retorna estatísticas do cache
 */
export function getCacheStats(): {
  totalItems: number;
  aiSourced: number;
  databaseSourced: number;
  averageUsage: number;
} {
  const cache = loadCache();

  if (cache.length === 0) {
    return {
      totalItems: 0,
      aiSourced: 0,
      databaseSourced: 0,
      averageUsage: 0,
    };
  }

  const aiSourced = cache.filter((item) => item.source === "ai").length;
  const totalUsage = cache.reduce((sum, item) => sum + item.usageCount, 0);

  return {
    totalItems: cache.length,
    aiSourced,
    databaseSourced: cache.length - aiSourced,
    averageUsage: Math.round((totalUsage / cache.length) * 10) / 10,
  };
}
