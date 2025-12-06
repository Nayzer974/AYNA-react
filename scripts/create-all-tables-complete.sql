-- Script SQL complet pour créer toutes les tables nécessaires
-- À exécuter dans Supabase SQL Editor
-- Ce script crée toutes les tables manquantes pour l'application mobile

-- ============================================
-- 1. TABLE PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar TEXT,
  avatar_url TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  location JSONB,
  theme TEXT DEFAULT 'default' CHECK (theme IN ('default', 'ocean', 'sunset', 'forest', 'royal')),
  is_admin BOOLEAN DEFAULT false,
  push_token TEXT,
  challenge_40_days JSONB,
  journal_entries JSONB,
  analytics JSONB DEFAULT '{"totalDhikr": 0, "totalNotes": 0, "streak": 0, "lastActive": ""}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- RLS pour profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes avant de les recréer
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Politique: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Politique: Les utilisateurs peuvent voir tous les profils (pour la communauté)
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

-- Politique: Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique: Les utilisateurs peuvent insérer leur propre profil
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- ============================================
-- 2. TABLE ANALYTICS_EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- RLS pour analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes avant de les recréer
DROP POLICY IF EXISTS "Users can view own analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Users can insert own analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Admins can view all analytics events" ON analytics_events;

-- Politique: Les utilisateurs peuvent voir leurs propres événements
CREATE POLICY "Users can view own analytics events"
  ON analytics_events FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent insérer leurs propres événements
CREATE POLICY "Users can insert own analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les admins peuvent voir tous les événements
CREATE POLICY "Admins can view all analytics events"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- 3. TABLE USER_PREFERENCES
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes avant de les recréer
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;

-- Politique: Les utilisateurs peuvent voir leurs propres préférences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent modifier leurs propres préférences
CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent insérer leurs propres préférences
CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- ============================================
-- 4. TABLE COMMUNITY_POSTS (si elle n'existe pas)
-- ============================================
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  text TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour community_posts
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);

-- RLS pour community_posts
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes avant de les recréer
DROP POLICY IF EXISTS "Anyone can view community posts" ON community_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete own posts or admins can delete any" ON community_posts;

-- Politique: Tous les utilisateurs peuvent voir les posts
CREATE POLICY "Anyone can view community posts"
  ON community_posts FOR SELECT
  USING (true);

-- Politique: Les utilisateurs authentifiés peuvent créer des posts
CREATE POLICY "Authenticated users can create posts"
  ON community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent modifier leurs propres posts
CREATE POLICY "Users can update own posts"
  ON community_posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leurs propres posts ou les admins peuvent supprimer tous
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
-- 5. TABLE COMMUNITY_POST_LIKES (si elle n'existe pas)
-- ============================================
CREATE TABLE IF NOT EXISTS community_post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Index pour community_post_likes
CREATE INDEX IF NOT EXISTS idx_community_post_likes_post_id ON community_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_user_id ON community_post_likes(user_id);

-- RLS pour community_post_likes
ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes avant de les recréer
DROP POLICY IF EXISTS "Anyone can view likes" ON community_post_likes;
DROP POLICY IF EXISTS "Authenticated users can create likes" ON community_post_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON community_post_likes;

-- Politique: Tous les utilisateurs peuvent voir les likes
CREATE POLICY "Anyone can view likes"
  ON community_post_likes FOR SELECT
  USING (true);

-- Politique: Les utilisateurs authentifiés peuvent créer des likes
CREATE POLICY "Authenticated users can create likes"
  ON community_post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leurs propres likes
CREATE POLICY "Users can delete own likes"
  ON community_post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. TABLE USER_BANS (si elle n'existe pas)
-- ============================================
CREATE TABLE IF NOT EXISTS user_bans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  ban_type TEXT NOT NULL CHECK (ban_type IN ('temporary', 'permanent')),
  duration_minutes INTEGER,
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  banned_by UUID REFERENCES auth.users(id) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour user_bans
CREATE INDEX IF NOT EXISTS idx_user_bans_user_id ON user_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_expires_at ON user_bans(expires_at);

-- RLS pour user_bans
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes avant de les recréer
DROP POLICY IF EXISTS "Admins can view all bans" ON user_bans;
DROP POLICY IF EXISTS "Users can view own ban" ON user_bans;
DROP POLICY IF EXISTS "Admins can create bans" ON user_bans;
DROP POLICY IF EXISTS "Admins can delete bans" ON user_bans;

-- Politique: Les admins peuvent voir tous les bans
CREATE POLICY "Admins can view all bans"
  ON user_bans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Politique: Les utilisateurs peuvent voir leur propre ban
CREATE POLICY "Users can view own ban"
  ON user_bans FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: Seuls les admins peuvent créer des bans
CREATE POLICY "Admins can create bans"
  ON user_bans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Politique: Seuls les admins peuvent supprimer des bans
CREATE POLICY "Admins can delete bans"
  ON user_bans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- 7. TABLE BANNED_EMAILS (si elle n'existe pas)
-- ============================================
CREATE TABLE IF NOT EXISTS banned_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  banned_by UUID REFERENCES auth.users(id) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour banned_emails
ALTER TABLE banned_emails ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes avant de les recréer
DROP POLICY IF EXISTS "Admins can view banned emails" ON banned_emails;
DROP POLICY IF EXISTS "Admins can create banned emails" ON banned_emails;

-- Politique: Seuls les admins peuvent voir les emails bannis
CREATE POLICY "Admins can view banned emails"
  ON banned_emails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Politique: Seuls les admins peuvent créer des emails bannis
CREATE POLICY "Admins can create banned emails"
  ON banned_emails FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- 8. FONCTION POUR CRÉER UN PROFIL AUTOMATIQUEMENT
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar, theme, analytics)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_id', NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    COALESCE(NEW.raw_user_meta_data->>'theme', 'default'),
    '{"totalDhikr": 0, "totalNotes": 0, "streak": 0, "lastActive": ""}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil quand un utilisateur s'inscrit
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- COMMENTAIRES
-- ============================================
COMMENT ON TABLE profiles IS 'Table des profils utilisateur';
COMMENT ON TABLE analytics_events IS 'Table pour stocker les événements analytics';
COMMENT ON TABLE user_preferences IS 'Table pour stocker les préférences personnalisées';
COMMENT ON TABLE community_posts IS 'Table pour les publications de la communauté';
COMMENT ON TABLE community_post_likes IS 'Table pour les likes des publications';
COMMENT ON TABLE user_bans IS 'Table pour les bannissements d''utilisateurs';
COMMENT ON TABLE banned_emails IS 'Table pour les emails bannis';

