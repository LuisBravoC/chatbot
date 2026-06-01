import { create } from 'zustand/react'
import { persist, createJSONStorage } from 'zustand/middleware'
import { generateId, generateMessageId } from '../utils/formatting'
import type { Conversation, Message, AppConfig, ModelStatus, LanguageModelCapabilities, LanguageModelSession } from '../types'

// ── Tipo del store completo ────────────────────────────────────────────────────
interface AppStore {
  // Conversaciones
  conversations: Conversation[]
  currentConversationId: string | null
  getCurrentConversation: () => Conversation | null
  createConversation: () => Conversation
  deleteConversation: (id: string) => void
  setCurrentConversation: (id: string) => void
  addMessage: (role: 'user' | 'ai', content: string) => Message
  streamingContent: string | null
  setStreamingContent: (content: string | null) => void
  commitStreamingMessage: (content: string) => void
  updateLastAIMessage: (content: string) => void
  deleteMessage: (messageId: string) => void
  editMessage: (messageId: string, newContent: string) => void
  truncateMessagesFrom: (messageId: string) => void
  clearAllConversations: () => void
  importConversations: (incoming: Conversation[]) => number
  // Config
  config: AppConfig
  setConfig: (patch: Partial<AppConfig>) => void
  // Modelo
  modelStatus: ModelStatus
  downloadProgress: number
  capabilities: LanguageModelCapabilities | null
  setModelStatus: (status: ModelStatus) => void
  setDownloadProgress: (progress: number) => void
  setCapabilities: (caps: LanguageModelCapabilities | null) => void
  // Generación
  isGenerating: boolean
  abortController: AbortController | null
  setIsGenerating: (v: boolean) => void
  setAbortController: (ctrl: AbortController | null) => void
  // Sesión Gemini
  session: LanguageModelSession | null
  setSession: (session: LanguageModelSession | null) => void
  clearSession: () => void
  // UI
  sidebarCollapsed: boolean
  configPanelOpen: boolean
  toggleSidebar: () => void
  toggleConfigPanel: () => void
  setSidebarCollapsed: (v: boolean) => void
  setConfigPanelOpen: (v: boolean) => void
  // Búsqueda
  searchQuery: string
  setSearchQuery: (q: string) => void
}

const DEFAULT_CONFIG: AppConfig = {
  temperature: 0.8,
  topK: 40,
  systemPrompt: 'Eres un asistente útil, preciso y amigable. Responde de forma clara y concisa en el idioma del usuario.',
  streaming: true,
  autoScroll: true,
  showTimestamps: true,
  renderMarkdown: true,
  theme: 'light',
  autoDownloadModel: false,
}

/**
 * Storage personalizado que maneja la compatibilidad con el formato
 * antiguo de localStorage (sin el envelope { state, version } de Zustand).
 *
 * Formato antiguo (persistence.js manual):
 *   { conversations, currentConversationId, config }
 *
 * Formato nuevo (Zustand persist middleware):
 *   { state: { conversations, currentConversationId, config }, version: N }
 */
const compatStorage = createJSONStorage<AppStore>(() => ({
  getItem: (name: string): string | null => {
    const raw = localStorage.getItem(name)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      // Detectar formato antiguo: tiene conversations pero no el envelope 'state'
      if (parsed && typeof parsed === 'object' && 'conversations' in parsed && !('state' in parsed)) {
        const migrated = {
          state: {
            conversations: parsed.conversations ?? [],
            currentConversationId: parsed.currentConversationId ?? null,
            config: { ...DEFAULT_CONFIG, ...(parsed.config ?? {}) },
          },
          version: 1,
        }
        // Guardar ya en formato nuevo para que las lecturas siguientes sean directas
        localStorage.setItem(name, JSON.stringify(migrated))
        return JSON.stringify(migrated)
      }
      return raw
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string) => localStorage.setItem(name, value),
  removeItem: (name: string) => localStorage.removeItem(name),
}))

export const useAppStore = create<AppStore>()(
  persist<AppStore>(
    (set, get) => ({
      // ── Conversaciones ─────────────────────────────────────
      conversations: [],
      currentConversationId: null,

      getCurrentConversation: () => {
        const { conversations, currentConversationId } = get()
        return conversations.find(c => c.id === currentConversationId) ?? null
      },

      createConversation: () => {
        const conv = {
          id: generateId(),
          title: 'Nueva conversación',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          systemPrompt: get().config.systemPrompt,
        }
        set(s => ({ conversations: [conv, ...s.conversations], currentConversationId: conv.id }))
        return conv
      },

      deleteConversation: (id) => {
        set(s => {
          const conversations = s.conversations.filter(c => c.id !== id)
          const currentConversationId =
            s.currentConversationId === id ? (conversations[0]?.id ?? null) : s.currentConversationId
          return { conversations, currentConversationId }
        })
      },

      setCurrentConversation: (id) => set({ currentConversationId: id }),

      addMessage: (role, content) => {
        const state = get()
        let conv = state.conversations.find(c => c.id === state.currentConversationId)

        if (!conv) {
          conv = {
            id: generateId(),
            title: 'Nueva conversación',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: [],
            systemPrompt: state.config.systemPrompt,
          }
        }

        const message = { id: generateMessageId(), role, content, timestamp: Date.now(), edited: false }
        const isFirstUser = role === 'user' && conv.messages.filter(m => m.role === 'user').length === 0
        const title = isFirstUser
          ? (content.slice(0, 50).trim() + (content.length > 50 ? '...' : '')) || 'Sin título'
          : conv.title

        const updatedConv = { ...conv, messages: [...conv.messages, message], updatedAt: Date.now(), title }

        set(s => {
          const exists = s.conversations.some(c => c.id === conv.id)
          const conversations = exists
            ? s.conversations.map(c => c.id === conv.id ? updatedConv : c)
            : [updatedConv, ...s.conversations]
          return { conversations, currentConversationId: conv.id }
        })
        return message
      },

      // ── Streaming optimizado ────────────────────────────────
      // streamingContent almacena el texto en curso SIN tocar conversations.
      // Solo la burbuja activa suscribe a este campo, evitando re-renders
      // de toda la lista de mensajes en cada chunk de texto.
      streamingContent: null,  // null = no streaming | string = en curso

      setStreamingContent: (content) => set({ streamingContent: content }),

      // Cuando el streaming termina, persiste el contenido en conversations
      // y limpia streamingContent para que la burbuja activa lea del historial.
      commitStreamingMessage: (content) => {
        set(s => {
          const conv = s.conversations.find(c => c.id === s.currentConversationId)
          if (!conv) return { streamingContent: null }
          const messages = [...conv.messages]
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'ai') { messages[i] = { ...messages[i], content }; break }
          }
          return {
            conversations: s.conversations.map(c => c.id === conv.id ? { ...conv, messages } : c),
            streamingContent: null,
          }
        })
      },

      // Mantener updateLastAIMessage para usos no-streaming (abort, error, etc.)
      updateLastAIMessage: (content) => {
        set(s => {
          const conv = s.conversations.find(c => c.id === s.currentConversationId)
          if (!conv) return {}
          const messages = [...conv.messages]
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'ai') { messages[i] = { ...messages[i], content }; break }
          }
          return { conversations: s.conversations.map(c => c.id === conv.id ? { ...conv, messages } : c) }
        })
      },

      deleteMessage: (messageId) => {
        set(s => {
          const conv = s.conversations.find(c => c.id === s.currentConversationId)
          if (!conv) return {}
          const updatedConv = { ...conv, messages: conv.messages.filter(m => m.id !== messageId), updatedAt: Date.now() }
          return { conversations: s.conversations.map(c => c.id === conv.id ? updatedConv : c) }
        })
      },

      editMessage: (messageId, newContent) => {
        set(s => {
          const conv = s.conversations.find(c => c.id === s.currentConversationId)
          if (!conv) return {}
          const messages = conv.messages.map(m =>
            m.id === messageId ? { ...m, content: newContent, edited: true, timestamp: Date.now() } : m
          )
          return { conversations: s.conversations.map(c => c.id === conv.id ? { ...conv, messages, updatedAt: Date.now() } : c) }
        })
      },

      truncateMessagesFrom: (messageId) => {
        set(s => {
          const conv = s.conversations.find(c => c.id === s.currentConversationId)
          if (!conv) return {}
          const idx = conv.messages.findIndex(m => m.id === messageId)
          if (idx === -1) return {}
          const messages = conv.messages.slice(0, idx)
          return { conversations: s.conversations.map(c => c.id === conv.id ? { ...conv, messages, updatedAt: Date.now() } : c) }
        })
      },

      clearAllConversations: () => set({ conversations: [], currentConversationId: null }),

      importConversations: (incoming) => {
        const existingIds = new Set(get().conversations.map(c => c.id))
        const newOnes = incoming.filter(c => !existingIds.has(c.id))
        if (!newOnes.length) return 0
        set(s => ({ conversations: [...s.conversations, ...newOnes] }))
        return newOnes.length
      },

      // ── Config ────────────────────────────────────────────
      config: { ...DEFAULT_CONFIG },

      setConfig: (patch) => set(s => ({ config: { ...s.config, ...patch } })),

      // ── Estado del modelo ──────────────────────────────────
      modelStatus: 'checking',
      downloadProgress: 0,
      capabilities: null,

      setModelStatus: (modelStatus) => set({ modelStatus }),
      setDownloadProgress: (downloadProgress) => set({ downloadProgress }),
      setCapabilities: (capabilities) => set({ capabilities }),

      // ── Generación ─────────────────────────────────────────
      isGenerating: false,
      abortController: null,

      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setAbortController: (abortController) => set({ abortController }),

      // ── Sesión Gemini (no se persiste) ─────────────────────
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),

      // ── UI ─────────────────────────────────────────────────
      sidebarCollapsed: false,
      configPanelOpen: false,

      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleConfigPanel: () => set(s => ({ configPanelOpen: !s.configPanelOpen })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setConfigPanelOpen: (v) => set({ configPanelOpen: v }),

      // ── Búsqueda ───────────────────────────────────────────
      searchQuery: '',
      setSearchQuery: (searchQuery) => set({ searchQuery }),
    }),
    {
      name: 'gemini_nano_chat_state',
      storage: compatStorage,
      version: 1,
      // Solo persistir lo necesario — excluir runtime state (sesión, modelo, UI, búsqueda)
      partialize: (state: AppStore) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
        config: state.config,
      }) as AppStore,
      // Merge garantiza que keys nuevas de DEFAULT_CONFIG tengan sus valores por defecto
      merge: (persistedState: unknown, currentState: AppStore): AppStore => {
        const ps = persistedState as Partial<AppStore> | undefined
        return {
          ...currentState,
          ...(ps ?? {}),
          config: { ...DEFAULT_CONFIG, ...(ps?.config ?? {}) },
        }
      },
    }
  )
)
