-- Store LLM-suggested theme so the board can show "Suggested: Mod installation" badge.
-- When user drags card to a column, we update theme_id and can clear this.
ALTER TABLE insights
  ADD COLUMN IF NOT EXISTS suggested_theme_id uuid REFERENCES themes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_insights_suggested_theme_id ON insights(suggested_theme_id);
