/**
 * Script para validar que a RPC insert_meal_item existe no Supabase.
 *
 * Uso: npx tsx scripts/validate-insert-meal-item-rpc.ts
 *
 * Resultado esperado ANTES de aplicar migration:
 *   ❌ RPC nao existe (erro PGRST202)
 *
 * Resultado esperado APOS aplicar migration:
 *   ✅ RPC existe (erro de FK esperado, pois meal_id fake nao existe)
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validate(): Promise<void> {
  console.log("Testando RPC insert_meal_item...\n");

  const fakeMealId = "00000000-0000-0000-0000-000000000000";

  const { data, error } = await supabase.rpc("insert_meal_item", {
    p_meal_id: fakeMealId,
    p_food_name: "teste_validacao",
    p_quantity_g: 100,
    p_calories: 200,
    p_protein_g: 10,
    p_carbs_g: 20,
    p_fat_g: 5,
  });

  if (error) {
    if (error.code === "PGRST202") {
      console.error("❌ RPC insert_meal_item NAO EXISTE!");
      console.error("   Aplique a migration no SQL Editor do Supabase:");
      console.error("   supabase/migrations/20260302_001_create_insert_meal_item_rpc.sql");
      process.exit(1);
    }

    if (error.message.includes("foreign key") || error.message.includes("violates")) {
      console.log("✅ RPC insert_meal_item EXISTE e funciona!");
      console.log("   (Erro de FK esperado — meal_id fake nao existe na tabela meals)");
      console.log(`   Erro: ${error.message}`);
      process.exit(0);
    }

    console.warn("⚠️  RPC existe mas retornou erro inesperado:");
    console.warn(`   Code: ${error.code}`);
    console.warn(`   Message: ${error.message}`);
    process.exit(1);
  }

  console.log("✅ RPC insert_meal_item EXISTE e executou com sucesso!");
  console.log(`   Item ID retornado: ${data}`);
  console.log("   ⚠️  Item de teste criado — limpar manualmente se necessario.");
}

validate();
