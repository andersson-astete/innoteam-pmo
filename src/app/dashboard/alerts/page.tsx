'use client'

import styles from './alerts.module.css'

const mockAlerts = [
  { id: 1, severity: 'alta', title: 'Perú · observación abierta en Flujo de Fondos', impact: 'El reporte FF no cierra al 100%', action: 'Christopher resuelve hoy', owner: 'Christopher', due: 'Hoy' },
  { id: 2, severity: 'media', title: 'RD2 · el cliente pide una sesión por sociedad', impact: '4 sociedades en pruebas', action: 'Agendar 4 sesiones', owner: 'Andersson / Paul', due: 'Esta semana' },
  { id: 3, severity: 'alta', title: 'Guatemala · riesgo de cronograma', impact: '4 sociedades sin iniciar', action: 'Liberar agenda', owner: 'Paul', due: 'Desde 2/jul' },
  { id: 4, severity: 'media', title: 'Replanificación pendiente', impact: 'Sin cronograma sincerado', action: 'Sesión de ajuste', owner: 'Andersson', due: 'Esta semana' },
]

export default function AlertsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Alertas y Riesgos</h1>
        <p>4 alertas activas - foco de decisión</p>
      </div>

      <div className={styles.grid}>
        {mockAlerts.map(alert => (
          <div key={alert.id} className={`${styles.card} ${styles[alert.severity]}`}>
            <div className={styles.head}>
              <h3>{alert.title}</h3>
              <span className={`${styles.badge} ${styles[alert.severity]}`}>{alert.severity}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Impacto:</span>
              <span>{alert.impact}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Acción:</span>
              <span>{alert.action}</span>
            </div>
            <div className={styles.footer}>
              <span className={styles.owner}>{alert.owner}</span>
              <span className={styles.due}>{alert.due}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
