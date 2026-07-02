'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js'
import { Doughnut, Radar } from 'react-chartjs-2'
import {
  getProjectData,
  flattenDeliverables,
  type ProjectData,
  type FlatDeliverable,
  type Status,
} from '@/lib/supabase'
import {
  EST,
  avgOf,
  bandColorHex,
  socList,
  phaseProfile,
  estCounts,
  phaseCounts,
} from '@/lib/report'
import styles from './report.module.css'

ChartJS.register(ArcElement, Tooltip, RadialLinearScale, PointElement, LineElement, Filler)

// Lee una variable CSS en runtime (sigue el tema claro/oscuro)
function cv(name: string, fallback = '#888'): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}
function hexToRgba(h: string, a: number): string {
  h = (h || '').replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h || '888888', 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

interface Filters {
  pais: string
  estado: string
  selSoc: string | null
}

export default function ReportView({ projectId, canEdit }: { projectId: string; canEdit: boolean }) {
  const [data, setData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({ pais: 'all', estado: 'all', selSoc: null })
  const [themeTick, setThemeTick] = useState(0)

  // Recargar al cambiar de proyecto
  useEffect(() => {
    let alive = true
    setLoading(true)
    getProjectData(projectId).then((d) => {
      if (alive) {
        setData(d)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [projectId])

  // Re-render de gráficos cuando cambia el tema (html.light)
  useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((t) => t + 1))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const flat = useMemo<FlatDeliverable[]>(() => (data ? flattenDeliverables(data) : []), [data])
  const phases = data?.project.phases || []
  const reportTypes = data?.project.report_types || []
  const countries = data?.countries || []

  const fD = useMemo(
    () =>
      flat.filter(
        (d) =>
          (filters.pais === 'all' || d.f === filters.pais) &&
          (filters.estado === 'all' || d.est === filters.estado)
      ),
    [flat, filters.pais, filters.estado]
  )

  const setPais = useCallback(
    (p: string) => setFilters((f) => ({ ...f, pais: f.pais === p ? 'all' : p, selSoc: null })),
    []
  )
  const setEstado = useCallback(
    (e: string) => setFilters((f) => ({ ...f, estado: f.estado === e ? 'all' : e, selSoc: null })),
    []
  )
  const reset = useCallback(() => setFilters({ pais: 'all', estado: 'all', selSoc: null }), [])

  if (loading) return <div className={styles.loading}>Cargando reporte…</div>
  if (!data) return <div className={styles.loading}>Proyecto no encontrado.</div>

  const countryName = (code: string) => countries.find((c) => c.code === code)?.name || code
  const countryShort = (code: string) => {
    const c = countries.find((x) => x.code === code)
    return c?.short_name || c?.name || code
  }

  const avg = avgOf(fD)
  const testing = fD.filter((x) => x.est === 'testing').length
  const client = fD.filter((x) => x.est === 'client').length
  const init = fD.filter((x) => x.est === 'init').length
  const socN = new Set(fD.map((x) => x.soc)).size
  const activeAlerts =
    filters.pais === 'all'
      ? data.alerts
      : data.alerts.filter((a) => a.country_code === 'all' || a.country_code === filters.pais)

  // -------- KPIs --------
  const kpis = [
    { lab: 'Avance Global', val: `${avg}%`, ic: '◑', icc: '#3B82F6', prog: avg, sub: 'ponderado del alcance' },
    { lab: 'Entregables', val: `${fD.length}`, ic: '▤', icc: '#6D5FD4', sub: `${socN} sociedades · ${reportTypes.length} reportes` },
    { lab: 'En pruebas', val: `${testing}`, ic: '⚑', icc: cv('--testc'), sub: 'pruebas integrales', est: 'testing' },
    { lab: 'Lado cliente', val: `${client}`, ic: '👤', icc: cv('--clientc'), sub: 'en su ambiente', est: 'client' },
    { lab: 'Etapa inicial', val: `${init}`, ic: '◔', icc: cv('--coral'), sub: 'por arrancar', est: 'init' },
    { lab: 'Alertas', val: `${activeAlerts.length}`, ic: '⚠', icc: cv('--warn'), sub: 'activas en el filtro' },
  ]

  // -------- Gauge global --------
  const gaugeCol = bandColorHex(avg)
  const gaugeData = {
    datasets: [
      {
        data: [avg, 100 - avg],
        backgroundColor: [gaugeCol, cv('--track')],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
      },
    ],
  }
  const gaugeOpts: any = {
    cutout: '72%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { tooltip: { enabled: false }, legend: { display: false } },
  }

  // -------- Donut por estado --------
  const counts = estCounts(fD)
  const donutKeys = (['testing', 'go', 'client', 'proc', 'init'] as Status[]).filter((k) => counts[k] > 0)
  const donutData = {
    labels: donutKeys.map((k) => EST[k].label),
    datasets: [
      {
        data: donutKeys.map((k) => counts[k]),
        backgroundColor: donutKeys.map((k) => cv(EST[k].cssVar)),
        borderColor: cv('--panel'),
        borderWidth: 3,
        hoverOffset: 7,
      },
    ],
  }
  const donutOpts: any = {
    cutout: '60%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    onClick: (_e: any, el: any) => {
      if (el.length) setEstado(donutKeys[el[0].index])
    },
  }

  // -------- Radar de fases --------
  const radarSets: any[] = [
    {
      label: 'Portafolio',
      data: phaseProfile(flat, phases),
      borderColor: cv('--ink3'),
      backgroundColor: 'rgba(128,128,128,.12)',
      borderWidth: 1.5,
      pointRadius: 2,
      pointBackgroundColor: cv('--ink3'),
    },
  ]
  if (filters.pais !== 'all') {
    radarSets.unshift({
      label: countryShort(filters.pais),
      data: phaseProfile(fD, phases),
      borderColor: cv('--blue'),
      backgroundColor: 'rgba(59,130,246,.18)',
      borderWidth: 2,
      pointRadius: 2.5,
      pointBackgroundColor: cv('--blue'),
    })
  }
  const radarData = { labels: phases.map((p) => p.name), datasets: radarSets }
  const radarOpts: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { display: false, stepSize: 25 },
        grid: { color: cv('--grid') },
        angleLines: { color: cv('--grid') },
        pointLabels: { color: cv('--ink3'), font: { size: 9 } },
      },
    },
    plugins: { legend: { display: false } },
  }

  // -------- Heatmap país × reporte --------
  const heatCodes = countries.map((c) => c.code)

  // -------- Funnel --------
  const totF = fD.length || 1
  const fCounts = phaseCounts(fD, phases)
  const g65 = fD.filter((x) => x.pct >= 65).length

  // -------- Sociedades (tabla + detalle) --------
  const societies = socList(flat).sort((a, b) => b.pct - a.pct)
  const societiesFiltered =
    filters.pais === 'all' ? societies : societies.filter((s) => s.f === filters.pais)

  // -------- Detalle --------
  let detailTitle = 'Portafolio completo'
  let detailSub = `${countries.length} países · ${new Set(flat.map((x) => x.soc)).size} sociedades · ${flat.length} entregables`
  let detailList = flat
  if (filters.selSoc) {
    detailList = flat.filter((d) => d.soc === filters.selSoc)
    detailTitle = filters.selSoc
    detailSub = countryName(detailList[0]?.f || '')
  } else if (filters.pais !== 'all' || filters.estado !== 'all') {
    detailList = fD
    detailTitle = filters.pais !== 'all' ? countryName(filters.pais) : EST[filters.estado as Status].label
    detailSub = `${new Set(detailList.map((x) => x.soc)).size} sociedades · ${detailList.length} entregables`
  }
  const dAvg = avgOf(detailList)
  const dTest = detailList.filter((x) => x.est === 'testing').length
  const dClient = detailList.filter((x) => x.est === 'client').length
  const dPend = detailList.filter((x) => x.est === 'proc' || x.est === 'init').length

  return (
    <div className={styles.wrap} key={themeTick}>
      {/* Header */}
      <div className={styles.rhead}>
        <div className={styles.rtitle}>
          <h1>{data.project.name}</h1>
          <p>
            {data.project.subtitle || 'Reporte de seguimiento'} · Reporte en vivo
          </p>
        </div>
        <div className={styles.ractions}>
          <Link href="/dashboard" className={styles.btn}>
            ← Proyectos
          </Link>
          {canEdit && (
            <Link href={`/dashboard/projects/${projectId}/edit`} className={styles.btn}>
              ✎ Editar
            </Link>
          )}
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => window.print()}>
            ⤓ Exportar
          </button>
        </div>
      </div>

      {/* Filtro por país */}
      <div className={styles.filterbar}>
        <span className={styles.flabel}>País</span>
        <span
          className={`${styles.chip} ${filters.pais === 'all' ? styles.chipActive : ''}`}
          onClick={reset}
        >
          Todos <span className={styles.n}>{flat.length}</span>
        </span>
        {countries.map((c) => {
          const n = flat.filter((x) => x.f === c.code).length
          return (
            <span
              key={c.code}
              className={`${styles.chip} ${filters.pais === c.code ? styles.chipActive : ''}`}
              onClick={() => setPais(c.code)}
            >
              {countryShort(c.code)} <span className={styles.n}>{n}</span>
            </span>
          )
        })}
      </div>
      <div className={styles.activeNote}>
        {filters.pais !== 'all' && (
          <span className={`${styles.fpill} ${styles.fpillPais}`}>País: {countryShort(filters.pais)}</span>
        )}
        {filters.estado !== 'all' && <span className={styles.fpill}>Estado: {EST[filters.estado as Status].label}</span>}
        {filters.selSoc && <span className={styles.fpill}>Sociedad: {filters.selSoc}</span>}
        {(filters.pais !== 'all' || filters.estado !== 'all' || filters.selSoc) ? (
          <button className={styles.freset} onClick={reset}>
            limpiar filtros
          </button>
        ) : (
          <span className={styles.fhint}>Haz clic en países, tarjetas, sociedades o segmentos para filtrar.</span>
        )}
      </div>

      {/* KPIs */}
      <div className={styles.kpis}>
        {kpis.map((k) => {
          const on = k.est && filters.estado === k.est
          return (
            <div
              key={k.lab}
              className={`${styles.kpi} ${k.est ? styles.kpiClickable : ''} ${on ? styles.kpiOn : ''}`}
              onClick={k.est ? () => setEstado(k.est!) : undefined}
            >
              {k.est && <span className={styles.flt}>filtrar</span>}
              <div className="lab">
                <span className="ic" style={{ background: hexToRgba(k.icc, 0.16), color: k.icc }}>
                  {k.ic}
                </span>
                {k.lab}
              </div>
              <div className="val">{k.val}</div>
              <div className="sub">{k.sub}</div>
              {typeof k.prog === 'number' && (
                <div className="prog">
                  <i style={{ width: `${k.prog}%`, background: bandColorHex(k.prog) }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Gauge global + mini-gauges por país */}
      <div className={`${styles.grid} ${styles.g21}`} style={{ marginTop: 14 }}>
        <div className={`${styles.card} ${styles.gaugecard}`}>
          <div className={styles.chead}>
            <div>
              <h2>Avance global del proyecto</h2>
              <p className={styles.csub}>
                {filters.pais === 'all' ? 'Portafolio completo' : countryName(filters.pais)}
                {filters.estado !== 'all' ? ` · ${EST[filters.estado as Status].label}` : ''}
              </p>
            </div>
            <span className={styles.badge}>{fD.length} entregables</span>
          </div>
          <div className={styles.gcenter}>
            <div className={styles.gaugebox}>
              <Doughnut data={gaugeData} options={gaugeOpts} />
              <div className={styles.gaugelabel}>
                <div className="big" style={{ color: gaugeCol }}>
                  {avg}%
                </div>
                <div className="cap">avance promedio</div>
              </div>
            </div>
            <div className={styles.gband}>
              <span>
                <i style={{ background: cv('--coral') }} /> &lt;30%
              </span>
              <span>
                <i style={{ background: cv('--warn') }} /> 30–65%
              </span>
              <span>
                <i style={{ background: cv('--ok') }} /> ≥65% (apto Go)
              </span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Avance por país</h2>
              <p className={styles.csub}>Clic para filtrar</p>
            </div>
          </div>
          <div className={styles.minigrid}>
            {countries.map((c) => {
              const dd = flat.filter((x) => x.f === c.code)
              const v = avgOf(dd)
              const col = bandColorHex(v)
              return (
                <div
                  key={c.code}
                  className={`${styles.mg} ${filters.pais === c.code ? styles.mgOn : ''}`}
                  onClick={() => setPais(c.code)}
                >
                  <div className={styles.mgbox}>
                    <Doughnut
                      data={{
                        datasets: [
                          {
                            data: [v, 100 - v],
                            backgroundColor: [col, cv('--track')],
                            borderWidth: 0,
                            circumference: 180,
                            rotation: 270,
                          },
                        ],
                      }}
                      options={gaugeOpts}
                    />
                    <div className={styles.mgval} style={{ color: col }}>
                      {v}%
                    </div>
                  </div>
                  <div className={styles.mgname}>{countryShort(c.code)}</div>
                  <div className={styles.mgsub}>{dd.length} entregables</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Donut por estado + Radar de fases */}
      <div className={`${styles.grid} ${styles.g2}`}>
        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Composición por estado</h2>
              <p className={styles.csub}>Clic en un segmento para filtrar</p>
            </div>
          </div>
          <div className={styles.chartbox} style={{ height: 240 }}>
            {donutKeys.length ? (
              <Doughnut data={donutData} options={donutOpts} />
            ) : (
              <div className={styles.loading}>Sin datos</div>
            )}
          </div>
          <div className={styles.legend}>
            {donutKeys.map((k) => (
              <div className="li" key={k} onClick={() => setEstado(k)} style={{ cursor: 'pointer' }}>
                <span className="sw" style={{ background: cv(EST[k].cssVar) }} />
                {EST[k].label}
                <b>{counts[k]}</b>
                <small>{Math.round((counts[k] / (fD.length || 1)) * 100)}%</small>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Perfil por fase</h2>
              <p className={styles.csub}>
                {filters.pais === 'all' ? '% que superó cada fase' : `${countryShort(filters.pais)} vs portafolio`}
              </p>
            </div>
          </div>
          <div className={styles.chartbox} style={{ height: 300 }}>
            <Radar data={radarData} options={radarOpts} />
          </div>
        </div>
      </div>

      {/* Heatmap + Funnel */}
      <div className={`${styles.grid} ${styles.g2}`}>
        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Mapa de calor · país × reporte</h2>
              <p className={styles.csub}>% de avance promedio</p>
            </div>
          </div>
          <div className={styles.heatrow}>
            <div />
            {reportTypes.map((r) => (
              <div className={styles.heathdr} key={r.code} title={r.name}>
                {r.code}
              </div>
            ))}
          </div>
          {heatCodes.map((code) => (
            <div className={styles.heatrow} key={code}>
              <div className={styles.heatlab}>{countryShort(code)}</div>
              {reportTypes.map((r) => {
                const v = avgOf(flat.filter((x) => x.f === code && x.rep === r.code))
                const col = bandColorHex(v)
                const a = 0.12 + 0.5 * (v / 100)
                return (
                  <div
                    key={r.code}
                    className={styles.heatcell}
                    style={{ background: hexToRgba(col, a), borderColor: hexToRgba(col, 0.35) }}
                    title={`${countryName(code)} · ${r.name}: ${v}%`}
                  >
                    {v}
                    <small>%</small>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Embudo por fase</h2>
              <p className={styles.csub}>Entregables que alcanzaron cada fase</p>
            </div>
          </div>
          <div className={styles.funnel}>
            {phases.map((p, i) => {
              const v = fCounts[i]
              const w = Math.round((v / totF) * 100)
              return (
                <div className={styles.row} key={i}>
                  <div className={styles.fl}>
                    <span className={styles.w}>{p.weight}%</span>
                    {p.name}
                  </div>
                  <div className={styles.ft}>
                    <div
                      className={styles.ff}
                      style={{ width: `${w}%`, background: `linear-gradient(90deg,#2b62c9,${cv('--blue')})` }}
                    />
                  </div>
                  <div className={styles.fv}>
                    <b>{v}</b> · {w}%
                  </div>
                </div>
              )
            })}
          </div>
          <div className={styles.callout}>
            <span className="ci">i</span>
            <p>
              <b>{g65}</b> entregables ≥65% (aptos para Go) · <b>{testing}</b> en pruebas integrales.
            </p>
          </div>
        </div>
      </div>

      {/* Alertas + Próximos pasos */}
      <div className={`${styles.grid} ${styles.g21}`}>
        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Riesgos y alertas</h2>
              <p className={styles.csub}>Ordenadas por severidad</p>
            </div>
            <span className={styles.badge}>{activeAlerts.length} activas</span>
          </div>
          <div className={styles.alerts}>
            {data.alerts
              .slice()
              .sort(
                (a, b) =>
                  (({ Alta: 0, Media: 1, Baja: 2, Gestión: 1.5 } as any)[a.severity] ?? 3) -
                  (({ Alta: 0, Media: 1, Baja: 2, Gestión: 1.5 } as any)[b.severity] ?? 3)
              )
              .map((a) => {
                const dim =
                  filters.pais !== 'all' && a.country_code !== 'all' && a.country_code !== filters.pais
                const sevCol =
                  a.severity === 'Alta'
                    ? cv('--red')
                    : a.severity === 'Media'
                      ? cv('--warn')
                      : a.severity === 'Baja'
                        ? cv('--warn')
                        : cv('--violet')
                return (
                  <div className={`${styles.alert} ${dim ? 'dim' : ''}`} key={a.id}>
                    <div className={styles.ahead}>
                      <span className="sev" style={{ background: sevCol }} />
                      <span className="at">{a.title}</span>
                      <span className="atag" style={{ background: hexToRgba(sevCol, 0.13), color: sevCol }}>
                        {a.severity}
                      </span>
                    </div>
                    {a.impact && (
                      <div className={styles.arow}>
                        <span className="k">Impacto</span>
                        <span className="v">{a.impact}</span>
                      </div>
                    )}
                    {a.action && (
                      <div className={styles.arow}>
                        <span className="k">Acción</span>
                        <span className="v">{a.action}</span>
                      </div>
                    )}
                    <div className={styles.afoot}>
                      <span className="owner">{a.owner}</span>
                      <span className="due">{a.due}</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Próximos pasos</h2>
              <p className={styles.csub}>Acciones priorizadas</p>
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

      {/* Detalle */}
      <div className={styles.card} style={{ marginBottom: 14 }}>
        <div className={`${styles.detail}`}>
          <div className="dhead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span className="dtitle" style={{ fontSize: 15, fontWeight: 700 }}>
              {detailTitle}
            </span>
            <span className="dsub" style={{ fontSize: 11.5, color: 'var(--ink3)' }}>
              {detailSub}
            </span>
          </div>
          <div className={styles.dstats}>
            <div className={styles.dstat}>
              <div className="dv" style={{ color: bandColorHex(dAvg) }}>
                {dAvg}%
              </div>
              <div className="dl">Avance</div>
            </div>
            <div className={styles.dstat}>
              <div className="dv">{dTest}</div>
              <div className="dl">En pruebas</div>
            </div>
            <div className={styles.dstat}>
              <div className="dv">{dClient}</div>
              <div className="dl">Lado cliente</div>
            </div>
            <div className={styles.dstat}>
              <div className="dv">{dPend}</div>
              <div className="dl">Pendientes</div>
            </div>
          </div>
          {filters.selSoc && (
            <div className={styles.repcards}>
              {detailList.map((r) => {
                const ph = r.last >= 0 ? phases[r.last]?.name || '—' : 'Sin iniciar'
                return (
                  <div className={styles.repcard} key={r.id}>
                    <div className="rh">
                      <span className="rc" style={{ background: hexToRgba('#3B82F6', 0.16), color: '#3B82F6' }}>
                        {r.rep}
                      </span>
                      <span className="rp" style={{ color: bandColorHex(r.pct) }}>
                        {r.pct}%
                      </span>
                    </div>
                    <div className="rph">{ph}</div>
                    {r.obs && <div className="ro">{r.obs}</div>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de sociedades */}
      <div className={styles.card}>
        <div className={styles.chead}>
          <div>
            <h2>Sociedades</h2>
            <p className={styles.csub}>{societiesFiltered.length} sociedades · clic para ver detalle</p>
          </div>
        </div>
        <div className={styles.tableScroll}>
          <table>
            <thead>
              <tr>
                <th>Sociedad</th>
                <th>País</th>
                <th>Reportes</th>
                <th>Avance</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {societiesFiltered.map((s) => (
                <tr
                  key={s.soc}
                  className={filters.selSoc === s.soc ? 'selected' : ''}
                  onClick={() =>
                    setFilters((f) => ({ ...f, selSoc: f.selSoc === s.soc ? null : s.soc }))
                  }
                >
                  <td className={styles.soc}>{s.soc}</td>
                  <td>{countryShort(s.f)}</td>
                  <td>
                    <div className={styles.reps}>
                      {s.reps
                        .slice()
                        .sort((a, b) => a.rep.localeCompare(b.rep))
                        .map((r) => (
                          <span
                            className={styles.rep}
                            key={r.id}
                            title={`${r.rep}: ${r.pct}%`}
                            style={{ borderColor: hexToRgba(bandColorHex(r.pct), 0.5), color: bandColorHex(r.pct) }}
                          >
                            {r.rep}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td>
                    <div className={styles.progress}>
                      <span className={styles.bar} style={{ width: 90 }}>
                        <i style={{ width: `${s.pct}%`, background: bandColorHex(s.pct) }} />
                      </span>
                      <span style={{ color: bandColorHex(s.pct) }}>{s.pct}%</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={styles.tbadge}
                      style={{ background: hexToRgba(cv(EST[s.est].cssVar), 0.15), color: cv(EST[s.est].cssVar) }}
                    >
                      {EST[s.est].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
