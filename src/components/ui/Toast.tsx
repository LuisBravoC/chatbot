import { useState, useCallback, useRef } from 'react'
import type { ToastType } from '../../types'

const ICONS: Record<ToastType, React.ReactElement> = {
  success: <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  error:   <svg viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  warning: <svg viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  info:    <svg viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
}

interface ToastItem {
  id: number
  message: string
  type: ToastType
  exiting: boolean
}

type ShowToastFn = (message: string, type: ToastType, duration: number) => void

let globalShowToast: ShowToastFn | null = null

export function useToast() {
  const show = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    globalShowToast?.(message, type, duration)
  }, [])
  return { showToast: show }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counterRef = useRef(0)

  globalShowToast = useCallback((message: string, type: ToastType, duration: number) => {
    const id = ++counterRef.current
    setToasts(prev => [...prev, { id, message, type, exiting: false }])
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 320)
    }, duration)
  }, [])

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20,
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 300, pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13, color: 'var(--text-primary)',
          minWidth: 200, maxWidth: 340,
          animation: t.exiting ? 'toastSlideOut 0.3s forwards' : 'toastSlideIn 0.3s forwards',
          pointerEvents: 'auto',
        }}>
          <span style={{ width: 18, height: 18, flexShrink: 0, display: 'flex' }}>{ICONS[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
