'use client'

import { useState } from 'react'
import { getDeliverables, EST } from '@/lib/mockData'
import styles from './deliverables.module.css'

export default function DeliverablesPage() {
  const [deliverables, setDeliverables] = useState(getDeliverables())
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  const filtered = filterStatus ? deliverables.filter(d => d.est === filterStatus) : deliverables

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Entregables</h1>
        <p>45 reportes de 15 sociedades en 6 países</p>
      </div>

      <div className={styles.filterBar}>
        <button className={!filterStatus ? styles.active : ''} onClick={() => setFilterStatus(null)}>
          Todos ({deliverables.length})
        </button>
        {Object.entries(EST).map(([k, v]) => (
          <button
            key={k}
            className={filterStatus === k ? styles.active : ''}
            onClick={() => setFilterStatus(k)}
          >
            {v.l} ({deliverables.filter(d => d.est === k).length})
          </button>
        ))}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table>
            <thead>
              <tr>
                <th>Sociedad</th>
                <th>País</th>
                <th>Reporte</th>
                <th>Avance</th>
                <th>Estado</th>
                <th>Fase</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td className={styles.bold}>{d.soc}</td>
                  <td>{d.f}</td>
                  <td className={styles.rep}>{d.rep}</td>
                  <td>
                    <div className={styles.pct}>{d.pct}%</div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[d.est]}`}>
                      {EST[d.est as keyof typeof EST].l}
                    </span>
                  </td>
                  <td>{d.last >= 0 ? d.last + 1 : '-'}</td>
                  <td className={styles.small}>{d.obs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
