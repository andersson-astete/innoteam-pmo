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
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .kpi-value {
    font-size: 2.5rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1;
    margin-bottom: 0.25rem;
  }
  
  .kpi-value.danger { color: #dc2626; }
  .kpi-value.success { color: #16a34a; }
  .kpi-value.warning { color: #ca8a04; }

  .kpi-subtitle {
    font-size: 0.8rem;
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
    border-radius: 16px;
    width: 100%; max-width: 900px; max-height: 85vh;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    display: flex; flex-direction: column;
    animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    overflow: hidden;
  }
  
  .modal-header {
    padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0;
    display: flex; justify-content: space-between; align-items: center;
    background: #f8fafc;
  }
  
  .modal-header h2 { margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a; }
  
  .modal-close {
    background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;
    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
    border-radius: 50%; transition: background 0.2s;
  }
  .modal-close:hover { background: #e2e8f0; color: #0f172a; }
  
  .modal-body {
    padding: 0;
    overflow-y: auto;
    flex: 1;
  }

  .data-table { width: 100%; border-collapse: collapse; text-align: left; }
  .data-table th { 
    padding: 0.75rem 1.25rem; 
    background: #f1f5f9; 
    color: #475569; 
    font-weight: 700; 
    font-size: 0.75rem; 
    text-transform: uppercase; 
    border-bottom: 1px solid #e2e8f0;
    position: sticky;
    top: 0;
  }
  .data-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; color: #1e293b; }
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

  // --- PMO STRICT NUMERIC METRICS ---
  const totalDeliverables = fD.length
  // Ensure strict one decimal precision for the PM
  const overallProgressNum = totalDeliverables ? avgOf(fD) : 0
  const overallProgress = overallProgressNum.toFixed(1)
  
  const approvedDeliverables = fD.filter(d => d.pct >= 100)
  const approvedCount = approvedDeliverables.length
  
  const criticalDeliverables = fD.filter(d => d.pct < 25)
  const criticalRiskCount = criticalDeliverables.length
  
  const totalSocieties = data.societies.length
  const totalAlerts = data.alerts.length
  const totalSteps = data.steps.length

  // Phase grouping for roadmap
  const phaseNames = ['Planificación', 'Diseño BBP', 'Desarrollo EF', 'Pruebas UAT', 'Go-Live']
  const phaseData = [
    fD.filter(d => d.pct < 25),
    fD.filter(d => d.pct >= 25 && d.pct < 50),
    fD.filter(d => d.pct >= 50 && d.pct < 75),
    fD.filter(d => d.pct >= 75 && d.pct < 100),
    approvedDeliverables
  ]
  const phaseCounts = phaseData.map(arr => arr.length)

  // Risk Matrix Data
  const severityCounts = data.alerts.reduce((acc, alert) => {
    const sev = alert.severity?.toUpperCase() || 'OTRO'
    if (sev.includes('ALTA') || sev.includes('HIGH')) acc.Alta++
    else if (sev.includes('MEDIA') || sev.includes('MED')) acc.Media++
    else if (sev.includes('BAJA') || sev.includes('LOW')) acc.Baja++
    else acc.Otro++
    return acc
  }, { Alta: 0, Media: 0, Baja: 0, Otro: 0 })

  const riskExposure = Math.min(100, (criticalRiskCount / (totalDeliverables || 1)) * 100).toFixed(1)

  // --- ECHARTS CONFIGURATION ---

  // 1. GAUGE: Avance General
  const chartGaugeProgress = {
    series: [{
      type: 'gauge',
      startAngle: 180, endAngle: 0,
      min: 0, max: 100, splitNumber: 10,
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#16a34a' }]) },
      progress: { show: true, width: 18 },
      pointer: { show: false },
      axisLine: { lineStyle: { width: 18, color: [[1, '#e2e8f0']] } },
      axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      title: { show: true, offsetY: 20, fontSize: 12, color: '#64748b', fontWeight: 'bold' },
      detail: { valueAnimation: true, offsetCenter: [0, '-15%'], fontSize: 32, fontWeight: 'bolder', color: '#0f172a', formatter: '{value}%' },
      data: [{ value: overallProgressNum, name: 'AVANCE REAL' }]
    }]
  }

  // 2. GAUGE: Nivel de Riesgo
  const chartGaugeRisk = {
    series: [{
      type: 'gauge',
      startAngle: 180, endAngle: 0,
      min: 0, max: 100, splitNumber: 10,
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#eab308' }, { offset: 1, color: '#dc2626' }]) },
      progress: { show: true, width: 18 },
      pointer: { show: false },
      axisLine: { lineStyle: { width: 18, color: [[1, '#e2e8f0']] } },
      axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      title: { show: true, offsetY: 20, fontSize: 12, color: '#64748b', fontWeight: 'bold' },
      detail: { valueAnimation: true, offsetCenter: [0, '-15%'], fontSize: 32, fontWeight: 'bolder', color: '#dc2626', formatter: '{value}%' },
      data: [{ value: parseFloat(riskExposure), name: 'EXPOSICIÓN AL RIESGO' }]
    }]
  }

  // 3. Matriz de Riesgos (Bar Chart)
  const chartRiskMatrix = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '5%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: ['Baja', 'Media', 'Alta'], axisLine: { lineStyle: { color: '#cbd5e1' } }, axisLabel: { color: '#475569', fontWeight: 'bold' } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }, minInterval: 1 },
    series: [{
      name: 'Riesgos', type: 'bar', barWidth: '40%',
      data: [
        { value: severityCounts.Baja, itemStyle: { color: '#3b82f6' } },
        { value: severityCounts.Media, itemStyle: { color: '#f59e0b' } },
        { value: severityCounts.Alta, itemStyle: { color: '#dc2626' } }
      ],
      label: { show: true, position: 'top', color: '#0f172a', fontWeight: 'bold', fontSize: 16 }
    }]
  }

  // 4. Roadmap (Phase Gates)
  const chartRoadmapOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '5%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: phaseNames, axisLine: { lineStyle: { color: '#cbd5e1' } }, axisLabel: { color: '#475569', fontWeight: 'bold' } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
    series: [{
      name: 'Entregables en Fase', type: 'bar', barWidth: '45%',
      itemStyle: { color: '#1c3a91', borderRadius: [6, 6, 0, 0] },
      data: phaseCounts, label: { show: true, position: 'top', color: '#0f172a', fontWeight: 'bold', fontSize: 14 }
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
              <p>Dashboard Analítico y Cuantitativo PMO</p>
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
            <div className="meta-item"><span className="meta-label">Total Entregables</span><span className="meta-value">{totalDeliverables} Doc.</span></div>
          </div>
        </header>

        <main className="pmo-container">
          
          {/* 6 PMO QUANTITATIVE CARDS (100% NUMBERS) */}
          <div className="pmo-grid-kpi">
            <div className="pmo-card clickable" style={{ borderTop: '4px solid #1c3a91' }} onClick={() => setModal({ isOpen: true, title: 'Inventario de Avance', data: fD })}>
              <div className="kpi-title">Avance Real Consolidado</div>
              <div className="kpi-value">{overallProgress}%</div>
              <div className="kpi-subtitle">Progreso general ponderado</div>
            </div>

            <div className="pmo-card clickable" onClick={() => setModal({ isOpen: true, title: 'Entregables Aprobados', data: approvedDeliverables })}>
              <div className="kpi-title" style={{ color: '#009036' }}>Firmados / Aprobados</div>
              <div className="kpi-value success">{approvedCount} <span style={{ fontSize: '1.25rem', color: '#94a3b8' }}>/ {totalDeliverables}</span></div>
              <div className="kpi-subtitle">Documentos al 100% de avance</div>
            </div>

            <div className="pmo-card clickable" onClick={() => setModal({ isOpen: true, title: 'Frentes en Riesgo Crítico (<25%)', data: criticalDeliverables })}>
              <div className="kpi-title" style={{ color: '#dc2626' }}>Frentes en Riesgo Crítico</div>
              <div className="kpi-value danger">{criticalRiskCount}</div>
              <div className="kpi-subtitle">Entregables estancados &lt; 25%</div>
            </div>

            <div className="pmo-card">
              <div className="kpi-title" style={{ color: '#dc2626' }}>Riesgos y Alertas Activas</div>
              <div className="kpi-value danger">{totalAlerts}</div>
              <div className="kpi-subtitle">Reportados en matriz de riesgo</div>
            </div>

            <div className="pmo-card">
              <div className="kpi-title" style={{ color: '#1c3a91' }}>Acciones Pendientes</div>
              <div className="kpi-value">{totalSteps}</div>
              <div className="kpi-subtitle">Compromisos del comité</div>
            </div>

            <div className="pmo-card">
              <div className="kpi-title">Cobertura de Alcance</div>
              <div className="kpi-value">{totalSocieties} <span style={{ fontSize: '1.25rem', color: '#94a3b8' }}>Socs</span></div>
              <div className="kpi-subtitle">Operaciones en {countries.length} países</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
            
            {/* GAUGES */}
            <div className="pmo-card" style={{ gridColumn: 'span 4' }}>
              <h2 className="pmo-section-title">Termómetro de Avance</h2>
              <ReactECharts option={chartGaugeProgress} style={{ height: '260px' }} />
            </div>

            <div className="pmo-card" style={{ gridColumn: 'span 4' }}>
              <h2 className="pmo-section-title">Termómetro de Riesgo</h2>
              <ReactECharts option={chartGaugeRisk} style={{ height: '260px' }} />
            </div>

            {/* RISK MATRIX */}
            <div className="pmo-card" style={{ gridColumn: 'span 4' }}>
              <h2 className="pmo-section-title">Matriz de Riesgos</h2>
              <ReactECharts option={chartRiskMatrix} style={{ height: '260px' }} />
            </div>

            {/* ROADMAP */}
            <div className="pmo-card" style={{ gridColumn: 'span 12' }}>
              <h2 className="pmo-section-title">Roadmap de Entregables (Metodología)</h2>
              <ReactECharts option={chartRoadmapOption} style={{ height: '280px' }} />
            </div>

            {/* DIRECT ACTION PLAN TABLE */}
            <div className="pmo-card" style={{ gridColumn: 'span 12' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 className="pmo-section-title" style={{ margin: 0 }}>Plan de Acción Inmediato</h2>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', background: '#e2e8f0', padding: '0.4rem 0.75rem', borderRadius: '8px' }}>
                  Total: {data.steps.length}
                </span>
              </div>
              
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <table className="data-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>N°</th>
                      <th style={{ width: '40%' }}>Acción / Tarea</th>
                      <th style={{ width: '25%' }}>Responsable</th>
                      <th style={{ width: '15%' }}>Vencimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.steps.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No hay acciones pendientes.</td>
                      </tr>
                    ) : (
                      data.steps.map((s, index) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 800, color: '#64748b' }}>{index + 1}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>{s.title}</div>
                            {s.description && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.description}</div>}
                          </td>
                          <td style={{ fontWeight: 600, color: '#1c3a91' }}>{s.owner || 'No Asignado'}</td>
                          <td>
                            <span style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem' }}>
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
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No hay entregables en esta categoría.</div>
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
