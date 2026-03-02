-- ============================================
-- Criar RPC insert_meal_item com SECURITY DEFINER
-- A tabela meal_items tem RLS via join com meals.user_id
-- A RPC bypassa RLS para permitir insert pelo chat
-- ============================================

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

GRANT EXECUTE ON FUNCTION insert_meal_item TO authenticated;
