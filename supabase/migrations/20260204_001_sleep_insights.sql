-- ============================================
-- SLEEP INSIGHTS - RPC para dados detalhados de sono
-- ============================================

CREATE OR REPLACE FUNCTION get_sleep_insights(p_days INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
  start_date DATE := CURRENT_DATE - p_days;
  result JSON;
BEGIN
  SELECT json_build_object(
    'avg_duration_min', (
      SELECT ROUND(AVG(total_minutes)::numeric, 0)
      FROM sleep_sessions
      WHERE user_id = auth.uid() AND date >= start_date
    ),
    'total_nights', (
      SELECT COUNT(*)
      FROM sleep_sessions
      WHERE user_id = auth.uid() AND date >= start_date
    ),
    'by_day', COALESCE((
      SELECT json_agg(day_data ORDER BY day_data->>'date')
      FROM (
        SELECT json_build_object(
          'date', s.date,
          'total_min', s.total_minutes,
          'deep_min', COALESCE((SELECT SUM(duration_min) FROM sleep_stages WHERE sleep_session_id = s.id AND stage = 'deep'), 0),
          'rem_min', COALESCE((SELECT SUM(duration_min) FROM sleep_stages WHERE sleep_session_id = s.id AND stage = 'rem'), 0),
          'light_min', COALESCE((SELECT SUM(duration_min) FROM sleep_stages WHERE sleep_session_id = s.id AND stage = 'light'), 0),
          'awake_min', COALESCE((SELECT SUM(duration_min) FROM sleep_stages WHERE sleep_session_id = s.id AND stage = 'awake'), 0)
        ) as day_data
        FROM sleep_sessions s
        WHERE s.user_id = auth.uid() AND s.date >= start_date
        ORDER BY s.date
      ) sub
    ), '[]'),
    'avg_stages', COALESCE((
      SELECT json_agg(json_build_object('stage', stage, 'avg_pct', avg_pct))
      FROM (
        SELECT ss.stage, ROUND(AVG(ss.percentage)::numeric, 1) as avg_pct
        FROM sleep_stages ss
        JOIN sleep_sessions s ON s.id = ss.sleep_session_id
        WHERE s.user_id = auth.uid() AND s.date >= start_date
        GROUP BY ss.stage
      ) sub
    ), '[]'),
    'best_night', (
      SELECT json_build_object('date', date, 'total_min', total_minutes)
      FROM sleep_sessions
      WHERE user_id = auth.uid() AND date >= start_date
      ORDER BY total_minutes DESC
      LIMIT 1
    ),
    'worst_night', (
      SELECT json_build_object('date', date, 'total_min', total_minutes)
      FROM sleep_sessions
      WHERE user_id = auth.uid() AND date >= start_date
      ORDER BY total_minutes ASC
      LIMIT 1
    ),
    'consistency', (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE total_minutes >= 360)::numeric /
         NULLIF(COUNT(*)::numeric, 0)) * 100, 1
      )
      FROM sleep_sessions
      WHERE user_id = auth.uid() AND date >= start_date
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_sleep_insights(INTEGER) TO authenticated;
