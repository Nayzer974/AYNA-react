-- Table pour stocker les sessions Khalwa (Bayt An Nûr)
-- Chaque session contient les paramètres et le ressenti de l'utilisateur

CREATE TABLE IF NOT EXISTS khalwa_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intention TEXT,
  divine_name_id TEXT NOT NULL,
  divine_name_arabic TEXT NOT NULL,
  divine_name_transliteration TEXT NOT NULL,
  sound_ambiance TEXT NOT NULL,
  duration_minutes NUMERIC(10, 2) NOT NULL, -- Permet les décimales pour les secondes (ex: 0.5 = 30 secondes)
  breathing_type TEXT NOT NULL CHECK (breathing_type IN ('libre', '4-4', '3-6-9')),
  guided BOOLEAN NOT NULL DEFAULT true,
  feeling TEXT,
  completed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_khalwa_sessions_user_id ON khalwa_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_khalwa_sessions_created_at ON khalwa_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_khalwa_sessions_divine_name_id ON khalwa_sessions(divine_name_id);

-- RLS (Row Level Security) pour garantir que chaque utilisateur ne peut accéder qu'à ses propres sessions
ALTER TABLE khalwa_sessions ENABLE ROW LEVEL SECURITY;

-- Politique RLS : les utilisateurs ne peuvent voir que leurs propres sessions
DROP POLICY IF EXISTS "Users can view their own khalwa sessions" ON khalwa_sessions;
CREATE POLICY "Users can view their own khalwa sessions"
  ON khalwa_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique RLS : les utilisateurs ne peuvent insérer que leurs propres sessions
DROP POLICY IF EXISTS "Users can insert their own khalwa sessions" ON khalwa_sessions;
CREATE POLICY "Users can insert their own khalwa sessions"
  ON khalwa_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique RLS : les utilisateurs ne peuvent mettre à jour que leurs propres sessions
DROP POLICY IF EXISTS "Users can update their own khalwa sessions" ON khalwa_sessions;
CREATE POLICY "Users can update their own khalwa sessions"
  ON khalwa_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique RLS : les utilisateurs ne peuvent supprimer que leurs propres sessions
DROP POLICY IF EXISTS "Users can delete their own khalwa sessions" ON khalwa_sessions;
CREATE POLICY "Users can delete their own khalwa sessions"
  ON khalwa_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_khalwa_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_khalwa_sessions_updated_at ON khalwa_sessions;
CREATE TRIGGER update_khalwa_sessions_updated_at
  BEFORE UPDATE ON khalwa_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_khalwa_sessions_updated_at();

-- Fonction pour obtenir les statistiques d'un utilisateur
CREATE OR REPLACE FUNCTION get_khalwa_stats(p_user_id UUID)
RETURNS TABLE (
  total_sessions BIGINT,
  total_minutes BIGINT,
  avg_duration NUMERIC,
  most_used_divine_name TEXT,
  most_used_breathing_type TEXT,
  most_used_sound TEXT,
  sessions_this_week BIGINT,
  sessions_this_month BIGINT,
  longest_streak_days INTEGER
) AS $$
DECLARE
  v_total_sessions BIGINT;
  v_total_minutes BIGINT;
  v_avg_duration NUMERIC;
  v_most_used_divine_name TEXT;
  v_most_used_breathing_type TEXT;
  v_most_used_sound TEXT;
  v_sessions_this_week BIGINT;
  v_sessions_this_month BIGINT;
  v_longest_streak_days INTEGER;
BEGIN
  -- Statistiques de base
  SELECT 
    COUNT(*)::BIGINT,
    COALESCE(SUM(duration_minutes), 0)::BIGINT,
    COALESCE(AVG(duration_minutes), 0)::NUMERIC
  INTO v_total_sessions, v_total_minutes, v_avg_duration
  FROM khalwa_sessions
  WHERE user_id = p_user_id AND completed = true;

  -- Nom divin le plus utilisé
  SELECT divine_name_id INTO v_most_used_divine_name
  FROM khalwa_sessions
  WHERE user_id = p_user_id AND completed = true
  GROUP BY divine_name_id
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Type de respiration le plus utilisé
  SELECT breathing_type INTO v_most_used_breathing_type
  FROM khalwa_sessions
  WHERE user_id = p_user_id AND completed = true
  GROUP BY breathing_type
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Ambiance sonore la plus utilisée
  SELECT sound_ambiance INTO v_most_used_sound
  FROM khalwa_sessions
  WHERE user_id = p_user_id AND completed = true
  GROUP BY sound_ambiance
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Sessions cette semaine
  SELECT COUNT(*)::BIGINT INTO v_sessions_this_week
  FROM khalwa_sessions
  WHERE user_id = p_user_id 
    AND completed = true
    AND created_at >= NOW() - INTERVAL '7 days';

  -- Sessions ce mois
  SELECT COUNT(*)::BIGINT INTO v_sessions_this_month
  FROM khalwa_sessions
  WHERE user_id = p_user_id 
    AND completed = true
    AND created_at >= NOW() - INTERVAL '30 days';

  -- Calcul de la série (simplifié)
  WITH daily_sessions AS (
    SELECT DISTINCT DATE(created_at) as session_date
    FROM khalwa_sessions
    WHERE user_id = p_user_id AND completed = true
    ORDER BY DATE(created_at) DESC
  ),
  streak_calc AS (
    SELECT 
      session_date,
      session_date - ROW_NUMBER() OVER (ORDER BY session_date DESC)::INTEGER * INTERVAL '1 day' as grp
    FROM daily_sessions
  )
  SELECT COALESCE(MAX(cnt), 0)::INTEGER INTO v_longest_streak_days
  FROM (
    SELECT COUNT(*) as cnt
    FROM streak_calc
    GROUP BY grp
  ) sub;

  -- Retourner les résultats
  RETURN QUERY SELECT
    COALESCE(v_total_sessions, 0),
    COALESCE(v_total_minutes, 0),
    COALESCE(v_avg_duration, 0),
    COALESCE(v_most_used_divine_name, ''),
    COALESCE(v_most_used_breathing_type, ''),
    COALESCE(v_most_used_sound, ''),
    COALESCE(v_sessions_this_week, 0),
    COALESCE(v_sessions_this_month, 0),
    COALESCE(v_longest_streak_days, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

