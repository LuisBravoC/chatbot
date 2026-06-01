/**
 * geminiService.ts
 * Wrapper de la API nativa Gemini Nano (window.LanguageModel / window.ai.languageModel)
 * Compatible con Chrome 128+ (API vieja: 'available') y Chrome 130+ (API nueva: 'readily').
 */
import type { LanguageModelAPI, LanguageModelCapabilities, LanguageModelSession, LanguageModelCreateOptions, ModelStatus, APIDebugInfo } from '../types'

/**
 * Obtiene el objeto de la API de Gemini Nano desde window.
 * Usa 'LanguageModel' in window (igual que el vanilla) para detectar existencia
 * de la propiedad incluso si su valor aún es undefined durante la inicialización.
 */
function getAPI(): LanguageModelAPI | null {
  if ('LanguageModel' in window && window.LanguageModel) return window.LanguageModel
  if (window.ai && window.ai.languageModel) return window.ai.languageModel
  return null
}

// Persiste el último resultado de availability() para el panel de diagnóstico
let _lastAvailabilityResult = 'not called yet'
let _lastAvailabilityError: string | null = null

/** Info de diagnóstico para el panel de configuración — sin abrir DevTools */
export function getAPIDebugInfo(): APIDebugInfo {
  return {
    'LanguageModel in window': 'LanguageModel' in window,
    'window.LanguageModel': String(window.LanguageModel),
    'window.ai exists': Boolean(window.ai),
    'window.ai.languageModel': String(window.ai?.languageModel),
    'availability() result': _lastAvailabilityResult,
    'availability() error': _lastAvailabilityError ?? 'none',
    origin: location.origin,
    protocol: location.protocol,
  }
}

// ── Disponibilidad del modelo ────────────────────────────────────────────────

/**
 * Comprueba si el modelo está disponible. NO dispara descarga.
 *
 * Incluye un reintento breve para cubrir el caso donde Chrome aún no ha
 * terminado de inicializar la API en el momento del primer check.
 *
 * @returns {'ready'|'needs-download'|'unsupported'|'error'}
 */
export async function checkAvailability(): Promise<ModelStatus> {
  _lastAvailabilityResult = 'not called yet'
  _lastAvailabilityError = null

  // Dos intentos: inmediato + uno tras 300ms si el primero falla por timing
  const ATTEMPTS = [0, 300]

  for (let i = 0; i < ATTEMPTS.length; i++) {
    if (i > 0) await new Promise(resolve => setTimeout(resolve, ATTEMPTS[i]))

    const API = getAPI()
    if (!API) {
      _lastAvailabilityResult = 'API_NOT_FOUND'
      // Si la propiedad ni existe, no reintentar
      if (!('LanguageModel' in window) && !window.ai?.languageModel) break
      continue
    }

    try {
      const available = await API.availability()
      _lastAvailabilityResult = available

      // Chrome 138+: 'readily' | 'after-download' | 'downloading' | 'no'
      // Chrome 130+:  'readily' | 'after-download' | 'no'
      // Chrome 128-129: 'available' | 'downloadable' | 'unavailable'
      if (available === 'readily' || available === 'available') return 'ready'
      if (available === 'after-download' || available === 'downloadable') return 'needs-download'
      // Otra pestaña (o instancia) ya está descargando — engancharse al monitor
      if (available === 'downloading') return 'downloading'
      if (available === 'no' || available === 'unavailable') return 'unsupported'

      return 'unsupported'
    } catch (e: unknown) {
      const err = e as { message?: string }
      _lastAvailabilityResult = 'ERROR: ' + (err.message ?? String(e))
      _lastAvailabilityError = err.message ?? String(e)
      if (i < ATTEMPTS.length - 1) continue
      return 'error'
    }
  }

  return 'unsupported'
}

/**
 * Dispara la descarga del modelo y monitorea el progreso.
 * Solo llamar cuando checkAvailability() devuelve 'needs-download'.
 *
 * @param {Function} onProgress  callback({ percent, loaded, total })
 * @param {AbortSignal} signal   señal para cancelar
 * @returns {Promise<object>}    sesión lista para usar
 */
interface ProgressInfo { percent: number; loaded: number; total: number }

/**
 * Dispara la descarga y monitorea el progreso.
 *
 * Cálculo del porcentaje:
 * - Chrome 128-129 (API antigua): `loaded` y `total` son bytes → ratio.
 * - Chrome 138+ (API moderna): `loaded` es fracción 0..1, `total` suele ser
 *   undefined o 1 → usar `loaded * 100` directamente.
 *
 * La sesión devuelta por create() se DESTRUYE explícitamente: solo nos
 * interesa que la descarga complete; la sesión real para chat la creará
 * el primer mensaje con la config del usuario.
 */
export async function triggerDownload(
  onProgress: (info: ProgressInfo) => void,
  signal: AbortSignal,
): Promise<void> {
  const API = getAPI()
  if (!API) throw new Error('API de Gemini Nano no disponible')

  const session = await API.create({
    monitor: (m: EventTarget) => {
      m.addEventListener('downloadprogress', (e: Event) => {
        const ev = e as ProgressEvent
        // API moderna: loaded ∈ [0,1] y total undefined o 1 → loaded*100
        // API antigua: loaded y total son bytes → ratio
        const isFraction = !ev.total || ev.total <= 1
        const percent = isFraction
          ? Math.round(ev.loaded * 100)
          : Math.round((ev.loaded / ev.total) * 100)
        onProgress({ percent, loaded: ev.loaded, total: ev.total })
      })
    },
    signal,
  })

  // Liberar la sesión: solo queríamos que el modelo terminara de descargarse.
  session?.destroy?.()
}

export async function getCapabilities(): Promise<LanguageModelCapabilities | null> {
  const API = getAPI()
  if (!API) return null
  try {
    return await API.params()
  } catch {
    return null
  }
}

// ── Gestión de sesión ────────────────────────────────────────────────────────

/**
 * Crea una nueva sesión de Gemini Nano con los parámetros dados.
 * @param {{ temperature, topK, systemPrompt, capabilities }} opts
 */
interface CreateSessionOptions {
  temperature: number
  topK: number
  systemPrompt: string
  capabilities: LanguageModelCapabilities | null
}

export async function createSession({ temperature, topK, systemPrompt, capabilities }: CreateSessionOptions): Promise<LanguageModelSession> {
  const API = getAPI()
  if (!API) throw new Error('API de Gemini Nano no disponible')

  const options: LanguageModelCreateOptions = {}

  if (capabilities?.temperature) {
    options.temperature = Math.max(
      capabilities.temperature.min ?? 0,
      Math.min(capabilities.temperature.max ?? 2, temperature),
    )
  } else {
    options.temperature = temperature
  }

  if (capabilities?.topK) {
    options.topK = Math.min(capabilities.topK.max ?? 100, topK)
  } else {
    options.topK = topK
  }

  if (systemPrompt) {
    options.systemPrompt = systemPrompt
  }

  return API.create(options)
}

// ── Envío de mensajes ────────────────────────────────────────────────────────

/**
 * Construye el prompt completo para enviar al modelo.
 *
 * El system prompt se incluye DENTRO del texto (no solo en las opciones de sesión)
 * por dos razones:
 * 1. Versiones antiguas de Chrome ignoran systemPrompt en API.create()
 * 2. Gemini Nano es un modelo pequeño: incluirlo en el texto de cada turno
 *    refuerza las instrucciones y mejora el cumplimiento
 *
 * @param {Array}  messages     mensajes de historial (sin el último user)
 * @param {string} userInput    mensaje actual del usuario
 * @param {string} systemPrompt instrucciones del sistema (puede estar vacío)
 */
import type { Message } from '../types'

export function buildPrompt(messages: Message[], userInput: string, systemPrompt: string): string {
  const parts = []

  // System prompt al inicio del contexto
  if (systemPrompt?.trim()) {
    parts.push(systemPrompt.trim())
    parts.push('')
  }

  // Historial de conversación (últimos 8 mensajes)
  if (messages.length) {
    const recent = messages.slice(-8)
    const historyText = recent
      .map((m) => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
      .join('\n\n')
    parts.push(`Historial de la conversación:\n${historyText}`)
    parts.push('')
  }

  parts.push(`Usuario: ${userInput.trim()}`)
  parts.push('')
  parts.push('Asistente:')

  return parts.join('\n')
}

/**
 * Envía un mensaje con streaming.
 * Notifica cada 20 chars o salto de línea para no saturar el DOM.
 */
export async function sendStreaming(
  session: LanguageModelSession,
  prompt: string,
  onChunk: (accumulated: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const stream = session.promptStreaming(prompt, { signal })
  let accumulated = ''
  let lastNotified = 0

  for await (const chunk of stream) {
    accumulated += chunk
    if (accumulated.length - lastNotified >= 20 || chunk.includes('\n')) {
      onChunk(accumulated)
      lastNotified = accumulated.length
    }
  }

  onChunk(accumulated)
  return accumulated
}

export async function sendBlocking(
  session: LanguageModelSession,
  prompt: string,
  signal: AbortSignal,
): Promise<string> {
  return session.prompt(prompt, { signal })
}
