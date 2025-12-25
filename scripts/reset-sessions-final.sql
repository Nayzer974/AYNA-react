-- ============================================
-- SCRIPT DE RÉINITIALISATION COMPLÈTE DES SESSIONS
-- ============================================
-- Ce script :
-- 1. Supprime toutes les sessions automatiques existantes
-- 2. Met à jour le schéma si nécessaire
-- 3. Recrée toutes les fonctions RPC nécessaires
-- 4. Applique toutes les modifications récentes
-- ============================================

SET search_path = public, pg_temp;

-- ============================================
-- 1. SUPPRIMER TOUTES LES SESSIONS AUTOMATIQUES
-- ============================================
DO $$
DECLARE
  v_session_ids UUID[];
BEGIN
  -- Récupérer tous les IDs de sessions automatiques
  SELECT ARRAY_AGG(id) INTO v_session_ids
  FROM public.dhikr_sessions
  WHERE is_auto = true;
  
  IF v_session_ids IS NOT NULL AND array_length(v_session_ids, 1) > 0 THEN
    -- Supprimer les participants
    DELETE FROM public.dhikr_session_participants
    WHERE session_id = ANY(v_session_ids);
    
    -- Supprimer les clics
    DELETE FROM public.dhikr_session_clicks
    WHERE session_id = ANY(v_session_ids);
    
    -- Supprimer les sessions
    DELETE FROM public.dhikr_sessions
    WHERE id = ANY(v_session_ids);
    
    RAISE NOTICE 'Supprimé % session(s) automatique(s)', array_length(v_session_ids, 1);
  ELSE
    RAISE NOTICE 'Aucune session automatique à supprimer';
  END IF;
END $$;

-- ============================================
-- 2. AJOUTER LES COLONNES MANQUANTES
-- ============================================

-- Ajouter session_name si elle n'existe pas
ALTER TABLE public.dhikr_sessions 
ADD COLUMN IF NOT EXISTS session_name TEXT;

COMMENT ON COLUMN public.dhikr_sessions.session_name IS 'Nom de la session (utilisé pour les sessions automatiques mondiales)';

-- Ajouter prayer_period si elle n'existe pas
ALTER TABLE public.dhikr_sessions 
ADD COLUMN IF NOT EXISTS prayer_period TEXT;

COMMENT ON COLUMN public.dhikr_sessions.prayer_period IS 'Période de prière pour les sessions automatiques (fajr-dhuhr, dhuhr-asr, etc.)';

-- Ajouter is_auto si elle n'existe pas
ALTER TABLE public.dhikr_sessions 
ADD COLUMN IF NOT EXISTS is_auto BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.dhikr_sessions.is_auto IS 'Indique si la session est automatique (créée par l''application)';

-- S'assurer que target_count peut être NULL
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
    RAISE NOTICE 'Contrainte NOT NULL supprimée de target_count';
  END IF;
END $$;

-- ============================================
-- 3. SUPPRIMER LES ANCIENNES VERSIONS DES FONCTIONS
-- ============================================

-- Supprimer toutes les versions de create_auto_world_session
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT oid::regprocedure as func_signature
    FROM pg_proc
    WHERE proname = 'create_auto_world_session'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
  END LOOP;
  RAISE NOTICE 'Anciennes versions de create_auto_world_session supprimées';
END $$;

-- Supprimer toutes les versions de add_dhikr_click_simple
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT oid::regprocedure as func_signature
    FROM pg_proc
    WHERE proname = 'add_dhikr_click_simple'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
  END LOOP;
  RAISE NOTICE 'Anciennes versions de add_dhikr_click_simple supprimées';
END $$;

-- ============================================
-- 4. CRÉER/METTRE À JOUR create_auto_world_session
-- ============================================

CREATE OR REPLACE FUNCTION create_auto_world_session(
  p_user_id UUID,
  p_dhikr_text TEXT,
  p_prayer_period TEXT,
  p_session_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Supprimer toutes les sessions automatiques existantes
  -- (même avec des participants, elles doivent être supprimées quand une nouvelle prière arrive)
  DELETE FROM public.dhikr_session_participants
  WHERE session_id IN (
    SELECT id FROM public.dhikr_sessions WHERE is_auto = true
  );
  
  DELETE FROM public.dhikr_session_clicks
  WHERE session_id IN (
    SELECT id FROM public.dhikr_sessions WHERE is_auto = true
  );
  
  DELETE FROM public.dhikr_sessions
  WHERE is_auto = true;
  
  -- Créer la nouvelle session automatique
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
-- 5. CRÉER/METTRE À JOUR add_dhikr_click_simple
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
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session introuvable';
  END IF;
  
  -- Vérifier si la session est active
  IF NOT v_session.is_active THEN
    RETURN false;
  END IF;
  
  -- Pour les sessions illimitées (target_count = NULL), toujours permettre les clics
  IF v_session.target_count IS NOT NULL AND v_session.current_count >= v_session.target_count THEN
    RETURN false; -- Session complète (seulement pour sessions limitées)
  END IF;
  
  -- Calculer le nouveau compteur
  IF v_session.target_count IS NULL THEN
    -- Session illimitée : incrémenter sans limite
    v_new_count := v_session.current_count + 1;
    v_is_completed := false;
  ELSE
    -- Session limitée : incrémenter jusqu'à la limite
    v_new_count := LEAST(v_session.current_count + 1, v_session.target_count);
    v_is_completed := (v_new_count >= v_session.target_count);
  END IF;
  
  -- Enregistrer le clic dans dhikr_session_clicks (IMPORTANT pour l'historique)
  INSERT INTO public.dhikr_session_clicks (session_id, user_id, clicked_at)
  VALUES (p_session_id, p_user_id, NOW());
  
  -- Mettre à jour le compteur de la session
  UPDATE public.dhikr_sessions
  SET 
    current_count = v_new_count,
    is_active = NOT v_is_completed,
    completed_at = CASE WHEN v_is_completed THEN NOW() ELSE completed_at END,
    updated_at = NOW()
  WHERE id = p_session_id;
  
  RETURN true;
END;
$$;

COMMENT ON FUNCTION add_dhikr_click_simple IS 'Ajoute un clic à une session de dhikr. Enregistre le clic dans dhikr_session_clicks et met à jour le compteur. Gère les sessions illimitées (target_count = NULL) et les sessions limitées.';

-- Donner les permissions
GRANT EXECUTE ON FUNCTION add_dhikr_click_simple(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_dhikr_click_simple(UUID, UUID) TO anon;

-- ============================================
-- 6. VÉRIFIER LES PERMISSIONS RLS POUR dhikr_session_clicks
-- ============================================

-- S'assurer que les utilisateurs peuvent insérer des clics
DO $$
BEGIN
  -- Supprimer les anciennes politiques si elles existent
  DROP POLICY IF EXISTS "Users can insert clicks" ON public.dhikr_session_clicks;
  DROP POLICY IF EXISTS "Authenticated users can insert clicks" ON public.dhikr_session_clicks;
  
  -- Créer une politique permissive pour l'insertion
  CREATE POLICY "Users can insert clicks" 
  ON public.dhikr_session_clicks 
  FOR INSERT 
  TO public 
  WITH CHECK (true);
  
  RAISE NOTICE 'Politique RLS pour dhikr_session_clicks créée';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erreur lors de la création de la politique RLS: %', SQLERRM;
END $$;

-- ============================================
-- 7. VÉRIFIER ET ACTIVER REALTIME
-- ============================================

-- Vérifier si Realtime est activé pour les tables nécessaires
-- (Ces commandes doivent être exécutées dans Supabase Dashboard > Database > Replication)
-- ALTER PUBLICATION supabase_realtime ADD TABLE dhikr_sessions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE dhikr_session_participants;
-- ALTER PUBLICATION supabase_realtime ADD TABLE dhikr_session_clicks;

-- ============================================
-- 8. MESSAGE DE CONFIRMATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Script de réinitialisation terminé avec succès';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Modifications appliquées :';
  RAISE NOTICE '1. ✅ Toutes les sessions automatiques ont été supprimées';
  RAISE NOTICE '2. ✅ Colonnes ajoutées : session_name, prayer_period, is_auto';
  RAISE NOTICE '3. ✅ target_count peut maintenant être NULL (sessions illimitées)';
  RAISE NOTICE '4. ✅ Fonction create_auto_world_session recréée';
  RAISE NOTICE '5. ✅ Fonction add_dhikr_click_simple recréée (enregistre les clics)';
  RAISE NOTICE '6. ✅ Politique RLS pour dhikr_session_clicks créée';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT : Vérifiez que Realtime est activé pour :';
  RAISE NOTICE '   - dhikr_sessions';
  RAISE NOTICE '   - dhikr_session_participants';
  RAISE NOTICE '   - dhikr_session_clicks';
  RAISE NOTICE '';
  RAISE NOTICE '   Dans Supabase Dashboard > Database > Replication';
  RAISE NOTICE '';
  RAISE NOTICE 'Les sessions automatiques seront recréées automatiquement';
  RAISE NOTICE 'lors du prochain chargement de la page par un utilisateur connecté.';
  RAISE NOTICE '';
END $$;
