-- ============================================
-- RÉINITIALISATION COMPLÈTE DU BACKEND DHIKR
-- ============================================
-- Ce script supprime TOUT le backend existant pour DairatAnNur
-- et permet de repartir de zéro avec un backend propre
-- ============================================

-- ⚠️ ATTENTION : Ce script supprime toutes les données existantes !
-- Exécutez-le uniquement si vous êtes sûr de vouloir tout réinitialiser

-- ============================================
-- ÉTAPE 1 : Supprimer toutes les fonctions RPC
-- ============================================

DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT, INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.create_dhikr_session_direct(UUID, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.create_dhikr_session_simple(UUID, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.join_dhikr_session(UUID);
DROP FUNCTION IF EXISTS public.leave_dhikr_session(UUID);
DROP FUNCTION IF EXISTS public.add_dhikr_session_click(UUID);
DROP FUNCTION IF EXISTS public.process_dhikr_session_clicks();
DROP FUNCTION IF EXISTS public.delete_all_active_dhikr_sessions();

-- ============================================
-- ÉTAPE 2 : Supprimer tous les triggers
-- ============================================

DROP TRIGGER IF EXISTS trigger_update_dhikr_sessions_updated_at ON public.dhikr_sessions;

-- ============================================
-- ÉTAPE 3 : Supprimer toutes les fonctions de trigger
-- ============================================

DROP FUNCTION IF EXISTS public.update_dhikr_sessions_updated_at();

-- ============================================
-- ÉTAPE 4 : Supprimer toutes les politiques RLS
-- ============================================

-- Politiques pour dhikr_sessions
DROP POLICY IF EXISTS "Anyone can view active sessions" ON public.dhikr_sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON public.dhikr_sessions;
DROP POLICY IF EXISTS "Session creators can update their sessions" ON public.dhikr_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.dhikr_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.dhikr_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.dhikr_sessions;

-- Politiques pour dhikr_session_participants
DROP POLICY IF EXISTS "Anyone can view participants" ON public.dhikr_session_participants;
DROP POLICY IF EXISTS "Users can join sessions" ON public.dhikr_session_participants;
DROP POLICY IF EXISTS "Users can leave sessions" ON public.dhikr_session_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON public.dhikr_session_participants;
DROP POLICY IF EXISTS "Users can view their own participation" ON public.dhikr_session_participants;

-- Politiques pour dhikr_session_clicks
DROP POLICY IF EXISTS "Anyone can view clicks" ON public.dhikr_session_clicks;
DROP POLICY IF EXISTS "Users can add clicks" ON public.dhikr_session_clicks;
DROP POLICY IF EXISTS "Users can view their own clicks" ON public.dhikr_session_clicks;

-- ============================================
-- ÉTAPE 5 : Désactiver RLS temporairement
-- ============================================

ALTER TABLE IF EXISTS public.dhikr_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dhikr_session_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dhikr_session_clicks DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 6 : Supprimer toutes les tables (avec CASCADE)
-- ============================================
-- CASCADE supprime automatiquement les index, contraintes, etc.

DROP TABLE IF EXISTS public.dhikr_session_clicks CASCADE;
DROP TABLE IF EXISTS public.dhikr_session_participants CASCADE;
DROP TABLE IF EXISTS public.dhikr_sessions CASCADE;

-- ============================================
-- ✅ RÉINITIALISATION TERMINÉE
-- ============================================
-- Vous pouvez maintenant exécuter le script de création
-- du nouveau backend : create-dhikr-backend-mobile.sql

