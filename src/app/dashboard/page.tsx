'use client'

import Link from 'next/link'
import styles from './home.module.css'
import { getProjectStats } from '@/lib/mockData'

export default function DashboardPage() {
  const stats = getProjectStats()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Dashboard Ejecutivo</h1>
        <p>ISM · Proyecto de Reportes Financieros SAP</p>
      </div>

      <div className={styles.grid}>
        <Link href="/dashboard/projects" className={styles.card}>
          <div className={styles.cardContent}>
            <h2>📁 Proyectos</h2>
            <p className={styles.val}>{stats.total}</p>
            <p className={styles.sub}>entregables en seguimiento</p>
          </div>
        </Link>

        <Link href="/dashboard/deliverables" className={styles.card}>
          <div className={styles.cardContent}>
            <h2>✓ Entregables</h2>
            <p className={styles.val}>{stats.avg}%</p>
            <p className={styles.sub}>avance promedio</p>
          </div>
        </Link>

        <Link href="/dashboard/alerts" className={styles.card}>
          <div className={styles.cardContent}>
            <h2>⚠ Alertas</h2>
            <p className={styles.val}>4</p>
            <p className={styles.sub}>riesgos activos</p>
          </div>
        </Link>

        <Link href="/dashboard/actions" className={styles.card}>
          <div className={styles.cardContent}>
            <h2>→ Acciones</h2>
            <p className={styles.val}>6</p>
            <p className={styles.sub}>próximos pasos</p>
          </div>
        </Link>
      </div>

      <div className={styles.info}>
        <p>
          <strong>Bienvenido a INNOTEAM - PMO:</strong> Plataforma de seguimiento de implementaciones SAP/ODOO.
          Navega por <strong>Proyectos</strong> para ver sociedades, <strong>Entregables</strong> para filtrar por estado,
          y <strong>Alertas</strong> para enfocarte en los riesgos críticos.
        </p>
      </div>
    </div>
  )
}
