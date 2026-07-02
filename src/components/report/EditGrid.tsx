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
} from '@/lib/supabase'
import { EST } from '@/lib/report'
import { mutate } from '@/lib/mutate'
import styles from './edit.module.css'

const STATUSES = Object.keys(EST) as (keyof typeof EST)[]

export default function EditGrid({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState<string>('')

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
    setTimeout(() => setSaved(''), 1500)
  }

  if (loading) return <div className={styles.loading}>Cargando…</div>
  if (!data) return <div className={styles.loading}>Proyecto no encontrado.</div>

  const { project, countries, societies, deliverables, alerts, steps } = data
  const reportTypes = project.report_types
  const phases = project.phases

  // ---------- Países ----------
  const addCountry = async () => {
    const code = prompt('Código del país (p.ej. PERU):')?.trim()
    if (!code) return
    const name = prompt('Nombre del país:', code)?.trim() || code
    await mutate('countries', 'insert', {
      data: { project_id: projectId, code, name, short_name: name, sort_order: countries.length },
    })
    flash()
    reload()
  }
  const deleteCountry = async (c: Country) => {
    if (!confirm(`¿Eliminar el país ${c.name} y todas sus sociedades?`)) return
    await mutate('countries', 'delete', { id: c.id })
    flash('Eliminado')
    reload()
  }

  // ---------- Sociedades ----------
  const addSociety = async (country: Country) => {
    const name = prompt(`Nueva sociedad en ${country.name}:`)?.trim()
    if (!name) return
    const soc = await mutate('societies', 'insert', {
      data: {
        project_id: projectId,
        country_id: country.id,
        name,
        sort_order: societies.filter((s) => s.country_id === country.id).length,
      },
    })
    // Crear un entregable por cada tipo de reporte
    const rows = reportTypes.map((r) => ({
      society_id: soc.row.id,
      report_code: r.code,
      last_phase: -1,
      percentage: 0,
      status: 'init',
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

  // ---------- Entregables (edición inline con guardado optimista) ----------
  const patchDeliverable = async (del: Deliverable, patch: Partial<Deliverable>) => {
    // optimista
    setData((prev) =>
      prev
        ? { ...prev, deliverables: prev.deliverables.map((d) => (d.id === del.id ? { ...d, ...patch } : d)) }
        : prev
    )
    try {
      await mutate('deliverables', 'update', { id: del.id, data: patch })
      flash()
    } catch {
      reload()
    }
  }

  const delFor = (societyId: string, code: string): Deliverable | undefined =>
    deliverables.find((d) => d.society_id === societyId && d.report_code === code)

  // ---------- Alertas ----------
  const addAlert = async () => {
    const title = prompt('Título de la alerta:')?.trim()
    if (!title) return
    await mutate('alerts', 'insert', {
      data: {
        project_id: projectId,
        country_code: 'all',
        severity: 'Media',
        title,
        impact: '',
        action: '',
        owner: '',
        due: '',
        sort_order: alerts.length,
      },
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

  // ---------- Pasos ----------
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
          <h1>Editar · {project.name}</h1>
          <p>Los cambios se guardan automáticamente. El reporte se recalcula al instante.</p>
        </div>
        <div className={styles.actions}>
          {saved && <span className={styles.saved}>{saved}</span>}
          <Link href={`/dashboard/projects/${projectId}`} className={styles.btn}>
            Ver reporte →
          </Link>
        </div>
      </div>

      {/* Países + sociedades + grilla de entregables */}
      <div className={styles.sechead}>
        <h2>Países, sociedades y entregables</h2>
        <button className={styles.btnSm} onClick={addCountry}>
          + País
        </button>
      </div>

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
              <div className={styles.tableScroll}>
                <table>
                  <thead>
                    <tr>
                      <th>Sociedad</th>
                      <th>Reporte</th>
                      <th>Fase</th>
                      <th>%</th>
                      <th>Estado</th>
                      <th>Observación</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {socs.map((s) =>
                      reportTypes.map((rt, ri) => {
                        const del = delFor(s.id, rt.code)
                        if (!del) return null
                        return (
                          <tr key={del.id}>
                            {ri === 0 ? (
                              <td rowSpan={reportTypes.length} className={styles.socCell}>
                                {s.name}
                                <button className={styles.rmSoc} onClick={() => deleteSociety(s)} title="Eliminar sociedad">
                                  ✕
                                </button>
                              </td>
                            ) : null}
                            <td className={styles.repCell}>{rt.code}</td>
                            <td>
                              <select
                                className={styles.sel}
                                value={del.last_phase}
                                onChange={(e) => patchDeliverable(del, { last_phase: Number(e.target.value) })}
                              >
                                <option value={-1}>Sin iniciar</option>
                                {phases.map((p, i) => (
                                  <option key={i} value={i}>
                                    {i + 1}. {p.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                className={styles.num}
                                type="number"
                                min={0}
                                max={100}
                                value={del.percentage}
                                onChange={(e) =>
                                  patchDeliverable(del, { percentage: Math.max(0, Math.min(100, Number(e.target.value))) })
                                }
                              />
                            </td>
                            <td>
                              <select
                                className={styles.sel}
                                value={del.status}
                                onChange={(e) => patchDeliverable(del, { status: e.target.value as any })}
                              >
                                {STATUSES.map((st) => (
                                  <option key={st} value={st}>
                                    {EST[st].label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                className={styles.obs}
                                defaultValue={del.observation || ''}
                                placeholder="Observación…"
                                onBlur={(e) => {
                                  if (e.target.value !== (del.observation || ''))
                                    patchDeliverable(del, { observation: e.target.value })
                                }}
                              />
                            </td>
                            <td></td>
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
        <h2>Riesgos y alertas</h2>
        <button className={styles.btnSm} onClick={addAlert}>
          + Alerta
        </button>
      </div>
      {alerts.map((a) => (
        <div className={styles.itemCard} key={a.id}>
          <div className={styles.itemRow}>
            <input
              className={styles.itemTitle}
              defaultValue={a.title}
              onBlur={(e) => e.target.value !== a.title && patchAlert(a, { title: e.target.value })}
            />
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
