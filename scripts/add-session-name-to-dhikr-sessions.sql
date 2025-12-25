-- Ajouter le champ session_name à la table dhikr_sessions
ALTER TABLE public.dhikr_sessions 
ADD COLUMN IF NOT EXISTS session_name TEXT;

-- Commentaire
COMMENT ON COLUMN public.dhikr_sessions.session_name IS 'Nom de la session (utilisé pour les sessions automatiques mondiales)';

