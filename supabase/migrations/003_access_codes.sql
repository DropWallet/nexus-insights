-- Access codes for session-based auth (no Supabase Auth).
-- One code can be shared; we only record that someone used a valid code.

CREATE TABLE access_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  label text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_access_codes_code ON access_codes(code);

-- Seed one code for initial access (change in production)
INSERT INTO access_codes (code, label) VALUES
  ('nexus-insights-2025', 'Default access code');
