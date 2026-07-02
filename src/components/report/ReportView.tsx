'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import ReactECharts from 'echarts-for-react'
import {
  getProjectData,
  getSettings,
  flattenDeliverables,
  type ProjectData,
  type Settings,
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
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
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .pmo-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
    border: 1px solid #e2e8f0;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .pmo-card:hover {
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05);
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

  .filter-btn:hover {
    color: #0f172a;
  }

  .filter-btn.active {
    background: white;
    color: #0f172a;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
  }

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

  .action-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .action-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }

  .action-date {
    background: white;
    padding: 0.5rem;
    border-radius: 8px;
    text-align: center;
    min-width: 60px;
    border: 1px solid #cbd5e1;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
  }
  
  .action-date-month { font-size: 0.65rem; text-transform: uppercase; font-weight: 700; color: #64748b; }
  .action-date-day { font-size: 1.125rem; font-weight: 800; color: #0f172a; line-height: 1; margin-top: 0.1rem; }

  .action-content h4 { margin: 0 0 0.25rem 0; font-size: 0.95rem; font-weight: 700; color: #0f172a; }
  .action-content p { margin: 0; font-size: 0.8rem; color: #64748b; line-height: 1.4; }
  .action-owner { display: inline-flex; align-items: center; gap: 0.35rem; margin-top: 0.5rem; font-size: 0.75rem; font-weight: 600; color: #1c3a91; background: #e0e7ff; padding: 0.2rem 0.6rem; border-radius: 6px; }
`

export default function ReportView({ projectId, canEdit }: { projectId: string; canEdit: boolean }) {
  const [data, setData] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterCountry, setFilterCountry] = useState('ALL')

  useEffect(() => {
    let alive = true
    Promise.all([getProjectData(projectId), getSettings()]).then(([d]) => {
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
  const approvedCount = fD.filter(d => d.pct >= 100).length
  const criticalRiskCount = fD.filter(d => d.pct < 25).length
  const totalSocieties = data.societies.length

  // Health logic
  let healthStatus = 'good'
  let healthLabel = 'Saludable'
  if (criticalRiskCount > (totalDeliverables * 0.15)) { healthStatus = 'danger'; healthLabel = 'Riesgo Alto' }
  else if (criticalRiskCount > 0 || overallProgress < 40) { healthStatus = 'warn'; healthLabel = 'Riesgo Medio' }

  // Phase calculation
  const phaseNames = ['Planificación', 'Diseño BBP', 'Desarrollo EF', 'Pruebas UAT', 'Go-Live']
  const phaseCounts = [
    fD.filter(d => d.pct < 25).length,
    fD.filter(d => d.pct >= 25 && d.pct < 50).length,
    fD.filter(d => d.pct >= 50 && d.pct < 75).length,
    fD.filter(d => d.pct >= 75 && d.pct < 100).length,
    approvedCount
  ]
  const maxPhaseIndex = phaseCounts.indexOf(Math.max(...phaseCounts))
  const bottleneckPhase = phaseNames[maxPhaseIndex] || 'N/A'

  // --- ECHARTS CONFIGURATION ---

  // 1. Phase-Gates Roadmap (Replaces Funnel)
  const chartRoadmapOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '5%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: phaseNames, axisLine: { lineStyle: { color: '#cbd5e1' } }, axisLabel: { color: '#475569', fontWeight: 'bold' } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } } },
    series: [
      {
        name: 'Entregables en Fase',
        type: 'bar',
        barWidth: '45%',
        itemStyle: {
          color: new ReactECharts.echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#0ea5e9' },
            { offset: 1, color: '#1c3a91' }
          ]),
          borderRadius: [6, 6, 0, 0]
        },
        data: phaseCounts,
        label: { show: true, position: 'top', color: '#0f172a', fontWeight: 'bold', fontSize: 14 }
      }
    ]
  }

  // 2. Geographic Performance (Clean Bar)
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
    series: [
      {
        type: 'bar',
        barWidth: 20,
        itemStyle: {
          color: new ReactECharts.echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#8cc63f' },
            { offset: 1, color: '#009036' }
          ]),
          borderRadius: [0, 8, 8, 0]
        },
        data: cAvgs,
        label: { show: true, position: 'right', formatter: '{c}%', color: '#0f172a', fontWeight: 'bold' }
      }
    ]
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pmoStyles }} />
      <div className="pmo-dashboard">
        
        {/* Header */}
        <header className="pmo-header">
          <div className="pmo-title">
            <h1>{data.project.name}</h1>
            <p>Control Tower · Estado Ejecutivo de Implementación</p>
          </div>
          
          <div className="filter-group">
            <button onClick={() => setFilterCountry('ALL')} className={`filter-btn ${filterCountry === 'ALL' ? 'active' : ''}`}>
              Global
            </button>
            {countries.map(c => (
              <button key={c.code} onClick={() => setFilterCountry(c.code)} className={`filter-btn ${filterCountry === c.code ? 'active' : ''}`}>
                {c.name}
              </button>
            ))}
          </div>
        </header>

        <main className="pmo-container">
          
          {/* 6 PMO HEALTH SCORECARDS */}
          <div className="pmo-grid-kpi">
            <div className="pmo-card" style={{ borderTop: '4px solid #1c3a91' }}>
              <div className="kpi-title">Avance Real vs Plan</div>
              <div className="kpi-value">{overallProgress}%</div>
              <div className="kpi-subtitle">Progreso consolidado</div>
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

            <div className="pmo-card">
              <div className="kpi-title" style={{ color: '#009036' }}>Entregables Aprobados</div>
              <div className="kpi-value">{approvedCount} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ {totalDeliverables}</span></div>
              <div className="kpi-subtitle">Documentos al 100% (Go-Live)</div>
            </div>

            <div className="pmo-card">
              <div className="kpi-title" style={{ color: '#e31c1b' }}>Frentes en Riesgo</div>
              <div className="kpi-value">{criticalRiskCount}</div>
              <div className="kpi-subtitle">Avance estancado &lt; 25%</div>
            </div>

            <div className="pmo-card">
              <div className="kpi-title">Cuello de Botella</div>
              <div className="kpi-value" style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>{bottleneckPhase}</div>
              <div className="kpi-subtitle">Fase con más carga actual ({Math.max(...phaseCounts)} reqs)</div>
            </div>

            <div className="pmo-card">
              <div className="kpi-title">Alcance Geográfico</div>
              <div className="kpi-value">{totalSocieties} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>Socs</span></div>
              <div className="kpi-subtitle">Desplegado en {countries.length} países</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
            
            {/* Phase-Gates Roadmap */}
            <div className="pmo-card" style={{ gridColumn: 'span 8' }}>
              <h2 className="pmo-section-title">Roadmap de Fases (Phase-Gates)</h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>Volumen de entregables transitando por la metodología de implementación.</p>
              <ReactECharts option={chartRoadmapOption} style={{ height: '320px' }} />
            </div>

            {/* Geographic Performance */}
            <div className="pmo-card" style={{ gridColumn: 'span 4' }}>
              <h2 className="pmo-section-title">Desempeño Geográfico</h2>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>Avance global consolidado por país.</p>
              <ReactECharts option={chartGeoOption} style={{ height: '320px' }} />
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
                    // Extract a fake date just for beautiful UI, or use s.due
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
      </div>
    </>
  )
}
