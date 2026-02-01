-- Fix: adiciona carbs e fat ao get_home_summary()
-- Antes retornava apenas calories_in, calories_out, protein, weight, workout_minutes
-- Agora retorna também carbs e fat agregados da tabela meals

CREATE OR REPLACE FUNCTION get_home_summary(target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'date', target_date,
    'calories_in', COALESCE((SELECT SUM(total_calories) FROM meals WHERE user_id = auth.uid() AND date = target_date), 0),
    'calories_out', COALESCE((SELECT SUM(calories_burned) FROM workouts WHERE user_id = auth.uid() AND date = target_date), 0),
    'protein', COALESCE((SELECT SUM(total_protein_g) FROM meals WHERE user_id = auth.uid() AND date = target_date), 0),
    'carbs', COALESCE((SELECT SUM(total_carbs_g) FROM meals WHERE user_id = auth.uid() AND date = target_date), 0),
    'fat', COALESCE((SELECT SUM(total_fat_g) FROM meals WHERE user_id = auth.uid() AND date = target_date), 0),
    'weight', (SELECT weight_kg FROM weight_logs WHERE user_id = auth.uid() AND date <= target_date ORDER BY date DESC LIMIT 1),
    'workout_minutes', COALESCE((SELECT SUM(duration_min) FROM workouts WHERE user_id = auth.uid() AND date = target_date), 0)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
