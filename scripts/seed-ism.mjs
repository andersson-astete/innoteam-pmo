// Seed del proyecto ISM (plantilla llena) contra Supabase usando la service key.
// Uso: node scripts/seed-ism.mjs
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ---- Configuración de alcance del proyecto ISM ----
const PHASES = [
  { name: 'Levantamiento', weight: 15 },
  { name: 'Info recepcionada', weight: 5 },
  { name: 'Elaboración BBP', weight: 10 },
  { name: 'Aprobación BBP', weight: 5 },
  { name: 'Elaboración EF', weight: 10 },
  { name: 'Pruebas unitarias', weight: 20 },
  { name: 'Pruebas integrales', weight: 20 },
  { name: 'Observaciones', weight: 10 },
  { name: 'Guía de usuario', weight: 5 },
]
const REPORT_TYPES = [
  { code: 'BG', name: 'Balance General' },
  { code: 'DRE', name: 'Estado de Resultados' },
  { code: 'FF', name: 'Flujo de Fondos' },
]

// País: [code, nombreLargo, short]
const COUNTRIES = [
  ['RD1', 'RD1 · Rep. Dominicana', 'RD1'],
  ['PERU', 'Perú', 'Perú'],
  ['RD2', 'RD2 · Rep. Dominicana', 'RD2'],
  ['URU', 'Uruguay', 'Uruguay'],
  ['GUA', 'Guatemala', 'Guatemala'],
  ['HAI', 'Haití', 'Haití'],
]

// Entregables: [countryCode, sociedad, rep, last, pct, status, obs]
const DELIVERABLES = [
  ['RD1', 'San Miguel del Caribe S.A.', 'BG', 5, 65, 'testing', 'En pruebas integrales del cliente'],
  ['RD1', 'San Miguel del Caribe S.A.', 'DRE', 5, 65, 'testing', 'En pruebas integrales del cliente'],
  ['RD1', 'San Miguel del Caribe S.A.', 'FF', 5, 65, 'testing', 'En pruebas integrales del cliente'],
  ['PERU', 'Embotelladora', 'BG', 5, 65, 'go', 'Go liberándose'],
  ['PERU', 'Embotelladora', 'DRE', 5, 65, 'go', 'Go liberándose'],
  ['PERU', 'Embotelladora', 'FF', 5, 65, 'go', 'Observación: cálculo USD en guardado de tabla (Christopher) — se libera igual'],
  ['PERU', 'Cynkat', 'BG', 5, 65, 'client', 'Datos en Producción · prueba en su ambiente'],
  ['PERU', 'Cynkat', 'DRE', 5, 65, 'client', 'Datos en Producción · prueba en su ambiente'],
  ['PERU', 'Cynkat', 'FF', 5, 65, 'client', 'Datos en Producción · prueba en su ambiente'],
  ['PERU', 'G&A', 'BG', 5, 65, 'client', 'Datos en Producción · prueba en su ambiente'],
  ['PERU', 'G&A', 'DRE', 5, 65, 'client', 'Datos en Producción · prueba en su ambiente'],
  ['PERU', 'G&A', 'FF', 5, 65, 'client', 'Datos en Producción · prueba en su ambiente'],
  ['PERU', 'Silver', 'BG', 5, 65, 'client', 'Datos en Producción · prueba en su ambiente'],
  ['PERU', 'Silver', 'DRE', 5, 65, 'client', 'Datos en Producción · prueba en su ambiente'],
  ['PERU', 'Silver', 'FF', 5, 65, 'client', 'Datos en Producción · prueba en su ambiente'],
  ['RD2', 'Danane', 'BG', 5, 65, 'testing', 'En pruebas integrales · sesión con cliente pendiente (explicar subsanaciones)'],
  ['RD2', 'Danane', 'DRE', 5, 65, 'testing', 'En pruebas integrales · sesión con cliente pendiente (explicar subsanaciones)'],
  ['RD2', 'Danane', 'FF', 5, 65, 'testing', 'En pruebas integrales · sesión con cliente pendiente (explicar subsanaciones)'],
  ['RD2', 'Terrassa', 'BG', 5, 65, 'testing', 'En pruebas integrales · sesión con cliente pendiente (explicar subsanaciones)'],
  ['RD2', 'Terrassa', 'DRE', 5, 65, 'testing', 'En pruebas integrales · sesión con cliente pendiente (explicar subsanaciones)'],
  ['RD2', 'Terrassa', 'FF', 5, 65, 'testing', 'En pruebas integrales · sesión con cliente pendiente (explicar subsanaciones)'],
  ['RD2', 'ISMC', 'BG', 5, 65, 'testing', 'En pruebas integrales · sesión con cliente pendiente (explicar subsanaciones)'],
  ['RD2', 'ISMC', 'DRE', 5, 65, 'testing', 'En pruebas integrales · sesión con cliente pendiente (explicar subsanaciones)'],
  ['RD2', 'ISMC', 'FF', 5, 65, 'testing', 'En pruebas integrales · sesión con cliente pendiente (explicar subsanaciones)'],
  ['RD2', 'Procyon', 'BG', 5, 65, 'testing', 'En pruebas integrales · sesión con cliente pendiente (explicar subsanaciones)'],
  ['RD2', 'Procyon', 'DRE', 5, 65, 'testing', 'En pruebas integrales · sesión con cliente pendiente (explicar subsanaciones)'],
  ['RD2', 'Procyon', 'FF', 5, 65, 'testing', 'En pruebas integrales · sesión con cliente pendiente (explicar subsanaciones)'],
  ['URU', 'Tamalfi', 'BG', 2, 30, 'proc', 'BBP en borrador'],
  ['URU', 'Tamalfi', 'DRE', 2, 30, 'proc', 'BBP en borrador'],
  ['URU', 'Tamalfi', 'FF', -1, 0, 'init', 'Levantamiento hoy 3pm'],
  ['GUA', 'Embotelladoras Latas (A200)', 'BG', 1, 20, 'init', 'Balance recepcionado'],
  ['GUA', 'Embotelladoras Latas (A200)', 'DRE', 0, 15, 'init', 'Solo levantamiento'],
  ['GUA', 'Embotelladoras Latas (A200)', 'FF', -1, 0, 'init', 'Sin iniciar · alta complejidad'],
  ['GUA', 'Embotelladoras PET (A100)', 'BG', 1, 20, 'init', 'Balance recepcionado'],
  ['GUA', 'Embotelladoras PET (A100)', 'DRE', 0, 15, 'init', 'Solo levantamiento'],
  ['GUA', 'Embotelladoras PET (A100)', 'FF', -1, 0, 'init', 'Sin iniciar · alta complejidad'],
  ['GUA', 'Inmobiliaria Guatemala (D100)', 'BG', 1, 20, 'init', 'Balance recepcionado'],
  ['GUA', 'Inmobiliaria Guatemala (D100)', 'DRE', 0, 15, 'init', 'Solo levantamiento'],
  ['GUA', 'Inmobiliaria Guatemala (D100)', 'FF', -1, 0, 'init', 'Sin iniciar · alta complejidad'],
  ['GUA', 'Comercializadora (C100)', 'BG', 1, 20, 'init', 'Balance recepcionado'],
  ['GUA', 'Comercializadora (C100)', 'DRE', 0, 15, 'init', 'Solo levantamiento'],
  ['GUA', 'Comercializadora (C100)', 'FF', -1, 0, 'init', 'Sin iniciar · alta complejidad'],
  ['HAI', 'ISM Haiti', 'BG', 1, 20, 'init', 'Información recepcionada hoy'],
  ['HAI', 'ISM Haiti', 'DRE', -1, 0, 'init', 'Sin iniciar'],
  ['HAI', 'ISM Haiti', 'FF', -1, 0, 'init', 'Sin iniciar'],
]

const ALERTS = [
  ['PERU', 'Alta', 'Perú · observación abierta en Flujo de Fondos', 'El reporte FF no cierra al 100% si el cálculo en dólares (guardado de tabla) falla; sin resolver, el cliente devolvería el entregable en la última prueba.', 'Christopher resuelve hoy; el Go se libera igual porque la prueba en moneda local funciona (el rubro USD es el último paso).', 'Christopher', 'Hoy'],
  ['RD2', 'Media', 'RD2 · el cliente pide una sesión por sociedad', 'Danane, Terrassa, ISMC y Procyon ya están en pruebas integrales, pero el cliente necesita que se le expliquen las subsanaciones antes de continuar; sin las sesiones, sus pruebas se detienen.', 'Agendar 4 sesiones (una por sociedad) para explicar lo subsanado y desbloquear la continuidad de las pruebas integrales.', 'Andersson / Paul', 'Esta semana'],
  ['GUA', 'Alta', 'Guatemala · riesgo de cronograma', '4 sociedades de alta complejidad manejadas por 1 persona y aún sin iniciar; es el frente con mayor probabilidad de arrastre.', 'Arrancar por el balance el 2/jul, liberar agenda de reuniones y sincerar tiempos en la replanificación.', 'Paul', 'Desde 2/jul'],
  ['all', 'Gestión', 'Replanificación pendiente (fecha límite de Ramón)', 'Sin cronograma sincerado, el compromiso con el cliente queda sin respaldo y el primer informe del viernes iría incompleto.', 'Sesión con Paul y Christopher para ajustar tiempos de GT/UY/HT contra la fecha límite.', 'Andersson', 'Esta semana'],
  ['HAI', 'Media', 'Haití · sin iniciar', 'Información recepcionada hoy pero desarrollo no comenzado; depende de la capacidad disponible tras Guatemala.', 'Estimar esfuerzo e incluir en la replanificación de tiempos.', 'Paul', 'Por definir'],
  ['URU', 'Baja', 'Uruguay · Flujo de Fondos en 0%', 'FF sin iniciar mientras BG/DRE están en borrador; bajo impacto porque el esfuerzo estimado es ~1 día.', 'Levantar FF hoy 3pm y enviar el BBP oficial de BG/DRE al cliente.', 'Paul / David', 'Hoy 3pm'],
]

const STEPS = [
  ['Agendar 4 sesiones con el cliente — RD2', 'Una por sociedad (Danane, Terrassa, ISMC, Procyon) para explicar las subsanaciones y que continúen sus pruebas integrales', 'Andersson / Paul', 'Esta semana'],
  ['Resolver observación FF — Perú', 'Cálculo USD en guardado de tabla', 'Christopher', 'Hoy'],
  ['Emitir Go — Perú Embotelladora', 'Enviar correo para que el cliente inicie pruebas integrales', 'David', 'Hoy'],
  ['BBP oficial + FF — Uruguay', 'Doc oficial BG/DRE al cliente · levantar FF', 'Paul / David', 'Hoy 3pm'],
  ['Iniciar Guatemala (balance)', 'Sociedad más compleja · liberar agenda', 'Paul', '2/jul'],
  ['Replanificación de cronograma', 'Sincerar GT/UY/HT con la fecha límite', 'Andersson+Paul+Christopher', 'Semana'],
  ['Primer informe al cliente', 'Preparar y presentar estado', 'Andersson', 'Viernes'],
]

async function main() {
  // Idempotencia: borrar proyecto ISM previo si existe
  const { data: existing } = await db.from('projects').select('id').eq('name', 'ISM')
  if (existing?.length) {
    for (const p of existing) await db.from('projects').delete().eq('id', p.id)
    console.log(`Borrados ${existing.length} proyecto(s) ISM previos`)
  }

  // 1) Proyecto
  const { data: proj, error: pErr } = await db.from('projects').insert({
    name: 'ISM',
    subtitle: 'InnoTeam × ISM — Reportes SAP',
    brand_color: '#2F6BD8',
    phases: PHASES,
    report_types: REPORT_TYPES,
  }).select().single()
  if (pErr) throw pErr
  console.log('Proyecto ISM:', proj.id)

  // 2) Países
  const countryIdByCode = {}
  for (let i = 0; i < COUNTRIES.length; i++) {
    const [code, name, short] = COUNTRIES[i]
    const { data, error } = await db.from('countries').insert({
      project_id: proj.id, code, name, short_name: short, sort_order: i,
    }).select().single()
    if (error) throw error
    countryIdByCode[code] = data.id
  }
  console.log('Países:', Object.keys(countryIdByCode).length)

  // 3) Sociedades (únicas por código país + nombre, en orden de aparición)
  const societyId = {} // key `${code}::${name}` -> id
  let socOrder = 0
  for (const [code, soc] of DELIVERABLES.map(d => [d[0], d[1]])) {
    const key = `${code}::${soc}`
    if (societyId[key]) continue
    const { data, error } = await db.from('societies').insert({
      project_id: proj.id, country_id: countryIdByCode[code], name: soc, sort_order: socOrder++,
    }).select().single()
    if (error) throw error
    societyId[key] = data.id
  }
  console.log('Sociedades:', Object.keys(societyId).length)

  // 4) Entregables
  const delRows = DELIVERABLES.map(([code, soc, rep, last, pct, status, obs]) => ({
    society_id: societyId[`${code}::${soc}`],
    report_code: rep, last_phase: last, percentage: pct, status, observation: obs,
  }))
  const { error: dErr } = await db.from('deliverables').insert(delRows)
  if (dErr) throw dErr
  console.log('Entregables:', delRows.length)

  // 5) Alertas
  const alertRows = ALERTS.map(([cc, sev, title, impact, action, owner, due], i) => ({
    project_id: proj.id, country_code: cc, severity: sev, title, impact, action, owner, due, sort_order: i,
  }))
  const { error: aErr } = await db.from('alerts').insert(alertRows)
  if (aErr) throw aErr
  console.log('Alertas:', alertRows.length)

  // 6) Próximos pasos
  const stepRows = STEPS.map(([title, description, owner, due], i) => ({
    project_id: proj.id, title, description, owner, due, sort_order: i,
  }))
  const { error: sErr } = await db.from('steps').insert(stepRows)
  if (sErr) throw sErr
  console.log('Pasos:', stepRows.length)

  console.log('\n✅ Seed ISM completado. project_id =', proj.id)
}

main().catch((e) => { console.error('❌ Seed falló:', e.message || e); process.exit(1) })
