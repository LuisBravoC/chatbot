import React, { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: number
}

export function Modal({ open, onClose, title, children, footer, maxWidth = 520 }: ModalProps) {
  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--bg-modal)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
        padding: 16,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        width: '100%',
        maxWidth,
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-primary)',
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{title}</span>
          <button onClick={onClose} style={closeBtnStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-primary)',
            display: 'flex', justifyContent: 'flex-end', gap: 8,
            flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { transform:translateY(16px); opacity:0 } to { transform:none; opacity:1 } }
      `}</style>
    </div>
  )
}

interface BtnProps {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}
export function Btn({ children, onClick, variant = 'secondary' }: BtnProps) {
  const styles: Record<'primary' | 'secondary' | 'danger', React.CSSProperties> = {
    primary: { background: 'var(--accent-gradient)', color: 'white', border: 'none' },
    secondary: { background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' },
    danger: { background: 'var(--error)', color: 'white', border: 'none' },
  }
  return (
    <button onClick={onClick} style={{
      ...styles[variant],
      padding: '8px 18px',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
      transition: 'var(--transition-fast)',
    }}>
      {children}
    </button>
  )
}

const closeBtnStyle = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: 6, borderRadius: 'var(--radius-md)',
  color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center',
}
