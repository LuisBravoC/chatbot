import { useCallback, useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useToast } from '../components/ui/Toast'
import {
  checkAvailability,
  getCapabilities,
  triggerDownload,
  createSession,
  buildPrompt,
  sendStreaming,
  sendBlocking,
} from '../services/geminiService'

/**
 * Guards a nivel de módulo: previenen que React StrictMode (que invoca los
 * effects dos veces en desarrollo) ejecute initModel/downloadModel
 * concurrentemente. Se preservan entre los dos ciclos de mount/unmount.
 *
 * Si dos llamadas concurrentes pasaran sin esto:
 *  - initModel: doble fetch de availability/params (inocuo pero innecesario)
 *  - downloadModel: dos sesiones create() en paralelo → dos eventos
 *    'downloadprogress' superponiéndose → dos toasts de éxito al final
 */
let _initPromise: Promise<boolean> | null = null
let _downloadPromise: Promise<void> | null = null

/**
 * useGemini
 * Orquesta la API de Gemini Nano con el store de la app.
 * Expone: initModel, sendMessage, stopGeneration
 */
export function useGemini() {
  const toastShownRef = useRef(false)

  const {
    config,
    session,
    capabilities,
    isGenerating,
    setModelStatus,
    setDownloadProgress,
    setCapabilities,
    setSession,
    clearSession,
    setIsGenerating,
    setAbortController,
    addMessage,
    updateLastAIMessage,
    setStreamingContent,
    commitStreamingMessage,
    deleteMessage,
    getCurrentConversation,
  } = useAppStore()

  const { showToast } = useToast()

  // ── Inicializar modelo ─────────────────────────────────────────────────────

  const initModel = useCallback(async () => {
    // Si ya hay una inicialización en curso, esperar ese mismo Promise.
    // Esto evita el doble-invoke de React StrictMode.
    if (_initPromise) return _initPromise

    _initPromise = (async () => {
      setModelStatus('checking')

      // Orden idéntico al vanilla: availability() primero, params() después
      const status = await checkAvailability()

      // Solo consultar capacidades si la API está disponible
      if (status === 'ready' || status === 'needs-download') {
        const caps = await getCapabilities()
        setCapabilities(caps)
      }

      setModelStatus(status)

      // Limpiar el guard si falló para permitir reintentos manuales
      if (status === 'unsupported' || status === 'error') {
        _initPromise = null
      }

      return status === 'ready'
    })()

    return _initPromise
  }, [setModelStatus, setCapabilities])

  // ── Descargar modelo (disparado por el usuario) ────────────────────────────

  const downloadModel = useCallback(async () => {
    // Si ya hay descarga en curso (StrictMode doble-mount o doble-click),
    // esperar a la misma promesa en vez de iniciar otra.
    if (_downloadPromise) return _downloadPromise

    _downloadPromise = (async () => {
      setModelStatus('downloading')
      setDownloadProgress(0)
      const abortCtrl = new AbortController()
      setAbortController(abortCtrl)

      try {
        // triggerDownload crea la sesión SIN system prompt ni config del usuario.
        // La sesión se descarta dentro de triggerDownload; el primer mensaje
        // creará una correcta con la config actual.
        await triggerDownload(
          ({ percent }) => setDownloadProgress(percent),
          abortCtrl.signal,
        )
        setModelStatus('ready')
        showToast('¡Modelo descargado y listo!', 'success')
      } catch (e: unknown) {
        const err = e as { name?: string; message?: string }
        if (err.name === 'AbortError') {
          setModelStatus('needs-download')
          showToast('Descarga cancelada', 'info', 2000)
        } else {
          setModelStatus('error')
          showToast('Error durante la descarga: ' + (err.message ?? String(e)), 'error', 5000)
        }
      } finally {
        setAbortController(null)
      }
    })()

    try {
      await _downloadPromise
    } finally {
      _downloadPromise = null
    }
  }, [setModelStatus, setDownloadProgress, setAbortController, showToast])

  const cancelDownload = useCallback(() => {
    const { abortController } = useAppStore.getState()
    abortController?.abort()
  }, [])

  // ── Obtener / crear sesión ─────────────────────────────────────────────────

  const getOrCreateSession = useCallback(async () => {
    // Leer SIEMPRE del store directamente para evitar closures obsoletos.
    // Si el usuario cambió el system prompt o config antes de que React
    // re-renderizara, este getter garantiza que usamos los valores actuales.
    const { session: currentSession, config: currentConfig, capabilities: currentCaps } =
      useAppStore.getState()

    if (currentSession) return currentSession

    try {
      const newSession = await createSession({
        temperature: currentConfig.temperature,
        topK: currentConfig.topK,
        systemPrompt: currentConfig.systemPrompt,
        capabilities: currentCaps,
      })
      setSession(newSession)
      return newSession
    } catch (e: unknown) {
      console.error('Error creando sesión:', e)
      const err = e as { message?: string }
      showToast('Error al iniciar sesión: ' + (err.message ?? String(e)), 'error', 5000)
      return null
    }
  }, [setSession, showToast])  // mínimas dependencias — lee config/session del store en tiempo real

  // ── Enviar mensaje ─────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (content: string) => {
    if (isGenerating || !content?.trim()) return

    const trimmed = content.trim()

    // 1 — Añadir mensaje del usuario
    addMessage('user', trimmed)

    // 2 — Manejar caso sin API disponible
    const { modelStatus } = useAppStore.getState()
    if (modelStatus === 'unsupported') {
      addMessage(
        'ai',
        '⚠️ **Modelo no disponible**\n\nGemini Nano no está disponible en este navegador. Por favor utiliza:\n\n- **Chrome 128+** o **Edge 128+**\n- Habilita la API en `chrome://flags/#prompt-api-for-gemini-nano`\n\nVisita [developer.chrome.com/docs/ai/prompt-api](https://developer.chrome.com/docs/ai/prompt-api) para más información.',
      )
      return
    }

    // 3 — Preparar generación
    setIsGenerating(true)
    const abortController = new AbortController()
    setAbortController(abortController)

    // 4 — Obtener sesión
    const activeSession = await getOrCreateSession()
    if (!activeSession) {
      setIsGenerating(false)
      setAbortController(null)
      return
    }

    // 5 — Construir prompt con historial y system prompt
    // Leemos del store para tener la config más reciente (no el closure)
    const { getCurrentConversation: getConv, config: currentConfig } = useAppStore.getState()
    const conv = getConv()
    const history = conv ? conv.messages.slice(0, -1) : []
    const prompt = buildPrompt(history, trimmed, currentConfig.systemPrompt)

    // 6 — Añadir mensaje AI vacío (placeholder para streaming)
    const aiMsg = addMessage('ai', '')

    try {
      if (config.streaming && typeof activeSession.promptStreaming === 'function') {
        // Streaming: actualizar streamingContent en lugar de conversations
        // → solo la burbuja activa re-renderiza en cada chunk
        await sendStreaming(
          activeSession,
          prompt,
          (accumulated) => setStreamingContent(accumulated),
          abortController.signal,
        )
        // Al terminar: commit final al historial y limpiar streamingContent
        const finalContent = useAppStore.getState().streamingContent ?? ''
        commitStreamingMessage(finalContent)
      } else {
        const response = await sendBlocking(activeSession, prompt, abortController.signal)
        updateLastAIMessage(response)
      }
    } catch (e: unknown) {
      const err = e as { name?: string; message?: string }
      if (err.name === 'AbortError') {
        // Interrupción: usar streamingContent si hay parcial, si no cancelar
        const partial = useAppStore.getState().streamingContent ?? ''
        setStreamingContent(null)
        if (partial) {
          updateLastAIMessage(partial + '\n\n_[Generación interrumpida por el usuario]_')
          showToast('Generación detenida', 'info', 1500)
        } else {
          deleteMessage(aiMsg.id)
          showToast('Generación cancelada', 'info', 1500)
        }
      } else if (err.name === 'NotSupportedError') {
        deleteMessage(aiMsg.id)
        showToast('El modelo aún no está listo. Intenta de nuevo.', 'warning', 4000)
      } else {
        updateLastAIMessage(
          `❌ **Error al generar respuesta**\n\n\`${err.message ?? String(e)}\`\n\nIntenta de nuevo o revisa la configuración del modelo.`,
        )
        showToast('Error: ' + (err.message ?? String(e)), 'error', 5000)
      }
    } finally {
      setIsGenerating(false)
      setAbortController(null)
      // Garantizar que streamingContent queda limpio aunque ocurra un error no capturado
      if (useAppStore.getState().streamingContent !== null) {
        setStreamingContent(null)
      }
    }
  }, [
    isGenerating,
    config,
    addMessage,
    updateLastAIMessage,
    setStreamingContent,
    commitStreamingMessage,
    deleteMessage,
    getCurrentConversation,
    getOrCreateSession,
    setIsGenerating,
    setAbortController,
    showToast,
  ])

  // ── Regenerar desde un mensaje ─────────────────────────────────────────────

  const regenerateFrom = useCallback(async (aiMessageId: string) => {
    if (isGenerating) return

    const conv = useAppStore.getState().getCurrentConversation()
    if (!conv) return

    const idx = conv.messages.findIndex((m) => m.id === aiMessageId)
    if (idx === -1) return

    // Encontrar el mensaje user previo
    let userMsg = null
    for (let i = idx - 1; i >= 0; i--) {
      if (conv.messages[i].role === 'user') { userMsg = conv.messages[i]; break }
    }
    if (!userMsg) return

    // Truncar desde el mensaje AI y reenviar
    useAppStore.getState().truncateMessagesFrom(aiMessageId)
    await sendMessage(userMsg.content)
  }, [isGenerating, sendMessage])

  // ── Detener generación ─────────────────────────────────────────────────────

  const stopGeneration = useCallback(() => {
    const { abortController } = useAppStore.getState()
    abortController?.abort()
  }, [])

  // ── Invalidar sesión cuando cambia config ──────────────────────────────────

  const invalidateSession = useCallback(() => {
    clearSession()
  }, [clearSession])

  // ── Toast de estado del modelo — exactamente una vez ──────────────────────
  // useRef NO se resetea en el cleanup de StrictMode, lo que garantiza
  // que el toast se muestra solo una vez aunque el efecto corra dos veces.
  const { modelStatus } = useAppStore()

  useEffect(() => {
    if (modelStatus === 'checking') return        // todavía cargando, esperar
    if (toastShownRef.current) return             // ya mostrado, no repetir
    toastShownRef.current = true

    if (modelStatus === 'ready')
      showToast('Gemini Nano listo', 'success', 2000)
    else if (modelStatus === 'unsupported')
      showToast('API de Gemini Nano no disponible en este navegador', 'warning', 5000)
    else if (modelStatus === 'error')
      showToast('Error al verificar el modelo', 'error', 5000)
    // 'needs-download' no muestra toast — el panel lo comunica visualmente
  }, [modelStatus, showToast])

  return { initModel, downloadModel, cancelDownload, sendMessage, regenerateFrom, stopGeneration, invalidateSession }
}
