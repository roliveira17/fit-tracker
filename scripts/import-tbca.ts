/**
 * Script para importar dados da TBCA para o Supabase
 *
 * Uso:
 *   npx ts-node scripts/import-tbca.ts
 *
 * Pré-requisitos:
 *   - SUPABASE_SERVICE_ROLE_KEY no .env.local
 *   - Migração 20260127_002_food_database.sql aplicada
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as readline from "readline";
import * as path from "path";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";

// Compatibilidade ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variáveis de ambiente não configuradas!");
  console.error("   Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

// Cliente admin (bypass RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Interface do alimento TBCA (formato do JSON)
interface TBCAFood {
  codigo: string;
  classe: string;
  descricao: string;
  nutrientes: Array<{
    Componente: string;
    Unidades: string;
    "Valor por 100g": string;
  }>;
}

// Interface para inserção no Supabase
interface FoodDatabaseInsert {
  tbca_id: string;
  name: string;
  name_normalized: string;
  category: string;
  energy_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sodium_mg: number | null;
  potassium_mg: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  zinc_mg: number | null;
  magnesium_mg: number | null;
  phosphorus_mg: number | null;
  vitamin_a_mcg: number | null;
  vitamin_c_mg: number | null;
  vitamin_d_mcg: number | null;
  vitamin_b12_mcg: number | null;
  folate_mcg: number | null;
  cholesterol_mg: number | null;
  saturated_fat_g: number | null;
  source: string;
}

/**
 * Remove acentos e converte para lowercase
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extrai valor numérico de uma string
 * Lida com "NA", "Tr", vírgula decimal, etc.
 */
function parseNumber(value: string): number | null {
  if (!value || value === "NA" || value === "Tr" || value === "-" || value === "*") {
    return null;
  }

  // Substitui vírgula por ponto
  const normalized = value.replace(",", ".").trim();
  const num = parseFloat(normalized);

  return isNaN(num) ? null : num;
}

/**
 * Extrai nutriente específico do array
 */
function getNutrient(
  nutrientes: TBCAFood["nutrientes"],
  componente: string,
  unidade?: string
): number | null {
  const found = nutrientes.find(
    (n) =>
      n.Componente === componente &&
      (unidade ? n.Unidades === unidade : true)
  );
  return found ? parseNumber(found["Valor por 100g"]) : null;
}

/**
 * Converte alimento TBCA para formato do Supabase
 */
function convertFood(tbca: TBCAFood): FoodDatabaseInsert {
  const { codigo, classe, descricao, nutrientes } = tbca;

  return {
    tbca_id: codigo,
    name: descricao,
    name_normalized: normalizeText(descricao),
    category: classe,
    energy_kcal: getNutrient(nutrientes, "Energia", "kcal"),
    protein_g: getNutrient(nutrientes, "Proteína", "g"),
    carbs_g: getNutrient(nutrientes, "Carboidrato disponível", "g") ||
             getNutrient(nutrientes, "Carboidrato total", "g"),
    fat_g: getNutrient(nutrientes, "Lipídios", "g"),
    fiber_g: getNutrient(nutrientes, "Fibra alimentar", "g"),
    sodium_mg: getNutrient(nutrientes, "Sódio", "mg"),
    potassium_mg: getNutrient(nutrientes, "Potássio", "mg"),
    calcium_mg: getNutrient(nutrientes, "Cálcio", "mg"),
    iron_mg: getNutrient(nutrientes, "Ferro", "mg"),
    zinc_mg: getNutrient(nutrientes, "Zinco", "mg"),
    magnesium_mg: getNutrient(nutrientes, "Magnésio", "mg"),
    phosphorus_mg: getNutrient(nutrientes, "Fósforo", "mg"),
    vitamin_a_mcg: getNutrient(nutrientes, "Vitamina A (RAE)", "mcg") ||
                   getNutrient(nutrientes, "Vitamina A (RE)", "mcg"),
    vitamin_c_mg: getNutrient(nutrientes, "Vitamina C", "mg"),
    vitamin_d_mcg: getNutrient(nutrientes, "Vitamina D", "mcg"),
    vitamin_b12_mcg: getNutrient(nutrientes, "Vitamina B12", "mcg"),
    folate_mcg: getNutrient(nutrientes, "Equivalente de folato", "mcg"),
    cholesterol_mg: getNutrient(nutrientes, "Colesterol", "mg"),
    saturated_fat_g: getNutrient(nutrientes, "Ácidos graxos saturados", "g"),
    source: "tbca",
  };
}

/**
 * Lê arquivo JSONL linha por linha
 */
async function* readJSONL(filePath: string): AsyncGenerator<TBCAFood> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.trim()) {
      try {
        yield JSON.parse(line) as TBCAFood;
      } catch (e) {
        console.error("Erro ao parsear linha:", line.substring(0, 100));
      }
    }
  }
}

/**
 * Importa dados em lotes
 */
async function importBatch(foods: FoodDatabaseInsert[]): Promise<number> {
  const { data, error } = await supabase
    .from("food_database")
    .upsert(foods, { onConflict: "tbca_id" })
    .select("id");

  if (error) {
    console.error("Erro no batch:", error.message);
    return 0;
  }

  return data?.length || 0;
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("         IMPORTAÇÃO TBCA → SUPABASE                        ");
  console.log("═══════════════════════════════════════════════════════════");

  // Caminho do arquivo (pode ser passado como argumento)
  const filePath = process.argv[2] || path.resolve(__dirname, "../data/tbca_raw.json");

  if (!fs.existsSync(filePath)) {
    console.error(`\n❌ Arquivo não encontrado: ${filePath}`);
    console.error("\n   Baixe o arquivo da TBCA primeiro:");
    console.error("   1. Acesse: https://github.com/resen-dev/web-scraping-tbca");
    console.error("   2. Baixe: alimentos.txt");
    console.error("   3. Salve em: data/tbca_raw.json");
    process.exit(1);
  }

  console.log(`\n📂 Lendo arquivo: ${filePath}`);

  // Verificar conexão com Supabase
  const { error: connError } = await supabase.from("food_database").select("id").limit(1);
  if (connError) {
    console.error("\n❌ Erro de conexão com Supabase:", connError.message);
    console.error("   Verifique se a migração foi aplicada.");
    process.exit(1);
  }

  console.log("✅ Conectado ao Supabase\n");

  const BATCH_SIZE = 100;
  let batch: FoodDatabaseInsert[] = [];
  let totalProcessed = 0;
  let totalImported = 0;
  let categories = new Set<string>();

  console.log("📥 Importando alimentos...\n");

  for await (const food of readJSONL(filePath)) {
    const converted = convertFood(food);
    batch.push(converted);
    categories.add(food.classe);
    totalProcessed++;

    if (batch.length >= BATCH_SIZE) {
      const imported = await importBatch(batch);
      totalImported += imported;
      process.stdout.write(`\r   Processados: ${totalProcessed} | Importados: ${totalImported}`);
      batch = [];
    }
  }

  // Importar batch final
  if (batch.length > 0) {
    const imported = await importBatch(batch);
    totalImported += imported;
  }

  console.log(`\r   Processados: ${totalProcessed} | Importados: ${totalImported}`);

  // Estatísticas finais
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("                    RESULTADO FINAL                        ");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`\n   ✅ Total processado: ${totalProcessed}`);
  console.log(`   ✅ Total importado:  ${totalImported}`);
  console.log(`   📁 Categorias: ${categories.size}`);

  console.log("\n   Categorias encontradas:");
  [...categories].sort().forEach((cat) => console.log(`      - ${cat}`));

  // Verificar alguns exemplos
  console.log("\n   🔍 Testando busca fuzzy...");
  const { data: testResult } = await supabase.rpc("search_food", {
    search_term: "arroz",
    limit_results: 3,
  });

  if (testResult && testResult.length > 0) {
    console.log("\n   Busca por 'arroz':");
    testResult.forEach((r: { name: string; energy_kcal: number }) => {
      console.log(`      - ${r.name.substring(0, 60)}... (${r.energy_kcal} kcal)`);
    });
  }

  console.log("\n✅ Importação concluída!\n");
}

main().catch(console.error);
