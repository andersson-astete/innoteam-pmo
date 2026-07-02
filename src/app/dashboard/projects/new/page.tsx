'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const DEFAULT_PHASES = [
  { name: 'Levantamiento', weight: 15 },
  { name: 'Info recepcionada', weight: 5 },
  { name: 'Elaboración BBP', weight: 10 },
  { name: 'Aprobación BBP', weight: 5 },
  { name: 'Elaboración EF', weight: 10 },
  { name: 'Pruebas unitarias', weight: 20 },
  { name: 'Pruebas integrales', weight: 20 },
  { name: 'Observaciones', weight: 10 },
  { name: 'Guía de usuario', weight: 5 },
]
const DEFAULT_REPORTS = [
  { code: 'BG', name: 'Balance General' },
  { code: 'DRE', name: 'Estado de Resultados' },
  { code: 'FF', name: 'Flujo de Fondos' },
]

const inp: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--line)',
  borderRadius: 8,
  background: 'var(--bg)',
  color: 'var(--ink)',
  fontSize: 13,
}
const card: React.CSSProperties = {
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: 14,
  padding: 18,
  marginBottom: 16,
}
const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--ink2)', display: 'block', marginBottom: 6 }

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [color, setColor] = useState('#2F6BD8')
  const [phases, setPhases] = useState(DEFAULT_PHASES)
  const [reports, setReports] = useState(DEFAULT_REPORTS)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('El nombre del cliente es obligatorio')
    setSaving(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          subtitle: subtitle.trim(),
          brand_color: color,
          phases: phases.filter((p) => p.name.trim()),
          report_types: reports.filter((r) => r.code.trim()),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al crear el proyecto')
        return
      }
      router.push(`/dashboard/projects/${data.project.id}/edit`)
    } catch (err: any) {
      setError(err.message || 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Nuevo proyecto</h1>
        <Link href="/dashboard" style={{ ...inp, width: 'auto', padding: '8px 14px' }}>
          ← Proyectos
        </Link>
      </div>

      <form onSubmit={submit}>
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={label}>Cliente / Nombre del proyecto *</label>
              <input style={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="p.ej. ISM" />
            </div>
            <div>
              <label style={label}>Color de marca</label>
              <input type="color" style={{ ...inp, height: 38, padding: 4 }} value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={label}>Subtítulo</label>
            <input style={inp} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="p.ej. InnoTeam × ISM — Reportes SAP" />
          </div>
        </div>

        {/* Alcance: tipos de reporte */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Tipos de reporte (alcance)</h2>
              <p style={{ fontSize: 11.5, color: 'var(--ink3)' }}>Los entregables de cada sociedad. Editable según el proyecto.</p>
            </div>
            <button type="button" style={{ ...inp, width: 'auto', padding: '6px 12px' }} onClick={() => setReports([...reports, { code: '', name: '' }])}>
              + Reporte
            </button>
          </div>
          {reports.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 32px', gap: 8, marginBottom: 8 }}>
              <input style={inp} value={r.code} placeholder="BG" onChange={(e) => setReports(reports.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))} />
              <input style={inp} value={r.name} placeholder="Balance General" onChange={(e) => setReports(reports.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <button type="button" style={{ ...inp, width: 'auto', padding: 0, color: 'var(--coral)' }} onClick={() => setReports(reports.filter((_, j) => j !== i))}>
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Alcance: fases */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Fases y pesos</h2>
              <p style={{ fontSize: 11.5, color: 'var(--ink3)' }}>Metodología del proyecto. Precargada con la plantilla SAP.</p>
            </div>
            <button type="button" style={{ ...inp, width: 'auto', padding: '6px 12px' }} onClick={() => setPhases([...phases, { name: '', weight: 0 }])}>
              + Fase
            </button>
          </div>
          {phases.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 80px 32px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--ink3)', textAlign: 'center' }}>{i + 1}</span>
              <input style={inp} value={p.name} onChange={(e) => setPhases(phases.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <input type="number" style={inp} value={p.weight} onChange={(e) => setPhases(phases.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)))} />
              <button type="button" style={{ ...inp, width: 'auto', padding: 0, color: 'var(--coral)' }} onClick={() => setPhases(phases.filter((_, j) => j !== i))}>
                ✕
              </button>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: 'var(--coralbg)', color: 'var(--coral)', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{ background: 'var(--brand)', color: '#fff', padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Creando…' : 'Crear proyecto y añadir sociedades →'}
        </button>
      </form>
    </div>
  )
}
