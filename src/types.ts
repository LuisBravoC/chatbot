// ── Dominio del chat ───────────────────────────────────────────────────────────

export interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: number
  edited: boolean
}

export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: Message[]
  systemPrompt: string
}

// ── Configuración ──────────────────────────────────────────────────────────────

export interface AppConfig {
  temperature: number
  topK: number
  systemPrompt: string
  streaming: boolean
  autoScroll: boolean
  showTimestamps: boolean
  renderMarkdown: boolean
  theme: string
  autoDownloadModel: boolean
}

// ── Estado del modelo ──────────────────────────────────────────────────────────

export type ModelStatus =
  | 'checking'
  | 'ready'
  | 'needs-download'
  | 'downloading'
  | 'error'
  | 'unsupported'

// ── API de Gemini Nano (Chrome Built-in AI) ────────────────────────────────────

/** Valores de availability() — Chrome 130+ y Chrome 128-129 (legacy) */
export type AvailabilityResult =
  | 'readily'       // Chrome 130+: listo
  | 'after-download'// Chrome 130+: necesita descarga
  | 'downloading'   // Chrome 138+: descarga en curso (otra pestaña)
  | 'no'            // Chrome 130+: no disponible
  | 'available'     // Chrome 128-129: alias de 'readily'
  | 'downloadable'  // Chrome 128-129: alias de 'after-download'
  | 'unavailable'   // Chrome 128-129: alias de 'no'

export interface LanguageModelCapabilities {
  temperature?: { min: number; max: number }
  topK?: { max: number }
}

export interface LanguageModelSession {
  prompt(text: string, options?: { signal?: AbortSignal }): Promise<string>
  promptStreaming(text: string, options?: { signal?: AbortSignal }): AsyncIterable<string>
  destroy?(): void
}

export interface LanguageModelCreateOptions {
  temperature?: number
  topK?: number
  systemPrompt?: string
  monitor?: (monitor: EventTarget) => void
  signal?: AbortSignal
}

export interface LanguageModelAPI {
  availability(): Promise<AvailabilityResult>
  params(): Promise<LanguageModelCapabilities>
  create(options?: LanguageModelCreateOptions): Promise<LanguageModelSession>
}

// Extiende Window para que TypeScript conozca la API nativa de Chrome
declare global {
  interface Window {
    LanguageModel?: LanguageModelAPI
    ai?: { languageModel?: LanguageModelAPI }
  }
}

// ── Exportación ────────────────────────────────────────────────────────────────

export type ExportFormat = 'json' | 'markdown' | 'text'

// ── Toast ──────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info'

// ── API diagnóstico ────────────────────────────────────────────────────────────

export interface APIDebugInfo {
  'LanguageModel in window': boolean
  'window.LanguageModel': string
  'window.ai exists': boolean
  'window.ai.languageModel': string
  'availability() result': string
  'availability() error': string
  origin: string
  protocol: string
}
