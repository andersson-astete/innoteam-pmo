-- INNOTEAM - PMO Database Schema

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#2F6BD8',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'sap',
  status TEXT DEFAULT 'active',
  start_date DATE,
  target_close_date DATE,
  phase_weights JSONB DEFAULT '{"1":15,"2":5,"3":10,"4":5,"5":10,"6":20,"7":20,"8":10,"9":5}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Deliverables table
CREATE TABLE IF NOT EXISTS deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  society_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  report_type TEXT NOT NULL,
  percentage INTEGER DEFAULT 0,
  status TEXT DEFAULT 'init',
  last_phase_reached INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  impact TEXT,
  action TEXT,
  owner TEXT,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Action items table
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Observations table
CREATE TABLE IF NOT EXISTS observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  phase_id INTEGER,
  text TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  timestamp TIMESTAMP DEFAULT NOW()
);

