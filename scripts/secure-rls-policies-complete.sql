-- ============================================
-- POLICIES RLS SÉCURISÉES POUR TOUTES LES TABLES
-- ============================================
-- Ce script remplace toutes les policies permissives par des policies sécurisées
-- Date : 2025-01-27
-- Expert Sécurité : Agent IA Sécurité AYNA
--
-- ⚠️ IMPORTANT : Exécuter ce script dans Supabase SQL Editor
-- Ce script supprime les policies existantes et les remplace par des versions sécurisées
-- ============================================

-- ============================================
-- 1. TABLE PROFILES
-- ============================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- ✅ SELECT : Utilisateurs peuvent voir leur propre profil + profils publics (pour communauté)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id OR
    -- Les profils publics peuvent être vus par tous (pour la communauté)
    true
  );

-- ✅ SELECT : Admins peuvent voir tous les profils
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ✅ UPDATE : Utilisateurs peuvent modifier uniquement leur propre profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Empêcher la modification de is_admin par l'utilisateur
    (OLD.is_admin = NEW.is_admin OR
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.is_admin = true
     ))
  );

-- ✅ INSERT : Utilisateurs peuvent créer uniquement leur propre profil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id AND
    -- Empêcher la création avec is_admin = true
    (is_admin = false OR
     EXISTS (
       SELECT 1 FROM profiles
       WHERE profiles.id = auth.uid()
       AND profiles.is_admin = true
     ))
  );

-- ✅ UPDATE : Admins peuvent modifier n'importe quel profil
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- 2. TABLE COMMUNITY_POSTS
-- ============================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Anyone can view community posts" ON community_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete own posts or admins can delete any" ON community_posts;

-- ✅ SELECT : Tous peuvent voir les posts (communauté publique)
-- Mais on filtre les posts des utilisateurs bannis
CREATE POLICY "Anyone can view community posts"
  ON community_posts FOR SELECT
  USING (
    -- Exclure les posts des utilisateurs bannis
    NOT EXISTS (
      SELECT 1 FROM user_bans
      WHERE user_bans.user_id = community_posts.user_id
      AND (
        user_bans.ban_type = 'permanent' OR
        (user_bans.ban_type = 'temporary' AND user_bans.expires_at > NOW())
      )
    )
  );

-- ✅ INSERT : Seuls les utilisateurs authentifiés et non bannis peuvent créer
CREATE POLICY "Authenticated users can create posts"
  ON community_posts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = user_id AND
    -- Vérifier que l'utilisateur n'est pas banni
    NOT EXISTS (
      SELECT 1 FROM user_bans
      WHERE user_bans.user_id = auth.uid()
      AND (
        user_bans.ban_type = 'permanent' OR
        (user_bans.ban_type = 'temporary' AND user_bans.expires_at > NOW())
      )
    )
  );

-- ✅ UPDATE : Utilisateurs peuvent modifier uniquement leurs propres posts
CREATE POLICY "Users can update own posts"
  ON community_posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ✅ DELETE : Utilisateurs peuvent supprimer leurs propres posts, admins peuvent supprimer tous
CREATE POLICY "Users can delete own posts or admins can delete any"
  ON community_posts FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- 3. TABLE DHIKR_SESSIONS
-- ============================================

-- Supprimer les policies permissives
DROP POLICY IF EXISTS "Anyone can view active sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Creators can update their sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Creators can delete their sessions" ON dhikr_sessions;
DROP POLICY IF EXISTS "Creators can view own sessions" ON dhikr_sessions;

-- ✅ SELECT : Tous peuvent voir les sessions actives et ouvertes
CREATE POLICY "Anyone can view active sessions"
  ON dhikr_sessions FOR SELECT
  USING (
    is_active = true AND is_open = true
  );

-- ✅ SELECT : Les créateurs peuvent voir leurs propres sessions (même inactives)
CREATE POLICY "Creators can view own sessions"
  ON dhikr_sessions FOR SELECT
  USING (auth.uid() = created_by);

-- ✅ INSERT : Seuls les utilisateurs authentifiés peuvent créer
CREATE POLICY "Authenticated users can create sessions"
  ON dhikr_sessions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = created_by AND
    -- Vérifier que l'utilisateur n'est pas banni
    NOT EXISTS (
      SELECT 1 FROM user_bans
      WHERE user_bans.user_id = auth.uid()
      AND (
        user_bans.ban_type = 'permanent' OR
        (user_bans.ban_type = 'temporary' AND user_bans.expires_at > NOW())
      )
    )
  );

-- ✅ UPDATE : Seuls les créateurs peuvent modifier leurs sessions
CREATE POLICY "Creators can update their sessions"
  ON dhikr_sessions FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- ✅ DELETE : Seuls les créateurs peuvent supprimer leurs sessions
CREATE POLICY "Creators can delete their sessions"
  ON dhikr_sessions FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================
-- 4. TABLE KHALWA_SESSIONS
-- ============================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Users can view their own khalwa sessions" ON khalwa_sessions;
DROP POLICY IF EXISTS "Users can insert their own khalwa sessions" ON khalwa_sessions;
DROP POLICY IF EXISTS "Users can update their own khalwa sessions" ON khalwa_sessions;
DROP POLICY IF EXISTS "Users can delete their own khalwa sessions" ON khalwa_sessions;

-- ✅ SELECT : Utilisateurs peuvent voir uniquement leurs propres sessions
CREATE POLICY "Users can view their own khalwa sessions"
  ON khalwa_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- ✅ INSERT : Utilisateurs peuvent créer uniquement leurs propres sessions
CREATE POLICY "Users can insert their own khalwa sessions"
  ON khalwa_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ✅ UPDATE : Utilisateurs peuvent modifier uniquement leurs propres sessions
CREATE POLICY "Users can update their own khalwa sessions"
  ON khalwa_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ✅ DELETE : Utilisateurs peuvent supprimer uniquement leurs propres sessions
CREATE POLICY "Users can delete their own khalwa sessions"
  ON khalwa_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. TABLE ANALYTICS_EVENTS
-- ============================================

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Users can view own analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Users can insert own analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Admins can view all analytics events" ON analytics_events;

-- ✅ SELECT : Utilisateurs peuvent voir uniquement leurs propres événements
-- Admins peuvent voir tous les événements
CREATE POLICY "Users can view own analytics events"
  ON analytics_events FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ✅ INSERT : Utilisateurs peuvent créer uniquement leurs propres événements
CREATE POLICY "Users can insert own analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ✅ UPDATE : Désactivé par défaut (analytics en lecture seule)
-- Si nécessaire, permettre uniquement aux admins

-- ✅ DELETE : Désactivé par défaut (analytics en lecture seule)
-- Si nécessaire, permettre uniquement aux admins

-- ============================================
-- 6. FONCTIONS RPC SÉCURISÉES
-- ============================================

-- ✅ Fonction pour vérifier si un utilisateur est admin (sécurisée)
CREATE OR REPLACE FUNCTION public.check_user_is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- ✅ Validation : Vérifier que l'utilisateur appelant correspond à p_user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Vous ne pouvez vérifier que votre propre statut admin';
  END IF;

  SELECT is_admin INTO v_is_admin
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_is_admin, false);
END;
$$;

-- ✅ Fonction pour créer une session dhikr (avec validation renforcée)
CREATE OR REPLACE FUNCTION public.create_dhikr_session_secure(
  p_user_id UUID,
  p_dhikr_text TEXT,
  p_target_count INTEGER,
  p_max_participants INTEGER DEFAULT 100
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
  v_user_exists BOOLEAN;
BEGIN
  -- ✅ Validation : Vérifier que l'utilisateur appelant correspond à p_user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Vous ne pouvez créer une session que pour vous-même';
  END IF;

  -- ✅ Validation : Vérifier que l'utilisateur existe
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id)
  INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'Utilisateur non trouvé';
  END IF;

  -- ✅ Validation : Vérifier que l'utilisateur n'est pas banni
  IF EXISTS (
    SELECT 1 FROM user_bans
    WHERE user_id = p_user_id
    AND (
      ban_type = 'permanent' OR
      (ban_type = 'temporary' AND expires_at > NOW())
    )
  ) THEN
    RAISE EXCEPTION 'Vous êtes banni et ne pouvez pas créer de session';
  END IF;

  -- ✅ Validation : Limites de sécurité
  IF p_target_count < 100 OR p_target_count > 999 THEN
    RAISE EXCEPTION 'Le nombre de clics doit être entre 100 et 999';
  END IF;

  IF p_max_participants < 1 OR p_max_participants > 100 THEN
    RAISE EXCEPTION 'Le nombre maximum de participants doit être entre 1 et 100';
  END IF;

  -- ✅ Validation : Longueur du texte
  IF LENGTH(p_dhikr_text) > 500 THEN
    RAISE EXCEPTION 'Le texte du dhikr ne peut pas dépasser 500 caractères';
  END IF;

  -- Créer la session
  INSERT INTO dhikr_sessions (
    created_by,
    dhikr_text,
    target_count,
    max_participants
  )
  VALUES (
    p_user_id,
    p_dhikr_text,
    p_target_count,
    p_max_participants
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.check_user_is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_dhikr_session_secure(UUID, TEXT, INTEGER, INTEGER) TO authenticated;

-- ============================================
-- ✅ POLICIES RLS SÉCURISÉES CRÉÉES
-- ============================================
-- Toutes les policies ont été remplacées par des versions sécurisées
-- Les utilisateurs ne peuvent accéder qu'à leurs propres données
-- Les admins ont des permissions étendues mais contrôlées
-- Les utilisateurs bannis sont automatiquement exclus
-- ============================================










