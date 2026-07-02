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
import {
  avgOf,
  estCounts,
} from '@/lib/report'

// Custom CSS for the Executive Dashboard
const dashboardStyles = `
  .exec-dashboard { font-family: 'Inter', sans-serif; background: #f8f9fa; color: #1e293b; min-height: 100vh; padding-bottom: 2rem; }
  .exec-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); border: 1px solid #e2e8f0; }
  .exec-kpi-title { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; margin-bottom: 0.5rem; }
  .exec-kpi-value { font-size: 2.25rem; font-weight: 800; color: #0f172a; line-height: 1.2; }
  .exec-kpi-subtitle { font-size: 0.875rem; color: #64748b; font-weight: 500; padding-bottom: 0.25rem; }
  .exec-kpi-desc { font-size: 0.75rem; font-weight: 600; color: #94a3b8; margin-top: 0.75rem; }
  .exec-filter-btn { padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; transition: all 0.2s; border: 1px solid #cbd5e1; color: #475569; background: white; cursor: pointer; }
  .exec-filter-btn.active { background: #1c3a91; color: white; border-color: #1c3a91; box-shadow: 0 2px 8px rgba(28, 58, 145, 0.3); }
  .exec-filter-btn:hover:not(.active) { background: #f1f5f9; }
  .exec-action-item { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
  .exec-action-item:last-child { border-bottom: none; }
  .exec-action-num { width: 24px; height: 24px; border-radius: 50%; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
`

export default function ReportView({ projectId, canEdit }: { projectId: string; canEdit: boolean }) {
  const [data, setData] = useState<ProjectData | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterCountry, setFilterCountry] = useState('ALL')

  useEffect(() => {
    let alive = true
    Promise.all([getProjectData(projectId), getSettings()]).then(([d, s]) => {
      if (alive) {
        setData(d)
        setSettings(s)
        setLoading(false)
      }
    })
    return () => { alive = false }
  }, [projectId])

  const flat = useMemo<FlatDeliverable[]>(() => (data ? flattenDeliverables(data) : []), [data])
  const countries = data?.countries || []
  const phases = data?.project.phases || []

  const fD = useMemo(() => flat.filter((d) => filterCountry === 'ALL' || d.f === filterCountry), [flat, filterCountry])

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Cargando reporte ejecutivo...</div>
  if (!data) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Proyecto no encontrado.</div>

  const overallProgress = fD.length ? Math.round(avgOf(fD)) : 0
  const riskCount = fD.filter((s) => s.pct < 25).length
  const counts = estCounts(fD)
  const uatCount = counts['testing'] || 0
  const totalSocieties = data.societies.length

  // Charts Config
  // 1. Chart Country (Horizontal Bar)
  const countryCodes = filterCountry === 'ALL' ? countries.map(c => c.code) : [filterCountry]
  const cAvgs = countryCodes.map(code => {
    const cData = flat.filter(x => x.f === code)
    return cData.length ? Math.round(avgOf(cData)) : 0
  })
  
  const chartCountryOption = {
    grid: { left: '3%', right: '10%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: { type: 'value', max: 100, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    yAxis: { type: 'category', data: countryCodes.map(c => countries.find(x => x.code === c)?.name || c), axisLabel: { fontWeight: 'bold', color: '#334155' } },
    series: [{
      type: 'bar',
      data: cAvgs,
      itemStyle: { color: '#facc15', borderRadius: 4 },
      barWidth: 16,
      label: { show: true, position: 'right', formatter: '{c}%', fontWeight: 'bold' }
    }]
  }

  // 2. Chart Status Composition (Doughnut)
  const statusLabels = ['Etapa Inicial', 'En Elaboración', 'Pruebas UAT']
  const initCount = counts['init'] || 0
  const elabCount = (counts['client'] || 0) + (counts['proc'] || 0)
  const chartStatusOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', icon: 'circle', textStyle: { fontWeight: 'bold', color: '#64748b' } },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      avoidLabelOverlap: false,
      itemStyle: { borderWidth: 2, borderColor: '#fff' },
      label: { show: false },
      data: [
        { value: initCount, name: 'Etapa Inicial', itemStyle: { color: '#94a3b8' } },
        { value: elabCount, name: 'En Elaboración', itemStyle: { color: '#0ea5e9' } },
        { value: uatCount, name: 'Pruebas UAT', itemStyle: { color: '#d97706' } }
      ]
    }]
  }

  // 3. Simplified Funnel (Bar)
  const macroFases = ['1. Planificación', '2. Diseño BBP', '3. Desarrollo EF', '4. Pruebas UAT']
  const countF1 = fD.length
  const countF2 = fD.filter(d => d.pct >= 30).length
  const countF3 = fD.filter(d => d.pct >= 60).length
  const countF4 = fD.filter(d => d.pct >= 65).length

  const chartFunnelOption = {
    grid: { left: '3%', right: '3%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: macroFases, axisLabel: { fontWeight: 'bold', color: '#64748b', fontSize: 11 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [{
      type: 'bar',
      data: [countF1, countF2, countF3, countF4],
      itemStyle: { 
        color: (params: any) => ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][params.dataIndex],
        borderRadius: [6, 6, 0, 0]
      },
      barWidth: '40%',
      label: { show: true, position: 'top', fontWeight: 'bold' }
    }]
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: dashboardStyles }} />
      <div className="exec-dashboard">
        
        {/* Header */}
        <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', padding: '0 1rem', paddingTop: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <span style={{ color: '#009036' }}>{data.project.name}</span>
              <span style={{ color: '#cbd5e1' }}>|</span> 
              Reporte Ejecutivo
            </h1>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginTop: '0.25rem' }}>
              Gestionado por <span style={{ color: '#1c3a91', fontWeight: 800 }}>Inno<span style={{ color: '#8cc63f' }}>Team</span></span>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', background: 'white', padding: '0.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginRight: '0.5rem', marginLeft: '0.5rem' }}>Filtro País:</span>
            <button onClick={() => setFilterCountry('ALL')} className={`exec-filter-btn ${filterCountry === 'ALL' ? 'active' : ''}`}>Todos</button>
            {countries.map(c => (
              <button key={c.code} onClick={() => setFilterCountry(c.code)} className={`exec-filter-btn ${filterCountry === c.code ? 'active' : ''}`}>
                {c.name}
              </button>
            ))}
          </div>
        </header>

        <div style={{ padding: '0 1rem' }}>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="exec-card" style={{ padding: '1.25rem', borderTop: '4px solid #1c3a91' }}>
              <div className="exec-kpi-title">Avance Global</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div className="exec-kpi-value">{overallProgress}%</div>
              </div>
              <div style={{ width: '100%', background: '#f1f5f9', borderRadius: '9999px', height: '0.5rem', marginTop: '0.75rem' }}>
                <div style={{ background: '#1c3a91', height: '0.5rem', borderRadius: '9999px', width: `${overallProgress}%` }}></div>
              </div>
            </div>
            
            <div className="exec-card" style={{ padding: '1.25rem', borderTop: '4px solid #009036' }}>
              <div className="exec-kpi-title">Total Entregables</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div className="exec-kpi-value">{fD.length}</div>
                <div className="exec-kpi-subtitle">BG / DRE / FF</div>
              </div>
              <div className="exec-kpi-desc">{totalSocieties} sociedades en alcance</div>
            </div>

            <div className="exec-card" style={{ padding: '1.25rem', borderTop: '4px solid #eab308' }}>
              <div className="exec-kpi-title">Frentes en Pruebas (UAT)</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div className="exec-kpi-value">{uatCount}</div>
                <div className="exec-kpi-subtitle">entregables</div>
              </div>
              <div className="exec-kpi-desc" style={{ color: '#ca8a04' }}>Fase actual del proyecto</div>
            </div>

            <div className="exec-card" style={{ padding: '1.25rem', borderTop: '4px solid #e31c1b' }}>
              <div className="exec-kpi-title">Frentes en Riesgo</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div className="exec-kpi-value" style={{ color: '#e31c1b' }}>{riskCount}</div>
                <div className="exec-kpi-subtitle">retrasados</div>
              </div>
              <div className="exec-kpi-desc">Avance crítico menor al 25%</div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              
            {/* Left Column: Charts */}
            <div style={{ gridColumn: 'span 12' }} className="@container">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="exec-card" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', margin: '0 0 0.25rem 0' }}>Avance por País</h3>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>Progreso promedio de sus entregables.</p>
                  <ReactECharts option={chartCountryOption} style={{ height: '240px' }} />
                </div>
                <div className="exec-card" style={{ padding: '1.25rem', position: 'relative' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', margin: '0 0 0.25rem 0' }}>Composición por Estado</h3>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>Distribución macro de las fases.</p>
                  <ReactECharts option={chartStatusOption} style={{ height: '240px' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', paddingTop: '1.5rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1f2937' }}>{fD.length}</div>
                      <div style={{ fontSize: '0.625rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Total</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div style={{ gridColumn: 'span 12' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Funnel Simplificado */}
                <div className="exec-card" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', margin: '0 0 0.25rem 0' }}>Embudo de Fases (Simplificado)</h3>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>Tasas de conversión agrupadas para evitar ruido visual.</p>
                  <ReactECharts option={chartFunnelOption} style={{ height: '280px' }} />
                </div>

                {/* Plan de Acción Ejecutivo (Dynamic from DB) */}
                <div className="exec-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', margin: 0 }}>Plan de Acción Ejecutivo</h3>
                    <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.625rem', fontWeight: 700, padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>Prioridad</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>Próximos pasos comprometidos con responsable y fecha.</p>
                  
                  <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '280px', paddingRight: '0.5rem' }}>
                    {data.steps.length === 0 ? (
                      <div style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'center', marginTop: '2rem' }}>No hay pasos de acción registrados.</div>
                    ) : (
                      data.steps.map((s, i) => (
                        <div className="exec-action-item" key={s.id}>
                          <div className="exec-action-num">{i + 1}</div>
                          <div style={{ flexGrow: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>{s.title}</h4>
                              <span style={{ fontSize: '0.625rem', fontWeight: 600, color: '#64748b', textAlign: 'right' }}>{s.owner} <br/> ({s.due})</span>
                            </div>
                            {s.description && <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>{s.description}</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
