import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { exportConversation } from '../utils/export'

interface ShortcutCallbacks {
  onNewChat?: () => void
  onShowShortcuts?: () => void
  onShowTemplates?: () => void
  onStopGeneration?: () => void
}

/**
 * useKeyboardShortcuts
 * Registra todos los atajos de teclado de la aplicación.
 *
 * @param callbacks - onNewChat, onShowShortcuts, onShowTemplates, onStopGeneration
 *   - onStopGeneration
 */
export function useKeyboardShortcuts({ onNewChat, onShowShortcuts, onShowTemplates, onStopGeneration }: ShortcutCallbacks): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const mod = isMac ? e.metaKey : e.ctrlKey
      const key = e.key.toLowerCase()

      // Escape — detener generación o cerrar tema menu (manejado en ThemeSwitcher)
      if (e.key === 'Escape') {
        const { isGenerating } = useAppStore.getState()
        if (isGenerating) {
          onStopGeneration?.()
          e.preventDefault()
        }
        return
      }

      if (!mod) return

      switch (key) {
        case 'n': {
          e.preventDefault()
          onNewChat?.()
          break
        }
        case 'b': {
          e.preventDefault()
          useAppStore.getState().toggleSidebar()
          break
        }
        case 'p': {
          e.preventDefault()
          useAppStore.getState().toggleConfigPanel()
          break
        }
        case 'k': {
          e.preventDefault()
          // Abrir sidebar si está colapsado y hacer focus en el search
          const { sidebarCollapsed, setSidebarCollapsed } = useAppStore.getState()
          if (sidebarCollapsed) setSidebarCollapsed(false)
          setTimeout(() => (document.querySelector<HTMLInputElement>('input[placeholder*="Buscar"]'))?.focus(), 50)
          break
        }
        case 'e': {
          e.preventDefault()
          const conv = useAppStore.getState().getCurrentConversation()
          if (conv?.messages.length) exportConversation(conv, 'json')
          break
        }
        case 'd': {
          e.preventDefault()
          const themes = ['light', 'dark', 'midnight', 'sunset', 'forest', 'rose']
          const { config, setConfig } = useAppStore.getState()
          const idx = themes.indexOf(config.theme)
          const next = themes[(idx + 1) % themes.length]
          document.body.setAttribute('data-theme', next)
          setConfig({ theme: next })
          break
        }
        case 'l': {
          e.preventDefault()
          const ta = document.querySelector<HTMLTextAreaElement>('textarea#msg-input, textarea.message-input, textarea[placeholder*="mensaje"]')
          if (ta) { ta.value = ''; ta.dispatchEvent(new Event('input')) }
          break
        }
        default:
          break
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onNewChat, onStopGeneration, onShowShortcuts, onShowTemplates])
}
