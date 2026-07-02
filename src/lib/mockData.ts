// Mock data para desarrollo - reemplazar con datos de Supabase en producción

export const PHASES = [
  'Levantamiento',
  'Info recepcionada',
  'Elaboración BBP',
  'Aprobación BBP',
  'Elaboración EF',
  'Pruebas unitarias',
  'Pruebas integrales',
  'Observaciones',
  'Guía de usuario',
]

export const WEIGHTS = [15, 5, 10, 5, 10, 20, 20, 10, 5]

export const PAIS = {
  RD1: 'RD1 · Rep. Dominicana',
  PERU: 'Perú',
  RD2: 'RD2 · Rep. Dominicana',
  URU: 'Uruguay',
  GUA: 'Guatemala',
  HAI: 'Haití',
}

export const PAISSHORT = {
  RD1: 'RD1',
  PERU: 'Perú',
  RD2: 'RD2',
  URU: 'Uruguay',
  GUA: 'Guatemala',
  HAI: 'Haití',
}

export const EST = {
  testing: { c: '--testc', l: 'En pruebas integrales' },
  go: { c: '--ok', l: 'Go liberado' },
  client: { c: '--clientc', l: 'Lado cliente' },
  proc: { c: '--warn', l: 'En elaboración' },
  init: { c: '--coral', l: 'Etapa inicial' },
}

export interface Deliverable {
  id: string
  soc: string
  f: string
  rep: string
  last: number
  pct: number
  est: keyof typeof EST
  obs: string
}

export interface Society {
  soc: string
  f: string
  pct: number
  est: keyof typeof EST
  reps: Deliverable[]
}

// Datos de ejemplo ISM
const deliverables: Deliverable[] = [
  { id: '1', soc: 'San Miguel del Caribe S.A.', f: 'RD1', rep: 'BG', last: 5, pct: 65, est: 'testing', obs: 'En pruebas integrales del cliente' },
  { id: '2', soc: 'San Miguel del Caribe S.A.', f: 'RD1', rep: 'DRE', last: 5, pct: 65, est: 'testing', obs: 'En pruebas integrales del cliente' },
  { id: '3', soc: 'San Miguel del Caribe S.A.', f: 'RD1', rep: 'FF', last: 5, pct: 65, est: 'testing', obs: 'En pruebas integrales del cliente' },
  { id: '4', soc: 'Embotelladora', f: 'PERU', rep: 'BG', last: 4, pct: 45, est: 'proc', obs: 'En elaboración' },
  { id: '5', soc: 'Embotelladora', f: 'PERU', rep: 'DRE', last: 4, pct: 45, est: 'proc', obs: 'En elaboración' },
  { id: '6', soc: 'Embotelladora', f: 'PERU', rep: 'FF', last: 4, pct: 45, est: 'proc', obs: 'Observación: cálculo USD en guardado' },
  { id: '7', soc: 'Cynkat', f: 'PERU', rep: 'BG', last: 5, pct: 65, est: 'client', obs: 'Datos en PRD · prueba en ambiente cliente' },
  { id: '8', soc: 'Cynkat', f: 'PERU', rep: 'DRE', last: 5, pct: 65, est: 'client', obs: 'Datos en PRD · prueba en ambiente cliente' },
  { id: '9', soc: 'Cynkat', f: 'PERU', rep: 'FF', last: 5, pct: 65, est: 'client', obs: 'Datos en PRD · prueba en ambiente cliente' },
  { id: '10', soc: 'G&A', f: 'PERU', rep: 'BG', last: 5, pct: 65, est: 'client', obs: 'Datos en PRD · prueba en ambiente cliente' },
  { id: '11', soc: 'G&A', f: 'PERU', rep: 'DRE', last: 5, pct: 65, est: 'client', obs: 'Datos en PRD · prueba en ambiente cliente' },
  { id: '12', soc: 'G&A', f: 'PERU', rep: 'FF', last: 5, pct: 65, est: 'client', obs: 'Datos en PRD · prueba en ambiente cliente' },
  { id: '13', soc: 'Silver', f: 'PERU', rep: 'BG', last: 5, pct: 65, est: 'client', obs: 'Datos en PRD · prueba en ambiente cliente' },
  { id: '14', soc: 'Silver', f: 'PERU', rep: 'DRE', last: 5, pct: 65, est: 'client', obs: 'Datos en PRD · prueba en ambiente cliente' },
  { id: '15', soc: 'Silver', f: 'PERU', rep: 'FF', last: 5, pct: 65, est: 'client', obs: 'Datos en PRD · prueba en ambiente cliente' },
  { id: '16', soc: 'Danane', f: 'RD2', rep: 'BG', last: 5, pct: 65, est: 'testing', obs: 'En pruebas integrales · sesión con cliente' },
  { id: '17', soc: 'Danane', f: 'RD2', rep: 'DRE', last: 5, pct: 65, est: 'testing', obs: 'En pruebas integrales · sesión con cliente' },
  { id: '18', soc: 'Danane', f: 'RD2', rep: 'FF', last: 5, pct: 65, est: 'testing', obs: 'En pruebas integrales · sesión con cliente' },
  { id: '19', soc: 'Terrassa', f: 'RD2', rep: 'BG', last: 5, pct: 65, est: 'testing', obs: 'En pruebas integrales · sesión con cliente' },
  { id: '20', soc: 'Terrassa', f: 'RD2', rep: 'DRE', last: 5, pct: 65, est: 'testing', obs: 'En pruebas integrales · sesión con cliente' },
  { id: '21', soc: 'Terrassa', f: 'RD2', rep: 'FF', last: 5, pct: 65, est: 'testing', obs: 'En pruebas integrales · sesión con cliente' },
  { id: '22', soc: 'ISMC', f: 'RD2', rep: 'BG', last: 5, pct: 65, est: 'testing', obs: 'En pruebas integrales · sesión con cliente' },
  { id: '23', soc: 'ISMC', f: 'RD2', rep: 'DRE', last: 5, pct: 65, est: 'testing', obs: 'En pruebas integrales · sesión con cliente' },
  { id: '24', soc: 'ISMC', f: 'RD2', rep: 'FF', last: 5, pct: 65, est: 'testing', obs: 'En pruebas integrales · sesión con cliente' },
  { id: '25', soc: 'Procyon', f: 'RD2', rep: 'BG', last: 5, pct: 65, est: 'testing', obs: 'En pruebas integrales · sesión con cliente' },
  { id: '26', soc: 'Procyon', f: 'RD2', rep: 'DRE', last: 5, pct: 65, est: 'testing', obs: 'En pruebas integrales · sesión con cliente' },
  { id: '27', soc: 'Procyon', f: 'RD2', rep: 'FF', last: 5, pct: 65, est: 'testing', obs: 'En pruebas integrales · sesión con cliente' },
  { id: '28', soc: 'Tamalfi', f: 'URU', rep: 'BG', last: 2, pct: 30, est: 'proc', obs: 'BBP en borrador' },
  { id: '29', soc: 'Tamalfi', f: 'URU', rep: 'DRE', last: 2, pct: 30, est: 'proc', obs: 'BBP en borrador' },
  { id: '30', soc: 'Tamalfi', f: 'URU', rep: 'FF', last: -1, pct: 0, est: 'init', obs: 'Levantamiento hoy 3pm' },
  { id: '31', soc: 'Embotelladoras Latas (A200)', f: 'GUA', rep: 'BG', last: 1, pct: 20, est: 'init', obs: 'Balance recepcionado' },
  { id: '32', soc: 'Embotelladoras Latas (A200)', f: 'GUA', rep: 'DRE', last: 0, pct: 15, est: 'init', obs: 'Solo levantamiento' },
  { id: '33', soc: 'Embotelladoras Latas (A200)', f: 'GUA', rep: 'FF', last: -1, pct: 0, est: 'init', obs: 'Sin iniciar · alta complejidad' },
  { id: '34', soc: 'Embotelladoras PET (A100)', f: 'GUA', rep: 'BG', last: 1, pct: 20, est: 'init', obs: 'Balance recepcionado' },
  { id: '35', soc: 'Embotelladoras PET (A100)', f: 'GUA', rep: 'DRE', last: 0, pct: 15, est: 'init', obs: 'Solo levantamiento' },
  { id: '36', soc: 'Embotelladoras PET (A100)', f: 'GUA', rep: 'FF', last: -1, pct: 0, est: 'init', obs: 'Sin iniciar · alta complejidad' },
  { id: '37', soc: 'Inmobiliaria Guatemala (D100)', f: 'GUA', rep: 'BG', last: 1, pct: 20, est: 'init', obs: 'Balance recepcionado' },
  { id: '38', soc: 'Inmobiliaria Guatemala (D100)', f: 'GUA', rep: 'DRE', last: 0, pct: 15, est: 'init', obs: 'Solo levantamiento' },
  { id: '39', soc: 'Inmobiliaria Guatemala (D100)', f: 'GUA', rep: 'FF', last: -1, pct: 0, est: 'init', obs: 'Sin iniciar · alta complejidad' },
  { id: '40', soc: 'Comercializadora (C100)', f: 'GUA', rep: 'BG', last: 1, pct: 20, est: 'init', obs: 'Balance recepcionado' },
  { id: '41', soc: 'Comercializadora (C100)', f: 'GUA', rep: 'DRE', last: 0, pct: 15, est: 'init', obs: 'Solo levantamiento' },
  { id: '42', soc: 'Comercializadora (C100)', f: 'GUA', rep: 'FF', last: -1, pct: 0, est: 'init', obs: 'Sin iniciar · alta complejidad' },
  { id: '43', soc: 'ISM Haiti', f: 'HAI', rep: 'BG', last: 1, pct: 20, est: 'init', obs: 'Información recepcionada hoy' },
  { id: '44', soc: 'ISM Haiti', f: 'HAI', rep: 'DRE', last: -1, pct: 0, est: 'init', obs: 'Sin iniciar' },
  { id: '45', soc: 'ISM Haiti', f: 'HAI', rep: 'FF', last: -1, pct: 0, est: 'init', obs: 'Sin iniciar' },
]

export function getDeliverables() {
  return deliverables
}

export function filterDeliverables(pais?: string, status?: string) {
  return deliverables.filter(d => {
    if (pais && d.f !== pais) return false
    if (status && d.est !== status) return false
    return true
  })
}

export function getSocieties(): Society[] {
  const societies: { [key: string]: Society } = {}
  deliverables.forEach(d => {
    if (!societies[d.soc]) {
      societies[d.soc] = { soc: d.soc, f: d.f, pct: 0, est: 'init', reps: [] }
    }
    societies[d.soc].reps.push(d)
  })
  Object.values(societies).forEach(s => {
    const pcts = s.reps.map(r => r.pct).filter(p => p >= 0)
    s.pct = pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0
    const statusOrder = { testing: 0, go: 1, client: 2, proc: 3, init: 4 }
    s.est = s.reps.slice().sort((a, b) => statusOrder[a.est] - statusOrder[b.est])[0].est
  })
  return Object.values(societies)
}

export function getProjectStats() {
  const total = deliverables.length
  const avg = Math.round(deliverables.reduce((a, d) => a + d.pct, 0) / total)
  const testing = deliverables.filter(d => d.est === 'testing').length
  const client = deliverables.filter(d => d.est === 'client').length
  const init = deliverables.filter(d => d.est === 'init').length
  return { total, avg, testing, client, init }
}

export function bandColor(v: number) {
  const red = '#F87171'
  const warn = '#FBBF24'
  const ok = '#34D399'
  return v >= 65 ? ok : v >= 30 ? warn : red
}
