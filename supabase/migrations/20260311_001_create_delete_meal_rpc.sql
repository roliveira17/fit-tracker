-- RPC para deletar uma refeição e seus itens (cascade via FK)
-- Verifica ownership antes de deletar
CREATE OR REPLACE FUNCTION delete_meal(p_meal_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM meals WHERE id = p_meal_id;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Meal not found';
  END IF;
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  DELETE FROM meals WHERE id = p_meal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
