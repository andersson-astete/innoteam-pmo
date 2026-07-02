'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import ReactECharts from 'echarts-for-react'
import 'echarts-gl'
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
  estCounts,
  phaseCounts,
  buildRiskMatrix,
  type RiskItem,
} from '@/lib/report'
import styles from './report.module.css'

function cv(name: string, fallback = '#888'): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}
const LEVEL_COLOR: Record<RiskItem['level'], string> = {
  Crítico: '#F87171',
  Alto: '#FB923C',
  Medio: '#FBBF24',
  Bajo: '#34D399',
}

interface ModalData {
  title: string
  sub?: string
  rows: { k: string; v: string }[]
  note?: string
}

export default function ReportView({ projectId, canEdit }: { projectId: string; canEdit: boolean }) {
  const [data, setData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pais, setPais] = useState('all')
  const [estado, setEstado] = useState('all')
  const [themeTick, setThemeTick] = useState(0)
  const [modal, setModal] = useState<ModalData | null>(null)

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

  useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((t) => t + 1))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const flat = useMemo<FlatDeliverable[]>(() => (data ? flattenDeliverables(data) : []), [data])
  const countries = data?.countries || []
  const phases = data?.project.phases || []

  const fD = useMemo(
    () => flat.filter((d) => (pais === 'all' || d.f === pais) && (estado === 'all' || d.est === estado)),
    [flat, pais, estado]
  )

  const reset = useCallback(() => {
    setPais('all')
    setEstado('all')
  }, [])

  if (loading) return <div className={styles.loading}>Cargando reporte…</div>
  if (!data) return <div className={styles.loading}>Proyecto no encontrado.</div>

  const countryShort = (code: string) => {
    const c = countries.find((x) => x.code === code)
    return c?.short_name || c?.name || code
  }
  const countryName = (code: string) => countries.find((c) => c.code === code)?.name || code

  const avg = avgOf(fD)
  const counts = estCounts(fD)
  const societies = socList(flat)
  const risks = buildRiskMatrix(fD, phases)
  const criticalRisks = risks.filter((r) => r.level === 'Crítico' || r.level === 'Alto').length

  // ---- Colores tema ----
  const ink3 = cv('--ink3')
  const grid = cv('--grid')
  const panel = cv('--panel')
  const gaugeCol = bandColorHex(avg)

  // ---- KPIs ----
  const kUAT = fD.filter((x) => x.est === 'testing' || x.est === 'client').length
  const kPRD = fD.filter((x) => x.est === 'go').length
  const kpis = [
    {
      lab: 'Avance Global',
      val: `${avg}%`,
      color: gaugeCol,
      modal: (): ModalData => ({
        title: 'Avance global',
        sub: pais === 'all' ? 'Portafolio completo' : countryName(pais),
        rows: countries.map((c) => ({ k: c.name, v: `${avgOf(flat.filter((x) => x.f === c.code))}%` })),
        note: 'Promedio del avance de todos los entregables del alcance.',
      }),
    },
    {
      lab: 'Entregables',
      val: `${fD.length}`,
      color: cv('--brand'),
      modal: (): ModalData => ({
        title: 'Entregables',
        rows: [
          { k: 'Total', v: `${fD.length}` },
          { k: 'Sociedades', v: `${new Set(fD.map((x) => x.soc)).size}` },
          { k: 'Tipos de reporte', v: data.project.report_types.map((r) => r.code).join(', ') },
        ],
      }),
    },
    {
      lab: 'En pruebas UAT',
      val: `${kUAT}`,
      color: cv('--testc'),
      modal: (): ModalData => ({
        title: 'En pruebas integrales (UAT)',
        rows: fD
          .filter((x) => x.est === 'testing' || x.est === 'client')
          .map((x) => ({ k: `${x.soc} · ${x.rep}`, v: `${x.pct}%` })),
        note: 'Entregables liberados al cliente para pruebas integrales.',
      }),
    },
    {
      lab: 'En producción',
      val: `${kPRD}`,
      color: cv('--ok'),
      modal: (): ModalData => ({
        title: 'En producción',
        rows: fD.filter((x) => x.est === 'go').map((x) => ({ k: `${x.soc} · ${x.rep}`, v: `${x.pct}%` })),
      }),
    },
    {
      lab: 'Riesgos',
      val: `${criticalRisks}`,
      color: cv('--coral'),
      modal: (): ModalData => ({
        title: 'Riesgos priorizados',
        rows: risks.slice(0, 12).map((r) => ({ k: `${r.label} (${r.level})`, v: `P${r.probability}·I${r.impact}=${r.score}` })),
        note: 'Generados automáticamente del detalle (avance, fechas, fase).',
      }),
    },
  ]

  // ---- Velocímetro global ----
  const gaugeOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        progress: { show: true, width: 16, itemStyle: { color: gaugeCol } },
        axisLine: { lineStyle: { width: 16, color: [[1, cv('--track')]] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { width: 5, length: '62%', itemStyle: { color: gaugeCol } },
        anchor: { show: true, size: 14, itemStyle: { color: gaugeCol } },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          fontSize: 32,
          fontWeight: 800,
          color: gaugeCol,
          offsetCenter: [0, '42%'],
        },
        data: [{ value: avg }],
      },
    ],
  }

  // ---- Barras apiladas: país × estado ----
  const estKeys = (['testing', 'go', 'client', 'proc', 'init'] as Status[]).filter((k) => counts[k] > 0)
  const paisCodes = countries.map((c) => c.code)
  const stackedOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { textStyle: { color: ink3, fontSize: 10 }, top: 0, itemHeight: 8 },
    grid: { left: 34, right: 12, top: 34, bottom: 24 },
    xAxis: { type: 'category', data: paisCodes.map(countryShort), axisLabel: { color: ink3, fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { color: ink3 }, splitLine: { lineStyle: { color: grid } } },
    series: estKeys.map((k) => ({
      name: EST[k].label,
      type: 'bar',
      stack: 'x',
      emphasis: { focus: 'series' },
      itemStyle: { color: cv(EST[k].cssVar) },
      data: paisCodes.map((code) => flat.filter((x) => x.f === code && x.est === k).length),
    })),
  }

  // ---- Barras 3D: avance por país ----
  const bar3dOption = {
    tooltip: {},
    visualMap: {
      show: false,
      min: 0,
      max: 100,
      dimension: 2,
      inRange: { color: ['#FB923C', '#FBBF24', '#34D399'] },
    },
    xAxis3D: { type: 'category', data: paisCodes.map(countryShort), axisLabel: { color: ink3 } },
    yAxis3D: { type: 'category', data: ['Avance'], axisLabel: { show: false } },
    zAxis3D: { type: 'value', max: 100, axisLabel: { color: ink3 } },
    grid3D: {
      boxWidth: 110,
      boxDepth: 18,
      boxHeight: 70,
      viewControl: { alpha: 18, beta: 20, distance: 190, autoRotate: false },
      light: { main: { intensity: 1.3, shadow: true }, ambient: { intensity: 0.35 } },
      axisLine: { lineStyle: { color: ink3 } },
      splitLine: { lineStyle: { color: grid } },
    },
    series: [
      {
        type: 'bar3D',
        shading: 'lambert',
        bevelSize: 0.25,
        data: paisCodes.map((code, i) => ({ value: [i, 0, avgOf(flat.filter((x) => x.f === code))] })),
        itemStyle: { opacity: 0.92 },
        emphasis: { itemStyle: { opacity: 1 } },
      },
    ],
  }

  // ---- Matriz de riesgos (scatter prob × impacto) ----
  const riskOption = {
    tooltip: {
      formatter: (p: any) => `${p.data.name}<br/>Prob ${p.value[0]} · Impacto ${p.value[1]} · Puntaje ${p.value[2]}`,
    },
    grid: { left: 42, right: 18, top: 16, bottom: 40 },
    xAxis: {
      type: 'value',
      name: 'Probabilidad',
      nameLocation: 'middle',
      nameGap: 26,
      min: 0.5,
      max: 5.5,
      interval: 1,
      axisLabel: { color: ink3 },
      splitLine: { lineStyle: { color: grid } },
    },
    yAxis: {
      type: 'value',
      name: 'Impacto',
      nameLocation: 'middle',
      nameGap: 28,
      min: 0.5,
      max: 5.5,
      interval: 1,
      axisLabel: { color: ink3 },
      splitLine: { lineStyle: { color: grid } },
    },
    series: [
      {
        type: 'scatter',
        symbolSize: (d: number[]) => 14 + d[2] * 1.7,
        data: risks.map((r) => ({
          value: [r.probability, r.impact, r.score],
          name: r.label,
          itemStyle: { color: LEVEL_COLOR[r.level], opacity: 0.85, shadowBlur: 8, shadowColor: 'rgba(0,0,0,.3)' },
        })),
      },
    ],
  }

  // ---- Embudo por fase ----
  const fCounts = phaseCounts(fD, phases)
  const funnelOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} entregables' },
    series: [
      {
        type: 'funnel',
        left: '4%',
        right: '4%',
        top: 8,
        bottom: 8,
        minSize: '18%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: { show: true, position: 'inside', color: '#fff', fontSize: 10, formatter: '{b}' },
        itemStyle: { borderColor: panel, borderWidth: 1 },
        emphasis: { label: { fontWeight: 700 } },
        data: phases.map((p, i) => ({ name: p.name, value: fCounts[i] })),
      },
    ],
  }

  // ---- Handlers de clic ----
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
  const onRiskClick = (p: any) => {
    const r = risks[p.dataIndex]
    if (!r) return
    setModal({
      title: r.label,
      sub: `Riesgo ${r.level} · puntaje ${r.score}`,
      rows: [
        { k: 'País', v: countryName(r.pais) },
        { k: 'Probabilidad', v: `${r.probability} / 5` },
        { k: 'Impacto', v: `${r.impact} / 5` },
        { k: 'Puntaje', v: `${r.score} / 25` },
        { k: 'Motivo', v: r.reason },
      ],
      note: 'Riesgo calculado automáticamente del detalle del proyecto.',
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
      <div className={styles.rhead}>
        <div className={styles.rtitle}>
          <h1>{data.project.name}</h1>
          <p>{data.project.subtitle || 'Reporte de seguimiento'} · Reporte ejecutivo</p>
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

      {/* Filtros por país */}
      <div className={styles.filterbar}>
        <span className={styles.flabel}>País</span>
        <span className={`${styles.chip} ${pais === 'all' ? styles.chipActive : ''}`} onClick={reset}>
          Todos <span className={styles.n}>{flat.length}</span>
        </span>
        {countries.map((c) => (
          <span
            key={c.code}
            className={`${styles.chip} ${pais === c.code ? styles.chipActive : ''}`}
            onClick={() => setPais((p) => (p === c.code ? 'all' : c.code))}
          >
            {countryShort(c.code)} <span className={styles.n}>{flat.filter((x) => x.f === c.code).length}</span>
          </span>
        ))}
        {(pais !== 'all' || estado !== 'all') && (
          <button className={styles.freset} onClick={reset}>
            limpiar
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className={styles.kpis}>
        {kpis.map((k) => (
          <div key={k.lab} className={`${styles.kpi} ${styles.clickable}`} onClick={() => setModal(k.modal())}>
            <span className={styles.flt}>ver</span>
            <div className="lab">{k.lab}</div>
            <div className="val" style={{ color: k.color }}>
              {k.val}
            </div>
          </div>
        ))}
      </div>

      {/* Velocímetro + Barras apiladas */}
      <div className={`${styles.grid} ${styles.g2}`} style={{ marginTop: 14 }}>
        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Avance global</h2>
              <p className={styles.csub}>
                {pais === 'all' ? 'Portafolio completo' : countryName(pais)} · {fD.length} entregables
              </p>
            </div>
            <span className={styles.chartHint}>clic en tarjetas ↑</span>
          </div>
          <ReactECharts option={gaugeOption} style={{ height: 240 }} notMerge />
        </div>
        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Entregables por país y estado</h2>
              <p className={styles.csub}>Barras apiladas · clic en una barra</p>
            </div>
          </div>
          <ReactECharts
            option={stackedOption}
            style={{ height: 240 }}
            notMerge
            onEvents={{ click: onPaisBarClick }}
          />
        </div>
      </div>

      {/* Barras 3D + Matriz de riesgos */}
      <div className={`${styles.grid} ${styles.g2}`}>
        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Avance por país (3D)</h2>
              <p className={styles.csub}>Vista tridimensional · gira con el mouse</p>
            </div>
          </div>
          <ReactECharts option={bar3dOption} style={{ height: 300 }} notMerge />
        </div>
        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Matriz de riesgos</h2>
              <p className={styles.csub}>Automática · probabilidad × impacto · clic en un punto</p>
            </div>
            <span className={styles.badge}>{risks.length} riesgos</span>
          </div>
          <ReactECharts option={riskOption} style={{ height: 260 }} notMerge onEvents={{ click: onRiskClick }} />
          <div className={styles.riskLegend}>
            {(['Crítico', 'Alto', 'Medio', 'Bajo'] as const).map((l) => (
              <span key={l}>
                <i style={{ background: LEVEL_COLOR[l] }} /> {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Embudo + Próximos pasos */}
      <div className={`${styles.grid} ${styles.g2}`}>
        <div className={styles.card}>
          <div className={styles.chead}>
            <div>
              <h2>Embudo por fase</h2>
              <p className={styles.csub}>Entregables que alcanzaron cada fase · clic para detalle</p>
            </div>
          </div>
          <ReactECharts option={funnelOption} style={{ height: 340 }} notMerge onEvents={{ click: onFunnelClick }} />
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

      {/* Sociedades por país */}
      <div className={styles.card}>
        <div className={styles.chead}>
          <div>
            <h2>Sociedades por país</h2>
            <p className={styles.csub}>Clic en una sociedad para su detalle</p>
          </div>
        </div>
        <div className={styles.tree}>
          {countries
            .filter((c) => pais === 'all' || c.code === pais)
            .map((c) => {
              const socs = societies.filter((s) => s.f === c.code)
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

      {/* Modal */}
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
