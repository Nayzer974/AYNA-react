-- ÉTAPE 4 : Fonction de nettoyage automatique (optionnel)
-- Copiez et exécutez cette partie dans Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.cleanup_completed_public_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.dhikr_sessions
  WHERE is_private = false
    AND is_active = false
    AND completed_at IS NOT NULL
    AND completed_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;


