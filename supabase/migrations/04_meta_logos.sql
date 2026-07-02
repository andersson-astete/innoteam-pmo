-- INNOTEAM - PMO · Metadata de equipo, logos y settings globales

-- Equipo del proyecto
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pm TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS functional_team JSONB DEFAULT '[]'; -- [{name}]
ALTER TABLE projects ADD COLUMN IF NOT EXISTS technical_team JSONB DEFAULT '[]';  -- [{name}]

-- Settings globales (una sola fila)
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  innoteam_logo_url TEXT,
  org_name TEXT DEFAULT 'InnoTeam',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO settings (id, org_name) VALUES (1, 'InnoTeam') ON CONFLICT (id) DO NOTHING;

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS read_settings ON settings;
CREATE POLICY read_settings ON settings FOR SELECT USING (true);
