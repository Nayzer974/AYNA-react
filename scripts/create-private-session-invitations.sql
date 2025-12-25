-- Script pour créer le système d'invitations par lien pour les sessions privées
-- Ce script ajoute le support des tokens d'invitation dans la table dhikr_sessions

-- Note: Le token est stocké dans session_name au format "Session privée - TOKEN"
-- Une table séparée n'est pas nécessaire car le token est géré côté client

-- Vérifier que la colonne session_name existe (elle devrait déjà exister)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dhikr_sessions' 
    AND column_name = 'session_name'
  ) THEN
    ALTER TABLE dhikr_sessions ADD COLUMN session_name TEXT;
  END IF;
END $$;

-- Créer un index pour améliorer les performances lors de la recherche par token
-- (le token est dans session_name, donc on indexe session_name pour les sessions privées)
CREATE INDEX IF NOT EXISTS idx_dhikr_sessions_private_token 
ON dhikr_sessions(session_name) 
WHERE is_private = true AND session_name LIKE 'Session privée - %';

-- Fonction pour valider un token d'invitation
CREATE OR REPLACE FUNCTION validate_invite_token(
  p_private_session_id TEXT,
  p_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_exists BOOLEAN;
BEGIN
  -- Vérifier si une session privée existe avec ce token
  SELECT EXISTS(
    SELECT 1 
    FROM dhikr_sessions
    WHERE is_private = true
      AND private_session_id = p_private_session_id
      AND session_name = CONCAT('Session privée - ', p_token)
      AND is_active = true
  ) INTO v_session_exists;

  RETURN v_session_exists;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION validate_invite_token IS 'Valide un token d''invitation pour une session privée';

-- Permissions
GRANT EXECUTE ON FUNCTION validate_invite_token(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_invite_token(TEXT, TEXT) TO anon;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Système d''invitations par lien créé avec succès';
  RAISE NOTICE '   - Index créé pour les recherches par token';
  RAISE NOTICE '   - Fonction validate_invite_token créée';
END $$;





