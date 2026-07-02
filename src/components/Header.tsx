'use client'

import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth'
import styles from './Header.module.css'

interface HeaderProps {
  onMenuClick: () => void
  onThemeToggle: () => void
  theme: 'dark' | 'light'
}

export default function Header({ onMenuClick, onThemeToggle, theme }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuClick} title="Toggle menu">
          ☰
        </button>
        <div className={styles.brand}>
          <h1>INNOTEAM - PMO</h1>
        </div>
      </div>

      <div className={styles.right}>
        <button
          className={styles.themeBtn}
          onClick={onThemeToggle}
          title="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>

        <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
          ⎋
        </button>
      </div>
    </header>
  )
}
