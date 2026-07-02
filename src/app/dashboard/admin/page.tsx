'use client'

import styles from './admin.module.css'

export default function AdminPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Administración</h1>
        <p>Gestión de empresas, usuarios y proyectos</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2>Empresas</h2>
          <p>Gestionar clientes, logos y configuración</p>
          <button>Ir a Empresas</button>
        </div>
        <div className={styles.card}>
          <h2>Usuarios</h2>
          <p>Crear y asignar roles (Gerencia, PM, Consultores)</p>
          <button>Ir a Usuarios</button>
        </div>
        <div className={styles.card}>
          <h2>Proyectos</h2>
          <p>Crear proyectos, definir fases y metodología</p>
          <button>Ir a Proyectos</button>
        </div>
        <div className={styles.card}>
          <h2>Auditoría</h2>
          <p>Ver historial de cambios (quién, qué, cuándo)</p>
          <button>Ver Auditoría</button>
        </div>
      </div>
    </div>
  )
}
