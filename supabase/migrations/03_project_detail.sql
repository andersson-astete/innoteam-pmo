-- INNOTEAM - PMO · Detalle de proyecto: metadata, etapa Kanban, fases fechadas
-- Amplía el modelo real con la info del Excel de seguimiento.

-- Proyecto: sponsor, líderes, etapa (Kanban)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sponsor TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_lead TEXT;    -- líder InnoTeam
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_lead TEXT;       -- líder usuario (cliente)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'inicio'; -- inicio|desarrollo|uat|produccion|cerrado
ALTER TABLE projects ADD COLUMN IF NOT EXISTS stage_order INT DEFAULT 0;

-- País: usuarios clave + líder usuario del país
ALTER TABLE countries ADD COLUMN IF NOT EXISTS key_users JSONB DEFAULT '[]'; -- [{name, role}]
ALTER TABLE countries ADD COLUMN IF NOT EXISTS lead TEXT;

-- Entregable: código (LI10…) + estado por fase (checkbox + fecha)
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE deliverables ADD COLUMN IF NOT EXISTS phase_states JSONB DEFAULT '[]'; -- [{done: bool, date: text|null}]
