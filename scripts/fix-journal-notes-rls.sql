-- Script pour corriger les politiques RLS de la table journal_notes
-- Ce script recrée les politiques RLS avec le format optimisé et vérifie que tout fonctionne

-- 1. Vérifier que la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'journal_notes'
  ) THEN
    RAISE EXCEPTION 'La table journal_notes n''existe pas. Exécutez d''abord create-journal-notes-table.sql';
  END IF;
END $$;

-- 2. Activer RLS si ce n'est pas déjà fait
ALTER TABLE journal_notes ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Users can view their own journal notes" ON journal_notes;
DROP POLICY IF EXISTS "Users can insert their own journal notes" ON journal_notes;
DROP POLICY IF EXISTS "Users can update their own journal notes" ON journal_notes;
DROP POLICY IF EXISTS "Users can delete their own journal notes" ON journal_notes;

-- 4. Recréer les politiques RLS avec format optimisé (select auth.uid())
-- Politique SELECT : les utilisateurs peuvent voir leurs propres notes
CREATE POLICY "Users can view their own journal notes"
  ON journal_notes
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Politique INSERT : les utilisateurs peuvent insérer leurs propres notes
-- IMPORTANT: WITH CHECK vérifie que user_id correspond à auth.uid()
CREATE POLICY "Users can insert their own journal notes"
  ON journal_notes
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Politique UPDATE : les utilisateurs peuvent mettre à jour leurs propres notes
CREATE POLICY "Users can update their own journal notes"
  ON journal_notes
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Politique DELETE : les utilisateurs peuvent supprimer leurs propres notes
CREATE POLICY "Users can delete their own journal notes"
  ON journal_notes
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- 5. Vérifier que les politiques sont créées
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'journal_notes';
  
  IF policy_count < 4 THEN
    RAISE WARNING 'Seulement % politiques créées sur 4 attendues', policy_count;
  ELSE
    RAISE NOTICE '✅ Toutes les politiques RLS ont été créées avec succès';
  END IF;
END $$;

-- 6. Commentaire
COMMENT ON TABLE journal_notes IS 'Table pour stocker les notes de journal des utilisateurs avec RLS activé';



