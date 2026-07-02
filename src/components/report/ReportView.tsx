'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import ReactECharts from 'echarts-for-react'
import {
  getProjectData,
  getSettings,
  flattenDeliverables,
  type ProjectData,
  type Settings,
  type FlatDeliverable,
  type Status,
} from '@/lib/supabase'
import {
  EST,
  avgOf,
  bandColorHex,
  socList,
  estCounts,
  phaseCounts,
  buildRiskMatrix,
  projectHealth,
  riskGrid,
  overdueItems,
} from '@/lib/report'
import { Logo } from './Logo'
import styles from './report.module.css'

function cv(name: string, fallback = '#888'): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}
const LEVEL_COLOR = { Crítico: '#F87171', Alto: '#FB923C', Medio: '#FBBF24', Bajo: '#34D399' } as const

// Degradado para dar relieve a las barras (no planas)
const grad = (from: string, to: string) => ({
  type: 'linear',
  x: 0,
  y: 0,
  x2: 1,
  y2: 0,
  colorStops: [
    { offset: 0, color: from },
    { offset: 1, color: to },
  ],
})

interface ModalData {
  title: string
  sub?: string
  rows: { k: string; v: string }[]
  note?: string
}

export default function ReportView({ projectId, canEdit }: { projectId: string; canEdit: boolean }) {
  const [data, setData] = useState<ProjectData | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [pais, setPais] = useState('all')
  const [themeTick, setThemeTick] = useState(0)
  const [modal, setModal] = useState<ModalData | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([getProjectData(projectId), getSettings()]).then(([d, s]) => {
      if (alive) {
        setData(d)
        setSettings(s)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [projectId])

  useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((t) => t + 1))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const flat = useMemo<FlatDeliverable[]>(() => (data ? flattenDeliverables(data) : []), [data])
  const countries = data?.countries || []
  const phases = data?.project.phases || []

  // Filtro único por país — TODOS los gráficos usan fD
  const fD = useMemo(() => flat.filter((d) => pais === 'all' || d.f === pais), [flat, pais])
  const reset = useCallback(() => setPais('all'), [])

  if (loading) return <div className={styles.loading}>Cargando reporte…</div>
  if (!data) return <div className={styles.loading}>Proyecto no encontrado.</div>

  const countryShort = (code: string) => {
    const c = countries.find((x) => x.code === code)
    return c?.short_name || c?.name || code
  }
  const countryName = (code: string) => countries.find((c) => c.code === code)?.name || code

  const counts = estCounts(fD)
  const risks = buildRiskMatrix(fD, phases)
  const overdue = overdueItems(fD, phases)
  const health = projectHealth(fD, risks, overdue.length, countryName)
  const grid3 = riskGrid(risks)
  const ink3 = cv('--ink3')
  const gridc = cv('--grid')

  // Países visibles (respeta filtro)
  const paisCodes = (pais === 'all' ? countries.map((c) => c.code) : [pais]).filter((code) =>
    flat.some((x) => x.f === code)
  )

  // ---- Avance por país (barras horizontales con relieve) ----
  const paisAvg = paisCodes.map((code) => avgOf(flat.filter((x) => x.f === code)))
  const avancePaisOption = {
    grid: { left: 8, right: 40, top: 8, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'value', max: 100, axisLabel: { color: ink3, formatter: '{value}%' }, splitLine: { lineStyle: { color: gridc } } },
    yAxis: { type: 'category', data: paisCodes.map(countryShort), axisLabel: { color: cv('--ink2'), fontWeight: 600 } },
    series: [
      {
        type: 'bar',
        data: paisAvg.map((v) => ({
          value: v,
          itemStyle: {
            borderRadius: [0, 8, 8, 0],
            color: grad(bandColorHex(Math.max(0, v - 20)), bandColorHex(v)),
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,.25)',
            shadowOffsetY: 3,
          },
        })),
        barWidth: '58%',
        label: { show: true, position: 'right', color: cv('--ink'), fontWeight: 700, formatter: '{c}%' },
      },
    ],
  }

  // ---- Composición por estado (dona con total al centro) ----
  const estKeys = (['testing', 'go', 'client', 'proc', 'init'] as Status[]).filter((k) => counts[k] > 0)
  const donutOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [
      {
        type: 'pie',
        radius: ['58%', '82%'],
        avoidLabelOverlap: false,
        itemStyle: { borderColor: cv('--panel'), borderWidth: 3, shadowBlur: 8, shadowColor: 'rgba(0,0,0,.2)' },
        label: { show: false },
        data: estKeys.map((k) => ({ name: EST[k].label, value: counts[k], itemStyle: { color: cv(EST[k].cssVar) } })),
      },
    ],
    graphic: {
      type: 'text',
      left: 'center',
      top: 'center',
      style: { text: `${fD.length}\nentregables`, textAlign: 'center', fill: cv('--ink'), fontSize: 18, fontWeight: 800, lineHeight: 20 },
    },
  }

  // ---- Embudo por fase ----
  const fCounts = phaseCounts(fD, phases)
  const funnelOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} entregables' },
    series: [
      {
        type: 'funnel',
        left: '2%',
        right: '2%',
        top: 6,
        bottom: 6,
        minSize: '20%',
        sort: 'descending',
        gap: 2,
        label: { show: true, position: 'inside', color: '#fff', fontSize: 10, formatter: '{b}' },
        itemStyle: { borderColor: cv('--panel'), borderWidth: 1, shadowBlur: 6, shadowColor: 'rgba(0,0,0,.2)' },
        data: phases.map((p, i) => ({ name: p.name, value: fCounts[i] })),
      },
    ],
  }

  const onPaisBarClick = (p: any) => {
    const code = paisCodes[p.dataIndex]
    if (!code) return
    const list = flat.filter((x) => x.f === code)
    setModal({
      title: countryName(code),
      sub: `${new Set(list.map((x) => x.soc)).size} sociedades · ${list.length} entregables`,
      rows: socList(list).map((s) => ({ k: s.soc, v: `${s.pct}% · ${EST[s.est].label}` })),
    })
  }
  const onFunnelClick = (p: any) => {
    const i = phases.findIndex((ph) => ph.name === p.name)
    if (i < 0) return
    const reached = fD.filter((x) => x.last >= i)
    setModal({
      title: p.name,
      sub: `${reached.length} entregables alcanzaron esta fase · peso ${phases[i].weight}%`,
      rows: reached.slice(0, 20).map((x) => ({ k: `${x.soc} · ${x.rep}`, v: `${x.pct}%` })),
    })
  }

  return (
    <div className={styles.wrap} key={themeTick}>
      {/* Marca */}
      <div className={styles.brandRow}>
        <Logo url={settings?.innoteam_logo_url} name="InnoTeam" kind="innoteam" height={28} />
        <span className={styles.brandX}>×</span>
        <Logo url={data.project.client_logo_url} name={data.project.name} kind="client" color={data.project.brand_color} height={28} />
      </div>

      <div className={styles.rhead}>
        <div className={styles.rtitle}>
          <h1>{data.project.name}</h1>
          <p>{data.project.subtitle || 'Reporte de seguimiento'} · Estado ejecutivo</p>
        </div>
        <div className={styles.ractions}>
          <Link href={`/dashboard/projects/${projectId}`} className={styles.btn}>
            ← Proyecto
          </Link>
          {canEdit && (
            <Link href={`/dashboard/projects/${projectId}/edit`} className={styles.btn}>
              ✎ Detalle
            </Link>
          )}
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => window.print()}>
            ⤓ Exportar
          </button>
        </div>
      </div>

      {/* Filtro país */}
      <div className={styles.filterbar}>
        <span className={styles.flabel}>País</span>
        <span className={`${styles.chip} ${pais === 'all' ? styles.chipActive : ''}`} onClick={reset}>
          Todos
        </span>
        {countries.map((c) => (
          <span
            key={c.code}
            className={`${styles.chip} ${pais === c.code ? styles.chipActive : ''}`}
            onClick={() => setPais((p) => (p === c.code ? 'all' : c.code))}
          >
            {countryShort(c.code)}
          </span>
        ))}
      </div>

      {/* Semáforo de estado */}
      <div className={styles.health} style={{ borderColor: `${health.color}66` }}>
        <div className={styles.healthDot} style={{ background: `${health.color}22`, color: health.color }}>
          {health.level === 'En marcha' ? '✓' : health.level === 'En riesgo' ? '!' : '‼'}
        </div>
        <div className={styles.healthMain}>
          <div className="lvl" style={{ color: health.color }}>
            {health.level}
          </div>
          <div className="msg">{health.message}</div>
        </div>
      </div>

      {/* Avance por país + Composición por estado */}
      <div className={`${styles.grid} ${styles.g2}`}>
        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Avance por país</h2>
              <p className={styles.cap}>
                <b>Qué muestra:</b> qué tan avanzado está cada país. Clic en una barra para ver sus sociedades.
              </p>
            </div>
          </div>
          <ReactECharts option={avancePaisOption} style={{ height: Math.max(180, paisCodes.length * 46) }} notMerge onEvents={{ click: onPaisBarClick }} />
        </div>
        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Composición por estado</h2>
              <p className={styles.cap}>
                <b>Qué muestra:</b> en qué etapa están los entregables (inicial, elaboración, UAT, producción).
              </p>
            </div>
          </div>
          <ReactECharts option={donutOption} style={{ height: 240 }} notMerge />
          <div className={styles.legend}>
            {estKeys.map((k) => (
              <div className="li" key={k}>
                <span className="sw" style={{ background: cv(EST[k].cssVar) }} />
                {EST[k].label}
                <b>{counts[k]}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Embudo + Riesgos */}
      <div className={`${styles.grid} ${styles.g2}`}>
        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Avance por fase (embudo)</h2>
              <p className={styles.cap}>
                <b>Qué muestra:</b> cuántos entregables han pasado cada fase de la metodología. Clic para el detalle.
              </p>
            </div>
          </div>
          <ReactECharts option={funnelOption} style={{ height: 320 }} notMerge onEvents={{ click: onFunnelClick }} />
        </div>
        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Riesgos priorizados</h2>
              <p className={styles.cap}>
                <b>Qué muestra:</b> los frentes que requieren atención (probabilidad × impacto). Generado del avance y las fechas.
              </p>
            </div>
            <span className={styles.badge}>{risks.length}</span>
          </div>
          {risks.length === 0 ? (
            <div className={styles.okState}>✓ Sin riesgos relevantes en este filtro.</div>
          ) : (
            <div className={styles.riskList}>
              {risks.slice(0, 5).map((r) => (
                <div className={styles.riskItem} key={r.key}>
                  <span className={styles.rdot} style={{ background: LEVEL_COLOR[r.level] }} />
                  <div>
                    <div className={styles.rlabel}>{r.label}</div>
                    <div className={styles.rreason}>
                      {countryShort(r.pais)} · {r.reason}
                    </div>
                  </div>
                  <span className={styles.rscore} style={{ background: `${LEVEL_COLOR[r.level]}22`, color: LEVEL_COLOR[r.level] }}>
                    {r.level} · {r.score}
                  </span>
                </div>
              ))}
            </div>
          )}
          {/* Mini-matriz 3x3 */}
          <div className={styles.rgrid}>
            {grid3.flatMap((row, ri) => [
              <div className={styles.axisY} key={`y${ri}`}>
                {row[0].impactBand}
              </div>,
              ...row.map((cell, ci) => (
                <div className={styles.cell} key={`${ri}-${ci}`} style={{ background: cell.color }}>
                  {cell.count || ''}
                </div>
              )),
            ])}
          </div>
          <div className={styles.rgridFoot}>
            <div />
            <div className="cellLabel" style={{ fontSize: 9, color: 'var(--ink3)', textAlign: 'center' }}>
              Prob. baja
            </div>
            <div className="cellLabel" style={{ fontSize: 9, color: 'var(--ink3)', textAlign: 'center' }}>
              media
            </div>
            <div className="cellLabel" style={{ fontSize: 9, color: 'var(--ink3)', textAlign: 'center' }}>
              alta
            </div>
          </div>
        </div>
      </div>

      {/* Fechas en riesgo + Plan de acción */}
      <div className={`${styles.grid} ${styles.g2}`}>
        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Fechas en riesgo</h2>
              <p className={styles.cap}>
                <b>Qué muestra:</b> entregables con una fecha de fase ya vencida sin completar (cómo vamos vs. plan).
              </p>
            </div>
            <span className={styles.badge}>{overdue.length}</span>
          </div>
          {overdue.length === 0 ? (
            <div className={styles.okState}>✓ Sin fechas vencidas.</div>
          ) : (
            <div className={styles.overdue}>
              {overdue.slice(0, 10).map((o, i) => (
                <div className={styles.overdueItem} key={i}>
                  <span>
                    {o.label} — {o.phase}
                  </span>
                  <span className="od">{o.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Plan de acción</h2>
              <p className={styles.cap}>
                <b>Qué muestra:</b> los próximos pasos comprometidos con responsable y fecha.
              </p>
            </div>
          </div>
          <div className={styles.steps}>
            {data.steps.map((s, i) => (
              <div className={styles.step} key={s.id}>
                <div className="sn">{i + 1}</div>
                <div>
                  <div className="st">{s.title}</div>
                  {s.description && <div className="sd">{s.description}</div>}
                </div>
                <div className="meta">
                  <span className="owner">{s.owner}</span>
                  <span className="due">{s.due}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sociedades por país */}
      <div className={styles.card}>
        <div className={styles.chead}>
          <div>
            <h2>Sociedades por país</h2>
            <p className={styles.cap}>
              <b>Qué muestra:</b> el avance de cada sociedad. Clic en una para ver sus reportes (BG/DRE/FF).
            </p>
          </div>
        </div>
        <div className={styles.tree}>
          {countries
            .filter((c) => pais === 'all' || c.code === pais)
            .map((c) => {
              const socs = socList(flat.filter((x) => x.f === c.code))
              return (
                <div className={styles.treeCol} key={c.code}>
                  <div className={styles.treeHead}>
                    <span>{c.name}</span>
                    <span style={{ color: bandColorHex(avgOf(flat.filter((x) => x.f === c.code))) }}>
                      {avgOf(flat.filter((x) => x.f === c.code))}%
                    </span>
                  </div>
                  {socs.map((s) => (
                    <div
                      className={styles.treeItem}
                      key={s.soc}
                      onClick={() =>
                        setModal({
                          title: s.soc,
                          sub: `${countryName(c.code)} · ${EST[s.est].label}`,
                          rows: s.reps.map((r) => ({
                            k: `${r.rep} (${r.code || '—'})`,
                            v: `${r.pct}% · ${r.last >= 0 ? phases[r.last]?.name || '—' : 'Sin iniciar'}`,
                          })),
                          note: s.reps.find((r) => r.obs)?.obs || undefined,
                        })
                      }
                    >
                      <span>{s.soc}</span>
                      <span className={styles.tpct} style={{ color: bandColorHex(s.pct) }}>
                        {s.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              )
            })}
        </div>
      </div>

      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <div>
                <h3>{modal.title}</h3>
                {modal.sub && <div className="sub">{modal.sub}</div>}
              </div>
              <button className={styles.modalClose} onClick={() => setModal(null)}>
                ✕
              </button>
            </div>
            {modal.rows.length === 0 ? (
              <div className={styles.modalNote}>Sin elementos.</div>
            ) : (
              modal.rows.map((r, i) => (
                <div className={styles.mrow} key={i}>
                  <span className="mk">{r.k}</span>
                  <span className="mv">{r.v}</span>
                </div>
              ))
            )}
            {modal.note && <div className={styles.modalNote}>{modal.note}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
