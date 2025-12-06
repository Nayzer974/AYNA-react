-- Script pour mettre à jour la précision de duration_minutes pour supporter les secondes
-- À exécuter dans Supabase SQL Editor

-- 1. Modifier le type de colonne pour permettre les décimales
ALTER TABLE public.khalwa_sessions 
  ALTER COLUMN duration_minutes TYPE NUMERIC(10, 2) USING duration_minutes::NUMERIC(10, 2);

-- 2. Supprimer l'ancienne fonction avant de la recréer (nécessaire car le type de retour change)
DROP FUNCTION IF EXISTS public.get_khalwa_stats(UUID);

-- 3. Recréer la fonction get_khalwa_stats avec le nouveau type de retour pour gérer les décimales
CREATE OR REPLACE FUNCTION public.get_khalwa_stats(p_user_id UUID)
RETURNS TABLE (
  total_sessions BIGINT,
  total_minutes NUMERIC,
  avg_duration NUMERIC,
  most_used_divine_name TEXT,
  most_used_breathing_type TEXT,
  most_used_sound TEXT,
  sessions_this_week BIGINT,
  sessions_this_month BIGINT,
  longest_streak_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_total_sessions BIGINT;
  v_total_minutes NUMERIC;
  v_avg_duration NUMERIC;
  v_most_used_divine_name TEXT;
  v_most_used_breathing_type TEXT;
  v_most_used_sound TEXT;
  v_sessions_this_week BIGINT;
  v_sessions_this_month BIGINT;
  v_longest_streak_days INTEGER;
BEGIN
  -- Statistiques de base (total_minutes peut maintenant avoir des décimales)
  SELECT 
    COUNT(*)::BIGINT,
    COALESCE(SUM(duration_minutes), 0)::NUMERIC,
    COALESCE(AVG(duration_minutes), 0)::NUMERIC
  INTO v_total_sessions, v_total_minutes, v_avg_duration
  FROM public.khalwa_sessions
  WHERE user_id = p_user_id AND completed = true;

  -- Nom divin le plus utilisé
  SELECT divine_name_id INTO v_most_used_divine_name
  FROM public.khalwa_sessions
  WHERE user_id = p_user_id AND completed = true
  GROUP BY divine_name_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Type de respiration le plus utilisé
  SELECT breathing_type INTO v_most_used_breathing_type
  FROM public.khalwa_sessions
  WHERE user_id = p_user_id AND completed = true
  GROUP BY breathing_type
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Ambiance sonore la plus utilisée
  SELECT sound_ambiance INTO v_most_used_sound
  FROM public.khalwa_sessions
  WHERE user_id = p_user_id AND completed = true
  GROUP BY sound_ambiance
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Sessions cette semaine (basé sur les vraies dates)
  SELECT COUNT(*)::BIGINT INTO v_sessions_this_week
  FROM public.khalwa_sessions
  WHERE user_id = p_user_id 
    AND completed = true
    AND created_at >= DATE_TRUNC('week', NOW()) -- Début de la semaine (lundi)
    AND created_at < DATE_TRUNC('week', NOW()) + INTERVAL '7 days';

  -- Sessions ce mois (basé sur les vraies dates)
  SELECT COUNT(*)::BIGINT INTO v_sessions_this_month
  FROM public.khalwa_sessions
  WHERE user_id = p_user_id 
    AND completed = true
    AND created_at >= DATE_TRUNC('month', NOW()) -- Début du mois
    AND created_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month';

  -- Calcul de la série (jours consécutifs basés sur les vraies dates)
  WITH daily_sessions AS (
    SELECT DISTINCT DATE(created_at) as session_date
    FROM public.khalwa_sessions
    WHERE user_id = p_user_id AND completed = true
    ORDER BY DATE(created_at) DESC
  ),
  streak_calc AS (
    SELECT 
      session_date,
      session_date - ROW_NUMBER() OVER (ORDER BY session_date DESC)::INTEGER * INTERVAL '1 day' as grp
    FROM daily_sessions
  )
  SELECT COALESCE(MAX(cnt), 0)::INTEGER INTO v_longest_streak_days
  FROM (
    SELECT COUNT(*) as cnt
    FROM streak_calc
    GROUP BY grp
  ) sub;

  -- Retourner les résultats
  RETURN QUERY SELECT
    COALESCE(v_total_sessions, 0),
    COALESCE(v_total_minutes, 0),
    COALESCE(v_avg_duration, 0),
    COALESCE(v_most_used_divine_name, ''),
    COALESCE(v_most_used_breathing_type, ''),
    COALESCE(v_most_used_sound, ''),
    COALESCE(v_sessions_this_week, 0),
    COALESCE(v_sessions_this_month, 0),
    COALESCE(v_longest_streak_days, 0);
END;
$$;

