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
