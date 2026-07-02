'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

interface SidebarProps {
  isOpen: boolean
}

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/projects', label: 'Proyectos', icon: '📁' },
  { href: '/dashboard/deliverables', label: 'Entregables', icon: '✓' },
  { href: '/dashboard/alerts', label: 'Alertas', icon: '⚠' },
  { href: '/dashboard/actions', label: 'Acciones', icon: '→' },
  { href: '/dashboard/admin', label: 'Administración', icon: '⚙' },
]

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
      <nav className={styles.nav}>
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${isActive ? styles.active : ''}`}
              title={link.label}
            >
              <span className={styles.icon}>{link.icon}</span>
              <span className={styles.label}>{link.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
