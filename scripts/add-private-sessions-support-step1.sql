-- ÉTAPE 1 : Ajouter les colonnes pour les sessions privées
-- Copiez et exécutez cette partie dans Supabase SQL Editor

ALTER TABLE public.dhikr_sessions
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE public.dhikr_sessions
ADD COLUMN IF NOT EXISTS private_session_id TEXT;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_dhikr_sessions_is_private ON public.dhikr_sessions(is_private);
CREATE INDEX IF NOT EXISTS idx_dhikr_sessions_private_session_id ON public.dhikr_sessions(private_session_id);


