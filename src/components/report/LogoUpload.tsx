'use client'

import { useRef, useState } from 'react'

export default function LogoUpload({
  target,
  projectId,
  onDone,
  label,
}: {
  target: 'innoteam' | 'client'
  projectId?: string
  onDone: (url: string) => void
  label: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const upload = async (file: File) => {
    setBusy(true)
    setErr('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('target', target)
      if (projectId) fd.append('projectId', projectId)
      const res = await fetch('/api/upload-logo', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        setErr(json.error || 'Error al subir')
        return
      }
      onDone(json.url)
    } catch (e: any) {
      setErr(e.message || 'Error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) upload(f)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        style={{
          border: '1px solid var(--line2)',
          background: 'var(--panel)',
          color: 'var(--ink)',
          padding: '6px 12px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? 'Subiendo…' : label}
      </button>
      {err && <span style={{ color: 'var(--coral)', fontSize: 11 }}>{err}</span>}
    </span>
  )
}
