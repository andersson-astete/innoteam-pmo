'use client'

import styles from './home.module.css'

export default function DashboardPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Dashboard Ejecutivo</h1>
        <p>Bienvenido a INNOTEAM - PMO</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardContent}>
            <h2>Proyectos</h2>
            <p className={styles.loading}>Cargando...</p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardContent}>
            <h2>Entregables</h2>
            <p className={styles.loading}>Cargando...</p>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardContent}>
            <h2>Alertas</h2>
            <p className={styles.loading}>Cargando...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
