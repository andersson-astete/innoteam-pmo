'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

interface SidebarProps {
  isOpen: boolean
}

const links = [
  { href: '/dashboard', label: 'Proyectos', icon: '📁' },
  { href: '/dashboard/admin', label: 'Administración', icon: '⚙' },
  { href: '/dashboard/admin/users', label: 'Usuarios', icon: '👥' },
]

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
      <nav className={styles.nav}>
        {links.map((link) => {
          const isRoot = link.href === '/dashboard'
          const isActive = isRoot
            ? pathname === '/dashboard' || pathname.startsWith('/dashboard/projects')
            : pathname === link.href || pathname.startsWith(link.href + '/')
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
