-- INNOTEAM - PMO · Modelo real: Proyecto -> Países -> Sociedades -> Entregables
-- Reemplaza el esquema genérico inicial.

-- Drop del esquema genérico anterior
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS observations CASCADE;
DROP TABLE IF EXISTS action_items CASCADE;
DROP TABLE IF EXISTS phase_checkpoints CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS deliverables CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- ============ Proyectos (cliente) ============
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                       -- cliente, p.ej. "ISM"
  subtitle TEXT,                            -- p.ej. "InnoTeam × ISM — Reportes SAP"
  client_logo_url TEXT,
  brand_color TEXT DEFAULT '#2F6BD8',
  phases JSONB NOT NULL DEFAULT '[]',       -- [{ "name": "...", "weight": 15 }]
  report_types JSONB NOT NULL DEFAULT '[]', -- [{ "code": "BG", "name": "Balance General" }]
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ Países ============
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL,                        -- RD1, PERU, RD2, URU, GUA, HAI
  name TEXT NOT NULL,                        -- nombre largo
  short_name TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ Sociedades ============
CREATE TABLE societies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ Entregables ============
CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  report_code TEXT NOT NULL,                 -- BG | DRE | FF | ...
  last_phase INT DEFAULT -1,                 -- índice de última fase alcanzada (-1 = sin iniciar)
  percentage INT DEFAULT 0,
  status TEXT DEFAULT 'init',                -- init | proc | testing | go | client
  observation TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ Alertas ============
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  country_code TEXT DEFAULT 'all',
  severity TEXT NOT NULL,                    -- Alta | Media | Baja | Gestión
  title TEXT NOT NULL,
  impact TEXT,
  action TEXT,
  owner TEXT,
  due TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ Próximos pasos ============
CREATE TABLE steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  due TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ Índices ============
CREATE INDEX idx_countries_project ON countries(project_id);
CREATE INDEX idx_societies_project ON societies(project_id);
CREATE INDEX idx_societies_country ON societies(country_id);
CREATE INDEX idx_deliverables_society ON deliverables(society_id);
CREATE INDEX idx_alerts_project ON alerts(project_id);
CREATE INDEX idx_steps_project ON steps(project_id);

-- ============ RLS ============
-- Herramienta interna: lectura pública; escritura vía route handlers con service key (bypass RLS).
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY read_projects     ON projects     FOR SELECT USING (true);
CREATE POLICY read_countries    ON countries    FOR SELECT USING (true);
CREATE POLICY read_societies    ON societies    FOR SELECT USING (true);
CREATE POLICY read_deliverables ON deliverables FOR SELECT USING (true);
CREATE POLICY read_alerts       ON alerts       FOR SELECT USING (true);
CREATE POLICY read_steps        ON steps        FOR SELECT USING (true);
