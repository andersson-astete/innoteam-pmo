'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  getProjectData,
  type ProjectData,
  type Country,
  type Society,
  type Deliverable,
  type Alert,
  type Step,
  type PhaseState,
} from '@/lib/supabase'
import { EST, computePercentage, deriveStatus, lastDonePhase } from '@/lib/report'
import { mutate } from '@/lib/mutate'
import styles from './edit.module.css'

const CODE_BY_REPORT: Record<string, string> = { BG: 'LI10', DRE: 'LI20', FF: 'LI30' }

function statusColor(s: string) {
  const v = (EST as any)[s]?.cssVar || '--ink3'
  return `var(${v})`
}

export default function EditGrid({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState('')

  const reload = useCallback(async () => {
    const d = await getProjectData(projectId)
    setData(d)
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    reload()
  }, [reload])

  const flash = (msg = 'Guardado ✓') => {
    setSaved(msg)
    setTimeout(() => setSaved(''), 1400)
  }

  if (loading) return <div className={styles.loading}>Cargando…</div>
  if (!data) return <div className={styles.loading}>Proyecto no encontrado.</div>

  const { project, countries, societies, deliverables, alerts, steps } = data
  const phases = project.phases
  const reportTypes = project.report_types

  // Normaliza phase_states a la longitud de fases
  const norm = (del: Deliverable): PhaseState[] =>
    phases.map((_, i) => del.phase_states?.[i] || { done: false, date: null })

  const delFor = (societyId: string, code: string) =>
    deliverables.find((d) => d.society_id === societyId && d.report_code === code)

  // Guarda phase_states + recalcula % / status / last_phase
  const savePhases = async (del: Deliverable, states: PhaseState[]) => {
    const percentage = computePercentage(states, phases)
    const status = deriveStatus(states, phases)
    const last_phase = lastDonePhase(states)
    setData((prev) =>
      prev
        ? {
            ...prev,
            deliverables: prev.deliverables.map((d) =>
              d.id === del.id ? { ...d, phase_states: states, percentage, status, last_phase } : d
            ),
          }
        : prev
    )
    try {
      await mutate('deliverables', 'update', {
        id: del.id,
        data: { phase_states: states, percentage, status, last_phase },
      })
      flash()
    } catch {
      reload()
    }
  }

  const togglePhase = (del: Deliverable, i: number) => {
    const states = norm(del)
    const ns = states.map((s, j) => (j === i ? { ...s, done: !s.done } : s))
    savePhases(del, ns)
  }
  const setPhaseDate = (del: Deliverable, i: number, date: string) => {
    const states = norm(del)
    const ns = states.map((s, j) => (j === i ? { ...s, date: date || null } : s))
    savePhases(del, ns)
  }

  const patchDel = async (del: Deliverable, patch: Partial<Deliverable>) => {
    setData((prev) =>
      prev ? { ...prev, deliverables: prev.deliverables.map((d) => (d.id === del.id ? { ...d, ...patch } : d)) } : prev
    )
    await mutate('deliverables', 'update', { id: del.id, data: patch })
    flash()
  }

  // Países
  const addCountry = async () => {
    const code = prompt('Código del país (p.ej. PERU):')?.trim()
    if (!code) return
    const name = prompt('Nombre del país:', code)?.trim() || code
    await mutate('countries', 'insert', {
      data: { project_id: projectId, code, name, short_name: name, sort_order: countries.length, key_users: [] },
    })
    flash()
    reload()
  }
  const deleteCountry = async (c: Country) => {
    if (!confirm(`¿Eliminar el país ${c.name} y sus sociedades?`)) return
    await mutate('countries', 'delete', { id: c.id })
    flash('Eliminado')
    reload()
  }

  // Sociedades (+ entregables por tipo de reporte con phase_states vacíos)
  const addSociety = async (country: Country) => {
    const name = prompt(`Nueva sociedad/empresa en ${country.name}:`)?.trim()
    if (!name) return
    const soc = await mutate('societies', 'insert', {
      data: {
        project_id: projectId,
        country_id: country.id,
        name,
        sort_order: societies.filter((s) => s.country_id === country.id).length,
      },
    })
    const emptyStates = phases.map(() => ({ done: false, date: null }))
    const rows = reportTypes.map((r) => ({
      society_id: soc.row.id,
      report_code: r.code,
      code: CODE_BY_REPORT[r.code] || '',
      phase_states: emptyStates,
      percentage: 0,
      status: 'init',
      last_phase: -1,
      observation: '',
    }))
    if (rows.length) await mutate('deliverables', 'insertMany', { data: rows })
    flash()
    reload()
  }
  const deleteSociety = async (s: Society) => {
    if (!confirm(`¿Eliminar la sociedad ${s.name} y sus entregables?`)) return
    await mutate('societies', 'delete', { id: s.id })
    flash('Eliminado')
    reload()
  }

  // Alertas / pasos
  const addAlert = async () => {
    const title = prompt('Título de la alerta:')?.trim()
    if (!title) return
    await mutate('alerts', 'insert', {
      data: { project_id: projectId, country_code: 'all', severity: 'Media', title, impact: '', action: '', owner: '', due: '', sort_order: alerts.length },
    })
    flash()
    reload()
  }
  const patchAlert = async (a: Alert, patch: Partial<Alert>) => {
    setData((prev) => (prev ? { ...prev, alerts: prev.alerts.map((x) => (x.id === a.id ? { ...x, ...patch } : x)) } : prev))
    await mutate('alerts', 'update', { id: a.id, data: patch })
    flash()
  }
  const deleteAlert = async (a: Alert) => {
    if (!confirm('¿Eliminar alerta?')) return
    await mutate('alerts', 'delete', { id: a.id })
    flash('Eliminado')
    reload()
  }
  const addStep = async () => {
    const title = prompt('Título del próximo paso:')?.trim()
    if (!title) return
    await mutate('steps', 'insert', {
      data: { project_id: projectId, title, description: '', owner: '', due: '', sort_order: steps.length },
    })
    flash()
    reload()
  }
  const patchStep = async (s: Step, patch: Partial<Step>) => {
    setData((prev) => (prev ? { ...prev, steps: prev.steps.map((x) => (x.id === s.id ? { ...x, ...patch } : x)) } : prev))
    await mutate('steps', 'update', { id: s.id, data: patch })
    flash()
  }
  const deleteStep = async (s: Step) => {
    if (!confirm('¿Eliminar paso?')) return
    await mutate('steps', 'delete', { id: s.id })
    flash('Eliminado')
    reload()
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h1>Detalle · {project.name}</h1>
          <p>El % y el Status se calculan solos según las fases completadas. Cada cambio se guarda automáticamente.</p>
        </div>
        <div className={styles.actions}>
          {saved && <span className={styles.saved}>{saved}</span>}
          <Link href={`/dashboard/projects/${projectId}`} className={styles.btn}>
            ← Resumen
          </Link>
          <Link href={`/dashboard/projects/${projectId}/report`} className={styles.btn}>
            Ver reporte →
          </Link>
        </div>
      </div>

      <div className={styles.sechead}>
        <h2>Países, sociedades y fases</h2>
        <button className={styles.btnSm} onClick={addCountry}>
          + País
        </button>
      </div>
      <p className={styles.hint}>
        Marca cada fase completada y elige su fecha en el calendario. El avance sube por el peso de la fase.
      </p>

      {countries.map((country) => {
        const socs = societies.filter((s) => s.country_id === country.id)
        return (
          <div className={styles.countryCard} key={country.id}>
            <div className={styles.countryHead}>
              <span className={styles.countryName}>
                {country.name} <span className={styles.code}>{country.code}</span>
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={styles.btnSm} onClick={() => addSociety(country)}>
                  + Sociedad
                </button>
                <button className={styles.btnDel} onClick={() => deleteCountry(country)}>
                  Eliminar país
                </button>
              </div>
            </div>

            {socs.length === 0 ? (
              <p className={styles.empty}>Sin sociedades. Agrega una.</p>
            ) : (
              <div className={styles.gridScroll}>
                <table>
                  <thead>
                    <tr>
                      <th className={styles.stickyCol}>Sociedad / Empresa</th>
                      <th>Cód</th>
                      <th>Entregable</th>
                      <th>%</th>
                      <th>Status</th>
                      {phases.map((p, i) => (
                        <th className={styles.phaseHead} key={i}>
                          {p.name}
                          <div className="w">peso {p.weight}%</div>
                        </th>
                      ))}
                      <th>Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {socs.map((s) =>
                      reportTypes.map((rt, ri) => {
                        const del = delFor(s.id, rt.code)
                        if (!del) return null
                        const states = norm(del)
                        return (
                          <tr key={del.id}>
                            {ri === 0 ? (
                              <td className={styles.stickyCol} rowSpan={reportTypes.length}>
                                <div className={styles.socName}>
                                  <span>{s.name}</span>
                                  <button className={styles.rmSoc} title="Eliminar sociedad" onClick={() => deleteSociety(s)}>
                                    ✕
                                  </button>
                                </div>
                              </td>
                            ) : null}
                            <td>
                              <input
                                className={styles.codeInput}
                                defaultValue={del.code || ''}
                                onBlur={(e) => e.target.value !== (del.code || '') && patchDel(del, { code: e.target.value })}
                              />
                            </td>
                            <td className={styles.prodCell}>{rt.code}</td>
                            <td className={styles.pctCell} style={{ color: del.percentage >= 65 ? 'var(--ok)' : del.percentage >= 30 ? 'var(--warn)' : 'var(--coral)' }}>
                              {del.percentage}%
                            </td>
                            <td className={styles.statusCell}>
                              <span
                                className="sbadge"
                                style={{ background: `color-mix(in srgb, ${statusColor(del.status)} 16%, transparent)`, color: statusColor(del.status) }}
                              >
                                {(EST as any)[del.status]?.label || del.status}
                              </span>
                            </td>
                            {phases.map((p, i) => (
                              <td className={styles.phaseCell} key={i}>
                                <input
                                  type="checkbox"
                                  className="chk"
                                  checked={!!states[i]?.done}
                                  onChange={() => togglePhase(del, i)}
                                />
                                {p.hasDate && (
                                  <input
                                    type="date"
                                    className="dateInp"
                                    value={states[i]?.date || ''}
                                    onChange={(e) => setPhaseDate(del, i, e.target.value)}
                                  />
                                )}
                              </td>
                            ))}
                            <td>
                              <input
                                className={styles.obsInput}
                                defaultValue={del.observation || ''}
                                placeholder="Observación…"
                                onBlur={(e) => e.target.value !== (del.observation || '') && patchDel(del, { observation: e.target.value })}
                              />
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}

      {/* Alertas */}
      <div className={styles.sechead}>
        <h2>Riesgos y alertas (manuales)</h2>
        <button className={styles.btnSm} onClick={addAlert}>
          + Alerta
        </button>
      </div>
      {alerts.map((a) => (
        <div className={styles.itemCard} key={a.id}>
          <div className={styles.itemRow}>
            <input className={styles.itemTitle} defaultValue={a.title} onBlur={(e) => e.target.value !== a.title && patchAlert(a, { title: e.target.value })} />
            <select className={styles.sel} value={a.severity} onChange={(e) => patchAlert(a, { severity: e.target.value })}>
              {['Alta', 'Media', 'Baja', 'Gestión'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select className={styles.sel} value={a.country_code} onChange={(e) => patchAlert(a, { country_code: e.target.value })}>
              <option value="all">Todos</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.short_name || c.name}
                </option>
              ))}
            </select>
            <button className={styles.btnDel} onClick={() => deleteAlert(a)}>
              ✕
            </button>
          </div>
          <input className={styles.itemSub} defaultValue={a.impact || ''} placeholder="Impacto…" onBlur={(e) => e.target.value !== (a.impact || '') && patchAlert(a, { impact: e.target.value })} />
          <input className={styles.itemSub} defaultValue={a.action || ''} placeholder="Acción…" onBlur={(e) => e.target.value !== (a.action || '') && patchAlert(a, { action: e.target.value })} />
          <div className={styles.itemRow}>
            <input className={styles.itemSub} defaultValue={a.owner || ''} placeholder="Responsable" onBlur={(e) => e.target.value !== (a.owner || '') && patchAlert(a, { owner: e.target.value })} />
            <input className={styles.itemSub} defaultValue={a.due || ''} placeholder="Fecha límite" onBlur={(e) => e.target.value !== (a.due || '') && patchAlert(a, { due: e.target.value })} />
          </div>
        </div>
      ))}

      {/* Pasos */}
      <div className={styles.sechead}>
        <h2>Próximos pasos</h2>
        <button className={styles.btnSm} onClick={addStep}>
          + Paso
        </button>
      </div>
      {steps.map((s) => (
        <div className={styles.itemCard} key={s.id}>
          <div className={styles.itemRow}>
            <input className={styles.itemTitle} defaultValue={s.title} onBlur={(e) => e.target.value !== s.title && patchStep(s, { title: e.target.value })} />
            <button className={styles.btnDel} onClick={() => deleteStep(s)}>
              ✕
            </button>
          </div>
          <input className={styles.itemSub} defaultValue={s.description || ''} placeholder="Descripción…" onBlur={(e) => e.target.value !== (s.description || '') && patchStep(s, { description: e.target.value })} />
          <div className={styles.itemRow}>
            <input className={styles.itemSub} defaultValue={s.owner || ''} placeholder="Responsable" onBlur={(e) => e.target.value !== (s.owner || '') && patchStep(s, { owner: e.target.value })} />
            <input className={styles.itemSub} defaultValue={s.due || ''} placeholder="Fecha" onBlur={(e) => e.target.value !== (s.due || '') && patchStep(s, { due: e.target.value })} />
          </div>
        </div>
      ))}
    </div>
  )
}
