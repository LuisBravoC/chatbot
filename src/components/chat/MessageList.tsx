import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { MessageItem } from './MessageItem'
import { TypingIndicator } from './TypingIndicator'
import { WelcomeScreen } from './WelcomeScreen'
import type { Message } from '../../types'

interface MessageListProps {
  onEdit: (msg: Message) => void
  onRegenerate: (msgId: string) => void
  onSuggestionClick: (prompt: string) => void
}

export function MessageList({ onEdit, onRegenerate, onSuggestionClick }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const { config, isGenerating, streamingContent, getCurrentConversation } = useAppStore()
  const conv = getCurrentConversation()
  const messages = conv?.messages ?? []

  // Índice del último mensaje AI — recibe streamingContent durante el streaming
  const lastAiIndex = messages.length - 1 - [...messages].reverse().findIndex(m => m.role === 'ai')

  // Auto-scroll al nuevo contenido
  useEffect(() => {
    if (config.autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, isGenerating, config.autoScroll])

  // useCallback para estabilizar referencias y que React.memo de MessageItem funcione.
  // Si estas funciones cambian en cada render, memo no puede evitar los re-renders.
  const handleDelete = useCallback((messageId: string) => {
    useAppStore.getState().deleteMessage(messageId)
  }, [])

  const handleEdit = useCallback((msg: Message) => {
    onEdit?.(msg)
  }, [onEdit])

  const handleRegenerate = useCallback((msgId: string) => {
    onRegenerate?.(msgId)
  }, [onRegenerate])

  const isEmpty = messages.length === 0

  return (
    <div
      id="chatMessages"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div id="messagesWrapper" style={{ maxWidth: 800, margin: '0 auto', width: '100%', minWidth: 0, padding: '16px 0' }}>
        {isEmpty ? (
          <WelcomeScreen onSuggestionClick={onSuggestionClick} />
        ) : (
          <>
            {messages.map((msg, idx) => (
              <MessageItem
                key={msg.id}
                msg={msg}
                // Inyectar streamingContent solo en la última burbuja AI activa
                streamingContent={
                  streamingContent !== null && idx === lastAiIndex ? streamingContent : null
                }
                showTimestamps={config.showTimestamps}
                renderMarkdown={config.renderMarkdown}
                onEdit={handleEdit}
                onRegenerate={handleRegenerate}
                onDelete={handleDelete}
              />
            ))}
            {/* Mostrar TypingIndicator solo mientras no haya aún un mensaje AI
                vacío/en proceso — evita la doble burbuja durante streaming */}
            {isGenerating && messages[messages.length - 1]?.role !== 'ai' && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
