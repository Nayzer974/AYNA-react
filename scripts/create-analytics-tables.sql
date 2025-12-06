-- Script SQL pour créer les tables nécessaires aux nouvelles fonctionnalités
-- À exécuter dans Supabase SQL Editor

-- Table pour les événements analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Table pour les préférences utilisateur
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies pour analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres événements
CREATE POLICY "Users can view their own analytics events"
  ON analytics_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent insérer leurs propres événements
CREATE POLICY "Users can insert their own analytics events"
  ON analytics_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les admins peuvent voir tous les événements
CREATE POLICY "Admins can view all analytics events"
  ON analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- RLS Policies pour user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres préférences
CREATE POLICY "Users can view their own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent modifier leurs propres préférences
CREATE POLICY "Users can update their own preferences"
  ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent insérer leurs propres préférences
CREATE POLICY "Users can insert their own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Ajouter la colonne push_token à la table profiles si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'push_token'
  ) THEN
    ALTER TABLE profiles ADD COLUMN push_token TEXT;
  END IF;
END $$;

-- Commentaires
COMMENT ON TABLE analytics_events IS 'Table pour stocker les événements analytics des utilisateurs';
COMMENT ON TABLE user_preferences IS 'Table pour stocker les préférences personnalisées des utilisateurs';
COMMENT ON COLUMN profiles.push_token IS 'Token pour les notifications push';


