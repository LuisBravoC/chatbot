import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../../store/useAppStore'

type ThemeId = 'light' | 'dark' | 'midnight' | 'sunset' | 'forest' | 'rose'
type IconKey = 'sun' | 'moon' | 'eye' | 'sun2' | 'tree' | 'heart'

const THEMES: { id: ThemeId; label: string; preview: string; icon: IconKey }[] = [
  { id: 'light',    label: 'Claro',       preview: 'linear-gradient(135deg,#fff,#f3f4f6)',   icon: 'sun' },
  { id: 'dark',     label: 'Oscuro',      preview: 'linear-gradient(135deg,#0f0f14,#1e1e28)', icon: 'moon' },
  { id: 'midnight', label: 'Medianoche',  preview: 'linear-gradient(135deg,#030712,#1e3a8a)', icon: 'eye' },
  { id: 'sunset',   label: 'Atardecer',   preview: 'linear-gradient(135deg,#fef7f0,#f97316)', icon: 'sun2' },
  { id: 'forest',   label: 'Bosque',      preview: 'linear-gradient(135deg,#0a1410,#16a34a)', icon: 'tree' },
  { id: 'rose',     label: 'Rosa',        preview: 'linear-gradient(135deg,#fff1f2,#e11d48)', icon: 'heart' },
]

const ICONS: Record<IconKey, React.ReactElement> = {
  sun:   <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
  moon:  <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
  eye:   <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
  sun2:  <><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>,
  tree:  <><path d="M12 2L7 10h10l-5-8zM7 10l-5 8h20l-5-8M12 18v4"/></>,
  heart: <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>,
}

export function ThemeSwitcher() {
  const { config, setConfig } = useAppStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const applyTheme = (id: ThemeId) => {
    document.body.setAttribute('data-theme', id)
    setConfig({ theme: id })
    // Actualizar meta theme-color
    const colors: Record<ThemeId, string> = { light:'#6366f1', dark:'#818cf8', midnight:'#3b82f6', sunset:'#f97316', forest:'#16a34a', rose:'#e11d48' }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors[id] ?? '#6366f1')
    setOpen(false)
  }

  // Aplicar tema guardado al montar
  useEffect(() => { applyTheme(config.theme as ThemeId) }, []) // eslint-disable-line

  // Cerrar al clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = THEMES.find(t => t.id === config.theme) ?? THEMES[0]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Cambiar tema"
        style={{
          background: 'none',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-secondary)',
          transition: 'var(--transition-fast)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {ICONS[current.icon]}
        </svg>
        <span style={{ fontSize: 13 }}>{current.label}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: 6,
          zIndex: 100,
          minWidth: 160,
        }}>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => applyTheme(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                background: config.theme === t.id ? 'var(--bg-active)' : 'none',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '8px 10px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontSize: 13,
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => { if (config.theme !== t.id) e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={(e) => { if (config.theme !== t.id) e.currentTarget.style.background = 'none' }}
            >
              <span style={{ width: 16, height: 16, borderRadius: 4, background: t.preview, flexShrink: 0, border: '1px solid var(--border-primary)' }} />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICONS[t.icon]}</svg>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
