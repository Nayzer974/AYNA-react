-- Fonction RPC pour créer une session mondiale automatique
-- Cette fonction crée une session publique automatique avec target_count = NULL (illimité)

CREATE OR REPLACE FUNCTION create_auto_world_session(
  p_user_id UUID,
  p_dhikr_text TEXT,
  p_prayer_period TEXT,
  p_session_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- Vérifier qu'il n'y a pas déjà une session automatique active
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

-- Commentaire
COMMENT ON FUNCTION create_auto_world_session IS 'Crée une session mondiale automatique (illimitée) pour une période de prière donnée. Supprime toutes les sessions automatiques existantes avant de créer la nouvelle.';


