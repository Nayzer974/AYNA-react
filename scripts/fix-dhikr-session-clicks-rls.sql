-- ============================================
-- CORRECTION DES POLITIQUES RLS POUR dhikr_session_clicks
-- ============================================
-- Ce script corrige la politique RLS pour permettre l'insertion de clics
-- pour tous les utilisateurs connectés (même sans email vérifié)
-- ============================================

-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Authenticated users can add clicks" ON public.dhikr_session_clicks;

-- Créer une nouvelle politique simplifiée et permissive
-- Permet l'insertion si :
-- 1. L'utilisateur est connecté (auth.uid() IS NOT NULL) ET user_id correspond à auth.uid()
-- 2. OU user_id est NULL (pour permettre les utilisateurs anonymes si nécessaire)
-- Cette politique fonctionne même si l'email n'est pas vérifié
CREATE POLICY "Connected users can add clicks"
  ON public.dhikr_session_clicks
  FOR INSERT
  WITH CHECK (
    -- Cas 1: Utilisateur connecté et user_id correspond à auth.uid()
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- Cas 2: user_id est NULL (utilisateurs anonymes)
    user_id IS NULL
  );

-- ============================================
-- ✅ POLITIQUE CORRIGÉE
-- ============================================
-- Cette politique permet à tous les utilisateurs connectés
-- (même sans email vérifié) d'enregistrer leurs clics
-- ============================================

