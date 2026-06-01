import { exportConversation } from '../../utils/export'
import type { Conversation } from '../../types'

interface ConversationItemProps {
  conv: Conversation
  isActive: boolean
  onSelect: () => void
  onDelete: (convId: string) => void
}

export function ConversationItem({ conv, isActive, onSelect, onDelete }: ConversationItemProps) {
  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        background: isActive ? 'var(--bg-active)' : 'none',
        border: isActive ? '1px solid var(--border-active)' : '1px solid transparent',
        transition: 'var(--transition-fast)',
        position: 'relative',
      }}
      className="conv-item"
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'none' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>

      <span style={{
        flex: 1,
        fontSize: 13,
        color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
        fontWeight: isActive ? 500 : 400,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {conv.title}
      </span>

      {/* Botones de acción — visibles al hover */}
      <div
        className="conv-actions"
        style={{ display: 'flex', gap: 2, opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        <button
          title="Exportar"
          onClick={(e) => { e.stopPropagation(); exportConversation(conv, 'json') }}
          style={actionBtnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <button
          title="Eliminar"
          onClick={(e) => { e.stopPropagation(); onDelete(conv.id) }}
          style={{ ...actionBtnStyle, color: 'var(--error)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// Mostrar botones al hover del item padre
const style = document.createElement('style')
style.textContent = '.conv-item:hover .conv-actions { opacity: 1 !important; }'
document.head.appendChild(style)

const actionBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '3px 5px',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-tertiary)',
  display: 'flex',
  alignItems: 'center',
  transition: 'var(--transition-fast)',
}
