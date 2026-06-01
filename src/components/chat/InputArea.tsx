import { useRef, useEffect, useCallback, RefObject } from 'react'
// RefObject is used by CharCounter below
import { useAppStore } from '../../store/useAppStore'

const MAX_CHARS = 32000

interface InputAreaProps {
  onSend: (text: string) => void
  onStop: () => void
}

export function InputArea({ onSend, onStop }: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { isGenerating } = useAppStore()

  // Auto-resize del textarea
  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isGenerating) onStop()
      else handleSend()
    }
  }

  const handleSend = () => {
    const val = textareaRef.current?.value?.trim()
    if (!val) return
    onSend(val)
    if (textareaRef.current) textareaRef.current.value = ''
    resize()
  }

  const handleClear = () => {
    if (textareaRef.current) {
      textareaRef.current.value = ''
      resize()
      textareaRef.current.focus()
    }
  }

  const len = textareaRef.current?.value?.length ?? 0
  const warnPct = len / MAX_CHARS
  const counterColor = warnPct > 0.9 ? 'var(--error)' : warnPct > 0.75 ? 'var(--warning)' : 'var(--text-tertiary)'

  return (
    <div style={{
      borderTop: '1px solid var(--border-primary)',
      background: 'var(--bg-primary)',
      padding: '12px 16px 16px',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{
          background: 'var(--bg-input)',
          border: '1.5px solid var(--border-primary)',
          borderRadius: 'var(--radius-xl)',
          transition: 'border-color var(--transition-fast)',
          display: 'flex',
          flexDirection: 'column',
        }}
          onFocusCapture={(e) => { e.currentTarget.style.borderColor = 'var(--border-active)' }}
          onBlurCapture={(e) => { e.currentTarget.style.borderColor = 'var(--border-primary)' }}
        >
          {/* Textarea + botones */}
          <div style={{ display: 'flex', alignItems: 'flex-end', padding: '8px 8px 8px 16px', gap: 8 }}>
            <textarea
              ref={textareaRef}
              rows={1}
              maxLength={MAX_CHARS}
              placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
              onInput={resize}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                paddingTop: 6,
                paddingBottom: 6,
                maxHeight: 200,
                overflowY: 'auto',
              }}
            />

            {/* Limpiar */}
            <button
              onClick={handleClear}
              title="Limpiar texto"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                transition: 'var(--transition-fast)',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.background = 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            {/* Enviar / Detener */}
            <button
              onClick={isGenerating ? onStop : handleSend}
              title={isGenerating ? 'Detener generación (Escape)' : 'Enviar mensaje (Enter)'}
              style={{
                background: isGenerating ? 'var(--error)' : 'var(--accent-gradient)',
                border: 'none',
                cursor: 'pointer',
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0,
                transition: 'var(--transition-fast)',
                boxShadow: isGenerating ? 'none' : '0 2px 8px rgba(99,102,241,0.4)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none' }}
            >
              {isGenerating ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="5" y="5" width="14" height="14" rx="2"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </div>

          {/* Footer: hint + contador */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '4px 16px 10px',
            fontSize: 11,
          }}>
            <span style={{ color: 'var(--text-tertiary)' }}>
              <kbd style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>Enter</kbd>
              {' '}para enviar · <kbd style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>Shift</kbd>
              {' '}+{' '}<kbd style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>Enter</kbd>
              {' '}nueva línea
            </span>
            <CharCounter textareaRef={textareaRef} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Contador separado para re-render mínimo
interface CharCounterProps { textareaRef: RefObject<HTMLTextAreaElement | null> }
function CharCounter({ textareaRef }: CharCounterProps) {
  const countRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    const update = () => {
      if (!countRef.current) return
      const len = el.value.length
      const pct = len / MAX_CHARS
      countRef.current.textContent = `${len.toLocaleString('es-ES')} / ${MAX_CHARS.toLocaleString('es-ES')}`
      countRef.current.style.color = pct > 0.9 ? 'var(--error)' : pct > 0.75 ? 'var(--warning)' : 'var(--text-tertiary)'
    }
    el.addEventListener('input', update)
    update()
    return () => el.removeEventListener('input', update)
  }, [textareaRef])

  return <span ref={countRef} style={{ color: 'var(--text-tertiary)' }}>0 / 32.000</span>
}
