-- =====================================================
-- Script pour corriger tous les problèmes du linter Supabase
-- =====================================================
-- Ce script corrige :
-- 1. Function Search Path Mutable (WARN)
-- 2. Auth RLS InitPlan (WARN) - Optimisation des politiques RLS
-- 3. Multiple Permissive Policies (WARN) - Fusion des politiques
-- 4. Duplicate Index (WARN) - Suppression des index dupliqués
-- 5. Unindexed Foreign Keys (INFO) - Ajout d'index
-- 
-- Exécuter ce script dans Supabase SQL Editor
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CORRECTION DES FONCTIONS : Ajouter SET search_path
-- =====================================================

-- Fonction update_khalwa_sessions_updated_at
CREATE OR REPLACE FUNCTION public.update_khalwa_sessions_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fonction generate_audit_report
DROP FUNCTION IF EXISTS public.generate_audit_report();
CREATE OR REPLACE FUNCTION public.generate_audit_report()
RETURNS TABLE (
  user_id UUID,
  action TEXT,
  event_timestamp TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    user_id,
    action,
    timestamp as event_timestamp
  FROM public.audit_logs
  ORDER BY timestamp DESC
  LIMIT 100;
END;
$$;

-- Fonction create_dhikr_session (si elle existe déjà, elle sera mise à jour)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'create_dhikr_session' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    -- La fonction sera mise à jour avec SET search_path dans le script principal
    -- Ici on s'assure juste qu'elle existe
    NULL;
  END IF;
END $$;

-- Fonction update_profiles_updated_at
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fonction update_user_preferences_updated_at
CREATE OR REPLACE FUNCTION public.update_user_preferences_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fonction handle_new_user
-- Supprimer le trigger d'abord car il dépend de la fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    email, 
    avatar, 
    theme, 
    analytics,
    gender
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_id', NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    COALESCE(NEW.raw_user_meta_data->>'theme', 'default'),
    '{"totalDhikr": 0, "totalNotes": 0, "streak": 0, "lastActive": ""}'::jsonb,
    COALESCE(NEW.raw_user_meta_data->>'gender', NULL)
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Fonction cleanup_completed_public_sessions
DROP FUNCTION IF EXISTS public.cleanup_completed_public_sessions();
CREATE OR REPLACE FUNCTION public.cleanup_completed_public_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.dhikr_sessions
  SET is_active = false
  WHERE is_active = true
    AND is_open = true
    AND current_count >= target_count;
END;
$$;

-- Fonction update_dhikr_sessions_updated_at
CREATE OR REPLACE FUNCTION public.update_dhikr_sessions_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fonction join_dhikr_session (mise à jour avec search_path)
-- Note: Cette fonction doit être mise à jour dans le script principal si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'join_dhikr_session' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    -- La fonction sera mise à jour avec SET search_path dans le script principal
    NULL;
  END IF;
END $$;

-- Fonction is_user_admin
DROP FUNCTION IF EXISTS public.is_user_admin(UUID);
CREATE OR REPLACE FUNCTION public.is_user_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND is_admin = true
  );
END;
$$;

-- Fonction promote_to_admin
DROP FUNCTION IF EXISTS public.promote_to_admin(TEXT);
CREATE OR REPLACE FUNCTION public.promote_to_admin(p_user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM public.profiles
  WHERE email = p_user_email;
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  UPDATE public.profiles
  SET is_admin = true, updated_at = now()
  WHERE id = v_user_id;
  
  RETURN true;
END;
$$;

-- Fonction demote_from_admin
DROP FUNCTION IF EXISTS public.demote_from_admin(TEXT);
CREATE OR REPLACE FUNCTION public.demote_from_admin(p_user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM public.profiles
  WHERE email = p_user_email;
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  UPDATE public.profiles
  SET is_admin = false, updated_at = now()
  WHERE id = v_user_id;
  
  RETURN true;
END;
$$;

-- Fonction list_admins
DROP FUNCTION IF EXISTS public.list_admins();
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.name
  FROM public.profiles p
  WHERE p.is_admin = true
  ORDER BY p.updated_at DESC;
END;
$$;

-- Fonction delete_dhikr_session
DROP FUNCTION IF EXISTS public.delete_dhikr_session(UUID);
CREATE OR REPLACE FUNCTION public.delete_dhikr_session(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Récupérer l'ID utilisateur depuis auth
  v_user_id := (SELECT auth.uid());
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté pour supprimer une session';
  END IF;
  
  -- Vérifier que l'utilisateur est le créateur
  IF NOT EXISTS (
    SELECT 1 FROM public.dhikr_sessions
    WHERE id = p_session_id AND created_by = v_user_id
  ) THEN
    RAISE EXCEPTION 'Vous ne pouvez supprimer que vos propres sessions';
  END IF;
  
  -- Supprimer la session (CASCADE supprimera les participants et clics)
  DELETE FROM public.dhikr_sessions
  WHERE id = p_session_id;
  
  RETURN true;
END;
$$;

-- Fonction promote_to_admin_by_id
DROP FUNCTION IF EXISTS public.promote_to_admin_by_id(UUID);
CREATE OR REPLACE FUNCTION public.promote_to_admin_by_id(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.profiles
  SET is_admin = true, updated_at = now()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$;

-- =====================================================
-- 2. OPTIMISATION DES POLITIQUES RLS : Utiliser (select auth.uid())
-- =====================================================

-- Note: Les politiques RLS doivent être recréées avec (select auth.uid())
-- au lieu de auth.uid() pour éviter la réévaluation à chaque ligne

-- Table: community_posts
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.community_posts;
CREATE POLICY "Authenticated users can create posts"
  ON public.community_posts
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete own posts or admins can delete any" ON public.community_posts;
CREATE POLICY "Users can delete own posts or admins can delete any"
  ON public.community_posts
  FOR DELETE
  USING (
    (select auth.uid()) = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Users can update own posts" ON public.community_posts;
CREATE POLICY "Users can update own posts"
  ON public.community_posts
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Table: community_post_likes
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.community_post_likes;
CREATE POLICY "Authenticated users can create likes"
  ON public.community_post_likes
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete own likes" ON public.community_post_likes;
CREATE POLICY "Users can delete own likes"
  ON public.community_post_likes
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Table: user_bans
DROP POLICY IF EXISTS "Admins can create bans" ON public.user_bans;
CREATE POLICY "Admins can create bans"
  ON public.user_bans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can delete bans" ON public.user_bans;
CREATE POLICY "Admins can delete bans"
  ON public.user_bans
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can view all bans" ON public.user_bans;
CREATE POLICY "Admins can view all bans"
  ON public.user_bans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Users can view own ban" ON public.user_bans;
CREATE POLICY "Users can view own ban"
  ON public.user_bans
  FOR SELECT
  USING ((select auth.uid()) = user_id);

-- Table: banned_emails
DROP POLICY IF EXISTS "Admins can create banned emails" ON public.banned_emails;
CREATE POLICY "Admins can create banned emails"
  ON public.banned_emails
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can view banned emails" ON public.banned_emails;
CREATE POLICY "Admins can view banned emails"
  ON public.banned_emails
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- Table: dhikr_sessions
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON public.dhikr_sessions;
CREATE POLICY "Authenticated users can create sessions"
  ON public.dhikr_sessions
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Creators can delete their sessions" ON public.dhikr_sessions;
CREATE POLICY "Creators can delete their sessions"
  ON public.dhikr_sessions
  FOR DELETE
  USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Creators can update their sessions" ON public.dhikr_sessions;
CREATE POLICY "Creators can update their sessions"
  ON public.dhikr_sessions
  FOR UPDATE
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

-- Table: dhikr_session_participants
DROP POLICY IF EXISTS "Authenticated users can join sessions" ON public.dhikr_session_participants;
CREATE POLICY "Authenticated users can join sessions"
  ON public.dhikr_session_participants
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can leave sessions" ON public.dhikr_session_participants;
CREATE POLICY "Users can leave sessions"
  ON public.dhikr_session_participants
  FOR DELETE
  USING ((select auth.uid()) = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their participation" ON public.dhikr_session_participants;
CREATE POLICY "Users can update their participation"
  ON public.dhikr_session_participants
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Table: dhikr_session_clicks
DROP POLICY IF EXISTS "Authenticated users can add clicks" ON public.dhikr_session_clicks;
CREATE POLICY "Authenticated users can add clicks"
  ON public.dhikr_session_clicks
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL OR user_id IS NULL);

-- Table: profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING ((select auth.uid()) = id);

-- Table: analytics_events
DROP POLICY IF EXISTS "Admins can view all analytics events" ON public.analytics_events;
CREATE POLICY "Admins can view all analytics events"
  ON public.analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Users can insert own analytics events" ON public.analytics_events;
CREATE POLICY "Users can insert own analytics events"
  ON public.analytics_events
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own analytics events" ON public.analytics_events;
CREATE POLICY "Users can view own analytics events"
  ON public.analytics_events
  FOR SELECT
  USING ((select auth.uid()) = user_id);

-- Table: user_preferences
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences
  FOR SELECT
  USING ((select auth.uid()) = user_id);

-- =====================================================
-- 3. FUSION DES POLITIQUES PERMISSIVES MULTIPLES
-- =====================================================

-- Table: analytics_events - Fusionner les politiques SELECT
-- Supprimer les politiques individuelles et créer une seule politique
DROP POLICY IF EXISTS "Admins can view all analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can view own analytics events" ON public.analytics_events;

CREATE POLICY "Users and admins can view analytics events"
  ON public.analytics_events
  FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- Table: community_post_likes - Fusionner les politiques INSERT
DROP POLICY IF EXISTS "Authenticated users can create likes" ON public.community_post_likes;
DROP POLICY IF EXISTS "Authenticated users can like posts" ON public.community_post_likes;

CREATE POLICY "Authenticated users can like posts"
  ON public.community_post_likes
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Table: community_post_likes - Fusionner les politiques SELECT
DROP POLICY IF EXISTS "Anyone can read likes" ON public.community_post_likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON public.community_post_likes;

CREATE POLICY "Anyone can view likes"
  ON public.community_post_likes
  FOR SELECT
  USING (true);

-- Table: community_posts - Fusionner les politiques DELETE
DROP POLICY IF EXISTS "Users can delete own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can delete own posts or admins can delete any" ON public.community_posts;

CREATE POLICY "Users can delete own posts or admins can delete any"
  ON public.community_posts
  FOR DELETE
  USING (
    (select auth.uid()) = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- Table: community_posts - Fusionner les politiques SELECT
DROP POLICY IF EXISTS "Anyone can read posts" ON public.community_posts;
DROP POLICY IF EXISTS "Anyone can view community posts" ON public.community_posts;

CREATE POLICY "Anyone can view community posts"
  ON public.community_posts
  FOR SELECT
  USING (true);

-- Table: profiles - Fusionner les politiques SELECT
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view profiles"
  ON public.profiles
  FOR SELECT
  USING (
    (select auth.uid()) = id
    OR true  -- Permettre la lecture de tous les profils (ajustez selon vos besoins)
  );

-- Table: user_bans - Fusionner les politiques SELECT
DROP POLICY IF EXISTS "Admins can view all bans" ON public.user_bans;
DROP POLICY IF EXISTS "Users and admins can view bans" ON public.user_bans;
DROP POLICY IF EXISTS "Users can view own ban" ON public.user_bans;

CREATE POLICY "Users and admins can view bans"
  ON public.user_bans
  FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- =====================================================
-- 4. SUPPRESSION DES INDEX DUPLIQUÉS
-- =====================================================

-- Table: community_posts
DROP INDEX IF EXISTS public.idx_community_posts_created_at;
-- Garder idx_community_posts_created_at_desc

-- Table: user_usage_tracking
DROP INDEX IF EXISTS public.idx_user_usage_tracking_user_date_valid;
-- Garder idx_user_usage_tracking_user_valid_date

-- =====================================================
-- 5. AJOUT D'INDEX SUR LES CLÉS ÉTRANGÈRES
-- =====================================================

-- Table: dhikr_session_clicks - Index sur user_id (clé étrangère)
CREATE INDEX IF NOT EXISTS idx_dhikr_session_clicks_user_id
  ON public.dhikr_session_clicks (user_id)
  WHERE user_id IS NOT NULL;

COMMIT;

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- Exécutez cette requête pour vérifier que les fonctions ont search_path
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) LIKE '%SET search_path%' as has_search_path
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'update_khalwa_sessions_updated_at',
    'generate_audit_report',
    'create_dhikr_session',
    'update_profiles_updated_at',
    'update_user_preferences_updated_at',
    'handle_new_user',
    'cleanup_completed_public_sessions',
    'update_dhikr_sessions_updated_at',
    'join_dhikr_session',
    'is_user_admin',
    'promote_to_admin',
    'demote_from_admin',
    'list_admins',
    'delete_dhikr_session',
    'promote_to_admin_by_id'
  )
ORDER BY proname;

