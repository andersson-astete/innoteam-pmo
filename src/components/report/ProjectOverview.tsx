'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  getProjectData,
  getSettings,
  flattenDeliverables,
  type ProjectData,
  type Settings,
  type Stage,
} from '@/lib/supabase'
import { avgOf, bandColorHex } from '@/lib/report'
import { Logo } from './Logo'
import styles from './overview.module.css'

const STAGE_LABEL: Record<Stage, { label: string; color: string }> = {
  inicio: { label: 'Inicio', color: '#FB923C' },
  desarrollo: { label: 'En desarrollo', color: '#FBBF24' },
  uat: { label: 'En pruebas UAT', color: '#A78BFA' },
  produccion: { label: 'En producción', color: '#34D399' },
  cerrado: { label: 'Cerrado', color: '#6E7C99' },
}

export default function ProjectOverview({ projectId, canEdit }: { projectId: string; canEdit: boolean }) {
  const [data, setData] = useState<ProjectData | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    Promise.all([getProjectData(projectId), getSettings()]).then(([d, s]) => {
      if (alive) {
        setData(d)
        setSettings(s)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [projectId])

  const flat = useMemo(() => (data ? flattenDeliverables(data) : []), [data])

  if (loading) return <div className={styles.loading}>Cargando…</div>
  if (!data) return <div className={styles.loading}>Proyecto no encontrado.</div>

  const { project, countries, societies } = data
  const stage = STAGE_LABEL[project.stage] || STAGE_LABEL.inicio
  const avg = avgOf(flat)

  return (
    <div className={styles.wrap}>
      {/* Marca: InnoTeam × Cliente */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        <Logo url={settings?.innoteam_logo_url} name="InnoTeam" kind="innoteam" height={30} />
        <span style={{ color: 'var(--ink3)', fontWeight: 700 }}>×</span>
        <Logo url={project.client_logo_url} name={project.name} kind="client" color={project.brand_color} height={30} />
      </div>
      <div className={styles.top}>
        <div>
          <div className={styles.titleRow}>
            <span className={styles.dot} style={{ background: project.brand_color }} />
            <div className={styles.title}>
              <h1>{project.name}</h1>
              {project.subtitle && <p>{project.subtitle}</p>}
            </div>
          </div>
          <span className={styles.stagePill} style={{ background: `${stage.color}22`, color: stage.color }}>
            {stage.label}
          </span>
        </div>
        <div className={styles.actions}>
          <Link href="/dashboard" className={styles.btn}>
            ← Proyectos
          </Link>
          {canEdit && (
            <Link href={`/dashboard/projects/${projectId}/edit`} className={styles.btn}>
              ✎ Entrar a detalle
            </Link>
          )}
          <Link href={`/dashboard/projects/${projectId}/report`} className={`${styles.btn} ${styles.btnPrimary}`}>
            📊 Ver reporte
          </Link>
        </div>
      </div>

      {/* Avance global */}
      <div className={styles.progressCard}>
        <div className={styles.pctBig} style={{ color: bandColorHex(avg) }}>
          {avg}%
        </div>
        <div className={styles.progressMeta}>
          <div style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 600 }}>Avance global del proyecto</div>
          <div className={styles.bar}>
            <i style={{ width: `${avg}%`, background: bandColorHex(avg) }} />
          </div>
        </div>
        <div className={styles.miniStats}>
          <div className={styles.miniStat}>
            <div className="v">{countries.length}</div>
            <div className="l">Países</div>
          </div>
          <div className={styles.miniStat}>
            <div className="v">{societies.length}</div>
            <div className="l">Sociedades</div>
          </div>
          <div className={styles.miniStat}>
            <div className="v">{flat.length}</div>
            <div className="l">Entregables</div>
          </div>
          <div className={styles.miniStat}>
            <div className="v">{project.phases.length}</div>
            <div className="l">Fases</div>
          </div>
        </div>
      </div>

      {/* Info clave */}
      <div className={styles.grid3}>
        <div className={styles.infoCard}>
          <div className="lab">Sponsor</div>
          <div className="val">{project.sponsor || 'Por definir'}</div>
        </div>
        <div className={styles.infoCard}>
          <div className="lab">PM (InnoTeam)</div>
          <div className="val">{project.pm || project.project_lead || 'Por definir'}</div>
        </div>
        <div className={styles.infoCard}>
          <div className="lab">Líder Usuario (Cliente)</div>
          <div className="val">{project.user_lead || 'Por definir'}</div>
        </div>
        <div className={styles.infoCard}>
          <div className="lab">Consultores funcionales</div>
          <div className="val">
            {project.functional_team?.length ? project.functional_team.map((m) => m.name).join(', ') : 'Por definir'}
          </div>
        </div>
        <div className={styles.infoCard}>
          <div className="lab">Consultores técnicos</div>
          <div className="val">
            {project.technical_team?.length ? project.technical_team.map((m) => m.name).join(', ') : 'Por definir'}
          </div>
        </div>
      </div>

      {/* Por país: usuarios clave + avance */}
      <div className={styles.sec}>Países, sociedades y usuarios clave</div>
      <div className={styles.countryGrid}>
        {countries.map((c) => {
          const cFlat = flat.filter((f) => f.f === c.code)
          const cAvg = avgOf(cFlat)
          const socs = societies.filter((s) => s.country_id === c.id)
          return (
            <div className={styles.countryCard} key={c.id}>
              <div className={styles.countryTop}>
                <span className={styles.countryName}>{c.name}</span>
                <span className={styles.countryPct} style={{ color: bandColorHex(cAvg) }}>
                  {cAvg}%
                </span>
              </div>
              {c.lead && (
                <div style={{ fontSize: 12, color: 'var(--ink2)' }}>
                  Líder usuario: <strong>{c.lead}</strong>
                </div>
              )}
              <div className={styles.kuLabel}>Usuarios clave</div>
              {c.key_users && c.key_users.length ? (
                c.key_users.map((u, i) => (
                  <div className={styles.ku} key={i}>
                    <span className="kuName">{u.name}</span>
                    <span className="kuRole">{u.role}</span>
                  </div>
                ))
              ) : (
                <div className={styles.kuEmpty}>Sin usuarios clave — agrégalos en el detalle.</div>
              )}
              <div className={styles.socList}>
                {socs.length} sociedades: {socs.map((s) => s.name).join(', ')}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
