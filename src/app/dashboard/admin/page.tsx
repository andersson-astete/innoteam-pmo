'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/auth'
import styles from './admin.module.css'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    }
    loadUser()
  }, [])

  const userRole = user?.user_metadata?.role

  const rolesInfo = [
    {
      name: '👁 Gerencia',
      description: 'Visualización de dashboards',
      permissions: ['Ver todos los dashboards', 'Exportar reportes', 'Ver alertas críticas'],
      color: '#10b981',
    },
    {
      name: '📊 Project Manager',
      description: 'Gestión de proyectos',
      permissions: ['Crear proyectos', 'Editar entregables', 'Crear alertas', 'Gestionar acciones'],
      color: '#f59e0b',
    },
    {
      name: '📋 Consultor',
      description: 'Captura de datos',
      permissions: ['Registrar observaciones', 'Reportar progreso', 'Ver sus entregas'],
      color: '#ef4444',
    },
    {
      name: '🔧 Admin TI',
      description: 'Administración del sistema',
      permissions: ['Crear usuarios', 'Asignar roles', 'Gestionar acceso', 'Ver auditoría'],
      color: '#3b82f6',
    },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Administración</h1>
        <p>Gestión de usuarios, permisos y configuración</p>
      </div>

      {/* Admin Section */}
      {userRole === 'admin-ti' && (
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '16px' }}>🔧 Panel Admin TI</h2>
          <Link href="/dashboard/admin/users">
            <button
              style={{
                padding: '10px 16px',
                background: 'var(--brand)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              ➕ Crear Nuevo Usuario
            </button>
          </Link>
        </div>
      )}

      {/* Roles Information */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>📋 Roles del Sistema</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
          }}
        >
          {rolesInfo.map((role) => (
            <div
              key={role.name}
              style={{
                background: 'var(--panel)',
                border: `2px solid ${role.color}`,
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '700' }}>
                {role.name}
              </h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--ink3)' }}>
                {role.description}
              </p>
              <div style={{ fontSize: '11px', color: 'var(--ink2)' }}>
                <strong>Permisos:</strong>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '16px' }}>
                  {role.permissions.map((perm) => (
                    <li key={perm}>{perm}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.grid}>
        <Link href="/dashboard/admin/users">
          <div className={styles.card}>
            <h2>👥 Usuarios</h2>
            <p>Crear y administrar usuarios del sistema</p>
            <button style={{ marginTop: '12px' }}>Ir a Usuarios →</button>
          </div>
        </Link>

        <div className={styles.card}>
          <h2>📊 Proyectos</h2>
          <p>Crear proyectos y definir fases</p>
          <button style={{ marginTop: '12px', opacity: 0.5, cursor: 'not-allowed' }}>
            Próximamente
          </button>
        </div>

        <div className={styles.card}>
          <h2>🏢 Empresas</h2>
          <p>Gestionar clientes y configuración</p>
          <button style={{ marginTop: '12px', opacity: 0.5, cursor: 'not-allowed' }}>
            Próximamente
          </button>
        </div>

        <div className={styles.card}>
          <h2>📋 Auditoría</h2>
          <p>Ver historial de cambios en el sistema</p>
          <button style={{ marginTop: '12px', opacity: 0.5, cursor: 'not-allowed' }}>
            Próximamente
          </button>
        </div>
      </div>
    </div>
  )
}
