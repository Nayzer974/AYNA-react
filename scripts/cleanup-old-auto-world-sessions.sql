-- Script pour nettoyer les anciennes sessions automatiques mondiales
-- À exécuter dans Supabase SQL Editor
-- Ce script supprime toutes les sessions automatiques sauf la plus récente

-- Supprimer les participants et clics des anciennes sessions automatiques
DELETE FROM public.dhikr_session_participants
WHERE session_id IN (
  SELECT id FROM public.dhikr_sessions 
  WHERE is_auto = true 
  AND id NOT IN (
    SELECT id FROM public.dhikr_sessions 
    WHERE is_auto = true 
    ORDER BY created_at DESC 
    LIMIT 1
  )
);

DELETE FROM public.dhikr_session_clicks
WHERE session_id IN (
  SELECT id FROM public.dhikr_sessions 
  WHERE is_auto = true 
  AND id NOT IN (
    SELECT id FROM public.dhikr_sessions 
    WHERE is_auto = true 
    ORDER BY created_at DESC 
    LIMIT 1
  )
);

-- Supprimer toutes les sessions automatiques sauf la plus récente
DELETE FROM public.dhikr_sessions
WHERE is_auto = true 
AND id NOT IN (
  SELECT id FROM public.dhikr_sessions 
  WHERE is_auto = true 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Afficher le résultat
SELECT 
  COUNT(*) as total_auto_sessions,
  MAX(created_at) as most_recent_session_date
FROM public.dhikr_sessions
WHERE is_auto = true;

