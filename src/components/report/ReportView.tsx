'use client'

import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import {
  getProjectData,
  flattenDeliverables,
  type ProjectData,
  type FlatDeliverable,
} from '@/lib/supabase'
import { avgOf } from '@/lib/report'

const pmoStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  
  .pmo-dashboard {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background-color: #f1f5f9;
    color: #0f172a;
    min-height: 100vh;
    padding-bottom: 3rem;
  }
  
  .pmo-header {
    background: white;
    padding: 1.25rem 2rem;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .pmo-header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .pmo-project-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #f1f5f9;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
  }
  .meta-label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; }
  .meta-value { font-size: 0.8rem; font-weight: 600; color: #0f172a; }
  
  .pmo-title h1 {
    font-size: 1.25rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.025em;
  }
  
  .pmo-title p {
    margin: 0.15rem 0 0 0;
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 500;
  }
  
  .pmo-container {
    max-width: 1440px;
    margin: 0 auto;
    padding: 1.5rem;
  }

  /* Compact Grid */
  .pmo-grid-kpi {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  @media (max-width: 1280px) { .pmo-grid-kpi { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (max-width: 768px) { .pmo-grid-kpi { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 480px) { .pmo-grid-kpi { grid-template-columns: repeat(1, minmax(0, 1fr)); } }

  .pmo-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.03), 0 2px 4px -2px rgb(0 0 0 / 0.03);
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .pmo-card.clickable { cursor: pointer; }
  .pmo-card.clickable:hover {
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05);
    transform: translateY(-2px);
    border-color: #cbd5e1;
  }

  .kpi-title {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .kpi-value {
    font-size: 2rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
  }
  
  .kpi-value.danger { color: #dc2626; }
  .kpi-value.success { color: #16a34a; }
  .kpi-value.warning { color: #ca8a04; }

  .kpi-subtitle {
    font-size: 0.7rem;
    font-weight: 600;
    color: #94a3b8;
    margin-top: 0.25rem;
  }

  .pmo-section-title {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .pmo-section-title::before {
    content: '';
    display: block;
    width: 4px;
    height: 14px;
    background: #009036;
    border-radius: 2px;
  }

  .filter-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    background: #f1f5f9;
    padding: 0.25rem;
    border-radius: 8px;
  }

  .filter-btn {
    padding: 0.35rem 1rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: transparent;
    color: #475569;
    transition: all 0.2s ease;
  }

  .filter-btn:hover { color: #0f172a; }
  .filter-btn.active { background: white; color: #0f172a; box-shadow: 0 1px 2px rgb(0 0 0 / 0.1); }

  /* Modal */
  .modal-backdrop {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 50;
    display: flex; align-items: center; justify-content: center; padding: 1rem;
    animation: fadeIn 0.2s ease-out;
  }
  .modal-content {
    background: white; border-radius: 16px; width: 100%; max-width: 900px; max-height: 85vh;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); display: flex; flex-direction: column;
    animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1); overflow: hidden;
  }
  .modal-header {
    padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0;
    display: flex; justify-content: space-between; align-items: center; background: #f8fafc;
  }
  .modal-header h2 { margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a; }
  .modal-close {
    background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;
    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
    border-radius: 50%; transition: background 0.2s;
  }
  .modal-close:hover { background: #e2e8f0; color: #0f172a; }
  .modal-body { padding: 0; overflow-y: auto; flex: 1; }
  .data-table { width: 100%; border-collapse: collapse; text-align: left; }
  .data-table th { padding: 0.75rem 1.25rem; background: #f1f5f9; color: #475569; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; }
  .data-table td { padding: 0.75rem 1.25rem; border-bottom: 1px solid #f1f5f9; font-size: 0.8rem; color: #1e293b; }
  .data-table tr:hover td { background: #f8fafc; }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
`

type ModalState = { isOpen: boolean; title: string; data: FlatDeliverable[] }

export default function ReportView({ projectId }: { projectId: string; canEdit?: boolean }) {
  const [data, setData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterCountry, setFilterCountry] = useState('ALL')
  const [modal, setModal] = useState<ModalState>({ isOpen: false, title: '', data: [] })

  useEffect(() => {
    let alive = true
    getProjectData(projectId).then((d) => {
      if (alive) {
        setData(d)
        setLoading(false)
      }
    })
    return () => { alive = false }
  }, [projectId])

  const flat = useMemo<FlatDeliverable[]>(() => (data ? flattenDeliverables(data) : []), [data])
  const countries = data?.countries || []
  const fD = useMemo(() => flat.filter((d) => filterCountry === 'ALL' || d.f === filterCountry), [flat, filterCountry])

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontFamily: 'sans-serif' }}>Cargando Control Tower...</div>
  if (!data) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontFamily: 'sans-serif' }}>Proyecto no encontrado.</div>

  // --- COMPACT NUMERIC METRICS ---
  const totalDeliverables = fD.length
  const overallProgressNum = totalDeliverables ? avgOf(fD) : 0
  const overallProgress = overallProgressNum.toFixed(1)
  
  const approvedDeliverables = fD.filter(d => d.pct >= 100)
  const approvedCount = approvedDeliverables.length
  const closureRate = totalDeliverables ? ((approvedCount / totalDeliverables) * 100).toFixed(1) : '0.0'
  
  const criticalDeliverables = fD.filter(d => d.pct < 25)
  const criticalRiskCount = criticalDeliverables.length
  
  const totalSocieties = data.societies.length
  const totalAlerts = data.alerts.length
  const totalSteps = data.steps.length
  const riskExposureNum = Math.min(100, (criticalRiskCount / (totalDeliverables || 1)) * 100)
  const riskExposure = riskExposureNum.toFixed(1)

  // Phase grouping
  const phaseNames = ['Planificación', 'Diseño BBP', 'Desarrollo EF', 'Pruebas UAT', 'Go-Live']
  const phaseData = [
    fD.filter(d => d.pct < 25),
    fD.filter(d => d.pct >= 25 && d.pct < 50),
    fD.filter(d => d.pct >= 50 && d.pct < 75),
    fD.filter(d => d.pct >= 75 && d.pct < 100),
    approvedDeliverables
  ]
  const phaseCounts = phaseData.map(arr => arr.length)

  // Pie & Donut logic
  const statusLabels = { 'init': 'Inicio', 'proc': 'Proceso', 'testing': 'Pruebas', 'client': 'Aprob. Cliente', 'go': 'Go-Live' }
  const statusCounts = fD.reduce((acc, curr) => {
    acc[curr.est] = (acc[curr.est] || 0) + 1; return acc
  }, {} as Record<string, number>)
  const statusChartData = Object.entries(statusCounts).map(([k, v]) => ({ name: statusLabels[k as keyof typeof statusLabels] || k, value: v }))

  const countryCodes = filterCountry === 'ALL' ? countries.map(c => c.code) : [filterCountry]
  const geoPieData = countryCodes.map(code => {
    const count = flat.filter(x => x.f === code).length
    const name = countries.find(x => x.code === code)?.name || code
    return { name, value: count }
  }).filter(x => x.value > 0)

  // --- ECHARTS CONFIGURATION ---

  // 1. Gauges (Smaller)
  const chartGaugeProgress = {
    series: [{
      type: 'gauge', startAngle: 180, endAngle: 0, min: 0, max: 100, splitNumber: 10,
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#16a34a' }]) },
      progress: { show: true, width: 12 }, pointer: { show: false },
      axisLine: { lineStyle: { width: 12, color: [[1, '#e2e8f0']] } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      title: { show: false },
      detail: { valueAnimation: true, offsetCenter: [0, '-15%'], fontSize: 24, fontWeight: 'bolder', color: '#0f172a', formatter: '{value}%' },
      data: [{ value: overallProgressNum, name: 'AVANCE REAL' }]
    }]
  }

  const chartGaugeRisk = {
    series: [{
      type: 'gauge', startAngle: 180, endAngle: 0, min: 0, max: 100, splitNumber: 10,
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#eab308' }, { offset: 1, color: '#dc2626' }]) },
      progress: { show: true, width: 12 }, pointer: { show: false },
      axisLine: { lineStyle: { width: 12, color: [[1, '#e2e8f0']] } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      title: { show: false },
      detail: { valueAnimation: true, offsetCenter: [0, '-15%'], fontSize: 24, fontWeight: 'bolder', color: '#dc2626', formatter: '{value}%' },
      data: [{ value: parseFloat(riskExposure), name: 'EXPOSICIÓN' }]
    }]
  }

  // 2. True Risk Matrix (Heatmap)
  const yAxisImpacts = ['Costo', 'Tiempo', 'Alcance']
  const xAxisSeverities = ['Baja', 'Media', 'Alta']
  
  // Initialize matrix [X, Y, Value]
  const matrixData: [number, number, number][] = []
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      matrixData.push([x, y, 0])
    }
  }

  data.alerts.forEach(alert => {
    let xIdx = 1; // Media by default
    let yIdx = 1; // Tiempo by default
    
    const sev = alert.severity?.toLowerCase() || ''
    if (sev.includes('baj') || sev.includes('low')) xIdx = 0
    else if (sev.includes('alt') || sev.includes('high')) xIdx = 2

    const imp = alert.impact?.toLowerCase() || ''
    if (imp.includes('cost')) yIdx = 0
    else if (imp.includes('alcan') || imp.includes('scop')) yIdx = 2

    const idx = matrixData.findIndex(d => d[0] === xIdx && d[1] === yIdx)
    if (idx !== -1) matrixData[idx][2]++
  })

  const chartRiskHeatmap = {
    tooltip: { position: 'top', formatter: (p: any) => `${xAxisSeverities[p.data[0]]} / ${yAxisImpacts[p.data[1]]}: ${p.data[2]} alertas` },
    grid: { left: '3%', right: '3%', bottom: '5%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: xAxisSeverities, axisLine: { show: false }, splitArea: { show: true } },
    yAxis: { type: 'category', data: yAxisImpacts, axisLine: { show: false }, splitArea: { show: true } },
    visualMap: {
      min: 0, max: Math.max(...matrixData.map(d => d[2]), 5),
      calculable: true, orient: 'horizontal', left: 'center', bottom: '0%', show: false,
      inRange: { color: ['#f8fafc', '#fef08a', '#f87171', '#991b1b'] }
    },
    series: [{
      name: 'Riesgos', type: 'heatmap', data: matrixData,
      label: { show: true, fontWeight: 'bold', fontSize: 16 },
      itemStyle: { borderColor: '#fff', borderWidth: 2, borderRadius: 4 }
    }]
  }

  // 3. Donuts and Pies
  const chartStatusDonut = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', icon: 'circle', itemWidth: 8, textStyle: { color: '#64748b', fontSize: 10 } },
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['50%', '40%'], avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      color: ['#94a3b8', '#3b82f6', '#f59e0b', '#10b981', '#009036'],
      data: statusChartData
    }]
  }

  const chartGeoPie = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', icon: 'circle', itemWidth: 8, textStyle: { color: '#64748b', fontSize: 10 } },
    series: [{
      type: 'pie', radius: '70%', center: ['50%', '40%'],
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      color: ['#1c3a91', '#0ea5e9', '#8cc63f', '#facc15', '#6366f1', '#ec4899'],
      data: geoPieData
    }]
  }

  // 4. Project Health Radar
  const chartRadarHealth = {
    tooltip: { trigger: 'item' },
    radar: {
      indicator: [
        { name: 'Avance', max: 100 },
        { name: 'Salud', max: 100 },
        { name: 'Velocidad', max: 100 },
        { name: 'Cierre', max: 100 },
        { name: 'Cobertura', max: 100 }
      ],
      center: ['50%', '50%'],
      radius: '65%',
      axisName: { color: '#475569', fontSize: 10, fontWeight: 'bold' },
      splitArea: { areaStyle: { color: ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1'].reverse() } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: [
          overallProgressNum,
          100 - riskExposureNum,
          Math.min(100, (approvedCount / (totalDeliverables || 1)) * 120), // Proxy for speed
          parseFloat(closureRate),
          100 // Proxy for coverage if project exists
        ],
        name: 'Salud del Proyecto',
        areaStyle: { color: 'rgba(59, 130, 246, 0.4)' },
        lineStyle: { color: '#2563eb', width: 2 },
        itemStyle: { color: '#1d4ed8' }
      }]
    }]
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pmoStyles }} />
      <div className="pmo-dashboard">
        
        {/* Header */}
        <header className="pmo-header">
          <div className="pmo-header-top">
            <div className="pmo-title">
              <h1>{data.project.name}</h1>
              <p>Dashboard Analítico y Cuantitativo PMO V4.0</p>
            </div>
            
            <div className="filter-group">
              <button onClick={() => setFilterCountry('ALL')} className={`filter-btn ${filterCountry === 'ALL' ? 'active' : ''}`}>Global</button>
              {countries.map(c => (
                <button key={c.code} onClick={() => setFilterCountry(c.code)} className={`filter-btn ${filterCountry === c.code ? 'active' : ''}`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="pmo-project-meta">
            <div className="meta-item"><span className="meta-label">Sponsor</span><span className="meta-value">{data.project.sponsor || 'N/A'}</span></div>
            <div className="meta-item"><span className="meta-label">PM</span><span className="meta-value">{data.project.pm || 'N/A'}</span></div>
            <div className="meta-item"><span className="meta-label">Líder</span><span className="meta-value">{data.project.user_lead || data.project.project_lead || 'N/A'}</span></div>
            <div className="meta-item"><span className="meta-label">Fase</span><span className="meta-value" style={{ textTransform: 'capitalize' }}>{data.project.stage || 'N/A'}</span></div>
          </div>
        </header>

        <main className="pmo-container">
          
          {/* COMPACT KPI GRID (6 cols on desktop) */}
          <div className="pmo-grid-kpi">
            <div className="pmo-card clickable" style={{ borderTop: '4px solid #1c3a91' }} onClick={() => setModal({ isOpen: true, title: 'Inventario de Avance', data: fD })}>
              <div className="kpi-title">Avance Real</div>
              <div className="kpi-value">{overallProgress}%</div>
            </div>

            <div className="pmo-card clickable" onClick={() => setModal({ isOpen: true, title: 'Entregables Aprobados', data: approvedDeliverables })}>
              <div className="kpi-title" style={{ color: '#009036' }}>Tasa de Cierre</div>
              <div className="kpi-value success">{closureRate}%</div>
            </div>

            <div className="pmo-card clickable" onClick={() => setModal({ isOpen: true, title: 'Frentes en Riesgo Crítico (<25%)', data: criticalDeliverables })}>
              <div className="kpi-title" style={{ color: '#dc2626' }}>Frentes Críticos</div>
              <div className="kpi-value danger">{criticalRiskCount}</div>
            </div>

            <div className="pmo-card">
              <div className="kpi-title" style={{ color: '#ca8a04' }}>Riesgos Activos</div>
              <div className="kpi-value warning">{totalAlerts}</div>
            </div>

            <div className="pmo-card">
              <div className="kpi-title">Plan Acción</div>
              <div className="kpi-value">{totalSteps}</div>
            </div>

            <div className="pmo-card">
              <div className="kpi-title">Sociedades</div>
              <div className="kpi-value">{totalSocieties}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.25rem' }}>
            
            {/* GAUGES (Small) */}
            <div className="pmo-card" style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, textAlign: 'center', color: '#1e293b', marginBottom: '-10px' }}>Termómetro Avance</div>
                <ReactECharts option={chartGaugeProgress} style={{ height: '140px' }} />
              </div>
            </div>

            <div className="pmo-card" style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, textAlign: 'center', color: '#1e293b', marginBottom: '-10px' }}>Termómetro Riesgo</div>
                <ReactECharts option={chartGaugeRisk} style={{ height: '140px' }} />
              </div>
            </div>

            {/* PIE CHARTS */}
            <div className="pmo-card" style={{ gridColumn: 'span 3' }}>
              <h2 className="pmo-section-title" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Distribución Fases</h2>
              <ReactECharts option={chartStatusDonut} style={{ height: '180px' }} />
            </div>

            <div className="pmo-card" style={{ gridColumn: 'span 3' }}>
              <h2 className="pmo-section-title" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Peso Geográfico</h2>
              <ReactECharts option={chartGeoPie} style={{ height: '180px' }} />
            </div>

            {/* ADVANCED PMO VISUALS */}
            <div className="pmo-card" style={{ gridColumn: 'span 6' }}>
              <h2 className="pmo-section-title">Matriz de Riesgo Real (Heatmap)</h2>
              <ReactECharts option={chartRiskHeatmap} style={{ height: '260px' }} />
            </div>

            <div className="pmo-card" style={{ gridColumn: 'span 6' }}>
              <h2 className="pmo-section-title">Radar de Salud del Proyecto</h2>
              <ReactECharts option={chartRadarHealth} style={{ height: '260px' }} />
            </div>

            {/* DIRECT ACTION PLAN TABLE */}
            <div className="pmo-card" style={{ gridColumn: 'span 12' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="pmo-section-title" style={{ margin: 0 }}>Plan de Acción Inmediato (Steering Committee)</h2>
              </div>
              
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <table className="data-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>N°</th>
                      <th style={{ width: '45%' }}>Acción Crítica</th>
                      <th style={{ width: '25%' }}>Dueño (Owner)</th>
                      <th style={{ width: '25%' }}>Compromiso (Due)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.steps.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No hay acciones registradas.</td></tr>
                    ) : (
                      data.steps.map((s, index) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 800, color: '#94a3b8' }}>{index + 1}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.title}</div>
                            {s.description && <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{s.description}</div>}
                          </td>
                          <td style={{ fontWeight: 600, color: '#1c3a91' }}>{s.owner || '—'}</td>
                          <td>
                            <span style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.7rem' }}>
                              {s.due || 'Por Definir'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
        
        {/* MODAL */}
        {modal.isOpen && (
          <div className="modal-backdrop" onClick={() => setModal({ ...modal, isOpen: false })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{modal.title}</h2>
                <button className="modal-close" onClick={() => setModal({ ...modal, isOpen: false })}>&times;</button>
              </div>
              <div className="modal-body">
                {modal.data.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Sin datos disponibles.</div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>País</th>
                        <th>Sociedad</th>
                        <th>Reporte</th>
                        <th>Estado</th>
                        <th>Avance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modal.data.map(item => {
                        let statusColor = '#94a3b8'
                        if (item.pct === 100) statusColor = '#16a34a'
                        else if (item.pct < 25) statusColor = '#dc2626'
                        else if (item.pct > 60) statusColor = '#2563eb'
                        
                        return (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 700 }}>{item.f}</td>
                            <td>{item.soc}</td>
                            <td>{item.code || item.rep}</td>
                            <td>
                              <span style={{ fontSize: '0.7rem', fontWeight: 600, background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                                {item.est}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '50px', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                                  <div style={{ height: '100%', width: \`\${item.pct}%\`, background: statusColor, borderRadius: '3px' }} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: statusColor }}>{item.pct}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
        
      </div>
    </>
  )
}
