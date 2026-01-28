-- Fonction RPC pour créer les sessions des dhikr de la page d'accueil
-- Cette fonction crée des sessions automatiques avec rotation 24h
-- Elle NE SUPPRIME PAS la session du script SQL existant (qui n'a pas de session_name spécifique)

-- Fonction pour créer une session automatique (home dhikr) avec gestion 24h
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
    AND session_name LIKE 'Session commune%'
    AND created_at > NOW() - INTERVAL '24 hours'
    AND (
      dhikr_text::json->>'arabic' = v_dhikr_arabic
      OR dhikr_text = p_dhikr_text
    )
  LIMIT 1;

  -- Si une session existe déjà avec ce contenu (créée dans les 24h), la retourner
  IF v_existing_session_id IS NOT NULL THEN
    RETURN v_existing_session_id;
  END IF;

  -- Supprimer les anciennes sessions "Session commune" de plus de 24h avec un contenu DIFFÉRENT
  -- On garde les sessions qui ont le même contenu (cas où l'utilisateur revient le même jour)
  -- IMPORTANT: Ne pas supprimer les sessions sans "Session commune" dans le nom (session du script SQL)
  FOR v_old_session IN 
    SELECT id FROM public.dhikr_sessions
    WHERE is_auto = true 
      AND is_active = true
      AND session_name LIKE 'Session commune%'
      AND created_at <= NOW() - INTERVAL '24 hours'
      AND (
        dhikr_text::json->>'arabic' IS DISTINCT FROM v_dhikr_arabic
        OR dhikr_text::json->>'arabic' IS NULL
      )
  LOOP
    -- Supprimer les participants et clics associés
    DELETE FROM public.dhikr_session_participants WHERE session_id = v_old_session.id;
    DELETE FROM public.dhikr_session_clicks WHERE session_id = v_old_session.id;
    -- Supprimer la session
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

COMMENT ON FUNCTION create_home_dhikr_session IS 'Crée une session automatique pour les dhikr de la page d''accueil avec rotation 24h. Ne supprime pas la session du script SQL existant.';

-- Donner les permissions
GRANT EXECUTE ON FUNCTION create_home_dhikr_session(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_home_dhikr_session(UUID, TEXT, TEXT) TO anon;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Fonction create_home_dhikr_session créée avec succès';
  RAISE NOTICE '   - Rotation automatique toutes les 24h';
  RAISE NOTICE '   - Ne supprime pas la session du script SQL existant';
  RAISE NOTICE '   - Utilise le même dhikr que la page d''accueil';
END $$;
