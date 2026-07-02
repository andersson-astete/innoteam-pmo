'use client'

import styles from './KPICard.module.css'

interface KPICardProps {
  label: string
  value: string | number
  icon: string
  iconColor: string
  iconBg: string
  subtext?: string
  progress?: number
  progressColor?: string
  clickable?: boolean
  onClick?: () => void
  isActive?: boolean
}

export default function KPICard({
  label,
  value,
  icon,
  iconColor,
  iconBg,
  subtext,
  progress,
  progressColor,
  clickable,
  onClick,
  isActive,
}: KPICardProps) {
  return (
    <div
      className={`${styles.kpi} ${clickable ? styles.clickable : ''} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {clickable && isActive && <span className={styles.filterTag}>filtro</span>}

      <div className={styles.lab}>
        <span className={styles.ic} style={{ background: iconBg, color: iconColor }}>
          {icon}
        </span>
        <span>{label}</span>
      </div>

      <div className={styles.val}>
        <span>{value}</span>
      </div>

      {subtext && <div className={styles.sub}>{subtext}</div>}

      {progress !== undefined && (
        <div className={styles.prog}>
          <i style={{ width: `${progress}%`, background: progressColor }}></i>
        </div>
      )}
    </div>
  )
}
