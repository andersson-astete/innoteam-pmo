// Seed del proyecto ISM (plantilla llena) con la estructura del Excel de seguimiento.
// Fases fechadas, códigos LI10/LI20/LI30, metadata y usuarios clave. Uso: node scripts/seed-ism.mjs
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan envs de Supabase')
  process.exit(1)
}
const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// ---- Fases (del Excel) con peso y si llevan fecha ----
const PHASES = [
  { name: 'Levantamiento de Información', weight: 8, hasDate: true },
  { name: 'Información Recepcionada', weight: 7, hasDate: true },
  { name: 'Cierre de Alcance', weight: 5, hasDate: true },
  { name: 'Elaboración BBP', weight: 8, hasDate: false },
  { name: 'Aprobación BBP', weight: 7, hasDate: true },
  { name: 'Elaboración EF', weight: 8, hasDate: false },
  { name: 'Pruebas Unitarias QA5', weight: 10, hasDate: false },
  { name: 'Show and Tell', weight: 5, hasDate: true },
  { name: 'Pruebas Integrales UAT', weight: 15, hasDate: true },
  { name: 'Observaciones en QAS', weight: 7, hasDate: false },
  { name: 'Guía de Usuario', weight: 5, hasDate: false },
  { name: 'Pase a PRD', weight: 8, hasDate: true },
  { name: 'Soporte Post Implementación', weight: 4, hasDate: true },
  { name: 'Cierre de Proyecto', weight: 3, hasDate: true },
]
const REPORT_TYPES = [
  { code: 'BG', name: 'Balance General' },
  { code: 'DRE', name: 'Estado de Resultados' },
  { code: 'FF', name: 'Flujo de Fondos' },
]
const CODE_BY_REPORT = { BG: 'LI10', DRE: 'LI20', FF: 'LI30' }

// ---- Cálculos (mismos que src/lib/report.ts) ----
const totalW = PHASES.reduce((a, p) => a + p.weight, 0)
function computePct(states) {
  const done = PHASES.reduce((a, p, i) => a + (states[i]?.done ? p.weight : 0), 0)
  return Math.round((done / totalW) * 100)
}
function lastDone(states) {
  let l = -1
  states.forEach((s, i) => { if (s?.done) l = i })
  return l
}
function deriveStatus(states) {
  const last = lastDone(states)
  if (last < 0) return 'init'
  const idx = (n) => PHASES.findIndex((p) => p.name.toLowerCase().includes(n))
  if (idx('prd') >= 0 && last >= idx('prd')) return 'go'
  if (idx('uat') >= 0 && last >= idx('uat')) return 'testing'
  if (idx('show') >= 0 && last >= idx('show')) return 'client'
  if (idx('bbp') >= 0 && last >= idx('bbp')) return 'proc'
  return 'init'
}
// Construye phase_states: done contiguo hasta `reached`; regla Cierre de Alcance (idx2) si Info(idx1) done; fecha UAT opcional
function buildStates(reached, uatDate) {
  const states = PHASES.map((_, i) => ({ done: i <= reached, date: null }))
  if (states[1]?.done) states[2].done = true
  if (uatDate) states[8].date = uatDate
  return states
}

// ---- Países ----
const COUNTRIES = [
  ['RD1', 'RD1 · Rep. Dominicana', 'RD1'],
  ['PERU', 'Perú', 'Perú'],
  ['RD2', 'RD2 · Rep. Dominicana', 'RD2'],
  ['URU', 'Uruguay', 'Uruguay'],
  ['GUA', 'Guatemala', 'Guatemala'],
  ['HAI', 'Haití', 'Haití'],
]

// ---- Sociedades: reached por reporte (BG/DRE/FF), fecha UAT, observación ----
// r: reached por defecto (BG=DRE=FF); rr: override por reporte
const SOCIETIES = [
  { pais: 'RD1', name: 'SAN MIGUEL DEL CARIBE S.A.', r: 7, uat: '2026-04-17', obs: 'UAT enviado (17-Abr). En pruebas integrales del cliente' },
  { pais: 'PERU', name: 'SAN MIGUEL DEL SUR S.A.C (Embotelladora)', r: 5, obs: 'Pruebas unitarias por confirmar · Show and Tell pendiente' },
  { pais: 'PERU', name: 'Cynkat (Distribuidora)', r: 5, obs: 'Pruebas unitarias por confirmar' },
  { pais: 'PERU', name: 'G&A (Distribuidora)', r: 5, obs: 'Pruebas unitarias por confirmar' },
  { pais: 'PERU', name: 'Silver (Distribuidora)', r: 5, obs: 'Pruebas unitarias por confirmar' },
  { pais: 'RD2', name: 'DANANE', r: 7, uat: '2026-07-01', obs: 'UAT enviado · Ramón agendará reunión 02/07 para subsanaciones' },
  { pais: 'RD2', name: 'TERRASSA', r: 7, uat: '2026-07-01', obs: 'UAT enviado · sesión con cliente pendiente' },
  { pais: 'RD2', name: 'ISMC', r: 7, uat: '2026-07-01', obs: 'UAT enviado · sesión con cliente pendiente' },
  { pais: 'RD2', name: 'PROCYON', r: 7, uat: '2026-07-01', obs: 'UAT enviado · sesión con cliente pendiente' },
  { pais: 'URU', name: 'TAMALFI', r: 3, rr: { FF: -1 }, obs: 'BBP en borrador · FF sin iniciar (levantamiento pendiente)' },
  { pais: 'GUA', name: 'Embotelladoras Latas (A200)', r: 1, rr: { DRE: 0, FF: -1 }, obs: 'Balance recepcionado · alta complejidad' },
  { pais: 'GUA', name: 'Embotelladoras PET (A100)', r: 1, rr: { DRE: 0, FF: -1 }, obs: 'Balance recepcionado · alta complejidad' },
  { pais: 'GUA', name: 'Inmobiliaria Guatemala (D100)', r: 1, rr: { DRE: 0, FF: -1 }, obs: 'Balance recepcionado · alta complejidad' },
  { pais: 'GUA', name: 'Comercializadora (C100)', r: 1, rr: { DRE: 0, FF: -1 }, obs: 'Balance recepcionado · alta complejidad' },
  { pais: 'HAI', name: 'ISM HAITI', r: 1, rr: { DRE: -1, FF: -1 }, obs: 'Información recepcionada hoy · DRE/FF sin iniciar' },
]

// Usuarios clave por país (placeholders para completar en el detalle)
const KEY_USERS = {
  RD1: [{ name: '(completar)', role: 'Contralor / Finanzas' }],
  PERU: [{ name: '(completar)', role: 'Contabilidad' }],
  RD2: [{ name: '(completar)', role: 'Finanzas' }],
  URU: [{ name: '(completar)', role: 'Contabilidad' }],
  GUA: [{ name: '(completar)', role: 'Finanzas' }],
  HAI: [{ name: '(completar)', role: 'Contabilidad' }],
}

const ALERTS = [
  ['PERU', 'Alta', 'Perú · observación abierta en Flujo de Fondos', 'El FF no cierra al 100% si el cálculo en dólares (guardado de tabla) falla; sin resolver, el cliente devolvería el entregable en la última prueba.', 'Christopher resuelve; el Go se libera porque la prueba en moneda local funciona.', 'Christopher', 'Esta semana'],
  ['RD2', 'Media', 'RD2 · el cliente pide una sesión por sociedad', 'Danane, Terrassa, ISMC y Procyon en UAT; el cliente necesita explicación de subsanaciones antes de continuar.', 'Agendar 4 sesiones (una por sociedad) para desbloquear las pruebas integrales.', 'Andersson / Paul', 'Esta semana'],
  ['GUA', 'Alta', 'Guatemala · riesgo de cronograma', '4 sociedades de alta complejidad manejadas por 1 persona y aún en etapa inicial.', 'Arrancar por el balance, liberar agenda y sincerar tiempos en la replanificación.', 'Paul', 'Desde 2/jul'],
  ['all', 'Gestión', 'Replanificación pendiente (fecha límite de Ramón)', 'Sin cronograma sincerado el compromiso con el cliente queda sin respaldo.', 'Sesión con Paul y Christopher para ajustar tiempos de GT/UY/HT.', 'Andersson', 'Esta semana'],
  ['HAI', 'Media', 'Haití · sin iniciar', 'Información recepcionada pero desarrollo no comenzado; depende de capacidad tras Guatemala.', 'Estimar esfuerzo e incluir en la replanificación.', 'Paul', 'Por definir'],
  ['URU', 'Baja', 'Uruguay · Flujo de Fondos en 0%', 'FF sin iniciar mientras BG/DRE están en borrador; bajo impacto (~1 día).', 'Levantar FF y enviar el BBP oficial de BG/DRE al cliente.', 'Paul / David', 'Esta semana'],
]
const STEPS = [
  ['Agendar 4 sesiones con el cliente — RD2', 'Una por sociedad para explicar subsanaciones y continuar UAT', 'Andersson / Paul', 'Esta semana'],
  ['Resolver observación FF — Perú', 'Cálculo USD en guardado de tabla', 'Christopher', 'Esta semana'],
  ['Emitir Go — Perú Embotelladora', 'Correo para que el cliente inicie pruebas integrales', 'David', 'Esta semana'],
  ['BBP oficial + FF — Uruguay', 'Doc oficial BG/DRE al cliente · levantar FF', 'Paul / David', 'Esta semana'],
  ['Iniciar Guatemala (balance)', 'Sociedad más compleja · liberar agenda', 'Paul', '2/jul'],
  ['Replanificación de cronograma', 'Sincerar GT/UY/HT con la fecha límite', 'Andersson+Paul+Christopher', 'Semana'],
  ['Primer informe al cliente', 'Preparar y presentar estado', 'Andersson', 'Viernes'],
]

async function main() {
  const { data: existing } = await db.from('projects').select('id').eq('name', 'ISM')
  if (existing?.length) {
    for (const p of existing) await db.from('projects').delete().eq('id', p.id)
    console.log(`Borrados ${existing.length} proyecto(s) ISM previos`)
  }

  const { data: proj, error: pErr } = await db.from('projects').insert({
    name: 'ISM',
    subtitle: 'InnoTeam × ISM — Reportes SAP',
    brand_color: '#2F6BD8',
    phases: PHASES,
    report_types: REPORT_TYPES,
    sponsor: 'Ramón — ISM (patrocinador) · (completar)',
    project_lead: 'Andersson Astete — InnoTeam',
    user_lead: 'Ramón — ISM · (completar)',
    stage: 'uat',
    stage_order: 0,
  }).select().single()
  if (pErr) throw pErr
  console.log('Proyecto ISM:', proj.id)

  const countryId = {}
  for (let i = 0; i < COUNTRIES.length; i++) {
    const [code, name, short] = COUNTRIES[i]
    const { data, error } = await db.from('countries').insert({
      project_id: proj.id, code, name, short_name: short, sort_order: i,
      key_users: KEY_USERS[code] || [], lead: '(completar)',
    }).select().single()
    if (error) throw error
    countryId[code] = data.id
  }
  console.log('Países:', Object.keys(countryId).length)

  let socOrder = 0
  const delRows = []
  for (const s of SOCIETIES) {
    const { data: soc, error } = await db.from('societies').insert({
      project_id: proj.id, country_id: countryId[s.pais], name: s.name, sort_order: socOrder++,
    }).select().single()
    if (error) throw error
    for (const rt of REPORT_TYPES) {
      const reached = s.rr && rt.code in s.rr ? s.rr[rt.code] : s.r
      const states = buildStates(reached, rt.code === 'FF' && reached < 0 ? null : s.uat)
      delRows.push({
        society_id: soc.id,
        report_code: rt.code,
        code: CODE_BY_REPORT[rt.code],
        phase_states: states,
        percentage: computePct(states),
        status: deriveStatus(states),
        last_phase: lastDone(states),
        observation: s.obs || '',
      })
    }
  }
  const { error: dErr } = await db.from('deliverables').insert(delRows)
  if (dErr) throw dErr
  console.log('Sociedades:', SOCIETIES.length, '· Entregables:', delRows.length)

  const alertRows = ALERTS.map(([cc, sev, title, impact, action, owner, due], i) => ({
    project_id: proj.id, country_code: cc, severity: sev, title, impact, action, owner, due, sort_order: i,
  }))
  await db.from('alerts').insert(alertRows)
  const stepRows = STEPS.map(([title, description, owner, due], i) => ({
    project_id: proj.id, title, description, owner, due, sort_order: i,
  }))
  await db.from('steps').insert(stepRows)
  console.log('Alertas:', alertRows.length, '· Pasos:', stepRows.length)

  // Resumen de % por sociedad
  console.log('\n% automático por entregable (muestra):')
  const sample = delRows.slice(0, 6)
  sample.forEach((d) => console.log(`  ${d.code} ${d.report_code}: ${d.percentage}% (${d.status})`))
  console.log('\n✅ Seed ISM completado. project_id =', proj.id)
}
main().catch((e) => { console.error('❌ Seed falló:', e.message || e); process.exit(1) })
