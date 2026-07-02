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
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #f1f5f9;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
  }
  .meta-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; }
  .meta-value { font-size: 0.85rem; font-weight: 600; color: #0f172a; }
  
  .pmo-title h1 {
    font-size: 1.5rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.025em;
  }
  
  .pmo-title p {
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
  }
  
  .pmo-container {
    max-width: 1440px;
    margin: 0 auto;
    padding: 2rem;
  }

  .pmo-grid-kpi {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  @media (max-width: 1024px) {
    .pmo-grid-kpi { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .pmo-grid-kpi { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  }

  .pmo-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.03), 0 2px 4px -2px rgb(0 0 0 / 0.03);
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .pmo-card.clickable {
    cursor: pointer;
  }
  .pmo-card.clickable:hover {
    box-shadow: 0 12px 20px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05);
    transform: translateY(-2px);
    border-color: #cbd5e1;
  }

  .kpi-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .kpi-value {
    font-size: 2.25rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
    margin-bottom: 0.5rem;
  }

  .kpi-subtitle {
    font-size: 0.875rem;
    font-weight: 600;
    color: #94a3b8;
    margin-top: auto;
  }

  .pmo-section-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 1.25rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .pmo-section-title::before {
    content: '';
    display: block;
    width: 4px;
    height: 16px;
    background: #009036;
    border-radius: 2px;
  }

  .filter-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    background: #f1f5f9;
    padding: 0.375rem;
    border-radius: 12px;
  }

  .filter-btn {
    padding: 0.5rem 1.25rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: transparent;
    color: #475569;
    transition: all 0.2s ease;
  }

  .filter-btn:hover { color: #0f172a; }
  .filter-btn.active { background: white; color: #0f172a; box-shadow: 0 1px 3px rgb(0 0 0 / 0.1); }

  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.35rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-good { background: #dcfce7; color: #166534; }
  .status-warn { background: #fef9c3; color: #854d0e; }
  .status-danger { background: #fee2e2; color: #991b1b; }

  /* Modal Styles */
  .modal-backdrop {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(4px);
    z-index: 50;
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
    animation: fadeIn 0.2s ease-out;
  }
  
  .modal-content {
    background: white;
    border-radius: 20px;
    width: 100%; max-width: 800px; max-height: 85vh;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    display: flex; flex-direction: column;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    overflow: hidden;
  }
  
  .modal-header {
    padding: 1.5rem; border-bottom: 1px solid #e2e8f0;
    display: flex; justify-content: space-between; align-items: center;
    background: #f8fafc;
  }
  
  .modal-header h2 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; }
  
  .modal-close {
    background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;
    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
    border-radius: 50%; transition: background 0.2s;
  }
  .modal-close:hover { background: #e2e8f0; color: #0f172a; }
  
  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .data-table { width: 100%; border-collapse: collapse; text-align: left; }
  .data-table th { padding: 0.75rem 1rem; background: #f1f5f9; color: #475569; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
  .data-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; color: #1e293b; }
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

  // --- PMO EXPERT METRICS CALCULATION ---
  const totalDeliverables = fD.length
  const overallProgress = totalDeliverables ? Math.round(avgOf(fD)) : 0
  
  const approvedDeliverables = fD.filter(d => d.pct >= 100)
  const approvedCount = approvedDeliverables.length
  
  const criticalDeliverables = fD.filter(d => d.pct < 25)
  const criticalRiskCount = criticalDeliverables.length
  
  const totalSocieties = data.societies.length

  // Health logic
  let healthStatus = 'good'
  let healthLabel = 'Saludable'
  if (criticalRiskCount > (totalDeliverables * 0.15)) { healthStatus = 'danger'; healthLabel = 'Riesgo Alto' }
  else if (criticalRiskCount > 0 || overallProgress < 40) { healthStatus = 'warn'; healthLabel = 'Riesgo Medio' }

  // Phase calculation
  const phaseNames = ['Planificación', 'Diseño BBP', 'Desarrollo EF', 'Pruebas UAT', 'Go-Live']
  const phaseData = [
    fD.filter(d => d.pct < 25),
    fD.filter(d => d.pct >= 25 && d.pct < 50),
    fD.filter(d => d.pct >= 50 && d.pct < 75),
    fD.filter(d => d.pct >= 75 && d.pct < 100),
    approvedDeliverables
  ]
  const phaseCounts = phaseData.map(arr => arr.length)
  const maxPhaseIndex = phaseCounts.indexOf(Math.max(...phaseCounts))
  const bottleneckPhase = phaseNames[maxPhaseIndex] || 'N/A'
  const bottleneckData = phaseData[maxPhaseIndex] || []

  // Status Distribution
  const statusLabels = { 'init': 'Inicio', 'proc': 'Proceso', 'testing': 'Pruebas', 'client': 'Aprob. Cliente', 'go': 'Go-Live' }
  const statusCounts = fD.reduce((acc, curr) => {
    acc[curr.est] = (acc[curr.est] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const statusChartData = Object.entries(statusCounts).map(([key, val]) => ({
    name: statusLabels[key as keyof typeof statusLabels] || key,
    value: val
  }))

  // Top 5 Lowest Societies
  const societyAvgs = data.societies.map(soc => {
    const sData = flat.filter(x => x.society_id === soc.id)
    return { name: soc.name, avg: sData.length ? Math.round(avgOf(sData)) : 0, count: sData.length }
  }).filter(s => s.count > 0).sort((a, b) => a.avg - b.avg).slice(0, 5)

  // --- ECHARTS CONFIGURATION ---

  const chartRoadmapOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '5%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: phaseNames, axisLine: { lineStyle: { color: '#cbd5e1' } }, axisLabel: { color: '#475569', fontWeight: 'bold' } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
    series: [{
      name: 'Entregables en Fase', type: 'bar', barWidth: '45%',
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#0ea5e9' }, { offset: 1, color: '#1c3a91' }]), borderRadius: [6, 6, 0, 0] },
      data: phaseCounts, label: { show: true, position: 'top', color: '#0f172a', fontWeight: 'bold', fontSize: 14 }
    }]
  }

  const chartStatusOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', icon: 'circle', itemWidth: 10, textStyle: { color: '#64748b', fontWeight: 'bold', fontSize: 11 } },
    series: [{
      name: 'Estado', type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      color: ['#94a3b8', '#3b82f6', '#f59e0b', '#10b981', '#009036'],
      data: statusChartData
    }]
  }

  const countryCodes = filterCountry === 'ALL' ? countries.map(c => c.code) : [filterCountry]
  const cAvgs = countryCodes.map(code => {
    const cData = flat.filter(x => x.f === code)
    return cData.length ? Math.round(avgOf(cData)) : 0
  })

  const chartGeoOption = {
    tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
    grid: { left: '3%', right: '10%', bottom: '5%', top: '5%', containLabel: true },
    xAxis: { type: 'value', max: 100, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    yAxis: { type: 'category', data: countryCodes.map(c => countries.find(x => x.code === c)?.name || c), axisLabel: { color: '#475569', fontWeight: 'bold' } },
    series: [{
      type: 'bar', barWidth: 16,
      itemStyle: { color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [{ offset: 0, color: '#8cc63f' }, { offset: 1, color: '#009036' }]), borderRadius: [0, 8, 8, 0] },
      data: cAvgs, label: { show: true, position: 'right', formatter: '{c}%', color: '#0f172a', fontWeight: 'bold' }
    }]
  }

  const chartTopSocietiesOption = {
    tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
    grid: { left: '3%', right: '10%', bottom: '5%', top: '5%', containLabel: true },
    xAxis: { type: 'value', max: 100, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    yAxis: { type: 'category', data: societyAvgs.map(s => s.name), axisLabel: { color: '#475569', fontWeight: 'bold', width: 100, overflow: 'truncate' } },
    series: [{
      type: 'bar', barWidth: 16,
      itemStyle: { color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [{ offset: 0, color: '#fca5a5' }, { offset: 1, color: '#ef4444' }]), borderRadius: [0, 8, 8, 0] },
      data: societyAvgs.map(s => s.avg), label: { show: true, position: 'right', formatter: '{c}%', color: '#0f172a', fontWeight: 'bold' }
    }]
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pmoStyles }} />
      <div className="pmo-dashboard">
        
        {/* Enriched Header */}
        <header className="pmo-header">
          <div className="pmo-header-top">
            <div className="pmo-title">
              <h1>{data.project.name}</h1>
              <p>Control Tower · Estado Ejecutivo de Implementación</p>
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
            <div className="meta-item"><span className="meta-label">Project Manager</span><span className="meta-value">{data.project.pm || 'N/A'}</span></div>
            <div className="meta-item"><span className="meta-label">Líder Negocio</span><span className="meta-value">{data.project.user_lead || data.project.project_lead || 'N/A'}</span></div>
            <div className="meta-item"><span className="meta-label">Fase Principal</span><span className="meta-value" style={{ textTransform: 'capitalize' }}>{data.project.stage || 'N/A'}</span></div>
          </div>
        </header>

        <main className="pmo-container">
          
          {/* 6 PMO HEALTH SCORECARDS (BALANCED GRID 3 COLUMNS) */}
          <div className="pmo-grid-kpi">
            <div className="pmo-card clickable" style={{ borderTop: '4px solid #1c3a91' }} onClick={() => setModal({ isOpen: true, title: 'Avance Real Total', data: fD })}>
              <div className="kpi-title">Avance Real vs Plan</div>
              <div className="kpi-value">{overallProgress}%</div>
              <div className="kpi-subtitle">Progreso consolidado (Clic para detalle)</div>
              <div style={{ background: '#f1f5f9', height: '6px', borderRadius: '4px', marginTop: '1rem' }}>
                <div style={{ background: '#1c3a91', height: '100%', width: `${overallProgress}%`, borderRadius: '4px' }} />
              </div>
            </div>

            <div className="pmo-card">
              <div className="kpi-title">Salud del Proyecto</div>
              <div style={{ margin: '0.5rem 0 1rem 0' }}>
                <span className={`status-badge status-${healthStatus}`}>{healthLabel}</span>
              </div>
              <div className="kpi-subtitle">Basado en retrasos críticos</div>
            </div>

            <div className="pmo-card clickable" onClick={() => setModal({ isOpen: true, title: 'Entregables Firmados / Aprobados', data: approvedDeliverables })}>
              <div className="kpi-title" style={{ color: '#009036' }}>Entregables Aprobados</div>
              <div className="kpi-value">{approvedCount} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ {totalDeliverables}</span></div>
              <div className="kpi-subtitle">Documentos al 100% (Go-Live)</div>
            </div>

            <div className="pmo-card clickable" onClick={() => setModal({ isOpen: true, title: 'Frentes en Riesgo Crítico', data: criticalDeliverables })}>
              <div className="kpi-title" style={{ color: '#e31c1b' }}>Frentes en Riesgo</div>
              <div className="kpi-value">{criticalRiskCount}</div>
              <div className="kpi-subtitle">Avance estancado &lt; 25% (Requiere Atención)</div>
            </div>

            <div className="pmo-card clickable" onClick={() => setModal({ isOpen: true, title: `Entregables en ${bottleneckPhase}`, data: bottleneckData })}>
              <div className="kpi-title">Cuello de Botella</div>
              <div className="kpi-value" style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>{bottleneckPhase}</div>
              <div className="kpi-subtitle">Fase con mayor carga ({Math.max(...phaseCounts)} reqs)</div>
            </div>

            <div className="pmo-card">
              <div className="kpi-title">Alcance Geográfico</div>
              <div className="kpi-value">{totalSocieties} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>Socs</span></div>
              <div className="kpi-subtitle">Desplegado en {countries.length} países</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
            
            {/* 4 CHARTS */}
            <div className="pmo-card" style={{ gridColumn: 'span 8' }}>
              <h2 className="pmo-section-title">Roadmap de Fases (Phase-Gates)</h2>
              <ReactECharts option={chartRoadmapOption} style={{ height: '280px' }} />
            </div>

            <div className="pmo-card" style={{ gridColumn: 'span 4' }}>
              <h2 className="pmo-section-title">Distribución de Estados</h2>
              <ReactECharts option={chartStatusOption} style={{ height: '280px' }} />
            </div>

            <div className="pmo-card" style={{ gridColumn: 'span 6' }}>
              <h2 className="pmo-section-title">Desempeño Geográfico Global</h2>
              <ReactECharts option={chartGeoOption} style={{ height: '280px' }} />
            </div>

            <div className="pmo-card" style={{ gridColumn: 'span 6' }}>
              <h2 className="pmo-section-title">Top 5 Sociedades con Menor Avance</h2>
              <ReactECharts option={chartTopSocietiesOption} style={{ height: '280px' }} />
            </div>

            {/* Action Plan */}
            <div className="pmo-card" style={{ gridColumn: 'span 12' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 className="pmo-section-title" style={{ margin: 0 }}>Plan de Acción Inmediato (Steering Committee)</h2>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
                  {data.steps.length} acciones requeridas
                </span>
              </div>
              
              <div className="action-list">
                {data.steps.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontSize: '0.875rem' }}>No hay acciones críticas registradas para el comité.</div>
                ) : (
                  data.steps.map((s) => {
                    const due = s.due || 'Pronto'
                    const day = due.length > 2 ? due.substring(0,2) : due
                    const month = due.length > 3 ? due.substring(3,6) : 'MES'
                    
                    return (
                      <div className="action-item" key={s.id}>
                        <div className="action-date">
                          <div className="action-date-month">{month}</div>
                          <div className="action-date-day">{day}</div>
                        </div>
                        <div className="action-content">
                          <h4>{s.title}</h4>
                          {s.description && <p>{s.description}</p>}
                          <div className="action-owner">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            {s.owner}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

          </div>
        </main>
        
        {/* DYNAMIC DRILL-DOWN MODAL */}
        {modal.isOpen && (
          <div className="modal-backdrop" onClick={() => setModal({ ...modal, isOpen: false })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{modal.title}</h2>
                <button className="modal-close" onClick={() => setModal({ ...modal, isOpen: false })}>&times;</button>
              </div>
              <div className="modal-body">
                {modal.data.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No hay datos para mostrar en esta vista.</div>
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
                            <td style={{ fontWeight: 600 }}>{item.f}</td>
                            <td>{item.soc}</td>
                            <td>{item.code || item.rep}</td>
                            <td>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                {item.est}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                                  <div style={{ height: '100%', width: `${item.pct}%`, background: statusColor, borderRadius: '3px' }} />
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
