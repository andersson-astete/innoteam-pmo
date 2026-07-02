'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getDeliverables, getSocieties, getProjectStats, filterDeliverables, PAIS, PAISSHORT, EST } from '@/lib/mockData'
import styles from './projects.module.css'
import KPICard from '@/components/KPICard'

export default function ProjectsPage() {
  const [selectedPais, setSelectedPais] = useState<string | null>(null)
  const stats = getProjectStats()
  const allSocieties = getSocieties()
  const societies = selectedPais
    ? allSocieties.filter(s => s.f === selectedPais)
    : allSocieties

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Proyectos</h1>
        <p>15 sociedades · 45 entregables</p>
      </div>

      {/* KPIs */}
      <div className={styles.kpis}>
        <KPICard
          label="Avance Global"
          value={`${stats.avg}%`}
          icon="◑"
          iconColor="#3B82F6"
          iconBg="rgba(59, 130, 246, 0.14)"
          subtext="ponderado por fase"
          progress={stats.avg}
          progressColor={stats.avg >= 65 ? 'var(--ok)' : stats.avg >= 30 ? 'var(--warn)' : 'var(--coral)'}
        />
        <KPICard
          label="Entregables"
          value={stats.total}
          icon="▤"
          iconColor="#6D5FD4"
          iconBg="rgba(109, 95, 212, 0.14)"
          subtext={`${allSocieties.length} sociedades × 3 reportes`}
        />
        <KPICard
          label="En Pruebas"
          value={stats.testing}
          icon="⚑"
          iconColor="var(--testc)"
          iconBg="var(--testbg)"
          subtext={`${Math.round((stats.testing / stats.total) * 100)}% en pruebas integrales`}
          progress={Math.round((stats.testing / stats.total) * 100)}
          progressColor="var(--testc)"
        />
        <KPICard
          label="Lado Cliente"
          value={stats.client}
          icon="◈"
          iconColor="var(--clientc)"
          iconBg="var(--clientbg)"
          subtext="distribuidoras en PRD"
        />
        <KPICard
          label="Etapa Inicial"
          value={stats.init}
          icon="◔"
          iconColor="var(--coral)"
          iconBg="var(--coralbg)"
          subtext="requieren impulso"
          progress={Math.round((stats.init / stats.total) * 100)}
          progressColor="var(--coral)"
        />
        <KPICard
          label="Alertas"
          value="4"
          icon="!"
          iconColor="var(--warn)"
          iconBg="var(--warnbg)"
          subtext="foco de decisión"
        />
      </div>

      {/* Filtros */}
      <div className={styles.filterBar}>
        <span className={styles.flabel}>Por país:</span>
        <button
          className={`${styles.chip} ${!selectedPais ? styles.active : ''}`}
          onClick={() => setSelectedPais(null)}
        >
          Todos ({allSocieties.length})
        </button>
        {Object.entries(PAISSHORT).map(([k, v]) => (
          <button
            key={k}
            className={`${styles.chip} ${selectedPais === k ? styles.active : ''}`}
            onClick={() => setSelectedPais(k)}
          >
            {v} ({allSocieties.filter(s => s.f === k).length})
          </button>
        ))}
      </div>

      {/* Tabla de Sociedades */}
      <div className={styles.tableCard}>
        <h2>Sociedades y Avance</h2>
        <div className={styles.tableScroll}>
          <table>
            <thead>
              <tr>
                <th>Sociedad</th>
                <th>País</th>
                <th>Reportes</th>
                <th>Avance</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {societies.map(s => (
                <tr key={s.soc} className={styles.row}>
                  <td className={styles.soc}>
                    <Link href={`/dashboard/projects/${encodeURIComponent(s.soc)}`}>
                      {s.soc}
                    </Link>
                  </td>
                  <td>{PAISSHORT[s.f as keyof typeof PAISSHORT] || s.f}</td>
                  <td>
                    <div className={styles.reps}>
                      {s.reps.map((r, i) => (
                        <span key={i} className={`${styles.rep} ${r.last >= 5 ? styles.done : ''}`}>
                          {r.rep}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className={styles.progress}>
                      <div style={{ width: `${s.pct}%` }} className={styles.bar}></div>
                      <span>{s.pct}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[s.est]}`}>
                      {EST[s.est as keyof typeof EST].l}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
