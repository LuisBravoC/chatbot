import React, { useRef } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { ConversationList } from './ConversationList'
import { exportAllConversations, parseImportFile } from '../../utils/export'

interface SidebarProps {
  onNewChat: () => void
  onDeleteConversation: (convId: string) => void
  onClearAll: () => void
  onShowTemplates: () => void
  onShowShortcuts: () => void
  onShowAbout: () => void
  onSelectConversation: () => void
}

export function Sidebar({ onNewChat, onDeleteConversation, onClearAll, onShowTemplates, onShowShortcuts, onShowAbout, onSelectConversation }: SidebarProps) {
  const { conversations, searchQuery, setSearchQuery } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      try {
        const incoming = parseImportFile(ev.target?.result as string)
        const imported = useAppStore.getState().importConversations(incoming)
        if (imported > 0) console.info(`${imported} conversación(es) importada(s)`)
      } catch { console.error('Archivo de importación inválido') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minWidth: 'var(--sidebar-width)',  /* evita que el contenido se deforme durante la animación */
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-primary)',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 12px 12px', borderBottom: '1px solid var(--border-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32,
            borderRadius: 10,
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Gemini Nano Chat</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>IA local y privada</div>
          </div>
        </div>

        <button onClick={onNewChat} style={{
          width: '100%',
          background: 'var(--accent-gradient)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: '9px 12px',
          cursor: 'pointer',
          color: 'white',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          transition: 'var(--transition-fast)',
          boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-gradient-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent-gradient)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva conversación
        </button>
      </div>

      {/* Búsqueda */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-secondary)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '7px 10px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conversaciones..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 13, color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* Contador */}
      <div style={{ padding: '8px 16px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)' }}>Historial</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{conversations.length}</span>
      </div>

      {/* Lista de conversaciones */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 6px' }}>
        <ConversationList onDelete={onDeleteConversation} onSelect={onSelectConversation} />
      </div>

      {/* Footer de botones */}
      <div style={{
        borderTop: '1px solid var(--border-secondary)',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}>
        {(([
          { label: 'Plantillas de prompts',    icon: 'file' as SidebarIconKey,     onClick: onShowTemplates },
          { label: 'Exportar todo',             icon: 'download' as SidebarIconKey, onClick: () => exportAllConversations(conversations) },
          { label: 'Importar conversaciones',   icon: 'upload' as SidebarIconKey,   onClick: () => fileInputRef.current?.click() },
          { label: 'Borrar todo el historial',  icon: 'trash' as SidebarIconKey,    onClick: onClearAll, danger: true },
          { label: 'Atajos de teclado',         icon: 'kbd' as SidebarIconKey,      onClick: onShowShortcuts },
          { label: 'Acerca de',                 icon: 'info' as SidebarIconKey,     onClick: onShowAbout },
        ] as { label: string; icon: SidebarIconKey; onClick?: () => void; danger?: boolean }[]).map(({ label, icon, onClick, danger }) => (
          <SidebarBtn key={label} label={label} icon={icon} onClick={onClick} danger={danger} />
        )))}
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
      </div>
    </aside>
  )
}

type SidebarIconKey = 'file' | 'download' | 'upload' | 'trash' | 'kbd' | 'info'
interface SidebarBtnProps {
  label: string
  icon: SidebarIconKey
  onClick?: () => void
  danger?: boolean
}
function SidebarBtn({ label, icon, onClick, danger }: SidebarBtnProps) {
  const ICONS: Record<SidebarIconKey, React.ReactElement> = {
    file:     <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    upload:   <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    trash:    <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>,
    kbd:      <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></>,
    info:     <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  }
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 9,
      background: 'none', border: 'none', cursor: 'pointer',
      padding: '8px 10px', borderRadius: 'var(--radius-md)', width: '100%',
      fontSize: 13, color: danger ? 'var(--error)' : 'var(--text-secondary)',
      transition: 'var(--transition-fast)',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = danger ? 'var(--error)' : 'var(--text-primary)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = danger ? 'var(--error)' : 'var(--text-secondary)' }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[icon]}
      </svg>
      {label}
    </button>
  )
}
