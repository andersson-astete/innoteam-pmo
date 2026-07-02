'use client'

import { useState } from 'react'
import type { ProjectData, Settings, TeamMember, KeyUser, Country } from '@/lib/supabase'
import { mutate } from '@/lib/mutate'
import { Logo } from './Logo'
import LogoUpload from './LogoUpload'

const box: React.CSSProperties = {
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: 14,
  padding: 16,
  marginBottom: 14,
}
const inp: React.CSSProperties = {
  border: '1px solid var(--line2)',
  background: 'var(--bg)',
  color: 'var(--ink)',
  borderRadius: 8,
  padding: '7px 10px',
  fontSize: 12.5,
  width: '100%',
}
const lab: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--ink2)', display: 'block', marginBottom: 5 }
const sec: React.CSSProperties = { fontSize: 13, fontWeight: 800, margin: '2px 0 12px' }
const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'var(--sub)',
  border: '1px solid var(--line2)',
  borderRadius: 999,
  padding: '4px 10px',
  fontSize: 12,
}
const addBtn: React.CSSProperties = {
  border: '1px dashed var(--line2)',
  background: 'transparent',
  color: 'var(--ink2)',
  borderRadius: 999,
  padding: '4px 10px',
  fontSize: 12,
}

export default function ProjectSettings({
  data,
  settings,
  onReload,
  flash,
}: {
  data: ProjectData
  settings: Settings | null
  onReload: () => void
  flash: (m?: string) => void
}) {
  const p = data.project
  const [open, setOpen] = useState(false)
  const [innoLogo, setInnoLogo] = useState(settings?.innoteam_logo_url || null)
  const [clientLogo, setClientLogo] = useState(p.client_logo_url || null)

  const saveProject = async (patch: Record<string, any>) => {
    await mutate('projects', 'update', { id: p.id, data: patch })
    flash()
  }
  const saveCountry = async (c: Country, patch: Record<string, any>) => {
    await mutate('countries', 'update', { id: c.id, data: patch })
    flash()
  }

  // Listas de equipo (JSONB)
  const teamEditor = (
    labelText: string,
    list: TeamMember[],
    field: 'functional_team' | 'technical_team'
  ) => (
    <div>
      <span style={lab}>{labelText}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {(list || []).map((m, i) => (
          <span key={i} style={chip}>
            {m.name}
            <button
              style={{ color: 'var(--coral)', fontSize: 12 }}
              onClick={() => saveProject({ [field]: list.filter((_, j) => j !== i) }).then(onReload)}
            >
              ✕
            </button>
          </span>
        ))}
        <button
          style={addBtn}
          onClick={() => {
            const name = prompt(`Nombre del consultor (${labelText}):`)?.trim()
            if (name) saveProject({ [field]: [...(list || []), { name }] }).then(onReload)
          }}
        >
          + Agregar
        </button>
      </div>
    </div>
  )

  return (
    <div style={box}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setOpen((o) => !o)}
      >
        <h2 style={{ fontSize: 15, fontWeight: 800 }}>⚙ Datos del proyecto y marca</h2>
        <span style={{ color: 'var(--ink3)', fontSize: 13 }}>{open ? '▲ ocultar' : '▼ editar'}</span>
      </div>

      {open && (
        <div style={{ marginTop: 14 }}>
          {/* Marca / logos */}
          <div style={sec}>Marca</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginBottom: 18 }}>
            <div>
              <span style={lab}>Logo InnoTeam (global)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Logo url={innoLogo} name="InnoTeam" kind="innoteam" height={30} />
                <LogoUpload
                  target="innoteam"
                  label="Subir logo InnoTeam"
                  onDone={(url) => {
                    setInnoLogo(url)
                    flash('Logo actualizado')
                  }}
                />
              </div>
            </div>
            <div>
              <span style={lab}>Logo del cliente ({p.name})</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Logo url={clientLogo} name={p.name} kind="client" color={p.brand_color} height={30} />
                <LogoUpload
                  target="client"
                  projectId={p.id}
                  label="Subir logo cliente"
                  onDone={(url) => {
                    setClientLogo(url)
                    flash('Logo actualizado')
                  }}
                />
              </div>
            </div>
          </div>

          {/* Equipo */}
          <div style={sec}>Equipo y gobierno</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: 12 }}>
            <div>
              <span style={lab}>Sponsor (cliente)</span>
              <input style={inp} defaultValue={p.sponsor || ''} onBlur={(e) => e.target.value !== (p.sponsor || '') && saveProject({ sponsor: e.target.value })} />
            </div>
            <div>
              <span style={lab}>PM (InnoTeam)</span>
              <input style={inp} defaultValue={p.pm || p.project_lead || ''} onBlur={(e) => saveProject({ pm: e.target.value })} />
            </div>
            <div>
              <span style={lab}>Líder usuario (cliente)</span>
              <input style={inp} defaultValue={p.user_lead || ''} onBlur={(e) => e.target.value !== (p.user_lead || '') && saveProject({ user_lead: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14, marginBottom: 12 }}>
            {teamEditor('Consultores funcionales', p.functional_team, 'functional_team')}
            {teamEditor('Consultores técnicos', p.technical_team, 'technical_team')}
          </div>

          {/* Usuarios clave por país */}
          <div style={sec}>Usuarios clave por país</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
            {data.countries.map((c) => (
              <div key={c.id} style={{ background: 'var(--sub)', border: '1px solid var(--line)', borderRadius: 12, padding: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{c.name}</div>
                <span style={lab}>Líder del país</span>
                <input
                  style={{ ...inp, marginBottom: 10 }}
                  defaultValue={c.lead || ''}
                  onBlur={(e) => e.target.value !== (c.lead || '') && saveCountry(c, { lead: e.target.value })}
                />
                <span style={lab}>Usuarios clave</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(c.key_users || []).map((u: KeyUser, i) => (
                    <span key={i} style={chip}>
                      {u.name} · {u.role}
                      <button
                        style={{ color: 'var(--coral)', fontSize: 12 }}
                        onClick={() => saveCountry(c, { key_users: c.key_users.filter((_, j) => j !== i) }).then(onReload)}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  <button
                    style={addBtn}
                    onClick={() => {
                      const name = prompt('Nombre del usuario clave:')?.trim()
                      if (!name) return
                      const role = prompt('Rol / área:', 'Usuario clave')?.trim() || 'Usuario clave'
                      saveCountry(c, { key_users: [...(c.key_users || []), { name, role }] }).then(onReload)
                    }}
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
