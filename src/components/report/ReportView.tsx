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
    padding: 1.5rem 2rem;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05);
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid #e2e8f0;
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
    gap: 0.75rem;
    margin-top: 1.25rem;
  }

  .meta-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 0.35rem 0.85rem;
    border-radius: 99px;
  }
  
  .meta-badge svg { color: #64748b; width: 14px; height: 14px; }
  .meta-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; }
  .meta-value { font-size: 0.75rem; font-weight: 700; color: #0f172a; margin-left: 0.25rem; }
  
  .pmo-title h1 {
    font-size: 1.5rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.025em;
  }
  
  .pmo-title p {
    margin: 0.15rem 0 0 0;
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 600;
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
    gap: 1.25rem;
    margin-bottom: 1.5rem;
  }
  
  @media (max-width: 1280px) { .pmo-grid-kpi { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (max-width: 768px) { .pmo-grid-kpi { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 480px) { .pmo-grid-kpi { grid-template-columns: repeat(1, minmax(0, 1fr)); } }

  .pmo-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 1.25rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.02), 0 2px 4px -2px rgb(0 0 0 / 0.02);
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  
  .pmo-card.clickable { cursor: pointer; }
  .pmo-card.clickable:hover {
    box-shadow: 0 10px 20px -3px rgb(0 0 0 / 0.06), 0 4px 6px -4px rgb(0 0 0 / 0.04);
    transform: translateY(-2px);
    border-color: #cbd5e1;
  }

  .kpi-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .kpi-title {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 800;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .kpi-icon {
    color: #cbd5e1;
    width: 20px;
    height: 20px;
  }

  .kpi-value {
    font-size: 2.25rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
    letter-spacing: -0.025em;
  }
  
  .kpi-value.danger { color: #dc2626; }
  .kpi-value.success { color: #10b981; }
  .kpi-value.warning { color: #eab308; }

  .pmo-section-title {
    font-size: 1rem;
    font-weight: 800;
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
    padding: 0.35rem;
    border-radius: 10px;
  }

  .filter-btn {
    padding: 0.35rem 1rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    border: none;
    background: transparent;
    color: #475569;
    transition: all 0.2s ease;
  }

  .filter-btn:hover { color: #0f172a; }
  .filter-btn.active { background: white; color: #0f172a; box-shadow: 0 1px 3px rgb(0 0 0 / 0.08); }

  /* Modal */
  .modal-backdrop {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(6px); z-index: 50;
    display: flex; align-items: center; justify-content: center; padding: 1rem;
    animation: fadeIn 0.2s ease-out;
  }
  .modal-content {
    background: white; border-radius: 20px; width: 100%; max-width: 900px; max-height: 85vh;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); display: flex; flex-direction: column;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); overflow: hidden;
  }
  .modal-header {
    padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0;
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
  .data-table th { padding: 0.85rem 1.25rem; background: #f1f5f9; color: #475569; font-weight: 800; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; }
  .data-table td { padding: 0.85rem 1.25rem; border-bottom: 1px solid #f1f5f9; font-size: 0.8rem; color: #1e293b; font-weight: 500; }
  .data-table tr:hover td { background: #f8fafc; }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
`

type ModalState = { isOpen: boolean; title: string; data: FlatDeliverable[] }

// SVG Icons for Badges & Cards
const IconUser = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IconTarget = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
const IconCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
const IconAlert = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IconShield = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IconList = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const IconGlobe = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>

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

  // 1. Gauges
  const chartGaugeProgress = {
    series: [{
      type: 'gauge', startAngle: 180, endAngle: 0, min: 0, max: 100, splitNumber: 10,
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#10b981' }]) },
      progress: { show: true, width: 14, roundCap: true }, pointer: { show: false },
      axisLine: { lineStyle: { width: 14, color: [[1, '#f1f5f9']] }, roundCap: true }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      title: { show: false },
      detail: { valueAnimation: true, offsetCenter: [0, '-10%'], fontSize: 26, fontWeight: 800, color: '#0f172a', formatter: '{value}%' },
      data: [{ value: overallProgressNum, name: 'AVANCE' }]
    }]
  }

  const chartGaugeRisk = {
    series: [{
      type: 'gauge', startAngle: 180, endAngle: 0, min: 0, max: 100, splitNumber: 10,
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#fbbf24' }, { offset: 1, color: '#dc2626' }]) },
      progress: { show: true, width: 14, roundCap: true }, pointer: { show: false },
      axisLine: { lineStyle: { width: 14, color: [[1, '#f1f5f9']] }, roundCap: true }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      title: { show: false },
      detail: { valueAnimation: true, offsetCenter: [0, '-10%'], fontSize: 26, fontWeight: 800, color: '#dc2626', formatter: '{value}%' },
      data: [{ value: parseFloat(riskExposure), name: 'RIESGO' }]
    }]
  }

  // 2. Strict PMBOK Risk Matrix
  const yAxisImpacts = ['Costo', 'Tiempo', 'Alcance']
  const xAxisSeverities = ['Baja', 'Media', 'Alta']
  
  // getRiskColor strictly follows PMBOK mapping
  const getRiskColor = (x: number, y: number, val: number) => {
    if (val === 0) return '#f8fafc' // empty
    if (x === 2 && y === 2) return '#dc2626' // Red (Alta, Alcance/Alto)
    if ((x === 2 && y === 1) || (x === 1 && y === 2)) return '#ea580c' // Orange
    if ((x === 0 && y === 2) || (x === 2 && y === 0) || (x === 1 && y === 1)) return '#eab308' // Yellow
    if ((x === 1 && y === 0) || (x === 0 && y === 1)) return '#84cc16' // Light green
    if (x === 0 && y === 0) return '#22c55e' // Green
    return '#cbd5e1'
  }

  const rawMatrix = [
    [0,0,0], [1,0,0], [2,0,0],
    [0,1,0], [1,1,0], [2,1,0],
    [0,2,0], [1,2,0], [2,2,0]
  ]

  data.alerts.forEach(alert => {
    let xIdx = 1; let yIdx = 1;
    const sev = alert.severity?.toLowerCase() || ''
    if (sev.includes('baj') || sev.includes('low')) xIdx = 0
    else if (sev.includes('alt') || sev.includes('high')) xIdx = 2
    const imp = alert.impact?.toLowerCase() || ''
    if (imp.includes('cost')) yIdx = 0
    else if (imp.includes('alcan') || imp.includes('scop')) yIdx = 2

    const idx = rawMatrix.findIndex(d => d[0] === xIdx && d[1] === yIdx)
    if (idx !== -1) rawMatrix[idx][2]++
  })

  const matrixDataSeries = rawMatrix.map(item => ({
    value: item,
    itemStyle: { color: getRiskColor(item[0], item[1], item[2]) }
  }))

  const chartRiskHeatmap = {
    tooltip: { position: 'top', formatter: (p: any) => `<div style="font-weight:bold;color:#0f172a">${xAxisSeverities[p.data.value[0]]} / ${yAxisImpacts[p.data.value[1]]}</div><div>${p.data.value[2]} Alertas activas</div>` },
    grid: { left: '3%', right: '3%', bottom: '5%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: xAxisSeverities, axisLine: { show: false }, splitArea: { show: true }, axisLabel: { fontWeight: 700, color: '#64748b' } },
    yAxis: { type: 'category', data: yAxisImpacts, axisLine: { show: false }, splitArea: { show: true }, axisLabel: { fontWeight: 700, color: '#64748b' } },
    series: [{
      name: 'Riesgos', type: 'heatmap', data: matrixDataSeries,
      label: { show: true, formatter: (p: any) => p.data.value[2] > 0 ? p.data.value[2] : '', fontWeight: 800, fontSize: 18, color: '#ffffff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowBlur: 2 },
      itemStyle: { borderColor: '#ffffff', borderWidth: 4, borderRadius: 8 }
    }]
  }

  // 3. Donuts and Pies
  const chartStatusDonut = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', icon: 'circle', itemWidth: 10, textStyle: { color: '#475569', fontSize: 11, fontWeight: 600 } },
    series: [{
      type: 'pie', radius: ['50%', '75%'], center: ['50%', '40%'], avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      color: ['#94a3b8', '#3b82f6', '#f59e0b', '#10b981', '#009036'],
      data: statusChartData
    }]
  }

  const chartGeoPie = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', icon: 'circle', itemWidth: 10, textStyle: { color: '#475569', fontSize: 11, fontWeight: 600 } },
    series: [{
      type: 'pie', radius: '75%', center: ['50%', '40%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      color: ['#1c3a91', '#0ea5e9', '#8cc63f', '#facc15', '#6366f1', '#ec4899'],
      data: geoPieData
    }]
  }

  // 4. Nightingale Rose Chart (replaces Radar)
  const chartNightingaleRose = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    legend: { show: false },
    series: [
      {
        name: 'Salud',
        type: 'pie',
        radius: [20, '85%'],
        center: ['50%', '50%'],
        roseType: 'area',
        itemStyle: { borderRadius: 8 },
        label: { show: true, formatter: '{b}', fontWeight: 700, color: '#475569' },
        data: [
          { value: overallProgressNum, name: 'Avance', itemStyle: { color: '#3b82f6' } },
          { value: 100 - riskExposureNum, name: 'Salud', itemStyle: { color: '#10b981' } },
          { value: Math.min(100, (approvedCount / (totalDeliverables || 1)) * 120), name: 'Velocidad', itemStyle: { color: '#f59e0b' } },
          { value: parseFloat(closureRate), name: 'Cierre', itemStyle: { color: '#8cc63f' } },
          { value: 100, name: 'Cobertura', itemStyle: { color: '#1c3a91' } }
        ]
      }
    ]
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pmoStyles }} />
      <div className="pmo-dashboard">
        
        {/* VIP Header with Badges */}
        <header className="pmo-header">
          <div className="pmo-header-top">
            <div className="pmo-title">
              <h1>{data.project.name}</h1>
              <p>Dashboard Ejecutivo · Control Tower V5.0</p>
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
            <div className="meta-badge">
              <IconUser />
              <span className="meta-label">Sponsor:</span>
              <span className="meta-value">{data.project.sponsor || 'N/A'}</span>
            </div>
            <div className="meta-badge">
              <IconUser />
              <span className="meta-label">PM:</span>
              <span className="meta-value">{data.project.pm || 'N/A'}</span>
            </div>
            <div className="meta-badge">
              <IconUser />
              <span className="meta-label">Líder:</span>
              <span className="meta-value">{data.project.user_lead || data.project.project_lead || 'N/A'}</span>
            </div>
            <div className="meta-badge">
              <IconTarget />
              <span className="meta-label">Fase Actual:</span>
              <span className="meta-value" style={{ textTransform: 'capitalize' }}>{data.project.stage || 'N/A'}</span>
            </div>
          </div>
        </header>

        <main className="pmo-container">
          
          {/* VIP COMPACT KPI GRID (6 cols on desktop) */}
          <div className="pmo-grid-kpi">
            <div className="pmo-card clickable" onClick={() => setModal({ isOpen: true, title: 'Inventario de Avance', data: fD })}>
              <div className="kpi-header">
                <div className="kpi-title">Avance Real</div>
                <div className="kpi-icon"><IconTarget /></div>
              </div>
              <div className="kpi-value">{overallProgress}%</div>
            </div>

            <div className="pmo-card clickable" onClick={() => setModal({ isOpen: true, title: 'Entregables Aprobados', data: approvedDeliverables })}>
              <div className="kpi-header">
                <div className="kpi-title">Tasa Cierre</div>
                <div className="kpi-icon"><IconCheck /></div>
              </div>
              <div className="kpi-value success">{closureRate}%</div>
            </div>

            <div className="pmo-card clickable" onClick={() => setModal({ isOpen: true, title: 'Frentes en Riesgo Crítico (<25%)', data: criticalDeliverables })}>
              <div className="kpi-header">
                <div className="kpi-title">Frentes Críticos</div>
                <div className="kpi-icon"><IconAlert /></div>
              </div>
              <div className="kpi-value danger">{criticalRiskCount}</div>
            </div>

            <div className="pmo-card">
              <div className="kpi-header">
                <div className="kpi-title">Riesgos Activos</div>
                <div className="kpi-icon"><IconShield /></div>
              </div>
              <div className="kpi-value warning">{totalAlerts}</div>
            </div>

            <div className="pmo-card">
              <div className="kpi-header">
                <div className="kpi-title">Plan Acción</div>
                <div className="kpi-icon"><IconList /></div>
              </div>
              <div className="kpi-value">{totalSteps}</div>
            </div>

            <div className="pmo-card">
              <div className="kpi-header">
                <div className="kpi-title">Sociedades</div>
                <div className="kpi-icon"><IconGlobe /></div>
              </div>
              <div className="kpi-value">{totalSocieties}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.25rem' }}>
            
            {/* GAUGES (Small) */}
            <div className="pmo-card" style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center', paddingTop: '1.5rem' }}>
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, textAlign: 'center', color: '#1e293b', marginBottom: '-10px' }}>Termómetro Avance</div>
                <ReactECharts option={chartGaugeProgress} style={{ height: '140px' }} />
              </div>
            </div>

            <div className="pmo-card" style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center', paddingTop: '1.5rem' }}>
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, textAlign: 'center', color: '#1e293b', marginBottom: '-10px' }}>Exposición Riesgo</div>
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
              <h2 className="pmo-section-title">Matriz de Riesgo PMBOK</h2>
              <ReactECharts option={chartRiskHeatmap} style={{ height: '280px' }} />
            </div>

            <div className="pmo-card" style={{ gridColumn: 'span 6' }}>
              <h2 className="pmo-section-title">Rose Chart: Salud de Proyecto</h2>
              <ReactECharts option={chartNightingaleRose} style={{ height: '280px' }} />
            </div>

            {/* DIRECT ACTION PLAN TABLE */}
            <div className="pmo-card" style={{ gridColumn: 'span 12' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 className="pmo-section-title" style={{ margin: 0 }}>Plan de Acción Inmediato (Steering Committee)</h2>
              </div>
              
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
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
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{s.title}</div>
                            {s.description && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{s.description}</div>}
                          </td>
                          <td style={{ fontWeight: 700, color: '#1c3a91' }}>{s.owner || '—'}</td>
                          <td>
                            <span style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.7rem' }}>
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
                        if (item.pct === 100) statusColor = '#10b981'
                        else if (item.pct < 25) statusColor = '#dc2626'
                        else if (item.pct > 60) statusColor = '#3b82f6'
                        
                        return (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 800 }}>{item.f}</td>
                            <td>{item.soc}</td>
                            <td>{item.code || item.rep}</td>
                            <td>
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
                                {item.est}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '60px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${item.pct}%`, background: statusColor, borderRadius: '3px' }} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: statusColor }}>{item.pct}%</span>
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
