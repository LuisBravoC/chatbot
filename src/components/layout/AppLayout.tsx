import { useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useGemini } from '../../hooks/useGemini'
import { Sidebar } from '../sidebar/Sidebar'
import { ChatArea } from '../chat/ChatArea'
import { ConfigPanel } from './ConfigPanel'
import { ModelStatus } from '../ui/ModelStatus'
import { ModelSetupPanel } from '../ui/ModelSetupPanel'
import { ThemeSwitcher } from '../ui/ThemeSwitcher'
import type { Message } from '../../types'

interface AppLayoutProps {
  onShowModal: (type: string, opts?: Record<string, unknown>) => void
  onOpenEdit: (msg: Message) => void
  onNewChat: () => void
}

export function AppLayout({ onShowModal, onOpenEdit, onNewChat }: AppLayoutProps) {
  const {
    sidebarCollapsed,
    configPanelOpen,
    modelStatus,
    toggleSidebar,
    toggleConfigPanel,
    setConfigPanelOpen,
    setSidebarCollapsed,
    createConversation,
    deleteConversation,
    clearAllConversations,
    getCurrentConversation,
  } = useAppStore()

  const { initModel, downloadModel, cancelDownload, sendMessage, stopGeneration, regenerateFrom } = useGemini()

  // Inicializar el modelo al montar.
  // - 'needs-download' + autoDownloadModel → dispara la descarga.
  // - 'downloading' → otra pestaña ya está descargando; nos enganchamos al
  //   monitor (create() suscribe al progreso aunque la descarga ya esté en curso).
  useEffect(() => {
    initModel().then((ready) => {
      if (ready) return
      const { modelStatus, config } = useAppStore.getState()
      if (modelStatus === 'needs-download' && config.autoDownloadModel) {
        downloadModel()
      } else if (modelStatus === 'downloading') {
        downloadModel()
      }
    })
  }, []) // eslint-disable-line

  // App.handleNewChat (onNewChat) ya llama a createConversation() y showToast().
  // Aquí solo delegamos para evitar doble creación.
  const handleNewChat = () => {
    onNewChat?.()
  }

  const handleDeleteConversation = (id: string) => {
    onShowModal('confirm', {
      title: 'Eliminar conversación',
      message: '¿Estás seguro de que deseas eliminar esta conversación? Esta acción no se puede deshacer.',
      onConfirm: () => deleteConversation(id),
    })
  }

  const handleClearAll = () => {
    const { conversations } = useAppStore.getState()
    if (!conversations.length) return
    onShowModal('confirm', {
      title: 'Borrar todo el historial',
      message: `¿Eliminar las ${conversations.length} conversaciones? Esta acción no se puede deshacer.`,
      onConfirm: clearAllConversations,
    })
  }

  const handleDeleteCurrent = () => {
    const conv = getCurrentConversation()
    if (!conv) return
    handleDeleteConversation(conv.id)
  }

  // Colapsar sidebar en móvil al seleccionar conversación
  const handleSelectConversation = () => {
    if (window.innerWidth <= 900) setSidebarCollapsed(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

      {/* Wrapper animado del sidebar — siempre en DOM, anima el width */}
      <div style={{
        width: sidebarCollapsed ? 0 : 'var(--sidebar-width)',
        minWidth: 0,
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 280ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <Sidebar
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          onClearAll={handleClearAll}
          onShowTemplates={() => onShowModal('templates')}
          onShowShortcuts={() => onShowModal('shortcuts')}
          onShowAbout={() => onShowModal('about')}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid var(--border-primary)',
          background: 'var(--bg-primary)',
          flexShrink: 0,
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Toggle sidebar */}
            <button onClick={toggleSidebar} title="Mostrar/ocultar sidebar (Ctrl+B)" style={iconBtnStyle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <ModelStatus />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThemeSwitcher />
            {/* Toggle config */}
            <button
              onClick={toggleConfigPanel}
              title="Panel de configuración (Ctrl+P)"
              style={{ ...iconBtnStyle, background: configPanelOpen ? 'var(--bg-active)' : 'none', color: configPanelOpen ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Área de chat o panel de configuración del modelo */}
        {modelStatus === 'ready' ? (
          <ChatArea
            onSend={sendMessage}
            onStop={stopGeneration}
            onEdit={(msg) => onOpenEdit(msg)}
            onRegenerate={regenerateFrom}
          />
        ) : (
          <ModelSetupPanel
            onDownload={downloadModel}
            onCancel={cancelDownload}
            onRetry={initModel}
          />
        )}
      </div>

      {/* Config panel — siempre en DOM, anima el width */}
      <div style={{
        width: configPanelOpen ? 340 : 0,
        minWidth: 0,
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 280ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <ConfigPanel
          onClose={() => setConfigPanelOpen(false)}
          onDeleteConversation={handleDeleteCurrent}
        />
      </div>
      </div> {/* end flex row */}
    </div>
  )
}

const iconBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 8,
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  transition: 'var(--transition-fast)',
}
