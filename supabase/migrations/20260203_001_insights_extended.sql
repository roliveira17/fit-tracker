-- Estende get_insights() com: body_fat, calories_burned, meals_by_type, top_foods

CREATE OR REPLACE FUNCTION get_insights(period_days INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
  start_date DATE := CURRENT_DATE - period_days;
  result JSON;
BEGIN
  SELECT json_build_object(
    'period_days', period_days,
    'weights', COALESCE((SELECT json_agg(json_build_object('date', date, 'weight', weight_kg) ORDER BY date) FROM weight_logs WHERE user_id = auth.uid() AND date >= start_date), '[]'),
    'calories_by_day', COALESCE((SELECT json_agg(json_build_object('date', date, 'calories', daily_cal) ORDER BY date) FROM (SELECT date, SUM(total_calories) as daily_cal FROM meals WHERE user_id = auth.uid() AND date >= start_date GROUP BY date) sub), '[]'),
    'protein_by_day', COALESCE((SELECT json_agg(json_build_object('date', date, 'protein', daily_prot) ORDER BY date) FROM (SELECT date, SUM(total_protein_g) as daily_prot FROM meals WHERE user_id = auth.uid() AND date >= start_date GROUP BY date) sub), '[]'),
    'carbs_by_day', COALESCE((SELECT json_agg(json_build_object('date', date, 'carbs', daily_carbs) ORDER BY date) FROM (SELECT date, SUM(total_carbs_g) as daily_carbs FROM meals WHERE user_id = auth.uid() AND date >= start_date GROUP BY date) sub), '[]'),
    'fat_by_day', COALESCE((SELECT json_agg(json_build_object('date', date, 'fat', daily_fat) ORDER BY date) FROM (SELECT date, SUM(total_fat_g) as daily_fat FROM meals WHERE user_id = auth.uid() AND date >= start_date GROUP BY date) sub), '[]'),
    'avg_sleep_stages', COALESCE((SELECT json_agg(json_build_object('stage', stage, 'avg_pct', avg_pct)) FROM (SELECT ss.stage, ROUND(AVG(ss.percentage)::numeric, 1) as avg_pct FROM sleep_stages ss JOIN sleep_sessions s ON s.id = ss.sleep_session_id WHERE s.user_id = auth.uid() AND s.date >= start_date GROUP BY ss.stage) sub), '[]'),
    'body_fat_by_day', COALESCE((SELECT json_agg(json_build_object('date', date, 'body_fat', body_fat_pct) ORDER BY date) FROM body_fat_logs WHERE user_id = auth.uid() AND date >= start_date), '[]'),
    'calories_burned_by_day', COALESCE((SELECT json_agg(json_build_object('date', date, 'calories_burned', daily_burn) ORDER BY date) FROM (SELECT date, SUM(calories_burned) as daily_burn FROM workouts WHERE user_id = auth.uid() AND date >= start_date GROUP BY date) sub), '[]'),
    'meals_by_type', COALESCE((SELECT json_agg(json_build_object('meal_type', meal_type, 'count', cnt, 'avg_calories', avg_cal)) FROM (SELECT meal_type, COUNT(*) as cnt, ROUND(AVG(total_calories)) as avg_cal FROM meals WHERE user_id = auth.uid() AND date >= start_date AND meal_type IS NOT NULL GROUP BY meal_type) sub), '[]'),
    'top_foods', COALESCE((SELECT json_agg(json_build_object('food_name', food_name, 'times_eaten', cnt, 'avg_calories', avg_cal) ORDER BY cnt DESC) FROM (SELECT mi.food_name, COUNT(*) as cnt, ROUND(AVG(mi.calories)) as avg_cal FROM meal_items mi JOIN meals m ON m.id = mi.meal_id WHERE m.user_id = auth.uid() AND m.date >= start_date GROUP BY mi.food_name ORDER BY cnt DESC LIMIT 10) sub), '[]'),
    'glucose', COALESCE((
      SELECT json_build_object(
        'avg_fasting', (SELECT ROUND(AVG(glucose_mg_dl)::numeric, 1) FROM glucose_logs WHERE user_id = auth.uid() AND measurement_type = 'fasting' AND date >= start_date),
        'avg_post_meal', (SELECT ROUND(AVG(glucose_mg_dl)::numeric, 1) FROM glucose_logs WHERE user_id = auth.uid() AND measurement_type = 'post_meal' AND date >= start_date),
        'time_in_range', (SELECT ROUND((COUNT(*) FILTER (WHERE glucose_mg_dl BETWEEN 70 AND 140)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100, 1) FROM glucose_logs WHERE user_id = auth.uid() AND date >= start_date),
        'by_day', (SELECT COALESCE(json_agg(json_build_object('date', date, 'avg', avg_gl, 'min', min_gl, 'max', max_gl) ORDER BY date), '[]') FROM (SELECT date, ROUND(AVG(glucose_mg_dl)::numeric, 1) as avg_gl, MIN(glucose_mg_dl) as min_gl, MAX(glucose_mg_dl) as max_gl FROM glucose_logs WHERE user_id = auth.uid() AND date >= start_date GROUP BY date) gl_sub)
      )
    ), '{"avg_fasting": null, "avg_post_meal": null, "time_in_range": null, "by_day": []}')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
