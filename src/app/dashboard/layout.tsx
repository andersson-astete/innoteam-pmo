'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import styles from './dashboard.module.css'

const Header = dynamic(() => import('@/components/Header'), { ssr: false })
const Sidebar = dynamic(() => import('@/components/Sidebar'), { ssr: false })

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    if (typeof window !== 'undefined') {
      if (newTheme === 'light') {
        document.documentElement.classList.add('light')
      } else {
        document.documentElement.classList.remove('light')
      }
      localStorage.setItem('theme', newTheme)
    }
  }

  return (
    <div className={styles.layout}>
      <Header
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onThemeToggle={handleThemeToggle}
        theme={theme}
      />
      <div className={styles.content}>
        <Sidebar isOpen={sidebarOpen} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  )
}
