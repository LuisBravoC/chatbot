import { useState, useCallback } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { ConfirmModal } from './components/modals/ConfirmModal'
import { EditMessageModal } from './components/modals/EditMessageModal'
import { AboutModal } from './components/modals/AboutModal'
import { ShortcutsModal } from './components/modals/ShortcutsModal'
import { TemplatesModal } from './components/modals/TemplatesModal'
import { ToastContainer, useToast } from './components/ui/Toast'
import { useAppStore } from './store/useAppStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import useRedirectFromSessionStorage from './hooks/useRedirectFromSessionStorage'
import type { Message } from './types'

type ModalType = 'confirm' | 'edit' | 'about' | 'shortcuts' | 'templates'

interface ConfirmModalState { open: boolean; title: string; message: string; onConfirm: (() => void) | null }
interface EditModalState { open: boolean; msg: Message | null }
interface SimpleModalState { open: boolean }

interface ModalsState {
  confirm: ConfirmModalState
  edit: EditModalState
  about: SimpleModalState
  shortcuts: SimpleModalState
  templates: SimpleModalState
}

const INITIAL_MODALS: ModalsState = {
  confirm:   { open: false, title: '', message: '', onConfirm: null },
  edit:      { open: false, msg: null },
  about:     { open: false },
  shortcuts: { open: false },
  templates: { open: false },
}

export default function App() {
  const [modals, setModals] = useState<ModalsState>(INITIAL_MODALS)
  const { showToast } = useToast()
  const { editMessage, createConversation } = useAppStore()
  
  // Redirigir desde 404.html si es necesario
  useRedirectFromSessionStorage()
  
  // Acceso directo al store para abortar generación sin instanciar useGemini
  const stopGeneration = useCallback(() => {
    useAppStore.getState().abortController?.abort()
  }, [])

  const openModal = useCallback((type: ModalType, opts: Record<string, unknown> = {}) => {
    setModals(prev => ({ ...prev, [type]: { open: true, ...opts } }))
  }, [])

  const closeModal = useCallback((type: ModalType) => {
    setModals(prev => ({ ...prev, [type]: { ...INITIAL_MODALS[type], open: false } }))
  }, [])

  const handleShowModal = useCallback((type: string, opts?: Record<string, unknown>) => {
    openModal(type as ModalType, opts)
  }, [openModal])

  const handleSaveEdit = useCallback((messageId: string, newContent: string) => {
    editMessage(messageId, newContent)
    showToast('Mensaje actualizado', 'success', 1500)
  }, [editMessage, showToast])

  const handleTemplateSelect = useCallback((template: string) => {
    // Buscar el textarea del input y rellenarlo
    const ta = document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="mensaje"]')
    if (ta) {
      ta.value = template
      ta.dispatchEvent(new Event('input', { bubbles: true }))
      ta.focus()
      showToast('Plantilla cargada en el input', 'success', 1500)
    }
  }, [showToast])

  const handleNewChat = useCallback(() => {
    createConversation()
    showToast('Nueva conversación creada', 'success', 1500)
  }, [createConversation, showToast])

  useKeyboardShortcuts({
    onNewChat: handleNewChat,
    onStopGeneration: stopGeneration,
    onShowShortcuts: () => openModal('shortcuts'),
    onShowTemplates: () => openModal('templates'),
  })

  return (
    <>
      <AppLayout
        onShowModal={handleShowModal}
        onOpenEdit={(msg: Message) => openModal('edit', { msg })}
        onNewChat={handleNewChat}
      />

      <ConfirmModal
        open={modals.confirm.open}
        title={modals.confirm.title}
        message={modals.confirm.message}
        onConfirm={modals.confirm.onConfirm}
        onClose={() => closeModal('confirm')}
      />

      <EditMessageModal
        open={modals.edit.open}
        msg={modals.edit.msg}
        onSave={handleSaveEdit}
        onClose={() => closeModal('edit')}
      />

      <AboutModal
        open={modals.about.open}
        onClose={() => closeModal('about')}
      />

      <ShortcutsModal
        open={modals.shortcuts.open}
        onClose={() => closeModal('shortcuts')}
      />

      <TemplatesModal
        open={modals.templates.open}
        onClose={() => closeModal('templates')}
        onSelect={handleTemplateSelect}
      />

      <ToastContainer />
    </>
  )
}
