import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ---------- Tipos del modelo real ----------
export type Status = 'init' | 'proc' | 'testing' | 'go' | 'client'

export interface Phase {
  name: string
  weight: number
  hasDate?: boolean
}
export interface ReportType {
  code: string
  name: string
}
export type Stage = 'inicio' | 'desarrollo' | 'uat' | 'produccion' | 'cerrado'
export interface KeyUser {
  name: string
  role: string
}
export interface PhaseState {
  done: boolean
  date: string | null
}
export interface Project {
  id: string
  name: string
  subtitle: string | null
  client_logo_url: string | null
  brand_color: string
  phases: Phase[]
  report_types: ReportType[]
  sponsor: string | null
  project_lead: string | null
  user_lead: string | null
  stage: Stage
  stage_order: number
  created_at: string
  updated_at: string
}
export interface Country {
  id: string
  project_id: string
  code: string
  name: string
  short_name: string | null
  sort_order: number
  key_users: KeyUser[]
  lead: string | null
}
export interface Society {
  id: string
  project_id: string
  country_id: string
  name: string
  sort_order: number
}
export interface Deliverable {
  id: string
  society_id: string
  report_code: string
  code: string | null
  last_phase: number
  percentage: number
  status: Status
  observation: string | null
  phase_states: PhaseState[]
  updated_at: string
}
export interface Alert {
  id: string
  project_id: string
  country_code: string
  severity: string
  title: string
  impact: string | null
  action: string | null
  owner: string | null
  due: string | null
  sort_order: number
}
export interface Step {
  id: string
  project_id: string
  title: string
  description: string | null
  owner: string | null
  due: string | null
  sort_order: number
}

// Datos completos de un proyecto para armar el reporte
export interface ProjectData {
  project: Project
  countries: Country[]
  societies: Society[]
  deliverables: Deliverable[]
  alerts: Alert[]
  steps: Step[]
}

// Fila plana de entregable enriquecida (país + sociedad) para los cálculos del reporte
export interface FlatDeliverable {
  id: string
  society_id: string
  soc: string // nombre sociedad
  f: string // código país
  rep: string // report_code
  code: string // código documento (LI10…)
  last: number
  pct: number
  est: Status
  obs: string
  phase_states: PhaseState[]
}

// ---------- Lecturas ----------
export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []) as Project[]
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).single()
  if (error) return null
  return data as Project
}

export async function getProjectData(projectId: string): Promise<ProjectData | null> {
  const project = await getProject(projectId)
  if (!project) return null

  const [{ data: countries }, { data: societies }, { data: alerts }, { data: steps }] =
    await Promise.all([
      supabase.from('countries').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('societies').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('alerts').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('steps').select('*').eq('project_id', projectId).order('sort_order'),
    ])

  const socIds = (societies || []).map((s) => s.id)
  let deliverables: Deliverable[] = []
  if (socIds.length) {
    const { data: dels } = await supabase
      .from('deliverables')
      .select('*')
      .in('society_id', socIds)
    deliverables = (dels || []) as Deliverable[]
  }

  return {
    project,
    countries: (countries || []) as Country[],
    societies: (societies || []) as Society[],
    deliverables,
    alerts: (alerts || []) as Alert[],
    steps: (steps || []) as Step[],
  }
}

// Aplana entregables + sociedad + país para alimentar los cálculos del reporte
export function flattenDeliverables(data: ProjectData): FlatDeliverable[] {
  const socById = new Map(data.societies.map((s) => [s.id, s]))
  const countryById = new Map(data.countries.map((c) => [c.id, c]))
  return data.deliverables.map((d) => {
    const soc = socById.get(d.society_id)
    const country = soc ? countryById.get(soc.country_id) : undefined
    return {
      id: d.id,
      society_id: d.society_id,
      soc: soc?.name || '—',
      f: country?.code || '—',
      rep: d.report_code,
      code: d.code || '',
      last: d.last_phase,
      pct: d.percentage,
      est: d.status,
      obs: d.observation || '',
      phase_states: d.phase_states || [],
    }
  })
}
