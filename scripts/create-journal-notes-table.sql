-- Table pour stocker les notes de journal
-- Permet la synchronisation entre appareils et la suppression définitive

CREATE TABLE IF NOT EXISTS journal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_journal_notes_user_id ON journal_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_notes_created_at ON journal_notes(created_at DESC);

-- RLS (Row Level Security) pour garantir que chaque utilisateur ne peut accéder qu'à ses propres notes
ALTER TABLE journal_notes ENABLE ROW LEVEL SECURITY;

-- Politique RLS : les utilisateurs ne peuvent voir que leurs propres notes
DROP POLICY IF EXISTS "Users can view their own journal notes" ON journal_notes;
CREATE POLICY "Users can view their own journal notes"
  ON journal_notes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique RLS : les utilisateurs ne peuvent insérer que leurs propres notes
DROP POLICY IF EXISTS "Users can insert their own journal notes" ON journal_notes;
CREATE POLICY "Users can insert their own journal notes"
  ON journal_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique RLS : les utilisateurs ne peuvent mettre à jour que leurs propres notes
DROP POLICY IF EXISTS "Users can update their own journal notes" ON journal_notes;
CREATE POLICY "Users can update their own journal notes"
  ON journal_notes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique RLS : les utilisateurs ne peuvent supprimer que leurs propres notes
DROP POLICY IF EXISTS "Users can delete their own journal notes" ON journal_notes;
CREATE POLICY "Users can delete their own journal notes"
  ON journal_notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_journal_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_journal_notes_updated_at ON journal_notes;
CREATE TRIGGER trigger_update_journal_notes_updated_at
  BEFORE UPDATE ON journal_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_notes_updated_at();

-- Commentaire
COMMENT ON TABLE journal_notes IS 'Table pour stocker les notes de journal des utilisateurs';




