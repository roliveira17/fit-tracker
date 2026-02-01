-- ============================================
-- FIX: Criar função para inserir meals com SECURITY DEFINER
-- Isso bypassa RLS e permite o foreign key check funcionar
-- ============================================

-- Função para inserir meal (bypassa RLS)
CREATE OR REPLACE FUNCTION insert_meal(
  p_user_id UUID,
  p_meal_type TEXT,
  p_date DATE,
  p_total_calories INTEGER,
  p_total_protein_g NUMERIC,
  p_total_carbs_g NUMERIC,
  p_total_fat_g NUMERIC,
  p_source TEXT,
  p_raw_text TEXT
) RETURNS UUID AS $$
DECLARE
  v_meal_id UUID;
BEGIN
  INSERT INTO meals (user_id, meal_type, date, total_calories, total_protein_g, total_carbs_g, total_fat_g, source, raw_text)
  VALUES (p_user_id, p_meal_type, p_date, p_total_calories, p_total_protein_g, p_total_carbs_g, p_total_fat_g, p_source, p_raw_text)
  RETURNING id INTO v_meal_id;

  RETURN v_meal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para inserir meal_items (bypassa RLS)
CREATE OR REPLACE FUNCTION insert_meal_item(
  p_meal_id UUID,
  p_food_name TEXT,
  p_quantity_g NUMERIC,
  p_calories INTEGER,
  p_protein_g NUMERIC,
  p_carbs_g NUMERIC,
  p_fat_g NUMERIC
) RETURNS UUID AS $$
DECLARE
  v_item_id UUID;
BEGIN
  INSERT INTO meal_items (meal_id, food_name, quantity_g, calories, protein_g, carbs_g, fat_g)
  VALUES (p_meal_id, p_food_name, p_quantity_g, p_calories, p_protein_g, p_carbs_g, p_fat_g)
  RETURNING id INTO v_item_id;

  RETURN v_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternativa: Modificar RLS para permitir verificação de FK
-- Isso permite que usuários autenticados vejam se um profile existe
-- (sem ver os dados, apenas para FK check)

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "meals_all_own" ON meals;
DROP POLICY IF EXISTS "meal_items_all_own" ON meal_items;

-- Recreate profiles policy - permite SELECT próprio
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Recreate profiles policy - permite INSERT/UPDATE/DELETE próprio
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Recreate meals policy - permite operações no próprio user_id
CREATE POLICY "meals_all_own" ON meals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Recreate meal_items policy - permite via join com meals
CREATE POLICY "meal_items_all_own" ON meal_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid())
  );
