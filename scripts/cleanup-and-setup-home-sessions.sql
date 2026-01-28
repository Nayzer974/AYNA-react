-- Script de nettoyage et configuration des sessions communes
-- Exécuter ce script UNE FOIS pour nettoyer toutes les sessions automatiques
-- et configurer la fonction pour créer UNIQUEMENT 2 sessions (dhikr de l'accueil)

-- ============================================
-- ÉTAPE 1: Supprimer TOUTES les sessions automatiques existantes
-- ============================================

-- Supprimer d'abord les participants et clics associés
DELETE FROM public.dhikr_session_participants 
WHERE session_id IN (SELECT id FROM public.dhikr_sessions WHERE is_auto = true);

DELETE FROM public.dhikr_session_clicks 
WHERE session_id IN (SELECT id FROM public.dhikr_sessions WHERE is_auto = true);

-- Supprimer toutes les sessions automatiques
DELETE FROM public.dhikr_sessions WHERE is_auto = true;

-- ============================================
-- ÉTAPE 2: Supprimer l'ancienne fonction create_auto_world_session
-- (elle supprime toutes les sessions, on ne veut plus l'utiliser)
-- ============================================

DROP FUNCTION IF EXISTS create_auto_world_session(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_auto_world_session(UUID, TEXT, TEXT);

-- ============================================
-- ÉTAPE 3: Créer la nouvelle fonction create_home_dhikr_session
-- Cette fonction crée UNE session à la fois (duah OU dhikr)
-- Elle vérifie d'abord si la session existe déjà
-- ============================================

CREATE OR REPLACE FUNCTION create_home_dhikr_session(
  p_user_id UUID,
  p_dhikr_text TEXT,
  p_session_name TEXT DEFAULT 'Session commune'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session_id UUID;
  v_existing_session_id UUID;
  v_dhikr_arabic TEXT;
  v_old_session RECORD;
BEGIN
  -- Extraire le texte arabe du JSON pour comparaison
  BEGIN
    v_dhikr_arabic := p_dhikr_text::json->>'arabic';
  EXCEPTION WHEN OTHERS THEN
    v_dhikr_arabic := p_dhikr_text;
  END;

  -- Vérifier si une session automatique avec le même contenu arabe existe déjà
  -- et a été créée dans les dernières 24h
  SELECT id INTO v_existing_session_id
  FROM public.dhikr_sessions
  WHERE is_auto = true 
    AND is_active = true
    AND created_at > NOW() - INTERVAL '24 hours'
    AND dhikr_text::json->>'arabic' = v_dhikr_arabic
  LIMIT 1;

  -- Si une session existe déjà avec ce contenu (créée dans les 24h), la retourner
  IF v_existing_session_id IS NOT NULL THEN
    RETURN v_existing_session_id;
  END IF;

  -- Supprimer les anciennes sessions de plus de 24h avec le MÊME nom de session
  -- (pour éviter l'accumulation de sessions obsolètes)
  FOR v_old_session IN 
    SELECT id FROM public.dhikr_sessions
    WHERE is_auto = true 
      AND session_name = p_session_name
      AND created_at <= NOW() - INTERVAL '24 hours'
  LOOP
    DELETE FROM public.dhikr_session_participants WHERE session_id = v_old_session.id;
    DELETE FROM public.dhikr_session_clicks WHERE session_id = v_old_session.id;
    DELETE FROM public.dhikr_sessions WHERE id = v_old_session.id;
  END LOOP;

  -- Créer la nouvelle session automatique
  INSERT INTO public.dhikr_sessions (
    created_by,
    dhikr_text,
    target_count,
    current_count,
    is_active,
    is_open,
    is_private,
    max_participants,
    is_auto,
    prayer_period,
    session_name
  ) VALUES (
    p_user_id,
    p_dhikr_text,
    NULL, -- target_count = NULL pour sessions illimitées
    0,
    true,
    true,
    false, -- Sessions publiques
    100,
    true, -- is_auto = true
    NULL,
    p_session_name
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

COMMENT ON FUNCTION create_home_dhikr_session IS 'Crée une session automatique pour UN dhikr de la page d''accueil. Rotation automatique toutes les 24h.';

-- Donner les permissions
GRANT EXECUTE ON FUNCTION create_home_dhikr_session(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_home_dhikr_session(UUID, TEXT, TEXT) TO anon;

-- ============================================
-- CONFIRMATION
-- ============================================

DO $$
DECLARE
  v_remaining_auto_sessions INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_remaining_auto_sessions FROM public.dhikr_sessions WHERE is_auto = true;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ NETTOYAGE ET CONFIGURATION TERMINÉS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '• Toutes les sessions automatiques ont été supprimées';
  RAISE NOTICE '• Sessions automatiques restantes: %', v_remaining_auto_sessions;
  RAISE NOTICE '• Fonction create_home_dhikr_session créée';
  RAISE NOTICE '• Ancienne fonction create_auto_world_session supprimée';
  RAISE NOTICE '';
  RAISE NOTICE 'L''application va maintenant créer UNIQUEMENT 2 sessions:';
  RAISE NOTICE '  1. Session commune - Duah (duah rabanah de l''accueil)';
  RAISE NOTICE '  2. Session commune - Dhikr (dhikr de l''accueil)';
  RAISE NOTICE '';
END $$;

