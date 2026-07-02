-- INNOTEAM - PMO Database Schema
-- Execute this on Supabase SQL Editor

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#2F6BD8',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'sap', -- sap, odoo, custom
  status TEXT DEFAULT 'active', -- active, completed, on_hold
  start_date DATE,
  target_close_date DATE,
  phase_weights JSONB DEFAULT '{"1":15,"2":5,"3":10,"4":5,"5":10,"6":20,"7":20,"8":10,"9":5}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Deliverables table
CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  society_name TEXT NOT NULL,
  country TEXT NOT NULL,
  report_type TEXT NOT NULL, -- BG, DRE, FF, custom
  percentage INTEGER DEFAULT 0,
  status TEXT DEFAULT 'init', -- init, proc, testing, go, client
  last_phase_reached INTEGER DEFAULT -1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Phase checkpoints table
CREATE TABLE phase_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  phase_id INTEGER NOT NULL,
  completed_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  severity TEXT NOT NULL, -- baja, media, alta
  title TEXT NOT NULL,
  impact TEXT,
  action TEXT,
  owner TEXT,
  due_date DATE,
  status TEXT DEFAULT 'open', -- open, resolved, closed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Action items table
CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending', -- pending, in_progress, done
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Observations table
CREATE TABLE observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  phase_id INTEGER,
  text TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- create, update, delete
  entity_type TEXT NOT NULL, -- deliverable, alert, action_item, etc
  entity_id UUID,
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_deliverables_project_id ON deliverables(project_id);
CREATE INDEX idx_alerts_project_id ON alerts(project_id);
CREATE INDEX idx_action_items_project_id ON action_items(project_id);
CREATE INDEX idx_observations_deliverable_id ON observations(deliverable_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);

-- Enable RLS (Row Level Security) for tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - adjust as needed)
-- Allow authenticated users to view all data for now
CREATE POLICY "Allow read all" ON companies FOR SELECT USING (TRUE);
CREATE POLICY "Allow read all" ON projects FOR SELECT USING (TRUE);
CREATE POLICY "Allow read all" ON deliverables FOR SELECT USING (TRUE);
CREATE POLICY "Allow read all" ON alerts FOR SELECT USING (TRUE);
CREATE POLICY "Allow read all" ON action_items FOR SELECT USING (TRUE);
CREATE POLICY "Allow read all" ON observations FOR SELECT USING (TRUE);

-- Allow authenticated users to insert/update/delete with user_id
CREATE POLICY "Allow insert all" ON deliverables FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow update all" ON deliverables FOR UPDATE USING (TRUE);
CREATE POLICY "Allow insert all" ON alerts FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow update all" ON alerts FOR UPDATE USING (TRUE);
CREATE POLICY "Allow insert all" ON action_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Allow update all" ON action_items FOR UPDATE USING (TRUE);

-- Note: Adjust RLS policies based on your actual role-based access control requirements
