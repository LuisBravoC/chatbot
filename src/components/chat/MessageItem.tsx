import React, { useState, useCallback, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAppStore } from '../../store/useAppStore'
import { formatTime } from '../../utils/formatting'
import type { Message } from '../../types'

// ── Botón copiar código en bloques pre ────────────────────────────────────────
interface CopyCodeButtonProps { code: string }
function CopyCodeButton({ code }: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handleCopy}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: copied ? 'var(--success)' : 'var(--text-tertiary)',
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 6px',
        borderRadius: 4,
        transition: 'var(--transition-fast)',
      }}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ¡Copiado!
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copiar
        </>
      )}
    </button>
  )
}

// ── Componentes personalizados para react-markdown ────────────────────────────
function buildComponents(): Components {
  return {
    pre({ children }) {
      // Extraer el texto del bloque de código
      type CodeProps = { children?: string; className?: string }
      const codeEl = (children as React.ReactElement<CodeProps>)?.props
      const code = codeEl?.children ?? ''
      const lang = (codeEl?.className ?? '').replace('language-', '') || 'code'
      // Header fuera del <pre> para que NO se mueva con el scroll horizontal del código
      return (
        <div className="code-block">
          <div className="code-header">
            <span style={{ fontFamily: 'var(--font-mono)' }}>{lang}</span>
            <CopyCodeButton code={String(code).replace(/\n$/, '')} />
          </div>
          <pre>{children}</pre>
        </div>
      )
    },
    a({ href, children }) {
      return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
    },
  }
}

const mdComponents: Components = buildComponents()

// ── Botón de acción de mensaje ────────────────────────────────────────────────
interface ActionBtnProps {
  title: string
  onClick: () => void
  children: React.ReactNode
  danger?: boolean
}
function ActionBtn({ title, onClick, children, danger = false }: ActionBtnProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 6px',
        borderRadius: 'var(--radius-sm)',
        color: danger ? 'var(--error)' : 'var(--text-tertiary)',
        opacity: 0.7,
        transition: 'var(--transition-fast)',
        display: 'flex',
        alignItems: 'center',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.background = 'none' }}
    >
      {children}
    </button>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
/**
 * MessageItem memoizado: solo re-renderiza cuando el contenido del mensaje,
 * el estado de edición o las opciones de visualización cambian.
 * Evita re-renders innecesarios del historial durante el streaming.
 *
 * Funciona con memo() sin comparador personalizado porque updateLastAIMessage()
 * crea un nuevo objeto solo para el mensaje que cambia → nueva referencia →
 * re-render. Los demás mensajes mantienen su referencia original → no re-render.
 */
interface MessageItemProps {
  msg: Message
  streamingContent: string | null
  onEdit: (msg: Message) => void
  onRegenerate: (msgId: string) => void
  onDelete: (msgId: string) => void
  showTimestamps: boolean
  renderMarkdown: boolean
}
function MessageItemBase({ msg, streamingContent, onEdit, onRegenerate, onDelete, showTimestamps, renderMarkdown }: MessageItemProps) {
  const [copied, setCopied] = useState(false)
  const isUser = msg.role === 'user'

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [msg.content])

  return (
    <div
      data-id={msg.id}
      style={{
        display: 'flex',
        gap: 10,
        padding: '6px 0',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: isUser ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
        border: '1px solid var(--border-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        color: isUser ? 'white' : 'var(--text-secondary)',
        flexShrink: 0,
      }}>
        {isUser ? 'U' : 'G'}
      </div>

      {/* Contenido — maxWidth limita la fila; la burbuja usa fit-content+max-width:100% para
          tener un ancho DEFINIDO (no shrink-to-fit circular) que el pre con width:100% pueda anclar */}
      <div style={{ maxWidth: '80%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        {/* Burbuja */}
        <div
          className="message-bubble"
          style={{
            background: isUser ? 'var(--bg-message-user)' : 'var(--bg-message-ai)',
            color: isUser ? 'var(--text-on-user-message)' : 'var(--text-on-ai-message)',
            padding: '10px 14px',
            borderRadius: isUser
              ? 'var(--radius-lg) var(--radius-sm) var(--radius-lg) var(--radius-lg)'
              : 'var(--radius-sm) var(--radius-lg) var(--radius-lg) var(--radius-lg)',
            wordBreak: 'break-word',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            width: 'fit-content',
            maxWidth: '100%',
            minWidth: 0,
          }}
        >
          {renderMarkdown && !isUser ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {(streamingContent ?? msg.content) || ' '}
            </ReactMarkdown>
          ) : (
            <span style={{ whiteSpace: 'pre-wrap' }}>{streamingContent ?? msg.content}</span>
          )}
          {msg.edited && (
            <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 6 }}>(editado)</span>
          )}
        </div>

        {/* Meta: timestamp + acciones */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flexDirection: isUser ? 'row-reverse' : 'row',
          opacity: 0,
          transition: 'opacity 0.15s',
        }}
          className="msg-meta"
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0' }}
        >
          {showTimestamps && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '0 4px' }}>
              {formatTime(msg.timestamp)}
            </span>
          )}

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 2 }}>
            <ActionBtn title="Copiar" onClick={handleCopy}>
              {copied
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              }
            </ActionBtn>

            {isUser ? (
              <ActionBtn title="Editar" onClick={() => onEdit(msg)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </ActionBtn>
            ) : (
              <ActionBtn title="Regenerar" onClick={() => onRegenerate(msg.id)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              </ActionBtn>
            )}

            <ActionBtn title="Eliminar" onClick={() => onDelete(msg.id)} danger>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </ActionBtn>
          </div>
        </div>
      </div>
    </div>
  )
}

export const MessageItem = memo(MessageItemBase)
