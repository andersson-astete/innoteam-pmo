// Cálculos del reporte — portados del dashboard HTML + lógica de fases/riesgos.
import type { FlatDeliverable, Phase, PhaseState, Status } from './supabase'

// Etiquetas y color por estado (equivale a EST del HTML)
export const EST: Record<Status, { cssVar: string; label: string }> = {
  testing: { cssVar: '--testc', label: 'En pruebas integrales' },
  go: { cssVar: '--ok', label: 'Go liberado' },
  client: { cssVar: '--clientc', label: 'Lado cliente' },
  proc: { cssVar: '--warn', label: 'En elaboración' },
  init: { cssVar: '--coral', label: 'Etapa inicial' },
}

export const STATUS_ORDER: Record<Status, number> = {
  testing: 0,
  go: 1,
  client: 2,
  proc: 3,
  init: 4,
}

// Promedio de % (HTML: avgOf)
export function avgOf(list: { pct: number }[]): number {
  return list.length ? Math.round(list.reduce((a, x) => a + x.pct, 0) / list.length) : 0
}

// Color por banda de avance (HTML: bandColor) — devuelve nombre de variable CSS
export function bandColorVar(v: number): string {
  return v >= 65 ? '--ok' : v >= 30 ? '--warn' : '--coral'
}

// Color literal (para Chart.js sin acceso a CSS vars) — hex de respaldo
export function bandColorHex(v: number): string {
  return v >= 65 ? '#34D399' : v >= 30 ? '#FBBF24' : '#FB923C'
}

export interface SocietyRow {
  soc: string
  f: string
  pct: number
  est: Status
  reps: FlatDeliverable[]
}

// Agrupa entregables por sociedad, calcula pct y estado dominante (HTML: socList)
export function socList(deliverables: FlatDeliverable[]): SocietyRow[] {
  const m: Record<string, SocietyRow> = {}
  deliverables.forEach((d) => {
    if (!m[d.soc]) m[d.soc] = { soc: d.soc, f: d.f, pct: 0, est: 'init', reps: [] }
    m[d.soc].reps.push(d)
  })
  return Object.values(m).map((s) => {
    s.pct = avgOf(s.reps)
    s.est = s.reps.slice().sort((a, b) => STATUS_ORDER[a.est] - STATUS_ORDER[b.est])[0].est
    return s
  })
}

// % de entregables que superó cada fase (HTML: phaseProfile) — para radar/funnel
export function phaseProfile(list: FlatDeliverable[], phases: Phase[]): number[] {
  return phases.map((_, i) => {
    const t = list.length
    return t ? Math.round((list.filter((x) => x.last >= i).length / t) * 100) : 0
  })
}

// Conteo por estado (HTML: estCounts) — para la dona
export function estCounts(list: FlatDeliverable[]): Record<Status, number> {
  const o: Record<Status, number> = { testing: 0, go: 0, client: 0, proc: 0, init: 0 }
  list.forEach((x) => o[x.est]++)
  return o
}

// Conteo por fase alcanzada (para el funnel)
export function phaseCounts(list: FlatDeliverable[], phases: Phase[]): number[] {
  return phases.map((_, i) => list.filter((x) => x.last >= i).length)
}

// ---------- Fases automáticas ----------

// % automático = suma de pesos de fases con done=true
export function computePercentage(phaseStates: PhaseState[], phases: Phase[]): number {
  if (!phases.length) return 0
  const totalW = phases.reduce((a, p) => a + (p.weight || 0), 0) || 100
  const done = phases.reduce((a, p, i) => a + (phaseStates[i]?.done ? p.weight || 0 : 0), 0)
  return Math.round((done / totalW) * 100)
}

// Índice de la última fase completada (-1 si ninguna)
export function lastDonePhase(phaseStates: PhaseState[]): number {
  let last = -1
  phaseStates.forEach((s, i) => {
    if (s?.done) last = i
  })
  return last
}

// Status derivado de la fase más avanzada completada.
// Usa el nombre de la fase para ubicar hitos clave (UAT, PRD) de forma robusta.
export function deriveStatus(phaseStates: PhaseState[], phases: Phase[]): Status {
  const last = lastDonePhase(phaseStates)
  if (last < 0) return 'init'
  const idxOf = (needle: string) =>
    phases.findIndex((p) => p.name.toLowerCase().includes(needle))
  const iUAT = idxOf('uat')
  const iPRD = idxOf('prd')
  const iShow = idxOf('show')
  const iBBP = idxOf('bbp')

  if (iPRD >= 0 && last >= iPRD) return 'go' // en producción
  if (iUAT >= 0 && last >= iUAT) return 'testing' // en pruebas integrales UAT
  if (iShow >= 0 && last >= iShow) return 'client' // liberado para revisión del cliente
  if (iBBP >= 0 && last >= iBBP) return 'proc' // en elaboración
  return 'init' // antes de BBP = etapa inicial
}

// Recalcula pct + status desde phase_states (usar al guardar y al leer)
export function recomputeDeliverable(
  phaseStates: PhaseState[],
  phases: Phase[]
): { percentage: number; status: Status; last_phase: number } {
  return {
    percentage: computePercentage(phaseStates, phases),
    status: deriveStatus(phaseStates, phases),
    last_phase: lastDonePhase(phaseStates),
  }
}

// ---------- Matriz de riesgos automática y puntuada ----------
export interface RiskItem {
  key: string
  label: string // sociedad · reporte
  pais: string
  probability: number // 1..5
  impact: number // 1..5
  score: number // 1..25
  level: 'Bajo' | 'Medio' | 'Alto' | 'Crítico'
  reason: string
}

const parseDate = (d: string | null): Date | null => {
  if (!d) return null
  const t = Date.parse(d)
  return isNaN(t) ? null : new Date(t)
}

// Genera riesgos por entregable a partir de heurísticas del detalle.
export function buildRiskMatrix(list: FlatDeliverable[], phases: Phase[], today = new Date()): RiskItem[] {
  const iUAT = phases.findIndex((p) => p.name.toLowerCase().includes('uat'))
  const iPRD = phases.findIndex((p) => p.name.toLowerCase().includes('prd'))
  const risks: RiskItem[] = []

  list.forEach((d) => {
    let probability = 1
    let impact = 2
    const reasons: string[] = []

    // ¿Fecha UAT vencida sin completar?
    const uatState = iUAT >= 0 ? d.phase_states[iUAT] : undefined
    const uatDate = parseDate(uatState?.date || null)
    const overdueUAT = !!(uatDate && !uatState?.done && uatDate < today)

    // Solo consideramos riesgo lo genuinamente rezagado (evita ruido gerencial)
    const isRisk = d.pct < 40 || overdueUAT
    if (!isRisk) return

    // Probabilidad: bajo avance / sin iniciar
    if (d.pct < 15) {
      probability = 5
      reasons.push('sin iniciar / avance mínimo')
    } else if (d.pct < 25) {
      probability = 4
      reasons.push('avance < 25%')
    } else if (d.pct < 40) {
      probability = 3
      reasons.push('avance < 40%')
    } else {
      probability = 2
    }
    if (overdueUAT) {
      probability = Math.min(5, probability + 1)
      reasons.push('fecha UAT vencida')
    }

    // Impacto: BG suele ser crítico; fase avanzada sin cerrar pesa más
    impact = d.rep === 'BG' ? 4 : 3
    if (iPRD >= 0 && d.last >= iUAT && iUAT >= 0 && d.last < iPRD) {
      impact = Math.min(5, impact + 1)
      reasons.push('en fase crítica (UAT→PRD)')
    }

    const score = probability * impact

    const level: RiskItem['level'] =
      score >= 15 ? 'Crítico' : score >= 10 ? 'Alto' : score >= 6 ? 'Medio' : 'Bajo'

    risks.push({
      key: d.id,
      label: `${d.soc} · ${d.rep}`,
      pais: d.f,
      probability,
      impact,
      score,
      level,
      reason: reasons.join(' · ') || 'seguimiento',
    })
  })

  return risks.sort((a, b) => b.score - a.score)
}

// ---------- Salud del proyecto (semáforo + mensaje ejecutivo) ----------
export interface Health {
  level: 'En marcha' | 'En riesgo' | 'Crítico'
  color: string
  message: string
}
export function projectHealth(
  list: FlatDeliverable[],
  risks: RiskItem[],
  overdueCount: number,
  countryLabel: (code: string) => string
): Health {
  const avg = avgOf(list)
  const high = risks.filter((r) => r.level === 'Crítico' || r.level === 'Alto').length
  const inUAT = list.filter((x) => x.est === 'testing' || x.est === 'client').length
  const inPRD = list.filter((x) => x.est === 'go').length

  let level: Health['level'] = 'En marcha'
  let color = '#34D399'
  if (high >= 5 || avg < 25) {
    level = 'Crítico'
    color = '#F87171'
  } else if (high >= 1 || overdueCount > 0 || avg < 50) {
    level = 'En riesgo'
    color = '#FBBF24'
  }

  // Frentes en riesgo (países con avance bajo)
  const paisCodes = Array.from(new Set(list.map((x) => x.f)))
  const frentes = paisCodes
    .filter((code) => avgOf(list.filter((x) => x.f === code)) < 40)
    .map((code) => countryLabel(code))

  const parts = [`Avance global ${avg}%`, `${inUAT} en UAT`, inPRD ? `${inPRD} en producción` : '']
  if (frentes.length) parts.push(`${frentes.length} frente(s) en riesgo: ${frentes.join(', ')}`)
  if (overdueCount) parts.push(`${overdueCount} con fecha vencida`)
  const message = parts.filter(Boolean).join(' · ')

  return { level, color, message }
}

// ---------- Mini-matriz de riesgos 3×3 (conteos) ----------
export interface RiskGridCell {
  probBand: 'Baja' | 'Media' | 'Alta'
  impactBand: 'Bajo' | 'Medio' | 'Alto'
  count: number
  color: string
}
const band3 = (v: number): 0 | 1 | 2 => (v >= 4 ? 2 : v >= 3 ? 1 : 0)
export function riskGrid(risks: RiskItem[]): RiskGridCell[][] {
  const probLabels: RiskGridCell['probBand'][] = ['Baja', 'Media', 'Alta']
  const impLabels: RiskGridCell['impactBand'][] = ['Bajo', 'Medio', 'Alto']
  // filas = impacto (Alto arriba), columnas = probabilidad
  const counts = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]
  risks.forEach((r) => {
    counts[band3(r.impact)][band3(r.probability)]++
  })
  const cellColor = (pi: number, ii: number) => {
    const s = pi + ii // 0..4
    return s >= 3 ? 'rgba(248,113,113,.22)' : s >= 2 ? 'rgba(251,191,36,.20)' : 'rgba(52,211,153,.16)'
  }
  const grid: RiskGridCell[][] = []
  for (let ii = 2; ii >= 0; ii--) {
    const row: RiskGridCell[] = []
    for (let pi = 0; pi < 3; pi++) {
      row.push({ probBand: probLabels[pi], impactBand: impLabels[ii], count: counts[ii][pi], color: cellColor(pi, ii) })
    }
    grid.push(row)
  }
  return grid
}

// ---------- Fechas en riesgo (fase con fecha vencida sin completar) ----------
export interface OverdueItem {
  label: string
  pais: string
  phase: string
  date: string
}
export function overdueItems(list: FlatDeliverable[], phases: Phase[], today = new Date()): OverdueItem[] {
  const out: OverdueItem[] = []
  list.forEach((d) => {
    d.phase_states.forEach((s, i) => {
      if (s?.date && !s.done) {
        const t = Date.parse(s.date)
        if (!isNaN(t) && new Date(t) < today) {
          out.push({ label: `${d.soc} · ${d.rep}`, pais: d.f, phase: phases[i]?.name || `Fase ${i + 1}`, date: s.date })
        }
      }
    })
  })
  return out.sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
}
