-- Optional mod author (Nexus Mods profile): URL, display name, avatar URL
ALTER TABLE insights
  ADD COLUMN IF NOT EXISTS mod_author_url text,
  ADD COLUMN IF NOT EXISTS mod_author_name text,
  ADD COLUMN IF NOT EXISTS mod_author_avatar_url text;
