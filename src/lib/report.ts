// Cálculos del reporte — portados fielmente del dashboard HTML original.
import type { FlatDeliverable, Phase, Status } from './supabase'

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
