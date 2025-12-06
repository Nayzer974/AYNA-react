-- Script SQL pour supprimer TOUTES les politiques RLS existantes
-- et les remplacer par des politiques publiques qui permettent tout
-- À exécuter dans le SQL Editor de Supabase Dashboard

-- ============================================
-- 1. Supprimer TOUTES les politiques de dhikr_sessions
-- ============================================

DROP POLICY IF EXISTS "Allow public read dhikr_sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Allow public insert dhikr_sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Allow public update dhikr_sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Allow public delete dhikr_sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Anyone can view active sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Session creators can update their sessions" ON dhikr_sessions;

-- ============================================
-- 2. Supprimer TOUTES les politiques de dhikr_session_participants
-- ============================================

DROP POLICY IF EXISTS "Allow public read dhikr_session_participants" ON dhikr_session_participants;
DROP POLICY IF EXISTS "Allow public insert dhikr_session_participants" ON dhikr_session_participants;
DROP POLICY IF EXISTS "Allow public update dhikr_session_participants" ON dhikr_session_participants;
DROP POLICY IF EXISTS "Allow public delete dhikr_session_participants" ON dhikr_session_participants;
DROP POLICY IF EXISTS "Anyone can view participants" ON dhikr_session_participants;
DROP POLICY IF EXISTS "Users can join sessions" ON dhikr_session_participants;
DROP POLICY IF EXISTS "Users can leave sessions" ON dhikr_session_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON dhikr_session_participants;

-- ============================================
-- 3. Supprimer TOUTES les politiques de dhikr_session_clicks
-- ============================================

DROP POLICY IF EXISTS "Allow public read dhikr_session_clicks" ON dhikr_session_clicks;
DROP POLICY IF EXISTS "Allow public insert dhikr_session_clicks" ON dhikr_session_clicks;
DROP POLICY IF EXISTS "Allow public update dhikr_session_clicks" ON dhikr_session_clicks;
DROP POLICY IF EXISTS "Allow public delete dhikr_session_clicks" ON dhikr_session_clicks;
DROP POLICY IF EXISTS "Anyone can view clicks" ON dhikr_session_clicks;
DROP POLICY IF EXISTS "Users can add clicks" ON dhikr_session_clicks;

-- ============================================
-- 4. Recréer les politiques publiques simples (sans DELETE)
-- ============================================

-- dhikr_sessions
CREATE POLICY "Allow public read dhikr_sessions"
ON dhikr_sessions FOR SELECT USING (true);

CREATE POLICY "Allow public insert dhikr_sessions"
ON dhikr_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update dhikr_sessions"
ON dhikr_sessions FOR UPDATE USING (true) WITH CHECK (true);

-- Pas de politique DELETE pour dhikr_sessions - seuls les admins peuvent supprimer via la fonction

-- dhikr_session_participants
CREATE POLICY "Allow public read dhikr_session_participants"
ON dhikr_session_participants FOR SELECT USING (true);

CREATE POLICY "Allow public insert dhikr_session_participants"
ON dhikr_session_participants FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update dhikr_session_participants"
ON dhikr_session_participants FOR UPDATE USING (true) WITH CHECK (true);

-- Politique DELETE pour permettre aux utilisateurs de quitter une session
-- Seulement si user_id correspond à l'utilisateur authentifié ou si user_id est NULL
CREATE POLICY "Allow users to leave sessions"
ON dhikr_session_participants FOR DELETE 
USING (
  user_id IS NULL 
  OR user_id = auth.uid()
);

-- dhikr_session_clicks
CREATE POLICY "Allow public read dhikr_session_clicks"
ON dhikr_session_clicks FOR SELECT USING (true);

CREATE POLICY "Allow public insert dhikr_session_clicks"
ON dhikr_session_clicks FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update dhikr_session_clicks"
ON dhikr_session_clicks FOR UPDATE USING (true) WITH CHECK (true);

-- Pas de politique DELETE pour dhikr_session_clicks - les clics sont traités automatiquement

-- ============================================
-- Vérification finale
-- ============================================

-- Vérifier les politiques créées
-- dhikr_sessions: 3 politiques (SELECT, INSERT, UPDATE)
-- dhikr_session_participants: 4 politiques (SELECT, INSERT, UPDATE, DELETE conditionnel)
-- dhikr_session_clicks: 3 politiques (SELECT, INSERT, UPDATE)
-- Total: 10 politiques
SELECT 
  tablename,
  policyname,
  cmd,
  COUNT(*) OVER (PARTITION BY tablename) as policies_per_table
FROM pg_policies
WHERE tablename IN ('dhikr_sessions', 'dhikr_session_participants', 'dhikr_session_clicks')
ORDER BY tablename, policyname;

