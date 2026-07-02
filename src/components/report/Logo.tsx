'use client'

// Muestra un logo desde URL, o un wordmark de respaldo si no hay imagen.
export function Logo({
  url,
  name,
  kind,
  color = '#2F6BD8',
  height = 30,
}: {
  url?: string | null
  name: string
  kind: 'innoteam' | 'client'
  color?: string
  height?: number
}) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} style={{ height, width: 'auto', display: 'block', objectFit: 'contain' }} />
  }
  if (kind === 'innoteam') return <InnoTeamMark height={height} />
  return <ClientMark name={name} color={color} height={height} />
}

export function InnoTeamMark({ height = 30 }: { height?: number }) {
  return (
    <svg height={height} viewBox="0 0 168 40" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="InnoTeam">
      <defs>
        <linearGradient id="itg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#7DBE3E" />
        </linearGradient>
      </defs>
      <rect x="2" y="6" width="28" height="28" rx="8" fill="url(#itg)" />
      <path d="M11 26V14M16 26v-8m5 8V17" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <text x="40" y="26" fontFamily="Inter, system-ui, sans-serif" fontSize="18" fontWeight="800" fill="currentColor">
        Inno<tspan fill="#7DBE3E">Team</tspan>
      </text>
    </svg>
  )
}

export function ClientMark({ name, color = '#2F6BD8', height = 30 }: { name: string; color?: string; height?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <div
      style={{
        height,
        minWidth: height,
        padding: '0 10px',
        borderRadius: 8,
        background: `linear-gradient(135deg, ${color}, ${color}bb)`,
        color: '#fff',
        fontWeight: 800,
        fontSize: height * 0.42,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        letterSpacing: 0.5,
      }}
    >
      <span style={{ background: 'rgba(255,255,255,.22)', borderRadius: 6, padding: '2px 6px', fontSize: height * 0.4 }}>
        {initials || '•'}
      </span>
      <span style={{ fontSize: height * 0.38, fontWeight: 700 }}>{name}</span>
    </div>
  )
}
