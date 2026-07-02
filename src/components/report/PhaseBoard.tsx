'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  getProjectData,
  getSettings,
  type ProjectData,
  type Settings,
  type Deliverable,
  type Alert,
  type Step,
  type PhaseState,
} from '@/lib/supabase'
import { EST, computePercentage, deriveStatus, lastDonePhase, bandColorHex } from '@/lib/report'
import { mutate } from '@/lib/mutate'
import ProjectSettings from './ProjectSettings'
import styles from './board.module.css'

const CODE_BY_REPORT: Record<string, string> = { BG: 'LI10', DRE: 'LI20', FF: 'LI30' }
const REP_COLOR: Record<string, string> = { BG: '#3B82F6', DRE: '#8B7CF6', FF: '#7DBE3E' }

export default function PhaseBoard({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ProjectData | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState('')
  const [pais, setPais] = useState<string>('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<number | null>(null)
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  const [addCountryOpen, setAddCountryOpen] = useState(false)
  const [newCountry, setNewCountry] = useState({ code: '', name: '' })
  const [addSocFor, setAddSocFor] = useState<string | null>(null)
  const [newSoc, setNewSoc] = useState('')

  const reload = useCallback(async () => {
    const [d, s] = await Promise.all([getProjectData(projectId), getSettings()])
    setData(d)
    setSettings(s)
    if (d && !pais) setPais(d.countries[0]?.code || 'all')
    setLoading(false)
  }, [projectId, pais])

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const flash = (m = 'Guardado ✓') => {
    setSaved(m)
    setTimeout(() => setSaved(''), 1400)
  }

  const phases = data?.project.phases || []
  const reportTypes = data?.project.report_types || []

  const norm = useCallback(
    (states: PhaseState[]): PhaseState[] => phases.map((_, i) => states?.[i] || { done: false, date: null }),
    [phases]
  )

  const columns = useMemo(
    () => [{ idx: -1, name: 'Sin iniciar', weight: 0 }, ...phases.map((p, i) => ({ idx: i, name: p.name, weight: p.weight }))],
    [phases]
  )

  // Aplica "fase alcanzada" a un entregable (marca 0..idx)
  const setReached = useCallback(
    async (del: Deliverable, idx: number) => {
      const states = phases.map((_, i) => ({ done: i <= idx, date: del.phase_states?.[i]?.date || null }))
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
        await mutate('deliverables', 'update', { id: del.id, data: { phase_states: states, percentage, status, last_phase } })
        flash()
      } catch {
        reload()
      }
    },
    [phases, reload]
  )

  const patchDel = async (del: Deliverable, patch: Partial<Deliverable>) => {
    setData((prev) =>
      prev ? { ...prev, deliverables: prev.deliverables.map((d) => (d.id === del.id ? { ...d, ...patch } : d)) } : prev
    )
    await mutate('deliverables', 'update', { id: del.id, data: patch })
    flash()
  }

  const setPhaseDate = (del: Deliverable, idx: number, date: string) => {
    const states = norm(del.phase_states).map((s, j) => (j === idx ? { ...s, date: date || null } : s))
    patchDel(del, { phase_states: states })
  }

  // Copiar fase + fechas de un entregable a los 3 reportes de su sociedad
  const copyToSiblings = async (del: Deliverable) => {
    if (!data) return
    const sibs = data.deliverables.filter((d) => d.society_id === del.society_id && d.id !== del.id)
    for (const sib of sibs) {
      const states = del.phase_states.map((s) => ({ ...s }))
      const percentage = computePercentage(states, phases)
      const status = deriveStatus(states, phases)
      const last_phase = lastDonePhase(states)
      await mutate('deliverables', 'update', { id: sib.id, data: { phase_states: states, percentage, status, last_phase } })
    }
    flash('Copiado a BG/DRE/FF')
    reload()
  }

  if (loading || !data) return <div className={styles.loading}>Cargando…</div>

  const { project, countries, societies, deliverables, alerts, steps } = data
  const socById = new Map(societies.map((s) => [s.id, s]))
  const countryById = new Map(countries.map((c) => [c.id, c]))

  const visibleDels = deliverables.filter((d) => {
    const soc = socById.get(d.society_id)
    const c = soc ? countryById.get(soc.country_id) : undefined
    return pais === 'all' || c?.code === pais
  })

  const openDel = deliverables.find((d) => d.id === openCardId) || null

  // ---- Países / sociedades ----
  const addCountry = async () => {
    if (!newCountry.code.trim()) return
    await mutate('countries', 'insert', {
      data: {
        project_id: projectId,
        code: newCountry.code.trim().toUpperCase(),
        name: newCountry.name.trim() || newCountry.code.trim(),
        short_name: newCountry.name.trim() || newCountry.code.trim(),
        sort_order: countries.length,
        key_users: [],
      },
    })
    setNewCountry({ code: '', name: '' })
    setAddCountryOpen(false)
    flash()
    reload()
  }
  const addSociety = async (countryId: string) => {
    if (!newSoc.trim()) return
    const soc = await mutate('societies', 'insert', {
      data: {
        project_id: projectId,
        country_id: countryId,
        name: newSoc.trim(),
        sort_order: societies.filter((s) => s.country_id === countryId).length,
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
    setNewSoc('')
    setAddSocFor(null)
    flash()
    reload()
  }

  // ---- Alertas / pasos (manuales) ----
  const addAlert = async () => {
    await mutate('alerts', 'insert', {
      data: { project_id: projectId, country_code: 'all', severity: 'Media', title: 'Nueva alerta', impact: '', action: '', owner: '', due: '', sort_order: alerts.length },
    })
    flash()
    reload()
  }
  const patchAlert = async (a: Alert, patch: Partial<Alert>) => {
    setData((prev) => (prev ? { ...prev, alerts: prev.alerts.map((x) => (x.id === a.id ? { ...x, ...patch } : x)) } : prev))
    await mutate('alerts', 'update', { id: a.id, data: patch })
    flash()
  }
  const delAlert = async (a: Alert) => {
    await mutate('alerts', 'delete', { id: a.id })
    flash('Eliminado')
    reload()
  }
  const addStep = async () => {
    await mutate('steps', 'insert', { data: { project_id: projectId, title: 'Nuevo paso', description: '', owner: '', due: '', sort_order: steps.length } })
    flash()
    reload()
  }
  const patchStep = async (s: Step, patch: Partial<Step>) => {
    setData((prev) => (prev ? { ...prev, steps: prev.steps.map((x) => (x.id === s.id ? { ...x, ...patch } : x)) } : prev))
    await mutate('steps', 'update', { id: s.id, data: patch })
    flash()
  }
  const delStep = async (s: Step) => {
    await mutate('steps', 'delete', { id: s.id })
    flash('Eliminado')
    reload()
  }

  const selCountry = countries.find((c) => c.code === pais)

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h1>Detalle · {project.name}</h1>
          <p>Arrastra cada entregable a la columna de la fase que alcanzó. El % y el estado se calculan solos.</p>
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

      {/* Datos del proyecto + logos */}
      <ProjectSettings data={data} settings={settings} onReload={reload} flash={flash} />

      {/* Filtro país */}
      <div className={styles.filterbar}>
        <span className={styles.flabel}>País</span>
        {countries.map((c) => (
          <span key={c.code} className={`${styles.chip} ${pais === c.code ? styles.chipActive : ''}`} onClick={() => setPais(c.code)}>
            {c.short_name || c.name}
          </span>
        ))}
        <span className={`${styles.chip} ${pais === 'all' ? styles.chipActive : ''}`} onClick={() => setPais('all')}>
          Todos
        </span>
        <button className={styles.btnSm} onClick={() => setAddCountryOpen((o) => !o)}>
          + País
        </button>
      </div>

      {addCountryOpen && (
        <div className={styles.inlineForm}>
          <input placeholder="Código (p.ej. CHILE)" value={newCountry.code} onChange={(e) => setNewCountry((v) => ({ ...v, code: e.target.value }))} />
          <input placeholder="Nombre del país" value={newCountry.name} onChange={(e) => setNewCountry((v) => ({ ...v, name: e.target.value }))} />
          <button className={styles.btnSm} onClick={addCountry}>
            Crear país
          </button>
        </div>
      )}

      <p className={styles.hint}>
        Tip: haz clic en una tarjeta para poner la fecha de su fase actual, su observación, o copiar el avance a los 3 reportes de la sociedad.
      </p>

      {/* Board de fases */}
      <div className={styles.board}>
        {columns.map((col) => {
          const cards = visibleDels.filter((d) => d.last_phase === col.idx)
          return (
            <div
              key={col.idx}
              className={`${styles.col} ${overCol === col.idx ? styles.colOver : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setOverCol(col.idx)
              }}
              onDragLeave={() => setOverCol((c) => (c === col.idx ? null : c))}
              onDrop={(e) => {
                e.preventDefault()
                setOverCol(null)
                const del = deliverables.find((d) => d.id === dragId)
                if (del) setReached(del, col.idx)
                setDragId(null)
              }}
            >
              <div className={styles.colHead}>
                <span>{col.name}</span>
                {col.idx >= 0 && <span className="w">{col.weight}%</span>}
              </div>
              <div className={styles.colCount}>{cards.length} entregables</div>
              {cards.map((d) => {
                const soc = socById.get(d.society_id)
                return (
                  <div
                    key={d.id}
                    className={styles.pcard}
                    style={{ borderLeftColor: REP_COLOR[d.report_code] || 'var(--brand)' }}
                    draggable
                    onDragStart={() => setDragId(d.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => setOpenCardId(d.id)}
                  >
                    <div className={styles.pcardTop}>
                      <span className={styles.pcardSoc}>{soc?.name}</span>
                      <span className={styles.pcardRep} style={{ background: `${REP_COLOR[d.report_code]}22`, color: REP_COLOR[d.report_code] }}>
                        {d.report_code}
                      </span>
                    </div>
                    <div className={styles.pcardBar}>
                      <i style={{ width: `${d.percentage}%`, background: bandColorHex(d.percentage) }} />
                    </div>
                    <div className={styles.pcardMeta}>
                      <span>{d.percentage}%</span>
                      <span>{(EST as any)[d.status]?.label || d.status}</span>
                    </div>
                  </div>
                )
              })}
              {cards.length === 0 && <div className={styles.emptyCol}>—</div>}
            </div>
          )
        })}
      </div>

      {/* Agregar sociedad al país seleccionado */}
      {selCountry && (
        <div className={styles.socAdd}>
          {addSocFor === selCountry.id ? (
            <div className={styles.inlineForm}>
              <input placeholder={`Nueva sociedad en ${selCountry.name}`} value={newSoc} onChange={(e) => setNewSoc(e.target.value)} />
              <button className={styles.btnSm} onClick={() => addSociety(selCountry.id)}>
                Crear sociedad
              </button>
              <button className={styles.btnGhost} onClick={() => setAddSocFor(null)}>
                Cancelar
              </button>
            </div>
          ) : (
            <button className={styles.btnSm} onClick={() => setAddSocFor(selCountry.id)}>
              + Sociedad en {selCountry.short_name || selCountry.name}
            </button>
          )}
        </div>
      )}

      {/* Modal de tarjeta */}
      {openDel && (
        <CardModal
          del={openDel}
          societyName={socById.get(openDel.society_id)?.name || ''}
          phases={phases}
          onClose={() => setOpenCardId(null)}
          onDate={(idx, date) => setPhaseDate(openDel, idx, date)}
          onObs={(v) => patchDel(openDel, { observation: v })}
          onCopy={() => copyToSiblings(openDel)}
        />
      )}

      {/* Alertas manuales */}
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
            <button className={styles.btnDel} onClick={() => delAlert(a)}>
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

      {/* Próximos pasos */}
      <div className={styles.sechead}>
        <h2>Próximos pasos (plan de acción)</h2>
        <button className={styles.btnSm} onClick={addStep}>
          + Paso
        </button>
      </div>
      {steps.map((s) => (
        <div className={styles.itemCard} key={s.id}>
          <div className={styles.itemRow}>
            <input className={styles.itemTitle} defaultValue={s.title} onBlur={(e) => e.target.value !== s.title && patchStep(s, { title: e.target.value })} />
            <button className={styles.btnDel} onClick={() => delStep(s)}>
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

function CardModal({
  del,
  societyName,
  phases,
  onClose,
  onDate,
  onObs,
  onCopy,
}: {
  del: Deliverable
  societyName: string
  phases: { name: string; weight: number; hasDate?: boolean }[]
  onClose: () => void
  onDate: (idx: number, date: string) => void
  onObs: (v: string) => void
  onCopy: () => void
}) {
  const idx = del.last_phase
  const currentPhase = idx >= 0 ? phases[idx] : null
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <div>
            <h3>
              {societyName} · {del.report_code}
            </h3>
            <div className="sub">
              {del.percentage}% · {currentPhase ? currentPhase.name : 'Sin iniciar'}
            </div>
          </div>
          <button className={styles.btn} onClick={onClose}>
            ✕
          </button>
        </div>

        {currentPhase && currentPhase.hasDate && (
          <>
            <label className={styles.mlabel}>Fecha de "{currentPhase.name}"</label>
            <input
              type="date"
              className={styles.mfield}
              defaultValue={del.phase_states[idx]?.date || ''}
              onChange={(e) => onDate(idx, e.target.value)}
            />
          </>
        )}

        <label className={styles.mlabel}>Observación</label>
        <textarea className={styles.mfield} rows={3} defaultValue={del.observation || ''} onBlur={(e) => onObs(e.target.value)} />

        <div className={styles.mactions}>
          <button className={styles.btn} onClick={onCopy}>
            ⧉ Copiar avance a BG/DRE/FF
          </button>
          <button className={`${styles.btnSm}`} onClick={onClose}>
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}
