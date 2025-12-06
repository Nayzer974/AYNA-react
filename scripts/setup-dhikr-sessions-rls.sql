-- Script SQL pour configurer les politiques RLS pour les tables de sessions de dhikr
-- Ce script permet les opérations sans authentification obligatoire

-- ============================================
-- 1. Table: dhikr_sessions
-- ============================================

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE dhikr_sessions ENABLE ROW LEVEL SECURITY;

-- Supprimer TOUTES les politiques existantes (y compris les restrictives)
DROP POLICY IF EXISTS "Allow public read dhikr_sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Allow public insert dhikr_sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Allow public update dhikr_sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Allow public delete dhikr_sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Anyone can view active sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Session creators can update their sessions" ON dhikr_sessions;

-- Politique pour SELECT : Tout le monde peut lire les sessions actives
CREATE POLICY "Allow public read dhikr_sessions"
ON dhikr_sessions
FOR SELECT
USING (true);

-- Politique pour INSERT : Tout le monde peut créer des sessions
CREATE POLICY "Allow public insert dhikr_sessions"
ON dhikr_sessions
FOR INSERT
WITH CHECK (true);

-- Politique pour UPDATE : Tout le monde peut mettre à jour les sessions
CREATE POLICY "Allow public update dhikr_sessions"
ON dhikr_sessions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Pas de politique DELETE pour dhikr_sessions - seuls les admins peuvent supprimer via la fonction deleteAllActiveDhikrSessions

-- ============================================
-- 2. Table: dhikr_session_participants
-- ============================================

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE dhikr_session_participants ENABLE ROW LEVEL SECURITY;

-- Supprimer TOUTES les politiques existantes (y compris les restrictives)
DROP POLICY IF EXISTS "Allow public read dhikr_session_participants" ON dhikr_session_participants;
DROP POLICY IF EXISTS "Allow public insert dhikr_session_participants" ON dhikr_session_participants;
DROP POLICY IF EXISTS "Allow public update dhikr_session_participants" ON dhikr_session_participants;
DROP POLICY IF EXISTS "Allow public delete dhikr_session_participants" ON dhikr_session_participants;
DROP POLICY IF EXISTS "Anyone can view participants" ON dhikr_session_participants;
DROP POLICY IF EXISTS "Users can join sessions" ON dhikr_session_participants;
DROP POLICY IF EXISTS "Users can leave sessions" ON dhikr_session_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON dhikr_session_participants;

-- Politique pour SELECT : Tout le monde peut lire les participants
CREATE POLICY "Allow public read dhikr_session_participants"
ON dhikr_session_participants
FOR SELECT
USING (true);

-- Politique pour INSERT : Tout le monde peut rejoindre une session
CREATE POLICY "Allow public insert dhikr_session_participants"
ON dhikr_session_participants
FOR INSERT
WITH CHECK (true);

-- Politique pour UPDATE : Tout le monde peut mettre à jour les participants
CREATE POLICY "Allow public update dhikr_session_participants"
ON dhikr_session_participants
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Politique pour DELETE : Permettre aux utilisateurs de quitter une session
-- Seulement si user_id correspond à l'utilisateur authentifié ou si user_id est NULL
CREATE POLICY "Allow users to leave sessions"
ON dhikr_session_participants
FOR DELETE
USING (
  user_id IS NULL 
  OR user_id = auth.uid()
);

-- ============================================
-- 3. Table: dhikr_session_clicks
-- ============================================

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE dhikr_session_clicks ENABLE ROW LEVEL SECURITY;

-- Supprimer TOUTES les politiques existantes (y compris les restrictives)
DROP POLICY IF EXISTS "Allow public read dhikr_session_clicks" ON dhikr_session_clicks;
DROP POLICY IF EXISTS "Allow public insert dhikr_session_clicks" ON dhikr_session_clicks;
DROP POLICY IF EXISTS "Allow public update dhikr_session_clicks" ON dhikr_session_clicks;
DROP POLICY IF EXISTS "Allow public delete dhikr_session_clicks" ON dhikr_session_clicks;
DROP POLICY IF EXISTS "Anyone can view clicks" ON dhikr_session_clicks;
DROP POLICY IF EXISTS "Users can add clicks" ON dhikr_session_clicks;

-- Politique pour SELECT : Tout le monde peut lire les clics
CREATE POLICY "Allow public read dhikr_session_clicks"
ON dhikr_session_clicks
FOR SELECT
USING (true);

-- Politique pour INSERT : Tout le monde peut ajouter des clics
CREATE POLICY "Allow public insert dhikr_session_clicks"
ON dhikr_session_clicks
FOR INSERT
WITH CHECK (true);

-- Politique pour UPDATE : Tout le monde peut mettre à jour les clics
CREATE POLICY "Allow public update dhikr_session_clicks"
ON dhikr_session_clicks
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Pas de politique DELETE pour dhikr_session_clicks - les clics sont traités automatiquement

-- ============================================
-- Vérification
-- ============================================

-- Vérifier que RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('dhikr_sessions', 'dhikr_session_participants', 'dhikr_session_clicks')
  AND schemaname = 'public';

-- Vérifier les politiques créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('dhikr_sessions', 'dhikr_session_participants', 'dhikr_session_clicks')
ORDER BY tablename, policyname;

