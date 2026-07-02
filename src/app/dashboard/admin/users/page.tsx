'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import styles from '../admin.module.css'

interface UserRecord {
  id: string
  email: string
  role: string
  created_at: string
}

export default function AdminUsersPage() {
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'gerencia' | 'pm' | 'consultant' | 'admin-ti'>('consultant')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    checkAccess()
    loadUsers()
  }, [])

  const checkAccess = async () => {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      window.location.href = '/auth/login'
      return
    }
    setUser(currentUser)

    // Solo admin-ti puede crear usuarios
    if (currentUser.user_metadata?.role !== 'admin-ti') {
      setMessage('❌ Acceso denegado. Solo Admin TI puede crear usuarios.')
    }
  }

  const loadUsers = async () => {
    try {
      const { data } = await supabase.auth.admin.listUsers()
      setUsers(
        data?.users?.map((u: any) => ({
          id: u.id,
          email: u.email,
          role: u.user_metadata?.role || 'N/A',
          created_at: u.created_at,
        })) || []
      )
    } catch (err) {
      console.error('Error loading users:', err)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (user?.user_metadata?.role !== 'admin-ti') {
      setMessage('❌ Solo Admin TI puede crear usuarios')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(`❌ ${data.error || 'Error al crear usuario'}`)
        return
      }

      setMessage(`✅ Usuario ${newEmail} creado como ${newRole}`)
      setNewEmail('')
      setNewPassword('')
      setNewRole('consultant')
      loadUsers()
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div>Cargando...</div>

  const isAdminTI = user?.user_metadata?.role === 'admin-ti'

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestión de Usuarios</h1>
        <p>Crear y administrar usuarios del sistema</p>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            background: message.includes('✅') ? 'var(--okbg)' : 'var(--coralbg)',
            color: message.includes('✅') ? 'var(--ok)' : 'var(--coral)',
            fontSize: '14px',
          }}
        >
          {message}
        </div>
      )}

      {isAdminTI && (
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>
            ➕ Crear Nuevo Usuario
          </h2>

          <form onSubmit={handleCreateUser}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="usuario@innoteam.com"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    background: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600' }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    background: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600' }}>
                  Rol
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    background: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: '13px',
                  }}
                >
                  <option value="gerencia">Gerencia (Visualización)</option>
                  <option value="pm">Project Manager</option>
                  <option value="consultant">Consultor Funcional</option>
                  <option value="admin-ti">Administrador TI</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  background: 'var(--brand)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  opacity: loading ? 0.6 : 1,
                  alignSelf: 'flex-end',
                }}
              >
                {loading ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: '12px',
          padding: '16px',
          overflowX: 'auto',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>
          👥 Usuarios del Sistema
        </h2>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px',
                  borderBottom: '1px solid var(--line)',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  color: 'var(--ink3)',
                }}
              >
                Email
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px',
                  borderBottom: '1px solid var(--line)',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  color: 'var(--ink3)',
                }}
              >
                Rol
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px',
                  borderBottom: '1px solid var(--line)',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  color: 'var(--ink3)',
                }}
              >
                Creado
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '10px 8px', fontSize: '13px' }}>{u.email}</td>
                <td style={{ padding: '10px 8px', fontSize: '12px', fontWeight: '600' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background:
                        u.role === 'gerencia'
                          ? 'var(--okbg)'
                          : u.role === 'admin-ti'
                            ? 'rgba(59, 130, 246, 0.14)'
                            : u.role === 'pm'
                              ? 'var(--warnbg)'
                              : 'var(--coralbg)',
                      color:
                        u.role === 'gerencia'
                          ? 'var(--ok)'
                          : u.role === 'admin-ti'
                            ? '#3B82F6'
                            : u.role === 'pm'
                              ? 'var(--warn)'
                              : 'var(--coral)',
                    }}
                  >
                    {u.role === 'gerencia' && '👁 Gerencia'}
                    {u.role === 'pm' && '📊 PM'}
                    {u.role === 'consultant' && '📋 Consultor'}
                    {u.role === 'admin-ti' && '🔧 Admin TI'}
                  </span>
                </td>
                <td style={{ padding: '10px 8px', fontSize: '12px', color: 'var(--ink3)' }}>
                  {new Date(u.created_at).toLocaleDateString('es-ES')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ink3)' }}>
            No hay usuarios registrados
          </div>
        )}
      </div>
    </div>
  )
}
