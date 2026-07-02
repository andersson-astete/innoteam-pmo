'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProjects, getProjectData, flattenDeliverables, type Project } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { avgOf } from '@/lib/report'
import styles from './home.module.css'

interface ProjectCard extends Project {
  avg: number
  countries: number
  societies: number
  deliverables: number
}

export default function DashboardHome() {
  const [projects, setProjects] = useState<ProjectCard[]>([])
  const [loading, setLoading] = useState(true)
  const [canCreate, setCanCreate] = useState(false)

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

  return (
    <div className={styles.container}>
      <div
        className={styles.header}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}
      >
        <div>
          <h1>Proyectos</h1>
          <p>Seguimiento de implementaciones · InnoTeam</p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/projects/new"
            style={{
              background: 'var(--brand)',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            + Crear proyecto
          </Link>
        )}
      </div>

      {loading ? (
        <p style={{ color: 'var(--ink3)' }}>Cargando proyectos…</p>
      ) : projects.length === 0 ? (
        <div className={styles.info}>
          <p>
            Aún no hay proyectos.{' '}
            {canCreate ? 'Crea el primero con el botón de arriba.' : 'Pide a un PM o Admin TI que cree uno.'}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {projects.map((p) => (
            <Link key={p.id} href={`/dashboard/projects/${p.id}`} className={styles.card}>
              <div className={styles.cardContent}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 4,
                      background: p.brand_color,
                      display: 'inline-block',
                    }}
                  />
                  <h2>{p.name}</h2>
                </div>
                {p.subtitle && <p className={styles.sub}>{p.subtitle}</p>}
                <div
                  className={styles.val}
                  style={{ color: p.avg >= 65 ? 'var(--ok)' : p.avg >= 30 ? 'var(--warn)' : 'var(--coral)' }}
                >
                  {p.avg}%
                </div>
                <p className={styles.sub}>
                  {p.countries} países · {p.societies} sociedades · {p.deliverables} entregables
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
