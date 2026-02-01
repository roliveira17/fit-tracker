-- ============================================
-- WORKOUT PROGRESSION - RPC para progressão de exercícios
-- ============================================

CREATE OR REPLACE FUNCTION get_workout_progression(p_days INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
  start_date DATE := CURRENT_DATE - p_days;
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_workouts', (
      SELECT COUNT(*)
      FROM workouts
      WHERE user_id = auth.uid() AND date >= start_date
    ),
    'total_volume', COALESCE((
      SELECT SUM(ws.sets * ws.reps * ws.weight_kg)::numeric
      FROM workout_sets ws
      JOIN workouts w ON w.id = ws.workout_id
      WHERE w.user_id = auth.uid() AND w.date >= start_date
        AND ws.weight_kg IS NOT NULL AND ws.sets IS NOT NULL AND ws.reps IS NOT NULL
    ), 0),
    'avg_duration_min', (
      SELECT ROUND(AVG(duration_min)::numeric, 0)
      FROM workouts
      WHERE user_id = auth.uid() AND date >= start_date AND duration_min IS NOT NULL
    ),
    'volume_by_day', COALESCE((
      SELECT json_agg(day_data ORDER BY day_data->>'date')
      FROM (
        SELECT json_build_object(
          'date', w.date,
          'volume', COALESCE(SUM(ws.sets * ws.reps * ws.weight_kg), 0),
          'duration', COALESCE(w.duration_min, 0)
        ) as day_data
        FROM workouts w
        LEFT JOIN workout_sets ws ON ws.workout_id = w.id
          AND ws.weight_kg IS NOT NULL AND ws.sets IS NOT NULL AND ws.reps IS NOT NULL
        WHERE w.user_id = auth.uid() AND w.date >= start_date
        GROUP BY w.id, w.date, w.duration_min
        ORDER BY w.date
      ) sub
    ), '[]'),
    'top_exercises', COALESCE((
      SELECT json_agg(exercise_data ORDER BY (exercise_data->>'times_performed')::int DESC)
      FROM (
        SELECT json_build_object(
          'exercise_name', ws.exercise_name,
          'times_performed', COUNT(DISTINCT w.id),
          'progression', (
            SELECT COALESCE(json_agg(
              json_build_object(
                'date', sub.date,
                'max_weight', sub.max_w,
                'total_volume', sub.vol
              ) ORDER BY sub.date
            ), '[]')
            FROM (
              SELECT w2.date,
                     MAX(ws2.weight_kg) as max_w,
                     SUM(ws2.sets * ws2.reps * ws2.weight_kg) as vol
              FROM workout_sets ws2
              JOIN workouts w2 ON w2.id = ws2.workout_id
              WHERE w2.user_id = auth.uid()
                AND w2.date >= start_date
                AND ws2.exercise_name = ws.exercise_name
                AND ws2.weight_kg IS NOT NULL
              GROUP BY w2.date
            ) sub
          ),
          'best_weight', MAX(ws.weight_kg),
          'best_volume', (
            SELECT COALESCE(MAX(sub.vol), 0)
            FROM (
              SELECT SUM(ws3.sets * ws3.reps * ws3.weight_kg) as vol
              FROM workout_sets ws3
              JOIN workouts w3 ON w3.id = ws3.workout_id
              WHERE w3.user_id = auth.uid()
                AND w3.date >= start_date
                AND ws3.exercise_name = ws.exercise_name
                AND ws3.weight_kg IS NOT NULL
              GROUP BY w3.date
            ) sub
          )
        ) as exercise_data
        FROM workout_sets ws
        JOIN workouts w ON w.id = ws.workout_id
        WHERE w.user_id = auth.uid() AND w.date >= start_date
          AND ws.weight_kg IS NOT NULL
        GROUP BY ws.exercise_name
        HAVING COUNT(DISTINCT w.id) >= 1
        ORDER BY COUNT(DISTINCT w.id) DESC
        LIMIT 10
      ) sub
    ), '[]'),
    'workout_types', COALESCE((
      SELECT json_agg(json_build_object('type', workout_type, 'count', cnt))
      FROM (
        SELECT workout_type, COUNT(*) as cnt
        FROM workouts
        WHERE user_id = auth.uid() AND date >= start_date
        GROUP BY workout_type
      ) sub
    ), '[]')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_workout_progression(INTEGER) TO authenticated;
