'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getProjects,
  getProjectData,
  flattenDeliverables,
  type Project,
  type Stage,
} from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { avgOf } from '@/lib/report'
import { mutate } from '@/lib/mutate'
import styles from './projects.module.css'

interface ProjectCard extends Project {
  avg: number
  countries: number
  societies: number
  deliverables: number
}

const STAGES: { key: Stage; label: string; color: string }[] = [
  { key: 'inicio', label: 'Inicio', color: '#FB923C' },
  { key: 'desarrollo', label: 'En desarrollo', color: '#FBBF24' },
  { key: 'uat', label: 'En pruebas UAT', color: '#A78BFA' },
  { key: 'produccion', label: 'En producción', color: '#34D399' },
  { key: 'cerrado', label: 'Cerrado', color: '#6E7C99' },
]
const stageMeta = (s: Stage) => STAGES.find((x) => x.key === s) || STAGES[0]
const barColor = (v: number) => (v >= 65 ? 'var(--ok)' : v >= 30 ? 'var(--warn)' : 'var(--coral)')

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectCard[]>([])
  const [loading, setLoading] = useState(true)
  const [canCreate, setCanCreate] = useState(false)
  const [view, setView] = useState<'list' | 'kanban'>('kanban')
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<Stage | null>(null)

  useEffect(() => {
    getCurrentUser().then((u) => {
      const role = u?.user_metadata?.role
      setCanCreate(role === 'pm' || role === 'admin-ti')
    })
    ;(async () => {
      const list = await getProjects()
      const cards = await Promise.all(
        list.map(async (p) => {
          const data = await getProjectData(p.id)
          const flat = data ? flattenDeliverables(data) : []
          return {
            ...p,
            avg: avgOf(flat),
            countries: data?.countries.length || 0,
            societies: data?.societies.length || 0,
            deliverables: flat.length,
          }
        })
      )
      setProjects(cards)
      setLoading(false)
    })()
  }, [])

  const moveToStage = async (id: string, stage: Stage) => {
    const proj = projects.find((p) => p.id === id)
    if (!proj || proj.stage === stage) return
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, stage } : p)))
    try {
      await mutate('projects', 'update', { id, data: { stage } })
    } catch {
      // revertir en error
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, stage: proj.stage } : p)))
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Proyectos</h1>
          <p>Seguimiento de implementaciones · InnoTeam</p>
        </div>
        <div className={styles.headActions}>
          <div className={styles.toggle}>
            <button className={view === 'list' ? styles.on : ''} onClick={() => setView('list')}>
              ☰ Lista
            </button>
            <button className={view === 'kanban' ? styles.on : ''} onClick={() => setView('kanban')}>
              ▦ Kanban
            </button>
          </div>
          {canCreate && (
            <Link href="/dashboard/projects/new" className={styles.createBtn}>
              + Crear proyecto
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--ink3)' }}>Cargando proyectos…</p>
      ) : view === 'list' ? (
        <div className={styles.grid}>
          {projects.map((p) => {
            const sm = stageMeta(p.stage)
            return (
              <Link key={p.id} href={`/dashboard/projects/${p.id}`} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.dot} style={{ background: p.brand_color }} />
                  <h2>{p.name}</h2>
                </div>
                {p.subtitle && <div className={styles.sub}>{p.subtitle}</div>}
                <div className={styles.big} style={{ color: barColor(p.avg) }}>
                  {p.avg}%
                </div>
                <div className={styles.sub}>
                  {p.countries} países · {p.societies} sociedades · {p.deliverables} entregables
                </div>
                <span
                  className={styles.stagePill}
                  style={{ background: `${sm.color}22`, color: sm.color }}
                >
                  {sm.label}
                </span>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className={styles.board}>
          {STAGES.map((st) => {
            const items = projects.filter((p) => p.stage === st.key)
            return (
              <div
                key={st.key}
                className={`${styles.col} ${overCol === st.key ? styles.colOver : ''}`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverCol(st.key)
                }}
                onDragLeave={() => setOverCol((c) => (c === st.key ? null : c))}
                onDrop={(e) => {
                  e.preventDefault()
                  setOverCol(null)
                  if (dragId) moveToStage(dragId, st.key)
                  setDragId(null)
                }}
              >
                <div className={styles.colHead}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: st.color }} />
                    {st.label}
                  </span>
                  <span className={styles.colCount}>{items.length}</span>
                </div>
                {items.map((p) => (
                  <Link
                    key={p.id}
                    href={`/dashboard/projects/${p.id}`}
                    className={styles.kcard}
                    draggable
                    onDragStart={() => setDragId(p.id)}
                    onDragEnd={() => setDragId(null)}
                  >
                    <div className={styles.kcardTop}>
                      <span className={styles.dot} style={{ background: p.brand_color }} />
                      <h3>{p.name}</h3>
                    </div>
                    <div className={styles.kmeta}>
                      {p.countries} países · {p.societies} sociedades
                    </div>
                    <div className={styles.kbar}>
                      <i style={{ width: `${p.avg}%`, background: barColor(p.avg) }} />
                    </div>
                    <div className={styles.kmeta}>{p.avg}% de avance</div>
                  </Link>
                ))}
                {items.length === 0 && <div className={styles.empty}>Arrastra aquí</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
