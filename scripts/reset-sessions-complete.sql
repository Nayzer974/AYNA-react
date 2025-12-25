-- ============================================
-- Script complet pour réinitialiser les sessions et appliquer toutes les modifications
-- ============================================
-- Ce script :
-- 1. Ajoute le champ session_name si nécessaire
-- 2. S'assure que target_count peut être NULL pour les sessions illimitées
-- 3. Supprime toutes les anciennes versions de fonctions RPC
-- 4. Crée/Met à jour la fonction create_auto_world_session avec session_name
-- 5. Crée/Met à jour la fonction add_dhikr_click_simple pour gérer target_count = NULL
-- 6. Supprime toutes les sessions automatiques existantes pour permettre la recréation
-- ============================================

-- ============================================
-- 1. Ajouter le champ session_name
-- ============================================
ALTER TABLE public.dhikr_sessions 
ADD COLUMN IF NOT EXISTS session_name TEXT;

COMMENT ON COLUMN public.dhikr_sessions.session_name IS 'Nom de la session (utilisé pour les sessions automatiques mondiales)';

-- ============================================
-- 2. S'assurer que target_count peut être NULL
-- ============================================
DO $$
BEGIN
  -- Vérifier si target_count a une contrainte NOT NULL et la supprimer si nécessaire
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'dhikr_sessions' 
    AND column_name = 'target_count' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.dhikr_sessions 
    ALTER COLUMN target_count DROP NOT NULL;
  END IF;
END $$;

-- ============================================
-- 3. Supprimer toutes les anciennes versions de create_auto_world_session
-- ============================================
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Supprimer toutes les versions de create_auto_world_session
  FOR r IN 
    SELECT oid::regprocedure as func_signature
    FROM pg_proc
    WHERE proname = 'create_auto_world_session'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
  END LOOP;
END $$;

-- ============================================
-- 4. Créer/Mettre à jour la fonction RPC create_auto_world_session
-- ============================================
CREATE OR REPLACE FUNCTION create_auto_world_session(
  p_user_id UUID,
  p_dhikr_text TEXT,
  p_prayer_period TEXT,
  p_session_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session_id UUID;
  v_user_exists BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur existe
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'L''utilisateur n''existe pas';
  END IF;

  -- Supprimer toutes les sessions automatiques existantes d'abord
  DELETE FROM public.dhikr_sessions
  WHERE is_auto = true;

  -- Supprimer les participants et clics associés
  DELETE FROM public.dhikr_session_participants
  WHERE session_id IN (SELECT id FROM public.dhikr_sessions WHERE is_auto = true);

  DELETE FROM public.dhikr_session_clicks
  WHERE session_id IN (SELECT id FROM public.dhikr_sessions WHERE is_auto = true);

  -- Créer la nouvelle session mondiale automatique
  INSERT INTO public.dhikr_sessions (
    created_by,
    dhikr_text,
    target_count,
    current_count,
    is_active,
    is_open,
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
    100,
    true, -- is_auto = true
    p_prayer_period,
    p_session_name
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

COMMENT ON FUNCTION create_auto_world_session IS 'Crée une session mondiale automatique (illimitée) pour une période de prière donnée. Supprime toutes les sessions automatiques existantes avant de créer la nouvelle.';

-- Donner les permissions
GRANT EXECUTE ON FUNCTION create_auto_world_session(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_auto_world_session(UUID, TEXT, TEXT, TEXT) TO anon;

-- ============================================
-- 5. Supprimer les anciennes versions de add_dhikr_click_simple
-- ============================================
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Supprimer toutes les versions de add_dhikr_click_simple
  FOR r IN 
    SELECT oid::regprocedure as func_signature
    FROM pg_proc
    WHERE proname = 'add_dhikr_click_simple'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
  END LOOP;
END $$;

-- ============================================
-- 6. Créer/Mettre à jour la fonction add_dhikr_click_simple pour gérer target_count = NULL
-- ============================================
CREATE OR REPLACE FUNCTION add_dhikr_click_simple(
  p_session_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session RECORD;
  v_new_count INTEGER;
  v_is_completed BOOLEAN;
BEGIN
  -- Récupérer la session
  SELECT current_count, target_count, is_active
  INTO v_session
  FROM public.dhikr_sessions
  WHERE id = p_session_id;

  -- Vérifier que la session existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session introuvable';
  END IF;

  -- Vérifier que la session est active
  IF NOT v_session.is_active THEN
    RETURN FALSE;
  END IF;

  -- Pour les sessions illimitées (target_count = NULL), toujours permettre les clics
  IF v_session.target_count IS NOT NULL AND v_session.current_count >= v_session.target_count THEN
    RETURN FALSE; -- Session complète (seulement pour sessions limitées)
  END IF;

  -- Calculer le nouveau compteur
  IF v_session.target_count IS NULL THEN
    -- Session illimitée : incrémenter sans limite
    v_new_count := v_session.current_count + 1;
    v_is_completed := FALSE;
  ELSE
    -- Session limitée : incrémenter jusqu'à la limite
    v_new_count := LEAST(v_session.current_count + 1, v_session.target_count);
    v_is_completed := v_new_count >= v_session.target_count;
  END IF;

  -- Insérer le clic dans la table (pour historique)
  INSERT INTO public.dhikr_session_clicks (session_id, user_id, clicked_at)
  VALUES (p_session_id, p_user_id, NOW())
  ON CONFLICT DO NOTHING;

  -- Mettre à jour la session
  UPDATE public.dhikr_sessions
  SET 
    current_count = v_new_count,
    is_active = NOT v_is_completed,
    completed_at = CASE WHEN v_is_completed THEN NOW() ELSE completed_at END,
    updated_at = NOW()
  WHERE id = p_session_id;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION add_dhikr_click_simple IS 'Ajoute un clic à une session de dhikr. Gère correctement les sessions illimitées (target_count = NULL).';

-- Donner les permissions
GRANT EXECUTE ON FUNCTION add_dhikr_click_simple(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_dhikr_click_simple(UUID, UUID) TO anon;

-- ============================================
-- 7. Supprimer toutes les sessions automatiques existantes
-- ============================================
-- Supprimer d'abord les participants et clics associés
DELETE FROM public.dhikr_session_participants
WHERE session_id IN (SELECT id FROM public.dhikr_sessions WHERE is_auto = true);

DELETE FROM public.dhikr_session_clicks
WHERE session_id IN (SELECT id FROM public.dhikr_sessions WHERE is_auto = true);

-- Supprimer toutes les sessions automatiques
DELETE FROM public.dhikr_sessions
WHERE is_auto = true;

-- ============================================
-- Message de confirmation
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Script terminé avec succès.';
  RAISE NOTICE 'Les modifications suivantes ont été appliquées :';
  RAISE NOTICE '1. Champ session_name ajouté à dhikr_sessions';
  RAISE NOTICE '2. target_count peut maintenant être NULL pour les sessions illimitées';
  RAISE NOTICE '3. Fonction create_auto_world_session mise à jour avec session_name';
  RAISE NOTICE '4. Fonction add_dhikr_click_simple créée/mise à jour pour gérer les sessions illimitées';
  RAISE NOTICE '5. Toutes les sessions automatiques existantes ont été supprimées';
  RAISE NOTICE '';
  RAISE NOTICE 'Les sessions automatiques seront recréées automatiquement lors du prochain chargement de la page par un utilisateur connecté.';
  RAISE NOTICE 'Les nouvelles sessions utiliseront les dhikr spécifiques selon la période de prière.';
END $$;

