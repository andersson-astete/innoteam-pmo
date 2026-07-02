'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'
import styles from './login.module.css'

export default function LoginContent() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await signIn(email, password)

      if (signInError) {
        setError(signInError.message || 'Error al iniciar sesión')
        return
      }

      if (data.session) {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Error inesperado. Por favor, intenta de nuevo.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>INNOTEAM - PMO</h1>
          <p>Project Tracking Platform</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className={styles.footer}>
          <details style={{ marginBottom: '12px', fontSize: '11px', cursor: 'pointer' }}>
            <summary style={{ fontWeight: '600', color: 'var(--ink3)', marginBottom: '8px' }}>
              📝 Usuarios de Test
            </summary>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace', lineHeight: '1.4' }}>
              <div><strong>👁 Gerencia:</strong> gerencia@innoteam.com / Gerencia123!</div>
              <div><strong>📊 PM:</strong> pm@innoteam.com / PM123!</div>
              <div><strong>📋 Consultor:</strong> consultant@innoteam.com / Consultant123!</div>
              <div><strong>🔧 Admin TI:</strong> admin@innoteam.com / Admin123!</div>
            </div>
          </details>
          <p>© 2026 InnoTeam. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}
